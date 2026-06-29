import test from 'node:test';
import assert from 'node:assert/strict';

import { buildUtcDateWindow, toPoolDateKey } from '../supabase/functions/sync-world-cup/date-utils.mjs';
import { mapStage } from '../supabase/functions/sync-world-cup/team-map.ts';

test('API UTC dates convert to Vancouver pool dates', () => {
    assert.equal(toPoolDateKey('2026-06-11T19:00:00Z'), '2026-06-11');
    assert.equal(toPoolDateKey('2026-06-15T02:00:00Z'), '2026-06-14');
    assert.equal(toPoolDateKey('2026-06-16T01:00:00Z'), '2026-06-15');
});

test('recent API sync window covers adjacent UTC dates', () => {
    assert.deepEqual(buildUtcDateWindow('2026-06-16T01:00:00Z', 1, 1), {
        dateFrom: '2026-06-15',
        dateTo: '2026-06-17',
    });
});

test('football-data knockout stages map to app stage names', () => {
    assert.equal(mapStage('LAST_32'), 'R32');
    assert.equal(mapStage('LAST_16'), 'R16');
    assert.equal(mapStage('QUARTER_FINALS'), 'Quarters');
    assert.equal(mapStage('SEMI_FINALS'), 'Semis');
    assert.equal(mapStage('FINAL'), 'Finals');
});
