export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  allDay?: boolean;
  location?: string;
  categories?: string[];
}

function formatIcsDateTime(date: Date, allDay: boolean): string {
  if (allDay) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function generateUid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}@zmanim-app`;
}

const VTIMEZONE_UTC = [
  'BEGIN:VTIMEZONE',
  'TZID:UTC',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000Z',
  'TZOFFSETFROM:+0000',
  'TZOFFSETTO:+0000',
  'TZNAME:UTC',
  'END:STANDARD',
  'END:VTIMEZONE',
].join('\r\n');

export function generateIcsCalendar(
  events: CalendarEvent[],
  calendarName?: string,
): string {
  const calName = calendarName ?? 'Zmanim';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zmanim App//EN',
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    VTIMEZONE_UTC,
  ];

  for (const event of events) {
    const allDay = event.allDay ?? false;
    const dtStart = formatIcsDateTime(event.startTime, allDay);
    const endTime = event.endTime ?? event.startTime;
    const dtEnd = formatIcsDateTime(endTime, allDay);

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${generateUid()}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);

    if (allDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    } else {
      lines.push(`DTSTART:${dtStart}Z`);
      lines.push(`DTEND:${dtEnd}Z`);
    }

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    }
    if (event.location) {
      lines.push(`LOCATION:${escapeIcsText(event.location)}`);
    }
    if (event.categories && event.categories.length > 0) {
      lines.push(`CATEGORIES:${event.categories.map(escapeIcsText).join(',')}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function generateZmanimIcs(
  days: Array<{
    date: Date;
    candleLighting?: Date;
    havdalah?: Date;
    parsha?: string;
  }>,
  calendarName?: string,
): string {
  const events: CalendarEvent[] = [];

  for (const day of days) {
    const parshaNote = day.parsha ? ` (${day.parsha})` : '';

    if (day.candleLighting) {
      events.push({
        title: `Candle Lighting${parshaNote}`,
        startTime: day.candleLighting,
        allDay: false,
        categories: ['Shabbat', 'Zmanim'],
      });
    }
    if (day.havdalah) {
      events.push({
        title: `Havdalah${parshaNote}`,
        startTime: day.havdalah,
        allDay: false,
        categories: ['Shabbat', 'Zmanim'],
      });
    }
  }

  return generateIcsCalendar(events, calendarName ?? 'Zmanim - Shabbat Times');
}
