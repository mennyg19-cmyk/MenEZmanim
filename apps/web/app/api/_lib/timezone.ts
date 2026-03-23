/**
 * Wall-clock date in an IANA timezone as a JS Date whose *local* getters match
 * that wall time (for JewishCalendar / weekday evaluation in org TZ).
 */
export function wallClockDateInTimeZone(instant: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(instant);

  const get = (t: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const y = get('year');
  const m = get('month') - 1;
  const d = get('day');
  let h = get('hour');
  const min = get('minute');
  const sec = get('second');
  if (h === 24) h = 0;
  return new Date(y, m, d, h, min, sec);
}

/** Whether `instant` is in daylight saving time for `timeZone` (Intl long name heuristic). */
export function isDstInTimeZone(instant: Date, timeZone: string): boolean {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'long' }).formatToParts(instant).find((p) => p.type === 'timeZoneName')
      ?.value ?? '';
  return /\bdaylight\b/i.test(name) || /\bsummer\b/i.test(name) || /\bdst\b/i.test(name);
}
