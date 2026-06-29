// Supabase Edge Function: sync-world-cup
//
// Pulls match results from football-data.org and upserts them into the
// `matches` table, skipping any row where `manual_override = true` so admin
// hand-edits are never clobbered.
//
// Defaults to DRY RUN — returns a JSON preview of what it would do without
// touching the database. Add `?execute=true` to actually apply the changes.
//
// See README.md for setup + deploy.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { mapTeam, mapStage } from "./team-map.ts";
import { buildUtcDateWindow, POOL_TIME_ZONE, toPoolDateKey } from "./date-utils.mjs";

const FOOTBALL_DATA_URL = "https://api.football-data.org/v4/competitions/WC/matches";
const BUILD_ID = "recent-window-sync-2026-06-16";
const DATE_PROBE_UTC = "2026-06-16T01:00:00Z";
const FETCH_MAX_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 8000;
const FETCH_RETRY_DELAY_MS = 750;

const RESPONSE_META = {
    build: BUILD_ID,
    poolTimeZone: POOL_TIME_ZONE,
    dateProbe: toPoolDateKey(DATE_PROBE_UTC),
};

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface ApiMatch {
    id: number;
    utcDate: string;
    status: string;
    stage: string;
    group: string | null;
    homeTeam: { id: number; name: string };
    awayTeam: { id: number; name: string };
    score: {
        winner: string | null;
        duration: string;
        fullTime: { home: number | null; away: number | null };
        halfTime: { home: number | null; away: number | null };
        penalties?: { home: number | null; away: number | null };
    };
    lastUpdated: string;
}

interface FetchAttemptDiagnostic {
    attempt: number;
    mode: FetchMode;
    url: string;
    ok: boolean;
    status: number | null;
    elapsedMs: number;
    error: string | null;
    body?: string;
}

interface FetchDiagnostics {
    upstreamUrl: string;
    mode: FetchMode;
    dateWindow: { dateFrom: string; dateTo: string } | null;
    maxAttempts: number;
    timeoutMs: number;
    attempts: FetchAttemptDiagnostic[];
}

type FetchMode = "full" | "recent";

interface PlannedChange {
    action: "insert" | "update" | "skip-manual" | "skip-unmapped" | "no-change" | "upcoming" | "in-play";
    api_status: string;
    team_home: string | null;
    team_away: string | null;
    score_home: number | null;
    score_away: number | null;
    stage: string | null;
    match_date: string;
    utc_date: string;
    was_extra_time: boolean;
    is_finished: boolean;
    api_id: number;
    db_id: number | null;
    db_match_date_manual: string | null;
    db_manual_override: boolean | null;
    db_is_finished: boolean | null;
    db_auto_synced_at: string | null;
    reason?: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    const execute = url.searchParams.get("execute") === "true";
    const fetchMode: FetchMode = url.searchParams.get("mode") === "recent" ? "recent" : "full";

    // Test mode: ?test_finish=<api_id>:<home>-<away>
    // When set, treats that one API match as if it had status FINISHED with the
    // given score, so the full insert/update/skip-manual path can be exercised
    // before any real WC match has actually played. Otherwise no effect.
    let testFinishId: number | null = null;
    let testFinishHome: number | null = null;
    let testFinishAway: number | null = null;
    const testFinishRaw = url.searchParams.get("test_finish");
    if (testFinishRaw) {
        const m = testFinishRaw.match(/^(\d+):(\d+)-(\d+)$/);
        if (m) {
            testFinishId = parseInt(m[1], 10);
            testFinishHome = parseInt(m[2], 10);
            testFinishAway = parseInt(m[3], 10);
        }
    }

    const apiKey = Deno.env.get("FOOTBALL_DATA_API_KEY") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (!apiKey) return jsonResponse({ ok: false, ...RESPONSE_META, error: "FOOTBALL_DATA_API_KEY not configured" }, 500);
    if (!supabaseUrl || !supabaseServiceKey) return jsonResponse({ ok: false, ...RESPONSE_META, error: "Supabase env not available" }, 500);

    // 1. Fetch live data from football-data.org
    const apiFetch = await fetchWorldCupMatches(apiKey, fetchMode);
    if (!apiFetch.ok) {
        return jsonResponse({
            ok: false,
            ...RESPONSE_META,
            error: apiFetch.error,
            fetchDiagnostics: apiFetch.diagnostics,
        }, 502);
    }
    const apiMatches = apiFetch.matches;

    // 2. Pre-fetch our existing matches for lookup
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: existing, error: existingErr } = await supabase
        .from("matches")
        .select("id, stage, team_home, team_away, match_date_manual, score_home, score_away, was_extra_time, is_finished, manual_override, auto_synced_at");
    if (existingErr) return jsonResponse({ ok: false, ...RESPONSE_META, error: `Failed to load existing matches: ${existingErr.message}` }, 500);

    const fixtureKey = (stage: string | null, home: string, away: string) =>
        `${stage || ""}|${[home, away].sort().join("|")}`;
    const dateDistanceDays = (a: string | null, b: string | null) => {
        if (!a || !b) return Number.POSITIVE_INFINITY;
        const aMs = Date.parse(`${a}T12:00:00Z`);
        const bMs = Date.parse(`${b}T12:00:00Z`);
        if (!Number.isFinite(aMs) || !Number.isFinite(bMs)) return Number.POSITIVE_INFINITY;
        return Math.abs(aMs - bMs) / 86400000;
    };

    // Index existing rows by exact pool date, plus a stage+team-pair fallback so
    // pre-fix UTC-date rows are reused instead of creating duplicate fixtures.
    type ExistingRow = NonNullable<typeof existing>[number];
    const existingMap = new Map<string, ExistingRow>();
    const existingByFixture = new Map<string, ExistingRow[]>();
    for (const row of existing || []) {
        const date = row.match_date_manual;
        existingMap.set(`${row.stage}|${row.team_home}|${row.team_away}|${date}`, row);
        existingMap.set(`${row.stage}|${row.team_away}|${row.team_home}|${date}`, row);
        const key = fixtureKey(row.stage, row.team_home, row.team_away);
        if (!existingByFixture.has(key)) existingByFixture.set(key, []);
        existingByFixture.get(key)!.push(row);
    }
    const findExistingRow = (stage: string | null, team_home: string | null, team_away: string | null, match_date: string) => {
        if (!stage || !team_home || !team_away) return null;

        const exact = existingMap.get(`${stage}|${team_home}|${team_away}|${match_date}`);
        if (exact) return exact;

        return (existingByFixture.get(fixtureKey(stage, team_home, team_away)) || [])
            .filter((row) => !row.manual_override && dateDistanceDays(row.match_date_manual, match_date) <= 1)
            .sort((a, b) => dateDistanceDays(a.match_date_manual, match_date) - dateDistanceDays(b.match_date_manual, match_date))
            [0] || null;
    };

    // 3. Plan changes (every match gets an entry, including upcoming/in-play)
    const planned: PlannedChange[] = [];
    let skippedUnfinished = 0;

    for (const m of apiMatches) {
        // Test-mode override: pretend this one match is FINISHED with a fake score
        if (testFinishId !== null && m.id === testFinishId) {
            m.status = "FINISHED";
            m.score = {
                ...m.score,
                duration: "REGULAR",
                fullTime: { home: testFinishHome, away: testFinishAway },
            };
        }

        const team_home = mapTeam(m.homeTeam?.name);
        const team_away = mapTeam(m.awayTeam?.name);
        const stage = mapStage(m.stage);
        const match_date = toPoolDateKey(m.utcDate);
        const utc_date = m.utcDate;
        const is_finished = m.status === "FINISHED";
        const score_home = is_finished ? m.score.fullTime.home : null;
        const score_away = is_finished ? m.score.fullTime.away : null;
        const was_extra_time = is_finished && (m.score.duration === "EXTRA_TIME" || m.score.duration === "PENALTY_SHOOTOUT");
        const existingRow = findExistingRow(stage, team_home, team_away, match_date);
        const baseRow = {
            api_status: m.status,
            team_home, team_away,
            stage,
            match_date,
            utc_date,
            is_finished,
            api_id: m.id,
            db_id: existingRow?.id ?? null,
            db_match_date_manual: existingRow?.match_date_manual ?? null,
            db_manual_override: existingRow?.manual_override ?? null,
            db_is_finished: existingRow?.is_finished ?? null,
            db_auto_synced_at: existingRow?.auto_synced_at ?? null,
        };

        if (!is_finished) {
            skippedUnfinished++;
        }

        if (!stage || !team_home || !team_away) {
            planned.push({
                ...baseRow,
                action: "skip-unmapped",
                score_home,
                score_away,
                was_extra_time,
                reason: `Missing mapped ${!stage ? `stage ${m.stage}` : ""}${!stage && (!team_home || !team_away) ? " and " : ""}${!team_home || !team_away ? `team ${m.homeTeam?.name || "?"} v ${m.awayTeam?.name || "?"}` : ""}`,
            });
            continue;
        }

        if (is_finished && (score_home === null || score_away === null)) {
            planned.push({
                ...baseRow,
                action: "skip-unmapped",
                score_home,
                score_away,
                was_extra_time,
                reason: `Finished API match ${m.id} is missing a full-time score`,
            });
            continue;
        }

        if (!is_finished && stage === "Group") {
            planned.push({
                ...baseRow,
                action: m.status === "IN_PLAY" || m.status === "PAUSED" ? "in-play" : "upcoming",
                score_home,
                score_away,
                was_extra_time,
                reason: "Unfinished group-stage fixture preview only",
            });
            continue;
        }

        if (existingRow?.manual_override) {
            planned.push({
                ...baseRow,
                action: "skip-manual",
                score_home, score_away, was_extra_time,
                reason: `Row #${existingRow.id} has manual_override=true`,
            });
            continue;
        }

        if (existingRow) {
            const unchanged =
                existingRow.stage === stage &&
                existingRow.team_home === team_home &&
                existingRow.team_away === team_away &&
                existingRow.is_finished === is_finished &&
                existingRow.score_home === score_home &&
                existingRow.score_away === score_away &&
                existingRow.was_extra_time === was_extra_time &&
                existingRow.match_date_manual === match_date;
            planned.push({
                ...baseRow,
                action: unchanged ? "no-change" : "update",
                score_home, score_away, was_extra_time,
            });
        } else {
            planned.push({
                ...baseRow,
                action: "insert",
                score_home, score_away, was_extra_time,
            });
        }
    }

    // 4. Apply changes (only if execute=true)
    const summary = {
        execute,
        totalApiMatches: apiMatches.length,
        skippedUnfinished,
        plannedInserts: planned.filter((p) => p.action === "insert").length,
        plannedUpdates: planned.filter((p) => p.action === "update").length,
        plannedNoChange: planned.filter((p) => p.action === "no-change").length,
        plannedSkipManual: planned.filter((p) => p.action === "skip-manual").length,
        plannedSkipUnmapped: planned.filter((p) => p.action === "skip-unmapped").length,
        upcoming: planned.filter((p) => p.api_status === "TIMED" || p.api_status === "SCHEDULED").length,
        inPlay: planned.filter((p) => p.api_status === "IN_PLAY" || p.api_status === "PAUSED").length,
        executedInserts: 0,
        executedUpdates: 0,
        errors: [] as string[],
    };

    if (execute) {
        const now = new Date().toISOString();
        for (const p of planned) {
            if ((p.action === "insert" || p.action === "update") && (!p.stage || !p.team_home || !p.team_away)) {
                summary.errors.push(`Skipped API ${p.api_id}: missing mapped stage/team during execute`);
                continue;
            }

            if (p.action === "insert") {
                const { error } = await supabase.from("matches").insert([{
                    team_home: p.team_home,
                    team_away: p.team_away,
                    score_home: p.score_home,
                    score_away: p.score_away,
                    stage: p.stage,
                    is_finished: p.is_finished,
                    match_date: now,
                    match_date_manual: p.match_date,
                    was_extra_time: p.was_extra_time,
                    auto_synced_at: now,
                    manual_override: false,
                }]);
                if (error) summary.errors.push(`Insert ${p.team_home}-${p.team_away}: ${error.message}`);
                else summary.executedInserts++;
            } else if (p.action === "update") {
                const existingRow = p.db_id
                    ? (existing || []).find((row) => row.id === p.db_id)
                    : findExistingRow(p.stage, p.team_home, p.team_away, p.match_date);
                if (!existingRow) continue;
                const { error } = await supabase
                    .from("matches")
                    .update({
                        team_home: p.team_home,
                        team_away: p.team_away,
                        stage: p.stage,
                        score_home: p.score_home,
                        score_away: p.score_away,
                        was_extra_time: p.was_extra_time,
                        is_finished: p.is_finished,
                        match_date_manual: p.match_date,
                        auto_synced_at: now,
                    })
                    .eq("id", existingRow.id);
                if (error) summary.errors.push(`Update #${existingRow.id} ${p.team_home}-${p.team_away}: ${error.message}`);
                else summary.executedUpdates++;
            }
        }
    }

    return jsonResponse({
        ok: true,
        ...RESPONSE_META,
        summary,
        fetchDiagnostics: apiFetch.diagnostics,
        planned,
    }, 200);
});

async function fetchWorldCupMatches(apiKey: string, mode: FetchMode): Promise<
    | { ok: true; matches: ApiMatch[]; diagnostics: FetchDiagnostics }
    | { ok: false; error: string; diagnostics: FetchDiagnostics }
> {
    const dateWindow = mode === "recent" ? buildUtcDateWindow(new Date(), 1, 1) : null;
    const upstreamUrl = buildFootballDataUrl(dateWindow);
    const diagnostics: FetchDiagnostics = {
        upstreamUrl,
        mode,
        dateWindow,
        maxAttempts: FETCH_MAX_ATTEMPTS,
        timeoutMs: FETCH_TIMEOUT_MS,
        attempts: [],
    };

    for (let attempt = 1; attempt <= FETCH_MAX_ATTEMPTS; attempt++) {
        const started = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        try {
            const res = await fetch(upstreamUrl, {
                headers: { "X-Auth-Token": apiKey },
                signal: controller.signal,
            });
            const elapsedMs = Date.now() - started;

            if (!res.ok) {
                const body = (await res.text()).slice(0, 1000);
                diagnostics.attempts.push({
                    attempt,
                    mode,
                    url: upstreamUrl,
                    ok: false,
                    status: res.status,
                    elapsedMs,
                    error: `football-data.org returned ${res.status}`,
                    body,
                });
            } else {
                const data = await res.json();
                diagnostics.attempts.push({
                    attempt,
                    mode,
                    url: upstreamUrl,
                    ok: true,
                    status: res.status,
                    elapsedMs,
                    error: null,
                });
                return { ok: true, matches: data.matches || [], diagnostics };
            }
        } catch (err) {
            diagnostics.attempts.push({
                attempt,
                mode,
                url: upstreamUrl,
                ok: false,
                status: null,
                elapsedMs: Date.now() - started,
                error: (err as Error).message || String(err),
            });
        } finally {
            clearTimeout(timeoutId);
        }

        if (attempt < FETCH_MAX_ATTEMPTS) {
            await delay(FETCH_RETRY_DELAY_MS * attempt);
        }
    }

    const lastError = diagnostics.attempts[diagnostics.attempts.length - 1]?.error || "unknown fetch error";
    return { ok: false, error: `Fetch failed after ${FETCH_MAX_ATTEMPTS} attempts: ${lastError}`, diagnostics };
}

function buildFootballDataUrl(dateWindow: { dateFrom: string; dateTo: string } | null): string {
    if (!dateWindow) return FOOTBALL_DATA_URL;

    const url = new URL(FOOTBALL_DATA_URL);
    url.searchParams.set("dateFrom", dateWindow.dateFrom);
    url.searchParams.set("dateTo", dateWindow.dateTo);
    return url.toString();
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function jsonResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body, null, 2), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
}
