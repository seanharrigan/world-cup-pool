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
import { toPoolDateKey } from "./date-utils.mjs";

const FOOTBALL_DATA_URL = "https://api.football-data.org/v4/competitions/WC/matches";

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

interface PlannedChange {
    action: "insert" | "update" | "skip-manual" | "skip-unmapped" | "no-change" | "upcoming" | "in-play";
    api_status: string;
    team_home: string;
    team_away: string;
    score_home: number | null;
    score_away: number | null;
    stage: string | null;
    match_date: string;
    utc_date: string;
    was_extra_time: boolean;
    api_id: number;
    db_id: number | null;
    db_match_date_manual: string | null;
    db_manual_override: boolean | null;
    db_auto_synced_at: string | null;
    reason?: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    const execute = url.searchParams.get("execute") === "true";

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

    if (!apiKey) return jsonResponse({ ok: false, error: "FOOTBALL_DATA_API_KEY not configured" }, 500);
    if (!supabaseUrl || !supabaseServiceKey) return jsonResponse({ ok: false, error: "Supabase env not available" }, 500);

    // 1. Fetch live data from football-data.org
    let apiMatches: ApiMatch[] = [];
    try {
        const res = await fetch(FOOTBALL_DATA_URL, { headers: { "X-Auth-Token": apiKey } });
        if (!res.ok) {
            const body = await res.text();
            return jsonResponse({ ok: false, error: `football-data.org returned ${res.status}`, body }, 502);
        }
        const data = await res.json();
        apiMatches = data.matches || [];
    } catch (err) {
        return jsonResponse({ ok: false, error: `Fetch failed: ${(err as Error).message}` }, 502);
    }

    // 2. Pre-fetch our existing matches for lookup
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: existing, error: existingErr } = await supabase
        .from("matches")
        .select("id, team_home, team_away, match_date_manual, score_home, score_away, was_extra_time, manual_override, auto_synced_at");
    if (existingErr) return jsonResponse({ ok: false, error: `Failed to load existing matches: ${existingErr.message}` }, 500);

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
    const findExistingRow = (stage: string | null, team_home: string, team_away: string, match_date: string) => {
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

        const team_home = mapTeam(m.homeTeam.name);
        const team_away = mapTeam(m.awayTeam.name);
        const stage = mapStage(m.stage);
        const match_date = toPoolDateKey(m.utcDate);
        const utc_date = m.utcDate;
        const existingRow = findExistingRow(stage, team_home, team_away, match_date);
        const baseRow = {
            api_status: m.status,
            team_home, team_away,
            stage,
            match_date,
            utc_date,
            api_id: m.id,
            db_id: existingRow?.id ?? null,
            db_match_date_manual: existingRow?.match_date_manual ?? null,
            db_manual_override: existingRow?.manual_override ?? null,
            db_auto_synced_at: existingRow?.auto_synced_at ?? null,
        };

        // Non-finished matches: just record their schedule status
        if (m.status !== "FINISHED") {
            skippedUnfinished++;
            const action = m.status === "IN_PLAY" || m.status === "PAUSED" ? "in-play" : "upcoming";
            planned.push({
                ...baseRow,
                action,
                score_home: m.score.fullTime.home,
                score_away: m.score.fullTime.away,
                was_extra_time: false,
            });
            continue;
        }

        const score_home = m.score.fullTime.home;
        const score_away = m.score.fullTime.away;
        const was_extra_time = m.score.duration === "EXTRA_TIME" || m.score.duration === "PENALTY_SHOOTOUT";

        if (!stage) {
            planned.push({
                ...baseRow,
                action: "skip-unmapped",
                score_home, score_away, was_extra_time,
                reason: `Unmapped stage ${m.stage}`,
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
        upcoming: planned.filter((p) => p.action === "upcoming").length,
        inPlay: planned.filter((p) => p.action === "in-play").length,
        executedInserts: 0,
        executedUpdates: 0,
        errors: [] as string[],
    };

    if (execute) {
        const now = new Date().toISOString();
        for (const p of planned) {
            if (p.action === "insert") {
                const { error } = await supabase.from("matches").insert([{
                    team_home: p.team_home,
                    team_away: p.team_away,
                    score_home: p.score_home,
                    score_away: p.score_away,
                    stage: p.stage,
                    is_finished: true,
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
                        score_home: p.score_home,
                        score_away: p.score_away,
                        was_extra_time: p.was_extra_time,
                        is_finished: true,
                        match_date_manual: p.match_date,
                        auto_synced_at: now,
                    })
                    .eq("id", existingRow.id);
                if (error) summary.errors.push(`Update #${existingRow.id} ${p.team_home}-${p.team_away}: ${error.message}`);
                else summary.executedUpdates++;
            }
        }
    }

    return jsonResponse({ ok: true, summary, planned }, 200);
});

function jsonResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body, null, 2), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
}
