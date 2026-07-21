(function attachFinalAudit(globalScope) {
    'use strict';

    const EXPECTED_MATCH_COUNT = 104;
    const EXPECTED_SCORING_MATCH_COUNT = 103;
    const FINAL_DATE = '2026-07-19';
    const THIRD_PLACE_DATE = '2026-07-18';
    const STAGE_MULTIPLIERS = { Group: 1, R32: 2, R16: 3, Quarters: 5, Semis: 8, Finals: 12 };
    const STAGE_BUCKETS = { Group: 'group', R32: 'r32', R16: 'r16', Quarters: 'qf', Semis: 'sf', Finals: 'final' };
    const TEAM_ALIASES = {
        'bosnia and herzegovina': 'bosnia',
        'cape verde islands': 'cape verde',
        'cabo verde': 'cape verde',
        'congo dr': 'dr congo',
        'cote divoire': 'ivory coast',
        'czech republic': 'czechia',
        'korea republic': 'south korea',
        'turkey': 'turkiye',
        'united states': 'usa'
    };

    function normalizeTeamName(value) {
        const normalized = String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, ' ')
            .trim()
            .toLowerCase();
        return TEAM_ALIASES[normalized] || normalized;
    }

    function normalizeEmail(value) {
        return String(value || '').trim().toLowerCase();
    }

    function dateKey(match) {
        const value = match?.match_date_manual || match?.match_date || match?.utc_date || '';
        return String(value).slice(0, 10);
    }

    function isThirdPlace(match) {
        const stage = String(match?.stage || '').toLowerCase();
        return stage.includes('third') || stage.includes('bronze') || dateKey(match) === THIRD_PLACE_DATE;
    }

    function isFinishedDatabaseMatch(match) {
        if (!match || match.is_finished === false || match.score_home == null || match.score_away == null) return false;
        return Number.isFinite(Number(match.score_home)) && Number.isFinite(Number(match.score_away));
    }

    function isFinishedInternetMatch(match) {
        return match?.api_status === 'FINISHED'
            && match.score_home != null
            && match.score_away != null
            && Number.isFinite(Number(match.score_home))
            && Number.isFinite(Number(match.score_away));
    }

    function fixturePairKey(match) {
        return [normalizeTeamName(match?.team_home), normalizeTeamName(match?.team_away)].sort().join('|');
    }

    function fixtureKey(match) {
        return `${fixturePairKey(match)}|${dateKey(match)}`;
    }

    function scoreByTeam(match) {
        return new Map([
            [normalizeTeamName(match?.team_home), Number(match?.score_home)],
            [normalizeTeamName(match?.team_away), Number(match?.score_away)]
        ]);
    }

    function winnerName(match) {
        const home = Number(match?.score_home);
        const away = Number(match?.score_away);
        if (!Number.isFinite(home) || !Number.isFinite(away) || home === away) return '';
        return home > away ? normalizeTeamName(match?.team_home) : normalizeTeamName(match?.team_away);
    }

    function emptyBreakdown() {
        return { group: 0, bonus: 0, r32: 0, r16: 0, qf: 0, sf: 0, final: 0, total: 0 };
    }

    function finalizeBreakdown(breakdown) {
        breakdown.total = breakdown.group + breakdown.bonus + breakdown.r32 + breakdown.r16 + breakdown.qf + breakdown.sf + breakdown.final;
        return breakdown;
    }

    function addIssue(target, severity, code, title, detail) {
        target.push({ severity, code, title, detail: detail || '' });
    }

    function findDatabaseMatch(internetMatch, dbById, dbByFixture, dbByPair, usedDbIds) {
        const direct = internetMatch?.db_id != null ? dbById.get(String(internetMatch.db_id)) : null;
        if (direct && !usedDbIds.has(String(direct.id))) return direct;

        const exact = (dbByFixture.get(fixtureKey(internetMatch)) || [])
            .find((row) => !usedDbIds.has(String(row.id)));
        if (exact) return exact;

        const internetDate = Date.parse(`${dateKey(internetMatch)}T12:00:00Z`);
        return (dbByPair.get(fixturePairKey(internetMatch)) || [])
            .filter((row) => !usedDbIds.has(String(row.id)))
            .map((row) => ({ row, distance: Math.abs(Date.parse(`${dateKey(row)}T12:00:00Z`) - internetDate) }))
            .filter((candidate) => Number.isFinite(candidate.distance) && candidate.distance <= 86400000)
            .sort((a, b) => a.distance - b.distance)[0]?.row || null;
    }

    function buildFinalAudit(input = {}) {
        const localTeams = (input.teams || []).filter((team) => team?.name && team.qualified !== false);
        const picks = input.picks || [];
        const profiles = input.profiles || [];
        const matches = input.matches || [];
        const advancement = input.advancement || [];
        const internetMatches = input.internetMatches || [];
        const appTotals = input.appTotals instanceof Map ? input.appTotals : new Map(Object.entries(input.appTotals || {}));
        const lockDateMs = input.lockDate ? new Date(input.lockDate).getTime() : Number.NaN;
        const blockers = [];
        const warnings = [];
        const matchRows = [];
        const teamByNormalized = new Map(localTeams.map((team) => [normalizeTeamName(team.name), team]));

        if (internetMatches.length !== EXPECTED_MATCH_COUNT) {
            addIssue(blockers, 'error', 'internet_match_count', 'Internet match coverage is incomplete', `Expected ${EXPECTED_MATCH_COUNT} fixtures, received ${internetMatches.length}.`);
        }
        if (matches.length !== EXPECTED_MATCH_COUNT) {
            addIssue(blockers, 'error', 'database_match_count', 'Database match coverage is incomplete', `Expected ${EXPECTED_MATCH_COUNT} rows, received ${matches.length}.`);
        }
        if (!picks.length) {
            addIssue(blockers, 'error', 'selection_data_empty', 'No saved selections were returned', 'The audit cannot verify payouts without the complete picks table. Check the admin login and read permissions.');
        }
        if (!profiles.length) {
            addIssue(blockers, 'error', 'profile_data_empty', 'No player profiles were returned', 'The audit cannot confirm entrant eligibility without the profiles table. Check the admin login and read permissions.');
        }

        const dbById = new Map(matches.filter((row) => row?.id != null).map((row) => [String(row.id), row]));
        const dbByFixture = new Map();
        const dbByPair = new Map();
        matches.forEach((row) => {
            const exactKey = fixtureKey(row);
            const pairKey = fixturePairKey(row);
            if (!dbByFixture.has(exactKey)) dbByFixture.set(exactKey, []);
            if (!dbByPair.has(pairKey)) dbByPair.set(pairKey, []);
            dbByFixture.get(exactKey).push(row);
            dbByPair.get(pairKey).push(row);
        });

        dbByFixture.forEach((rows, key) => {
            if (rows.length > 1) {
                addIssue(blockers, 'error', 'duplicate_database_match', 'Duplicate database match rows', `${key} appears ${rows.length} times.`);
            }
        });

        const usedDbIds = new Set();
        let winnerMismatches = 0;
        let scoreWarnings = 0;
        let matchedMatches = 0;
        let finishedScoringMatches = 0;

        internetMatches.forEach((internetMatch) => {
            const dbMatch = findDatabaseMatch(internetMatch, dbById, dbByFixture, dbByPair, usedDbIds);
            const thirdPlace = isThirdPlace(internetMatch) || isThirdPlace(dbMatch);
            const label = `${internetMatch.team_home || '?'} vs ${internetMatch.team_away || '?'} (${dateKey(internetMatch) || 'no date'})`;
            let severity = 'ok';
            let note = thirdPlace ? 'Third-place match verified; excluded from pool scoring.' : 'Winner and score agree.';

            if (!internetMatch.team_home || !internetMatch.team_away) {
                severity = 'error';
                note = 'Internet result has an unmapped team.';
                addIssue(blockers, 'error', 'unmapped_internet_team', 'Internet match has an unmapped team', label);
            }

            if (!dbMatch) {
                severity = 'error';
                note = 'No matching database row.';
                addIssue(blockers, 'error', 'missing_database_match', 'Internet match is missing from the database', label);
            } else {
                matchedMatches += 1;
                usedDbIds.add(String(dbMatch.id));
            }

            if (!thirdPlace && !STAGE_MULTIPLIERS[internetMatch.stage || dbMatch?.stage]) {
                severity = 'error';
                note = 'Unknown scoring stage.';
                addIssue(blockers, 'error', 'unknown_stage', 'Match has an unknown scoring stage', `${label}: ${internetMatch.stage || dbMatch?.stage || 'blank'}.`);
            }

            if (!thirdPlace && isFinishedInternetMatch(internetMatch)) finishedScoringMatches += 1;

            if (!isFinishedInternetMatch(internetMatch)) {
                if (!thirdPlace) {
                    severity = 'error';
                    note = 'Internet source does not show a finished result.';
                    addIssue(blockers, 'error', 'internet_unfinished', 'A scoring match is not finished on the internet source', label);
                }
            } else if (!dbMatch || !isFinishedDatabaseMatch(dbMatch)) {
                if (dbMatch) {
                    severity = 'error';
                    note = 'Internet result is finished but the database result is incomplete.';
                    addIssue(blockers, 'error', 'database_unfinished', 'Finished internet match is incomplete in the database', label);
                }
            } else {
                const internetWinner = winnerName(internetMatch);
                const databaseWinner = winnerName(dbMatch);
                const knockout = (internetMatch.stage || dbMatch.stage) !== 'Group' && !thirdPlace;
                if (knockout && !internetWinner) {
                    severity = 'error';
                    note = 'Knockout winner cannot be determined.';
                    addIssue(blockers, 'error', 'knockout_draw', 'Knockout winner cannot be determined', label);
                } else if (internetWinner !== databaseWinner) {
                    severity = 'error';
                    note = 'Winner differs from the internet result.';
                    winnerMismatches += 1;
                    addIssue(blockers, 'error', 'winner_mismatch', 'Winning team does not match the internet result', label);
                } else {
                    const internetScores = scoreByTeam(internetMatch);
                    const databaseScores = scoreByTeam(dbMatch);
                    const scoreDiffers = [...internetScores.entries()].some(([teamName, score]) => databaseScores.get(teamName) !== score);
                    if (scoreDiffers) {
                        severity = 'warning';
                        note = 'Winner agrees, but the exact score differs.';
                        scoreWarnings += 1;
                        addIssue(warnings, 'warning', 'score_mismatch', 'Exact score differs but the outcome agrees', label);
                    }
                }
            }

            matchRows.push({ internet: internetMatch, database: dbMatch, thirdPlace, severity, note });
        });

        matches.forEach((dbMatch) => {
            if (usedDbIds.has(String(dbMatch.id))) return;
            addIssue(blockers, 'error', 'database_match_not_online', 'Database match was not matched to the internet schedule', `${dbMatch.team_home || '?'} vs ${dbMatch.team_away || '?'} (${dateKey(dbMatch) || 'no date'}).`);
        });

        const scoringInternetMatches = internetMatches.filter((row) => !isThirdPlace(row));
        if (scoringInternetMatches.length !== EXPECTED_SCORING_MATCH_COUNT) {
            addIssue(blockers, 'error', 'scoring_match_count', 'Scoring match count is incorrect', `Expected ${EXPECTED_SCORING_MATCH_COUNT} scoring fixtures plus one excluded third-place match; found ${scoringInternetMatches.length}.`);
        }
        if (finishedScoringMatches !== EXPECTED_SCORING_MATCH_COUNT) {
            addIssue(blockers, 'error', 'finished_scoring_match_count', 'Not every scoring match is finished', `${finishedScoringMatches} of ${EXPECTED_SCORING_MATCH_COUNT} scoring matches are finished on the internet source.`);
        }
        const finishedFinals = internetMatches.filter((row) => dateKey(row) === FINAL_DATE && row.stage === 'Finals' && isFinishedInternetMatch(row));
        if (finishedFinals.length !== 1) {
            addIssue(blockers, 'error', 'final_count', 'The World Cup final is not uniquely confirmed', `Found ${finishedFinals.length} finished Finals rows on ${FINAL_DATE}.`);
        }

        const teamAudit = new Map(localTeams.map((team) => [normalizeTeamName(team.name), {
            ...team,
            pickedCount: 0,
            breakdown: emptyBreakdown(),
            matches: []
        }]));

        scoringInternetMatches.filter(isFinishedInternetMatch).forEach((match) => {
            const stage = match.stage;
            const bucket = STAGE_BUCKETS[stage];
            const multiplier = STAGE_MULTIPLIERS[stage];
            if (!bucket || !multiplier) return;
            const homeKey = normalizeTeamName(match.team_home);
            const awayKey = normalizeTeamName(match.team_away);
            const internetWinner = winnerName(match);
            [homeKey, awayKey].forEach((teamKey) => {
                if (!teamAudit.has(teamKey)) {
                    addIssue(blockers, 'error', 'unknown_scoring_team', 'Internet scoring team is not in the pool team list', teamKey || 'Blank team name.');
                    return;
                }
                const isDraw = !internetWinner;
                const points = isDraw ? (stage === 'Group' ? multiplier : 0) : (internetWinner === teamKey ? 3 * multiplier : 0);
                const teamRow = teamAudit.get(teamKey);
                teamRow.breakdown[bucket] += points;
                teamRow.matches.push({ stage, opponent: teamKey === homeKey ? match.team_away : match.team_home, score: `${match.score_home}-${match.score_away}`, points });
            });
        });

        const officiallyAdvanced = new Set();
        internetMatches.filter((row) => row.stage === 'R32').forEach((row) => {
            if (row.team_home) officiallyAdvanced.add(normalizeTeamName(row.team_home));
            if (row.team_away) officiallyAdvanced.add(normalizeTeamName(row.team_away));
        });
        if (officiallyAdvanced.size !== 32) {
            addIssue(blockers, 'error', 'advancement_coverage', 'Round-of-32 advancement could not be completely derived', `Expected 32 unique teams, found ${officiallyAdvanced.size}.`);
        }

        const databaseAdvanced = new Set(advancement.filter((row) => row.advanced_to_knockouts).map((row) => normalizeTeamName(row.team_name)));
        const advancementDifferences = new Set([
            ...[...officiallyAdvanced].filter((teamName) => !databaseAdvanced.has(teamName)),
            ...[...databaseAdvanced].filter((teamName) => !officiallyAdvanced.has(teamName))
        ]);
        advancementDifferences.forEach((teamName) => {
            const displayName = teamByNormalized.get(teamName)?.name || teamName;
            addIssue(blockers, 'error', 'advancement_mismatch', 'Advancement bonus does not match the internet bracket', displayName);
        });

        officiallyAdvanced.forEach((teamName) => {
            const teamRow = teamAudit.get(teamName);
            if (teamRow) teamRow.breakdown.bonus = 1;
        });

        const profilesByEmail = new Map(profiles.filter((profile) => profile?.email).map((profile) => [normalizeEmail(profile.email), profile]));
        const picksByEmail = new Map();
        picks.forEach((pick) => {
            const email = normalizeEmail(pick?.user_email);
            if (!email) {
                addIssue(blockers, 'error', 'pick_missing_email', 'A saved selection has no user email', pick?.team_name || 'Unknown team.');
                return;
            }
            if (!picksByEmail.has(email)) picksByEmail.set(email, []);
            picksByEmail.get(email).push(pick);
            const teamRow = teamAudit.get(normalizeTeamName(pick.team_name));
            if (teamRow) teamRow.pickedCount += 1;
        });

        teamAudit.forEach((teamRow) => finalizeBreakdown(teamRow.breakdown));

        const players = [];
        picksByEmail.forEach((playerPicks, email) => {
            const profile = profilesByEmail.get(email);
            if (profile?.blocked) return;
            const playerIssues = [];
            const seenTeams = new Set();
            const squad = [];
            let totalCost = 0;
            let tierOneCount = 0;
            let tierThreeCount = 0;
            let total = 0;

            if (!profile) {
                playerIssues.push('Missing profile');
                addIssue(warnings, 'warning', 'missing_profile', 'Selections have no matching profile', email);
            }
            if (profile?.has_paid === false) {
                playerIssues.push('Marked unpaid');
                addIssue(warnings, 'warning', 'unpaid_player', 'Ranked entrant is marked unpaid', profile.nickname || profile.realname || email);
            }

            playerPicks.forEach((pick) => {
                const teamKey = normalizeTeamName(pick.team_name);
                const localTeam = teamByNormalized.get(teamKey);
                const teamRow = teamAudit.get(teamKey);
                if (!localTeam || !teamRow) {
                    playerIssues.push(`Unknown team: ${pick.team_name || 'blank'}`);
                    addIssue(blockers, 'error', 'unknown_pick_team', 'Selection contains an unknown or unqualified team', `${profile?.nickname || email}: ${pick.team_name || 'blank'}.`);
                    return;
                }
                if (seenTeams.has(teamKey)) {
                    playerIssues.push(`Duplicate: ${localTeam.name}`);
                    addIssue(blockers, 'error', 'duplicate_pick', 'Entrant has the same team more than once', `${profile?.nickname || email}: ${localTeam.name}.`);
                }
                seenTeams.add(teamKey);
                totalCost += Number(localTeam.cost || 0);
                if (Number(localTeam.tier) === 1) tierOneCount += 1;
                if (Number(localTeam.tier) === 3) tierThreeCount += 1;
                total += teamRow.breakdown.total;
                squad.push({ name: localTeam.name, points: teamRow.breakdown.total, tier: localTeam.tier, cost: localTeam.cost });

                const savedAt = Date.parse(pick.updated_at || '');
                if (Number.isFinite(lockDateMs) && Number.isFinite(savedAt) && savedAt > lockDateMs) {
                    playerIssues.push(`Late save: ${localTeam.name}`);
                    addIssue(blockers, 'error', 'late_pick', 'Selection was saved after the pool lock', `${profile?.nickname || email}: ${localTeam.name} at ${pick.updated_at}.`);
                }
            });

            if (totalCost > 150) {
                playerIssues.push(`Over budget: $${totalCost}`);
                addIssue(blockers, 'error', 'over_budget', 'Entrant is over the $150 budget', `${profile?.nickname || email}: $${totalCost}.`);
            }
            if (tierOneCount > 1) {
                playerIssues.push(`${tierOneCount} Tier 1 teams`);
                addIssue(blockers, 'error', 'tier_one_limit', 'Entrant has more than one Tier 1 team', profile?.nickname || email);
            }
            if (tierThreeCount < 3) {
                playerIssues.push(`Only ${tierThreeCount} Tier 3 teams`);
                addIssue(blockers, 'error', 'tier_three_minimum', 'Entrant has fewer than three Tier 3 teams', profile?.nickname || email);
            }

            const appTotal = appTotals.has(email) ? Number(appTotals.get(email)) : null;
            if (appTotal == null || !Number.isFinite(appTotal)) {
                playerIssues.push('Missing application total');
                addIssue(blockers, 'error', 'missing_app_total', 'Entrant is missing from the application leaderboard', profile?.nickname || email);
            } else if (appTotal !== total) {
                playerIssues.push(`Application total ${appTotal}; audit total ${total}`);
                addIssue(blockers, 'error', 'app_total_mismatch', 'Application points do not match the independent audit', `${profile?.nickname || email}: app ${appTotal}, audit ${total}.`);
            }

            players.push({
                email,
                nickname: profile?.nickname || playerPicks[0]?.team_nickname || 'TBA',
                realname: profile?.realname || playerPicks[0]?.team_realname || '',
                hasPaid: profile?.has_paid !== false,
                totalCost,
                total,
                appTotal,
                squad,
                issues: playerIssues
            });
        });

        profiles.forEach((profile) => {
            const email = normalizeEmail(profile?.email);
            if (email && !profile.blocked && !picksByEmail.has(email)) {
                addIssue(warnings, 'warning', 'profile_without_picks', 'Active profile has no saved selections', profile.nickname || profile.realname || email);
            }
        });

        players.sort((a, b) => b.total - a.total || a.nickname.localeCompare(b.nickname));
        let rank = 0;
        let previousTotal = null;
        players.forEach((player, index) => {
            if (player.total !== previousTotal) rank = index + 1;
            player.rank = rank;
            previousTotal = player.total;
        });

        const teamsOutput = [...teamAudit.values()].sort((a, b) => b.breakdown.total - a.breakdown.total || a.name.localeCompare(b.name));
        const status = blockers.length ? 'not_ready' : (warnings.length ? 'ready_with_warnings' : 'verified');
        return {
            status,
            blockers,
            warnings,
            matches: matchRows,
            teams: teamsOutput,
            players,
            summary: {
                internetMatches: internetMatches.length,
                databaseMatches: matches.length,
                matchedMatches,
                finishedScoringMatches,
                winnerMismatches,
                scoreWarnings,
                entrants: players.length,
                blockedProfiles: profiles.filter((profile) => profile?.blocked).length
            }
        };
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function statusPresentation(status) {
        if (status === 'verified') return { label: 'Verified', color: 'text-emerald-300', border: 'border-emerald-500/40', background: 'bg-emerald-500/10' };
        if (status === 'ready_with_warnings') return { label: 'Ready With Warnings', color: 'text-amber-300', border: 'border-amber-500/40', background: 'bg-amber-500/10' };
        return { label: 'Not Ready', color: 'text-rose-300', border: 'border-rose-500/40', background: 'bg-rose-500/10' };
    }

    function summaryCard(label, value, note, tone = 'text-white') {
        return `<div class="rounded-2xl border border-gray-700 bg-gray-950 px-4 py-4">
            <div class="text-[8px] font-black uppercase tracking-[0.18em] text-gray-500">${escapeHtml(label)}</div>
            <div class="mt-2 text-2xl font-black ${tone}">${escapeHtml(value)}</div>
            <div class="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-gray-500">${escapeHtml(note)}</div>
        </div>`;
    }

    function renderFinalAudit(audit, loadedAt) {
        const root = document.getElementById('admin-final-audit-root');
        if (!root) return;
        const status = statusPresentation(audit.status);
        const allIssues = [...audit.blockers, ...audit.warnings];
        const issueHtml = allIssues.length
            ? allIssues.slice(0, 200).map((issue) => `<div class="rounded-xl border px-4 py-3 ${issue.severity === 'error' ? 'border-rose-500/30 bg-rose-500/10' : 'border-amber-500/30 bg-amber-500/10'}">
                <div class="text-[10px] font-black uppercase tracking-[0.16em] ${issue.severity === 'error' ? 'text-rose-300' : 'text-amber-300'}">${escapeHtml(issue.title)}</div>
                ${issue.detail ? `<div class="mt-1 text-xs font-bold text-gray-300">${escapeHtml(issue.detail)}</div>` : ''}
            </div>`).join('')
            : '<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm font-black text-emerald-300">No audit issues found.</div>';

        const matchHtml = audit.matches.map((row) => {
            const internet = row.internet || {};
            const database = row.database || {};
            const badge = row.severity === 'error'
                ? '<span class="text-rose-300">Blocker</span>'
                : row.severity === 'warning'
                    ? '<span class="text-amber-300">Warning</span>'
                    : '<span class="text-emerald-300">Pass</span>';
            return `<tr class="border-t border-gray-800">
                <td class="px-3 py-3 whitespace-nowrap">${escapeHtml(dateKey(internet))}</td>
                <td class="px-3 py-3">${escapeHtml(internet.stage || (row.thirdPlace ? 'Third Place' : database.stage || 'Unknown'))}</td>
                <td class="px-3 py-3 font-black text-white">${escapeHtml(internet.team_home || '?')} vs ${escapeHtml(internet.team_away || '?')}</td>
                <td class="px-3 py-3 text-center font-mono">${internet.score_home == null ? '—' : `${escapeHtml(internet.score_home)}–${escapeHtml(internet.score_away)}`}</td>
                <td class="px-3 py-3 text-center font-mono">${database.score_home == null ? '—' : `${escapeHtml(database.score_home)}–${escapeHtml(database.score_away)}`}</td>
                <td class="px-3 py-3 text-[9px] font-black uppercase tracking-[0.12em]">${badge}</td>
                <td class="px-3 py-3 text-xs text-gray-400">${escapeHtml(row.note)}</td>
            </tr>`;
        }).join('');

        const playerHtml = audit.players.map((player) => `<tr class="border-t border-gray-800">
            <td class="px-3 py-3 text-center text-lg font-black text-white">${player.rank}</td>
            <td class="px-3 py-3"><div class="font-black text-white">${escapeHtml(player.nickname)}</div><div class="text-[10px] text-gray-500">${escapeHtml(player.realname)}</div></td>
            <td class="px-3 py-3 text-xs text-gray-300">${player.squad.map((team) => `${escapeHtml(team.name)} (${team.points})`).join(', ')}</td>
            <td class="px-3 py-3 text-center font-mono">$${escapeHtml(player.totalCost)}</td>
            <td class="px-3 py-3 text-center text-lg font-black text-emerald-300">${escapeHtml(player.total)}</td>
            <td class="px-3 py-3 text-center font-mono">${player.appTotal == null ? '—' : escapeHtml(player.appTotal)}</td>
            <td class="px-3 py-3 text-center">${player.hasPaid ? '<span class="text-emerald-300">Paid</span>' : '<span class="text-amber-300">Unpaid</span>'}</td>
            <td class="px-3 py-3 text-xs ${player.issues.length ? 'text-rose-300' : 'text-emerald-300'}">${player.issues.length ? player.issues.map(escapeHtml).join('; ') : 'Pass'}</td>
        </tr>`).join('');

        const teamHtml = audit.teams.map((team) => `<tr class="border-t border-gray-800">
            <td class="px-3 py-3 font-black text-white">${escapeHtml(team.flag || '')} ${escapeHtml(team.name)}</td>
            <td class="px-3 py-3 text-center">${escapeHtml(team.pickedCount)}</td>
            <td class="px-3 py-3 text-center">${team.breakdown.group}</td>
            <td class="px-3 py-3 text-center">${team.breakdown.bonus}</td>
            <td class="px-3 py-3 text-center">${team.breakdown.r32}</td>
            <td class="px-3 py-3 text-center">${team.breakdown.r16}</td>
            <td class="px-3 py-3 text-center">${team.breakdown.qf}</td>
            <td class="px-3 py-3 text-center">${team.breakdown.sf}</td>
            <td class="px-3 py-3 text-center">${team.breakdown.final}</td>
            <td class="px-3 py-3 text-center text-lg font-black text-emerald-300">${team.breakdown.total}</td>
        </tr>`).join('');

        root.innerHTML = `
            <div class="rounded-3xl border ${status.border} ${status.background} p-6">
                <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <div class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Payout decision</div>
                        <div class="mt-1 text-3xl font-black uppercase italic ${status.color}">${escapeHtml(status.label)}</div>
                        <div class="mt-2 text-xs font-bold text-gray-400">Fresh read-only audit run ${escapeHtml(loadedAt)}. No database entries were changed.</div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums" target="_blank" rel="noopener noreferrer" class="rounded-xl border border-gray-600 bg-gray-950 px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-gray-200 hover:border-blue-400">Open Official FIFA Results</a>
                        <button type="button" onclick="exportAdminFinalAuditCsv()" class="rounded-xl border border-gray-600 bg-gray-950 px-4 py-3 text-[9px] font-black uppercase tracking-[0.18em] text-gray-200 hover:border-blue-400">Export Player Audit</button>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                ${summaryCard('Internet', `${audit.summary.internetMatches}/${EXPECTED_MATCH_COUNT}`, 'fixtures received', audit.summary.internetMatches === EXPECTED_MATCH_COUNT ? 'text-emerald-300' : 'text-rose-300')}
                ${summaryCard('Database', `${audit.summary.matchedMatches}/${EXPECTED_MATCH_COUNT}`, 'fixtures matched', audit.summary.matchedMatches === EXPECTED_MATCH_COUNT ? 'text-emerald-300' : 'text-rose-300')}
                ${summaryCard('Scoring', `${audit.summary.finishedScoringMatches}/${EXPECTED_SCORING_MATCH_COUNT}`, 'finished and eligible', audit.summary.finishedScoringMatches === EXPECTED_SCORING_MATCH_COUNT ? 'text-emerald-300' : 'text-rose-300')}
                ${summaryCard('Wrong Winners', audit.summary.winnerMismatches, 'must be zero', audit.summary.winnerMismatches ? 'text-rose-300' : 'text-emerald-300')}
                ${summaryCard('Score Warnings', audit.summary.scoreWarnings, 'same winner', audit.summary.scoreWarnings ? 'text-amber-300' : 'text-emerald-300')}
                ${summaryCard('Entrants', audit.summary.entrants, `${audit.summary.blockedProfiles} blocked excluded`)}
            </div>
            <details open class="rounded-3xl border border-gray-700 bg-gray-800 overflow-hidden">
                <summary class="cursor-pointer px-6 py-5 text-sm font-black uppercase tracking-[0.18em] text-white">Audit Findings · ${audit.blockers.length} blockers · ${audit.warnings.length} warnings</summary>
                <div class="space-y-2 border-t border-gray-700 p-5">${issueHtml}</div>
            </details>
            <details open class="rounded-3xl border border-gray-700 bg-gray-800 overflow-hidden">
                <summary class="cursor-pointer px-6 py-5 text-sm font-black uppercase tracking-[0.18em] text-white">Final Player Totals</summary>
                <div class="overflow-x-auto border-t border-gray-700"><table class="min-w-[1050px] w-full text-left text-[11px] font-bold text-gray-300"><thead class="bg-gray-950 text-[9px] uppercase tracking-[0.14em] text-gray-400"><tr><th class="px-3 py-3 text-center">Rank</th><th class="px-3 py-3">Player</th><th class="px-3 py-3">Selections (audit points)</th><th class="px-3 py-3 text-center">Cost</th><th class="px-3 py-3 text-center">Audit</th><th class="px-3 py-3 text-center">App</th><th class="px-3 py-3 text-center">Payment</th><th class="px-3 py-3">Checks</th></tr></thead><tbody>${playerHtml || '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">No entrants returned.</td></tr>'}</tbody></table></div>
            </details>
            <details class="rounded-3xl border border-gray-700 bg-gray-800 overflow-hidden">
                <summary class="cursor-pointer px-6 py-5 text-sm font-black uppercase tracking-[0.18em] text-white">All ${audit.teams.length} Team Totals</summary>
                <div class="overflow-x-auto border-t border-gray-700"><table class="min-w-[900px] w-full text-left text-[11px] font-bold text-gray-300"><thead class="bg-gray-950 text-[9px] uppercase tracking-[0.14em] text-gray-400"><tr><th class="px-3 py-3">Team</th><th class="px-3 py-3 text-center">Picks</th><th class="px-3 py-3 text-center">Group</th><th class="px-3 py-3 text-center">Bonus</th><th class="px-3 py-3 text-center">R32</th><th class="px-3 py-3 text-center">R16</th><th class="px-3 py-3 text-center">QF</th><th class="px-3 py-3 text-center">SF</th><th class="px-3 py-3 text-center">Final</th><th class="px-3 py-3 text-center">Total</th></tr></thead><tbody>${teamHtml}</tbody></table></div>
            </details>
            <details class="rounded-3xl border border-gray-700 bg-gray-800 overflow-hidden">
                <summary class="cursor-pointer px-6 py-5 text-sm font-black uppercase tracking-[0.18em] text-white">All ${audit.matches.length} Match Comparisons</summary>
                <div class="overflow-x-auto border-t border-gray-700"><table class="min-w-[1100px] w-full text-left text-[11px] font-bold text-gray-300"><thead class="bg-gray-950 text-[9px] uppercase tracking-[0.14em] text-gray-400"><tr><th class="px-3 py-3">Date</th><th class="px-3 py-3">Stage</th><th class="px-3 py-3">Match</th><th class="px-3 py-3 text-center">Internet</th><th class="px-3 py-3 text-center">Database</th><th class="px-3 py-3">Status</th><th class="px-3 py-3">Notes</th></tr></thead><tbody>${matchHtml}</tbody></table></div>
            </details>`;
    }

    async function readAllRows(table, columns) {
        const pageSize = 1000;
        const rows = [];
        for (let from = 0; ; from += pageSize) {
            const { data, error } = await supabaseClient.from(table).select(columns).range(from, from + pageSize - 1);
            if (error) throw error;
            rows.push(...(data || []));
            if (!data || data.length < pageSize) return rows;
        }
    }

    function buildApplicationTotals(picks, profiles, matches, advancementRows) {
        if (!globalScope.WorldCupScoring) return new Map();
        const blocked = new Set(profiles.filter((profile) => profile?.blocked).map((profile) => normalizeEmail(profile.email)));
        const includedPicks = picks.filter((pick) => !blocked.has(normalizeEmail(pick.user_email)));
        const profilesMap = globalScope.WorldCupScoring.buildProfilesMap(profiles.filter((profile) => !profile?.blocked));
        const advanced = new Set(advancementRows.filter((row) => row.advanced_to_knockouts).map((row) => row.team_name));
        const eliminated = new Set(advancementRows.filter((row) => row.eliminated).map((row) => row.team_name));
        const leaderboard = globalScope.WorldCupScoring.buildLeaderboardData(includedPicks, matches, profilesMap, teams, advanced, eliminated);
        return new Map(leaderboard.map((player) => [normalizeEmail(player.email), Number(player.totalPoints)]));
    }

    let latestAudit = null;

    async function fetchAdminFinalAudit() {
        const root = document.getElementById('admin-final-audit-root');
        const button = document.getElementById('admin-final-audit-run');
        if (!root) return;

        const { data: authData } = await supabaseClient.auth.getUser();
        const authenticatedEmail = normalizeEmail(authData?.user?.email);
        if (!authenticatedEmail || authenticatedEmail !== normalizeEmail(userEmail) || typeof isProtectedAdminEmail !== 'function' || !isProtectedAdminEmail(authenticatedEmail)) {
            root.innerHTML = '<div class="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm font-black text-rose-300">Final Audit requires a verified administrator login.</div>';
            return;
        }

        if (button) button.disabled = true;
        root.innerHTML = '<div class="rounded-3xl border border-gray-700 bg-gray-800 p-10 text-center text-xs font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">Reading Supabase and checking internet results…</div>';

        try {
            const internetRequest = fetch(MATCH_SYNC_URL).then(async (response) => {
                const payload = await response.json();
                if (!response.ok || !payload.ok) throw new Error(payload.error || 'Internet-results preview failed.');
                if (payload.summary?.execute !== false) throw new Error('Safety check failed: internet preview was not read-only.');
                return payload.planned || [];
            });

            const [picks, profiles, matches, advancementRows, internetMatches] = await Promise.all([
                readAllRows('picks', 'user_email,team_name,team_nickname,team_realname,tier,cost,updated_at'),
                readAllRows('profiles', 'email,nickname,realname,has_paid,blocked,updated_at'),
                readAllRows('matches', 'id,stage,team_home,team_away,score_home,score_away,match_date,match_date_manual,is_finished,was_extra_time,manual_override,auto_synced_at'),
                readAllRows('team_advancement', 'team_name,advanced_to_knockouts,eliminated'),
                internetRequest
            ]);

            latestAudit = buildFinalAudit({
                picks,
                profiles,
                matches,
                advancement: advancementRows,
                internetMatches,
                teams,
                lockDate: typeof LOCK_DATE !== 'undefined' ? LOCK_DATE : null,
                appTotals: buildApplicationTotals(picks, profiles, matches, advancementRows)
            });
            renderFinalAudit(latestAudit, new Date().toLocaleString());
        } catch (error) {
            root.innerHTML = `<div class="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6"><div class="text-lg font-black text-rose-300">Audit could not run</div><div class="mt-2 text-sm font-bold text-gray-300">${escapeHtml(error?.message || String(error))}</div><div class="mt-2 text-xs text-gray-500">No database entries were changed.</div></div>`;
        } finally {
            if (button) button.disabled = false;
        }
    }

    function csvCell(value) {
        const text = String(value ?? '');
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }

    function exportAdminFinalAuditCsv() {
        if (!latestAudit) return;
        const rows = [['rank', 'nickname', 'real_name', 'selected_teams', 'cost', 'audit_points', 'app_points', 'paid', 'issues']];
        latestAudit.players.forEach((player) => rows.push([
            player.rank,
            player.nickname,
            player.realname,
            player.squad.map((team) => team.name).join('; '),
            player.totalCost,
            player.total,
            player.appTotal ?? '',
            player.hasPaid ? 'yes' : 'no',
            player.issues.join('; ')
        ]));
        const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `world-cup-final-audit-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
    }

    const api = {
        EXPECTED_MATCH_COUNT,
        EXPECTED_SCORING_MATCH_COUNT,
        STAGE_MULTIPLIERS,
        normalizeTeamName,
        isThirdPlace,
        buildFinalAudit,
        fetchAdminFinalAudit,
        exportAdminFinalAuditCsv
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    globalScope.WorldCupFinalAudit = api;
    globalScope.fetchAdminFinalAudit = fetchAdminFinalAudit;
    globalScope.exportAdminFinalAuditCsv = exportAdminFinalAuditCsv;
})(typeof window !== 'undefined' ? window : globalThis);
