import test from 'node:test';
import assert from 'node:assert/strict';

import { toPoolDateKey } from '../supabase/functions/sync-world-cup/date-utils.mjs';

test('API UTC dates convert to Vancouver pool dates', () => {
    assert.equal(toPoolDateKey('2026-06-11T19:00:00Z'), '2026-06-11');
    assert.equal(toPoolDateKey('2026-06-15T02:00:00Z'), '2026-06-14');
    assert.equal(toPoolDateKey('2026-06-16T01:00:00Z'), '2026-06-15');
});
