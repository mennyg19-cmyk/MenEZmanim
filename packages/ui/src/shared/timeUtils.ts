export function formatTime12h(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatZmanTime(time: Date | null, use24h?: boolean, hideAmPm?: boolean): string | null {
  if (!time) return null;
  const h = time.getHours();
  const m = time.getMinutes();
  if (use24h) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  if (hideAmPm) return `${h12}:${m.toString().padStart(2, '0')}`;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatEventTime(time: string, use24h?: boolean, hideAmPm?: boolean): string {
  if (!time) return time;
  if (use24h) {
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return time;
    let h = parseInt(match[1], 10);
    const min = match[2];
    const ap = match[3].toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${min}`;
  }
  if (hideAmPm) return time.replace(/\s*(AM|PM)/i, '');
  return time;
}

export function parseTime12(t: string | undefined | null): number | null {
  if (!t) return null;
  const m = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + min;
}
