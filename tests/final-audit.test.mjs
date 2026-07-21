import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildFinalAudit } = require('../js/final-audit.js');

function isoDate(year, month, dayOffset) {
    return new Date(Date.UTC(year, month - 1, 1 + dayOffset)).toISOString().slice(0, 10);
}

function buildCompleteFixture() {
    const teams = Array.from({ length: 48 }, (_, index) => ({
        name: `Team ${index + 1}`,
        flag: '🏳️',
        tier: 3,
        cost: 1,
        qualified: true
    }));
    const internetMatches = [];

    for (let index = 0; index < 72; index += 1) {
        const home = teams[index % teams.length].name;
        const away = teams[(index + 1 + Math.floor(index / teams.length)) % teams.length].name;
        internetMatches.push({
            api_id: index + 1,
            db_id: index + 1,
            api_status: 'FINISHED',
            stage: 'Group',
            team_home: home,
            team_away: away,
            score_home: index % 5 === 0 ? 1 : 2,
            score_away: index % 5 === 0 ? 1 : 0,
            match_date: isoDate(2026, 6, 10 + Math.floor(index / 4))
        });
    }

    const knockoutStages = [
        ['R32', 16, 27],
        ['R16', 8, 33],
        ['Quarters', 4, 38],
        ['Semis', 2, 42]
    ];
    let nextId = 73;
    knockoutStages.forEach(([stage, count, dayOffset]) => {
        for (let index = 0; index < count; index += 1) {
            internetMatches.push({
                api_id: nextId,
                db_id: nextId,
                api_status: 'FINISHED',
                stage,
                team_home: teams[index * 2].name,
                team_away: teams[index * 2 + 1].name,
                score_home: 2,
                score_away: 1,
                match_date: isoDate(2026, 6, dayOffset + Math.floor(index / 4))
            });
            nextId += 1;
        }
    });

    internetMatches.push({
        api_id: 103,
        db_id: 103,
        api_status: 'FINISHED',
        stage: null,
        team_home: teams[2].name,
        team_away: teams[3].name,
        score_home: 3,
        score_away: 2,
        match_date: '2026-07-18'
    });
    internetMatches.push({
        api_id: 104,
        db_id: 104,
        api_status: 'FINISHED',
        stage: 'Finals',
        team_home: teams[0].name,
        team_away: teams[1].name,
        score_home: 2,
        score_away: 1,
        match_date: '2026-07-19'
    });

    const matches = internetMatches.map((match) => ({
        id: match.db_id,
        stage: match.stage || 'Finals',
        team_home: match.team_home,
        team_away: match.team_away,
        score_home: match.score_home,
        score_away: match.score_away,
        match_date_manual: match.match_date,
        is_finished: true,
        was_extra_time: false
    }));
    const advancement = teams.map((team, index) => ({
        team_name: team.name,
        advanced_to_knockouts: index < 32,
        eliminated: index !== 0
    }));

    const fixture = { teams, internetMatches, matches, advancement, picks: [], profiles: [], appTotals: new Map(), lockDate: '2026-06-11T18:00:00Z' };
    return addValidPlayer(fixture);
}

function addValidPlayer(fixture) {
    const baseline = buildFinalAudit(fixture);
    const chosenTeams = fixture.teams.slice(32, 35);
    const expectedTotal = chosenTeams.reduce((sum, team) => {
        const auditTeam = baseline.teams.find((row) => row.name === team.name);
        return sum + auditTeam.breakdown.total;
    }, 0);
    fixture.profiles = [{ email: 'player@example.com', nickname: 'Player', realname: 'Example', has_paid: true, blocked: false }];
    fixture.picks = chosenTeams.map((team) => ({
        user_email: 'player@example.com',
        team_name: team.name,
        updated_at: '2026-06-11T17:59:00Z'
    }));
    fixture.appTotals = new Map([['player@example.com', expectedTotal]]);
    return fixture;
}

test('complete 104-match tournament produces a verified read-only audit', () => {
    const audit = buildFinalAudit(buildCompleteFixture());

    assert.equal(audit.status, 'verified');
    assert.equal(audit.summary.internetMatches, 104);
    assert.equal(audit.summary.matchedMatches, 104);
    assert.equal(audit.summary.finishedScoringMatches, 103);
    assert.equal(audit.summary.winnerMismatches, 0);
    assert.equal(audit.blockers.length, 0);
});

test('same winner with a different exact score is a warning, not a blocker', () => {
    const fixture = buildCompleteFixture();
    fixture.matches[0].score_home = 3;
    fixture.matches[0].score_away = 3;
    const audit = buildFinalAudit(fixture);

    assert.equal(audit.status, 'ready_with_warnings');
    assert.equal(audit.blockers.length, 0);
    assert.ok(audit.warnings.some((issue) => issue.code === 'score_mismatch'));
});

test('different winning team blocks payout verification', () => {
    const fixture = buildCompleteFixture();
    fixture.matches[1].score_home = 0;
    fixture.matches[1].score_away = 2;
    const audit = buildFinalAudit(fixture);

    assert.equal(audit.status, 'not_ready');
    assert.equal(audit.summary.winnerMismatches, 1);
    assert.ok(audit.blockers.some((issue) => issue.code === 'winner_mismatch'));
});

test('late saved selection blocks payout even when its points total agrees', () => {
    const fixture = buildCompleteFixture();
    fixture.picks[0].updated_at = '2026-06-11T18:00:01Z';

    const audit = buildFinalAudit(fixture);
    assert.equal(audit.status, 'not_ready');
    assert.ok(audit.blockers.some((issue) => issue.code === 'late_pick'));
});

test('empty selection reads can never be marked verified', () => {
    const fixture = buildCompleteFixture();
    fixture.picks = [];
    fixture.profiles = [];
    fixture.appTotals = new Map();
    const audit = buildFinalAudit(fixture);

    assert.equal(audit.status, 'not_ready');
    assert.ok(audit.blockers.some((issue) => issue.code === 'selection_data_empty'));
    assert.ok(audit.blockers.some((issue) => issue.code === 'profile_data_empty'));
});

test('admin final-audit module contains no Supabase write operation', () => {
    const source = fs.readFileSync(new URL('../js/final-audit.js', import.meta.url), 'utf8');
    const forbiddenCalls = ['.insert(', '.update(', '.delete(', '.upsert(', '.rpc('];

    forbiddenCalls.forEach((call) => assert.equal(source.includes(call), false, `${call} must not appear in the read-only audit module`));
    assert.equal(source.includes('execute=true'), false, 'internet check must never request write mode');
});
