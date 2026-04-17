import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const scoringApi = require('../js/scoring.js');
const { THIRD_PLACE_MAPPING } = require('../js/third-place-mapping.js');

const GROUP_LETTERS = 'ABCDEFGHIJKL'.split('');
const THIRD_PLACE_WINNER_SEEDS = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L'];

function loadTournamentApi() {
    const featuresPath = require.resolve('../js/features.js');
    delete require.cache[featuresPath];

    global.window = { WorldCupScoring: scoringApi };
    global.window.WorldCupThirdPlaceMapping = { THIRD_PLACE_MAPPING };
    global.document = { getElementById: () => null };
    global.supabaseClient = {};
    global.advancedTeams = new Set();
    global.eliminatedTeams = new Set();
    global.teams = [];

    const api = require('../js/features.js');
    global.teams = deriveTeamsFromSchedule(api.GROUP_STAGE_SCHEDULE);
    return api;
}

function deriveTeamsFromSchedule(schedule) {
    const seen = new Map();
    let cost = 100;

    schedule.forEach((match) => {
        [match.home, match.away].forEach((teamName) => {
            if (seen.has(teamName)) return;
            seen.set(teamName, {
                name: teamName,
                group: match.group,
                flag: `:${teamName}:`,
                cost,
                qualified: true
            });
            cost -= 1;
        });
    });

    return [...seen.values()];
}

function buildCompletedGroupStage(schedule) {
    const teamsByGroup = new Map();
    const groupByName = new Map();

    schedule.forEach((match) => {
        if (!teamsByGroup.has(match.group)) teamsByGroup.set(match.group, []);
        const groupTeams = teamsByGroup.get(match.group);
        [match.home, match.away].forEach((teamName) => {
            if (!groupTeams.includes(teamName)) groupTeams.push(teamName);
            groupByName.set(teamName, match.group);
        });
    });

    const rankingByGroup = Object.fromEntries(
        [...teamsByGroup.entries()].map(([group, groupTeams]) => [group, groupTeams])
    );

    const resultByPair = new Map();
    GROUP_LETTERS.forEach((group, groupIndex) => {
        const [first, second, third, fourth] = rankingByGroup[group];
        const thirdWinGoals = 12 - groupIndex;

        resultByPair.set(pairKey(first, second), { winner: first, loser: second, winnerScore: 2, loserScore: 0 });
        resultByPair.set(pairKey(first, third), { winner: first, loser: third, winnerScore: 1, loserScore: 0 });
        resultByPair.set(pairKey(first, fourth), { winner: first, loser: fourth, winnerScore: 1, loserScore: 0 });
        resultByPair.set(pairKey(second, third), { winner: second, loser: third, winnerScore: 1, loserScore: 0 });
        resultByPair.set(pairKey(second, fourth), { winner: second, loser: fourth, winnerScore: 1, loserScore: 0 });
        resultByPair.set(pairKey(third, fourth), { winner: third, loser: fourth, winnerScore: thirdWinGoals, loserScore: 0 });
    });

    const matches = schedule.map((match, index) => {
        const result = resultByPair.get(pairKey(match.home, match.away));
        const score_home = match.home === result.winner ? result.winnerScore : result.loserScore;
        const score_away = match.away === result.winner ? result.winnerScore : result.loserScore;

        return {
            id: index + 1,
            stage: 'Group',
            match_date_manual: match.date,
            team_home: match.home,
            team_away: match.away,
            score_home,
            score_away
        };
    });

    return {
        matches,
        rankingByGroup,
        groupByName
    };
}

function pairKey(teamA, teamB) {
    return [teamA, teamB].sort().join('|');
}

function groupSeedName(rankingByGroup, label) {
    const pos = Number(label[0]) - 1;
    const group = label[1];
    return rankingByGroup[group][pos];
}

test('official FIFA third-place mapping table covers all 495 valid combinations cleanly', () => {
    assert.equal(Object.keys(THIRD_PLACE_MAPPING).length, 495);

    Object.entries(THIRD_PLACE_MAPPING).forEach(([qualifiedKey, mappingEntry]) => {
        assert.equal(typeof mappingEntry.rowNumber, 'number', `${qualifiedKey} should include the source CSV row number`);
        assert.ok(mappingEntry.rowNumber >= 1 && mappingEntry.rowNumber <= 495, `${qualifiedKey} should point to a valid CSV row`);

        const assignments = mappingEntry.assignments;
        assert.equal(qualifiedKey.length, 8, `${qualifiedKey} should contain 8 qualifying groups`);
        assert.equal(new Set(qualifiedKey.split('')).size, 8, `${qualifiedKey} should not repeat groups`);

        const assignmentKeys = Object.keys(assignments).sort();
        assert.deepEqual(assignmentKeys, [...THIRD_PLACE_WINNER_SEEDS].sort(), `${qualifiedKey} should assign all 8 winner seeds`);

        const assignmentValues = Object.values(assignments);
        assert.equal(assignmentValues.length, 8, `${qualifiedKey} should have 8 third-place assignments`);
        assert.equal(new Set(assignmentValues).size, 8, `${qualifiedKey} should not reuse a third-place seed`);

        assignmentValues.forEach((seed) => {
            assert.match(seed, /^3[A-L]$/, `${qualifiedKey} contains malformed seed ${seed}`);
            assert.ok(qualifiedKey.includes(seed[1]), `${qualifiedKey} should only assign qualified third-place groups`);
        });
    });
});

test('derived team status advances top two in every group and only the best eight third-place teams', () => {
    const api = loadTournamentApi();
    const { matches, rankingByGroup } = buildCompletedGroupStage(api.GROUP_STAGE_SCHEDULE);

    const statusRows = api._buildDerivedTeamStatusRows(matches);
    const statusByTeam = new Map(statusRows.map((row) => [row.team_name, row]));

    GROUP_LETTERS.forEach((group, groupIndex) => {
        const [first, second, third, fourth] = rankingByGroup[group];

        assert.equal(statusByTeam.get(first)?.advanced_to_knockouts, true, `${first} should auto-advance as 1${group}`);
        assert.equal(statusByTeam.get(second)?.advanced_to_knockouts, true, `${second} should auto-advance as 2${group}`);
        assert.equal(statusByTeam.get(fourth)?.eliminated, true, `${fourth} should be eliminated in 4${group}`);

        if (groupIndex < 8) {
            assert.equal(statusByTeam.get(third)?.advanced_to_knockouts, true, `${third} should qualify as a best third-place team`);
            assert.equal(statusByTeam.get(third)?.eliminated, false, `${third} should not be eliminated`);
        } else {
            assert.equal(statusByTeam.get(third)?.advanced_to_knockouts, false, `${third} should not qualify from third place`);
            assert.equal(statusByTeam.get(third)?.eliminated, true, `${third} should be eliminated once best-third ranking resolves`);
        }
    });
});

test('best third-place teams are ranked globally by group-stage performance', () => {
    const api = loadTournamentApi();
    const { matches, groupByName } = buildCompletedGroupStage(api.GROUP_STAGE_SCHEDULE);
    const standings = api.computeGroupStandings(matches);

    const thirdPlaceGroups = api._getBestThirdPlaceTeams(standings).map((team) => groupByName.get(team.name));

    assert.deepEqual(thirdPlaceGroups, GROUP_LETTERS);
});

test('round of 32 fixed pairings and best-third slots resolve without duplicates', () => {
    const api = loadTournamentApi();
    const { matches, rankingByGroup, groupByName } = buildCompletedGroupStage(api.GROUP_STAGE_SCHEDULE);
    const standings = api.computeGroupStandings(matches);
    const bestThirdAssignments = api._buildBestThirdAssignments(standings);
    const bestThirdSlots = new Map(api._getBestThirdSlots().map((slot) => [slot.key, slot]));
    const expectedMapping = THIRD_PLACE_MAPPING['ABCDEFGH'].assignments;

    assert.equal(bestThirdAssignments.size, 8);

    const r32Matches = api.KNOCKOUT_SCHEDULE.filter((match) => match.stage === 'R32');
    const seenTeams = new Set();
    const seenBestThirdTeams = new Set();

    r32Matches.forEach((match, index) => {
        const home = api._resolveKnockoutMatchTeam(match, 'home', standings, bestThirdAssignments);
        const away = api._resolveKnockoutMatchTeam(match, 'away', standings, bestThirdAssignments);

        assert.ok(home?.name, `resolved home team missing for ${match.slotKey}`);
        assert.ok(away?.name, `resolved away team missing for ${match.slotKey}`);
        assert.notEqual(home.name, away.name, `duplicate matchup in ${match.slotKey}`);

        if (index < 8) {
            assert.equal(home.name, groupSeedName(rankingByGroup, match.home));
            assert.equal(away.name, groupSeedName(rankingByGroup, match.away));
        }

        [home.name, away.name].forEach((teamName) => {
            assert.equal(seenTeams.has(teamName), false, `${teamName} should appear only once in the Round of 32`);
            seenTeams.add(teamName);
        });

        [['home', home], ['away', away]].forEach(([side, resolvedTeam]) => {
            if (match[side] !== 'Best 3rd') return;
            const group = groupByName.get(resolvedTeam.name);
            const slot = bestThirdSlots.get(`${match.slotKey}:${side}`);
            const expectedSeed = expectedMapping[match.home];

            assert.ok(slot.allowedGroups.includes(group), `${resolvedTeam.name} should be valid for ${match.slotKey}:${side}`);
            assert.equal(resolvedTeam.seedLabel, expectedSeed);
            assert.equal(seenBestThirdTeams.has(resolvedTeam.name), false, `${resolvedTeam.name} should fill only one best-third slot`);
            seenBestThirdTeams.add(resolvedTeam.name);
        });
    });

    assert.equal(seenTeams.size, 32);
    assert.equal(seenBestThirdTeams.size, 8);
});

test('best-third assignments follow the official FIFA mapping table for a qualified-set key', () => {
    const api = loadTournamentApi();
    const { matches } = buildCompletedGroupStage(api.GROUP_STAGE_SCHEDULE);
    const standings = api.computeGroupStandings(matches);
    const bestThirdAssignments = api._buildBestThirdAssignments(standings);

    const expected = THIRD_PLACE_MAPPING['ABCDEFGH'].assignments;
    const expectedSlotByWinner = {
        '1E': 'r32-09:away',
        '1I': 'r32-10:away',
        '1A': 'r32-11:away',
        '1L': 'r32-12:away',
        '1D': 'r32-13:away',
        '1G': 'r32-14:away',
        '1B': 'r32-15:away',
        '1K': 'r32-16:away'
    };

    Object.entries(expectedSlotByWinner).forEach(([winnerSeed, slotKey]) => {
        const assignedTeam = bestThirdAssignments.get(slotKey);
        assert.ok(assignedTeam, `missing assignment for ${slotKey}`);
        assert.equal(`3${assignedTeam.group}`, expected[winnerSeed]);
    });
});

test('later knockout slots can resolve one side as soon as an earlier match is finished', () => {
    const api = loadTournamentApi();
    const { matches } = buildCompletedGroupStage(api.GROUP_STAGE_SCHEDULE);
    const standings = api.computeGroupStandings(matches);
    const bestThirdAssignments = api._buildBestThirdAssignments(standings);

    const firstR32Match = api.KNOCKOUT_SCHEDULE.find((match) => match.slotKey === 'r32-01');
    const firstR16Match = api.KNOCKOUT_SCHEDULE.find((match) => match.slotKey === 'r16-01');
    const r32Home = api._resolveKnockoutMatchTeam(firstR32Match, 'home', standings, bestThirdAssignments, { matchesCache: matches });
    const r32Away = api._resolveKnockoutMatchTeam(firstR32Match, 'away', standings, bestThirdAssignments, { matchesCache: matches });

    const knockoutMatches = [
        ...matches,
        {
            id: 9999,
            stage: 'R32',
            match_date_manual: firstR32Match.date,
            team_home: r32Home.name,
            team_away: r32Away.name,
            score_home: 2,
            score_away: 1
        }
    ];

    const updatedStandings = api.computeGroupStandings(knockoutMatches);
    const updatedAssignments = api._buildBestThirdAssignments(updatedStandings);
    const resolvedHome = api._resolveKnockoutMatchTeam(firstR16Match, 'home', updatedStandings, updatedAssignments, { matchesCache: knockoutMatches });
    const resolvedAway = api._resolveKnockoutMatchTeam(firstR16Match, 'away', updatedStandings, updatedAssignments, { matchesCache: knockoutMatches });

    assert.equal(resolvedHome.name, r32Home.name);
    assert.equal(resolvedHome.status, 'confirmed');
    assert.equal(resolvedAway.name, 'TBD');
    assert.equal(resolvedAway.status, 'none');
});
