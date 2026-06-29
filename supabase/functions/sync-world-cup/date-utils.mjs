export const POOL_TIME_ZONE = 'America/Vancouver';

export function toPoolDateKey(utcDate, timeZone = POOL_TIME_ZONE) {
    const date = new Date(utcDate);
    if (!Number.isFinite(date.getTime())) {
        return String(utcDate || '').slice(0, 10);
    }

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${partMap.year}-${partMap.month}-${partMap.day}`;
}

export function toUtcDateKey(dateLike) {
    const date = new Date(dateLike);
    if (!Number.isFinite(date.getTime())) {
        return String(dateLike || '').slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
}

export function buildUtcDateWindow(now = new Date(), daysBefore = 1, daysAfter = 1) {
    const date = new Date(now);
    const base = Number.isFinite(date.getTime()) ? date : new Date();
    const utcMidnight = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());
    const dayMs = 86400000;

    return {
        dateFrom: toUtcDateKey(new Date(utcMidnight - daysBefore * dayMs)),
        dateTo: toUtcDateKey(new Date(utcMidnight + daysAfter * dayMs)),
    };
}
