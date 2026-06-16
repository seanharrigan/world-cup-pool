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
