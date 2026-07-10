import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
    STAGE_MULTIPLIERS,
    getMatchPointsForTeam,
    buildTeamPointsMap,
    buildAdvancedTeamsSet,
    buildTeamStageBreakdownMap,
    buildProfilesMap,
    buildLeaderboardData,
    getSquadSignature,
    buildBestAvailableSquadsData,
    buildBestAvailableSquadRankings,
    buildBestAvailableTeamData
} = require('../js/scoring.js');

const teams = [
    { name: 'Spain', flag: '🇪🇸', cost: 50, tier: 1 },
    { name: 'Morocco', flag: '🇲🇦', cost: 25, tier: 2 },
    { name: 'Canada', flag: '🇨🇦', cost: 10, tier: 2 },
    { name: 'Iraq', flag: '🇮🇶', cost: 4, tier: 3 }
];

test('stage multipliers match the pool rules', () => {
    assert.deepEqual(STAGE_MULTIPLIERS, {
        Group: 1,
        R32: 2,
        R16: 3,
        Quarters: 5,
        Semis: 8,
        Finals: 12
    });
});

test('group draw awards 1 point to each team in the match', () => {
    const match = {
        stage: 'Group',
        team_home: 'Spain',
        team_away: 'Morocco',
        score_home: 1,
        score_away: 1
    };

    assert.equal(getMatchPointsForTeam(match, 'Spain'), 1);
    assert.equal(getMatchPointsForTeam(match, 'Morocco'), 1);
    assert.equal(getMatchPointsForTeam(match, 'Canada'), 0);
});

test('knockout win applies the correct multiplier', () => {
    const r16Match = {
        stage: 'R16',
        team_home: 'Canada',
        team_away: 'Iraq',
        score_home: 2,
        score_away: 1
    };

    const finalMatch = {
        stage: 'Finals',
        team_home: 'Spain',
        team_away: 'Morocco',
        score_home: 3,
        score_away: 2
    };

    assert.equal(getMatchPointsForTeam(r16Match, 'Canada'), 9);
    assert.equal(getMatchPointsForTeam(r16Match, 'Iraq'), 0);
    assert.equal(getMatchPointsForTeam(finalMatch, 'Spain'), 36);
});

test('unfinished or null-score matches award zero points', () => {
    const teamsWithSouthAfrica = [
        ...teams,
        { name: 'South Africa', flag: '🇿🇦', cost: 8, tier: 3 }
    ];
    const unfinishedR32 = {
        stage: 'R32',
        team_home: 'South Africa',
        team_away: 'Canada',
        score_home: null,
        score_away: null,
        is_finished: false
    };

    assert.equal(getMatchPointsForTeam(unfinishedR32, 'South Africa'), 0);
    assert.equal(getMatchPointsForTeam(unfinishedR32, 'Canada'), 0);
    assert.deepEqual(buildTeamPointsMap([unfinishedR32], teamsWithSouthAfrica), {
        Spain: 0,
        Morocco: 0,
        Canada: 0,
        'South Africa': 0,
        Iraq: 0
    });
});

test('future real-team knockout rows do not change leaderboard totals until finished', () => {
    const teamsWithSouthAfrica = [
        ...teams,
        { name: 'South Africa', flag: '🇿🇦', cost: 8, tier: 3 }
    ];
    const matches = [
        {
            stage: 'R32',
            team_home: 'South Africa',
            team_away: 'Canada',
            score_home: null,
            score_away: null,
            is_finished: false
        }
    ];
    const picks = [
        { user_email: 'amy@example.com', team_name: 'Canada' }
    ];
    const profilesMap = buildProfilesMap([
        { email: 'amy@example.com', nickname: 'Amy', realname: 'Amy A' }
    ]);

    const leaderboard = buildLeaderboardData(picks, matches, profilesMap, teamsWithSouthAfrica);

    assert.equal(leaderboard[0].totalPoints, 0);
    assert.equal(leaderboard[0].stagePoints.R32, 0);
});

test('finished R32 South Africa 0-1 Canada awards Canada R32 points', () => {
    const match = {
        stage: 'R32',
        team_home: 'South Africa',
        team_away: 'Canada',
        score_home: 0,
        score_away: 1,
        is_finished: true
    };

    assert.equal(getMatchPointsForTeam(match, 'Canada'), 6);
    assert.equal(getMatchPointsForTeam(match, 'South Africa'), 0);
});

test('every knockout stage uses the expected multiplier in scoring', () => {
    const stageExpectations = [
        ['R32', 6],
        ['R16', 9],
        ['Quarters', 15],
        ['Semis', 24],
        ['Finals', 36]
    ];

    stageExpectations.forEach(([stage, expectedPoints]) => {
        const match = {
            stage,
            team_home: 'Spain',
            team_away: 'Morocco',
            score_home: 1,
            score_away: 0
        };

        assert.equal(getMatchPointsForTeam(match, 'Spain'), expectedPoints);
        assert.equal(getMatchPointsForTeam(match, 'Morocco'), 0);
    });
});

test('team points aggregate across multiple matches', () => {
    const matches = [
        {
            stage: 'Group',
            team_home: 'Spain',
            team_away: 'Morocco',
            score_home: 1,
            score_away: 1
        },
        {
            stage: 'R16',
            team_home: 'Spain',
            team_away: 'Canada',
            score_home: 2,
            score_away: 0
        }
    ];

    assert.deepEqual(buildTeamPointsMap(matches, teams), {
        Spain: 10,
        Morocco: 1,
        Canada: 0,
        Iraq: 0
    });
});

test('advancement bonus adds 1 point immediately to advanced teams', () => {
    const matches = [
        {
            stage: 'Group',
            team_home: 'Spain',
            team_away: 'Morocco',
            score_home: 1,
            score_away: 1
        }
    ];

    const advancedTeams = buildAdvancedTeamsSet([
        { team_name: 'Spain', advanced_to_knockouts: true },
        { team_name: 'Canada', advanced_to_knockouts: true },
        { team_name: 'Morocco', advanced_to_knockouts: false }
    ]);

    assert.deepEqual(buildTeamPointsMap(matches, teams, advancedTeams), {
        Spain: 2,
        Morocco: 1,
        Canada: 1,
        Iraq: 0
    });
});

test('team stage breakdown includes group slots and bonus separately', () => {
    const matches = [
        {
            id: 1,
            stage: 'Group',
            match_date_manual: '2026-06-11',
            team_home: 'Spain',
            team_away: 'Morocco',
            score_home: 2,
            score_away: 0
        },
        {
            id: 2,
            stage: 'Group',
            match_date_manual: '2026-06-15',
            team_home: 'Spain',
            team_away: 'Canada',
            score_home: 1,
            score_away: 1
        }
    ];

    const advancedTeams = buildAdvancedTeamsSet([
        { team_name: 'Spain', advanced_to_knockouts: true }
    ]);

    const breakdown = buildTeamStageBreakdownMap(matches, teams, advancedTeams);

    assert.equal(breakdown.Spain.G1, 3);
    assert.equal(breakdown.Spain.G2, 1);
    assert.equal(breakdown.Spain.G3, 0);
    assert.equal(breakdown.Spain.Bonus, 1);
    assert.equal(breakdown.Spain.total, 5);
});

test('team stage breakdown total equals the sum of each scoring bucket', () => {
    const matches = [
        { id: 1, stage: 'Group', match_date_manual: '2026-06-11', team_home: 'Spain', team_away: 'Morocco', score_home: 2, score_away: 0 },
        { id: 2, stage: 'Group', match_date_manual: '2026-06-15', team_home: 'Spain', team_away: 'Canada', score_home: 1, score_away: 1 },
        { id: 3, stage: 'R32', match_date_manual: '2026-07-01', team_home: 'Spain', team_away: 'Iraq', score_home: 1, score_away: 0 },
        { id: 4, stage: 'R16', match_date_manual: '2026-07-06', team_home: 'Spain', team_away: 'Canada', score_home: 2, score_away: 0 }
    ];

    const advancedTeams = buildAdvancedTeamsSet([
        { team_name: 'Spain', advanced_to_knockouts: true }
    ]);

    const breakdown = buildTeamStageBreakdownMap(matches, teams, advancedTeams).Spain;

    assert.equal(
        breakdown.total,
        breakdown.G1 + breakdown.G2 + breakdown.G3 + breakdown.Bonus + breakdown.R32 + breakdown.R16 + breakdown.QF + breakdown.SM + breakdown.F
    );
    assert.equal(breakdown.total, 20);
});

test('leaderboard totals score each saved squad and break ties alphabetically by nickname', () => {
    const matches = [
        {
            stage: 'Group',
            team_home: 'Spain',
            team_away: 'Morocco',
            score_home: 2,
            score_away: 0
        },
        {
            stage: 'Semis',
            team_home: 'Canada',
            team_away: 'Iraq',
            score_home: 1,
            score_away: 0
        }
    ];

    const picks = [
        { user_email: 'amy@example.com', team_name: 'Spain' },
        { user_email: 'amy@example.com', team_name: 'Canada' },
        { user_email: 'zoe@example.com', team_name: 'Spain' },
        { user_email: 'zoe@example.com', team_name: 'Canada' }
    ];

    const profilesMap = buildProfilesMap([
        { email: 'amy@example.com', nickname: 'Amy', realname: 'Amy A' },
        { email: 'zoe@example.com', nickname: 'Zoe', realname: 'Zoe Z' }
    ]);

    const advancedTeams = buildAdvancedTeamsSet([
        { team_name: 'Canada', advanced_to_knockouts: true }
    ]);

    const leaderboard = buildLeaderboardData(picks, matches, profilesMap, teams, advancedTeams);

    assert.equal(leaderboard[0].nickname, 'Amy');
    assert.equal(leaderboard[1].nickname, 'Zoe');
    assert.equal(leaderboard[0].totalPoints, 28);
    assert.equal(leaderboard[1].totalPoints, 28);
    assert.equal(leaderboard[0].stagePoints.Bonus, 1);
    assert.deepEqual(
        leaderboard[0].squad.map((team) => team.name),
        ['Spain', 'Canada']
    );
});

test('leaderboard squad carries eliminated status from team advancement rows', () => {
    const picks = [
        { user_email: 'amy@example.com', team_name: 'Spain' },
        { user_email: 'amy@example.com', team_name: 'Canada' }
    ];

    const profilesMap = buildProfilesMap([
        { email: 'amy@example.com', nickname: 'Amy', realname: 'Amy A' }
    ]);

    const leaderboard = buildLeaderboardData(
        picks,
        [],
        profilesMap,
        teams,
        new Set(),
        new Set(['Canada'])
    );

    assert.equal(leaderboard[0].squad.find((team) => team.name === 'Spain').eliminated, false);
    assert.equal(leaderboard[0].squad.find((team) => team.name === 'Canada').eliminated, true);
});

test('best available team respects budget and tier rules', () => {
    const expandedTeams = [
        { name: 'Spain', flag: '🇪🇸', cost: 50, tier: 1 },
        { name: 'France', flag: '🇫🇷', cost: 45, tier: 1 },
        { name: 'Morocco', flag: '🇲🇦', cost: 25, tier: 2 },
        { name: 'Canada', flag: '🇨🇦', cost: 10, tier: 2 },
        { name: 'Mexico', flag: '🇲🇽', cost: 25, tier: 2 },
        { name: 'Iraq', flag: '🇮🇶', cost: 4, tier: 3 },
        { name: 'Jordan', flag: '🇯🇴', cost: 2, tier: 3 },
        { name: 'Haiti', flag: '🇭🇹', cost: 2, tier: 3 },
        { name: 'Qatar', flag: '🇶🇦', cost: 4, tier: 3 },
        { name: 'Italy', flag: '🇮🇹', cost: 0, tier: 3, qualified: false }
    ];

    const matches = [
        { stage: 'Finals', team_home: 'Italy', team_away: 'Spain', score_home: 5, score_away: 0 },
        { stage: 'Finals', team_home: 'Spain', team_away: 'France', score_home: 1, score_away: 0 },
        { stage: 'R16', team_home: 'Morocco', team_away: 'Canada', score_home: 1, score_away: 0 },
        { stage: 'Group', team_home: 'Mexico', team_away: 'Iraq', score_home: 1, score_away: 0 },
        { stage: 'Group', team_home: 'Jordan', team_away: 'Haiti', score_home: 1, score_away: 1 },
        { stage: 'Group', team_home: 'Qatar', team_away: 'Canada', score_home: 0, score_away: 0 }
    ];

    const bestTeam = buildBestAvailableTeamData(matches, expandedTeams, new Set(['Canada']), new Set(['France']));

    assert.equal(bestTeam.nickname, 'Best Available Team to Date');
    assert.ok(bestTeam.squad.length >= 3);
    assert.ok(bestTeam.squad.filter((team) => team.tier === 1).length <= 1);
    assert.ok(bestTeam.squad.filter((team) => team.tier === 3).length >= 3);
    assert.ok(bestTeam.squad.reduce((sum, team) => sum + team.cost, 0) <= 150);
    assert.equal(bestTeam.squad.some((team) => team.name === 'Italy'), false);
});

test('best available squads returns ranked legal candidates', () => {
    const expandedTeams = [
        { name: 'Spain', flag: '🇪🇸', cost: 50, tier: 1 },
        { name: 'France', flag: '🇫🇷', cost: 45, tier: 1 },
        { name: 'Morocco', flag: '🇲🇦', cost: 25, tier: 2 },
        { name: 'Canada', flag: '🇨🇦', cost: 10, tier: 2 },
        { name: 'Mexico', flag: '🇲🇽', cost: 25, tier: 2 },
        { name: 'Iraq', flag: '🇮🇶', cost: 4, tier: 3 },
        { name: 'Jordan', flag: '🇯🇴', cost: 2, tier: 3 },
        { name: 'Haiti', flag: '🇭🇹', cost: 2, tier: 3 },
        { name: 'Qatar', flag: '🇶🇦', cost: 4, tier: 3 }
    ];

    const matches = [
        { stage: 'Finals', team_home: 'Spain', team_away: 'France', score_home: 1, score_away: 0 },
        { stage: 'R16', team_home: 'Morocco', team_away: 'Canada', score_home: 1, score_away: 0 },
        { stage: 'Group', team_home: 'Mexico', team_away: 'Iraq', score_home: 1, score_away: 0 },
        { stage: 'Group', team_home: 'Jordan', team_away: 'Haiti', score_home: 1, score_away: 1 },
        { stage: 'Group', team_home: 'Qatar', team_away: 'Canada', score_home: 0, score_away: 0 }
    ];

    const candidates = buildBestAvailableSquadsData(matches, expandedTeams, new Set(['Canada']), new Set(['France']), { limit: 5 });
    const bestTeam = buildBestAvailableTeamData(matches, expandedTeams, new Set(['Canada']), new Set(['France']));
    const signatures = new Set();

    assert.ok(candidates.length > 0);
    assert.ok(candidates.length <= 5);
    assert.equal(candidates[0].totalPoints, bestTeam.totalPoints);
    assert.equal(candidates[0].signature, getSquadSignature(bestTeam.squad));

    candidates.forEach((candidate) => {
        assert.ok(candidate.squad.length >= 3);
        assert.ok(candidate.totalCost <= 150);
        assert.ok(candidate.squad.filter((team) => team.tier === 1).length <= 1);
        assert.ok(candidate.squad.filter((team) => team.tier === 3).length >= 3);
        assert.equal(candidate.squad.some((team) => team.name === 'Italy'), false);
        assert.equal(candidate.signature, getSquadSignature(candidate.squad));
        assert.equal(signatures.has(candidate.signature), false);
        signatures.add(candidate.signature);
    });

    for (let index = 1; index < candidates.length; index += 1) {
        const previous = candidates[index - 1];
        const current = candidates[index];
        assert.ok(
            previous.totalPoints > current.totalPoints
                || (
                    previous.totalPoints === current.totalPoints
                    && (
                        previous.totalCost < current.totalCost
                        || (previous.totalCost === current.totalCost && previous.signature <= current.signature)
                    )
                )
        );
    }
});

test('best available squads can include more than eight teams when extra teams add points', () => {
    const variableTeams = [
        { name: 'Spain', flag: '🇪🇸', cost: 40, tier: 1 },
        { name: 'Morocco', flag: '🇲🇦', cost: 30, tier: 2 },
        { name: 'Canada', flag: '🇨🇦', cost: 25, tier: 2 },
        { name: 'Mexico', flag: '🇲🇽', cost: 20, tier: 2 },
        { name: 'USA', flag: '🇺🇸', cost: 15, tier: 2 },
        { name: 'Iraq', flag: '🇮🇶', cost: 6, tier: 3 },
        { name: 'Jordan', flag: '🇯🇴', cost: 4, tier: 3 },
        { name: 'Haiti', flag: '🇭🇹', cost: 4, tier: 3 },
        { name: 'Qatar', flag: '🇶🇦', cost: 6, tier: 3 }
    ];
    const advanced = new Set(variableTeams.map((team) => team.name));

    const bestTeam = buildBestAvailableTeamData([], variableTeams, advanced, new Set());

    assert.equal(bestTeam.squad.length, 9);
    assert.equal(bestTeam.totalCost, 150);
    assert.equal(bestTeam.totalPoints, 9);
});

test('best available squads can return fewer than eight teams when extras do not add points', () => {
    const variableTeams = [
        { name: 'Iraq', flag: '🇮🇶', cost: 2, tier: 3 },
        { name: 'Jordan', flag: '🇯🇴', cost: 2, tier: 3 },
        { name: 'Haiti', flag: '🇭🇹', cost: 2, tier: 3 },
        { name: 'Spain', flag: '🇪🇸', cost: 50, tier: 1 },
        { name: 'Morocco', flag: '🇲🇦', cost: 25, tier: 2 },
        { name: 'Canada', flag: '🇨🇦', cost: 10, tier: 2 },
        { name: 'Qatar', flag: '🇶🇦', cost: 4, tier: 3 },
        { name: 'Italy', flag: '🇮🇹', cost: 0, tier: 3, qualified: false }
    ];
    const advanced = new Set(['Iraq', 'Jordan', 'Haiti']);

    const bestTeam = buildBestAvailableTeamData([], variableTeams, advanced, new Set());

    assert.equal(bestTeam.squad.length, 3);
    assert.equal(bestTeam.totalCost, 6);
    assert.equal(bestTeam.totalPoints, 3);
    assert.deepEqual(bestTeam.squad.map((team) => team.name).sort(), ['Haiti', 'Iraq', 'Jordan']);
});

test('best available squad rankings can place a real squad outside the displayed top list', () => {
    const tinyTeams = [
        { name: 'Spain', flag: '🇪🇸', cost: 10, tier: 1 },
        { name: 'Morocco', flag: '🇲🇦', cost: 10, tier: 2 },
        { name: 'Iraq', flag: '🇮🇶', cost: 1, tier: 3 },
        { name: 'Jordan', flag: '🇯🇴', cost: 1, tier: 3 },
        { name: 'Haiti', flag: '🇭🇹', cost: 1, tier: 3 }
    ];
    const advanced = new Set(tinyTeams.map((team) => team.name));
    const candidates = buildBestAvailableSquadsData([], tinyTeams, advanced, new Set(), { limit: 2 });
    const [poolContext] = buildBestAvailableSquadRankings([], tinyTeams, advanced, new Set(), [{
        email: 'pool@example.com',
        nickname: 'Pool Leader',
        squad: tinyTeams.filter((team) => ['Iraq', 'Jordan', 'Haiti'].includes(team.name))
    }]);

    assert.equal(poolContext.legal, true);
    assert.equal(poolContext.totalPoints, 3);
    assert.equal(poolContext.totalCost, 3);
    assert.equal(poolContext.totalLegalSquads, 4n);
    assert.equal(poolContext.rankStart, 4n);
    assert.equal(poolContext.rankEnd, 4n);
    assert.equal(candidates.some((candidate) => candidate.signature === poolContext.signature), false);
});
