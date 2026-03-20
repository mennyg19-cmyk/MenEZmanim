export interface ZmanimPdfData {
  orgName: string;
  orgNameHebrew: string;
  dateRange: { start: Date; end: Date };
  days: Array<{
    date: Date;
    hebrewDate: string;
    dayOfWeek: string;
    parsha?: string;
    holiday?: string;
    zmanim: Array<{ label: string; hebrewLabel: string; time: string }>;
  }>;
}

export interface PdfExportOptions {
  title?: string;
  language: 'hebrew' | 'english' | 'both';
  orientation: 'portrait' | 'landscape';
  fontSize: number;
  includeParsha: boolean;
  includeHoliday: boolean;
}

function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

export function generateZmanimPdfHtml(
  data: ZmanimPdfData,
  options: PdfExportOptions,
): string {
  const {
    title,
    language,
    orientation,
    fontSize,
    includeParsha,
    includeHoliday,
  } = options;

  const docTitle = title ?? 'Zmanim Schedule';
  const isRtl = language === 'hebrew' || language === 'both';
  const showHebrew = language === 'hebrew' || language === 'both';
  const showEnglish = language === 'english' || language === 'both';

  const dateRangeStr = formatDateRange(data.dateRange.start, data.dateRange.end);

  const allZmanKeys = data.days[0]?.zmanim ?? [];
  const zmanLabels = allZmanKeys.map((z) =>
    showHebrew && showEnglish ? `${z.hebrewLabel} / ${z.label}` : showHebrew ? z.hebrewLabel : z.label,
  );

  const rows = data.days.map((day) => {
    const dateStr = day.date.toISOString().slice(0, 10);
    const dayLabel = showHebrew && showEnglish
      ? `${day.hebrewDate} (${day.dayOfWeek})`
      : showHebrew
        ? day.hebrewDate
        : `${day.dayOfWeek}, ${dateStr}`;

    const extras: string[] = [];
    if (includeParsha && day.parsha) extras.push(day.parsha);
    if (includeHoliday && day.holiday) extras.push(day.holiday);
    const extraStr = extras.length ? extras.join(' • ') : '';

    const cells = day.zmanim.map((z) => z.time);
    return { dayLabel, extraStr, cells };
  });

  const WEEK_SIZE = 7;
  const weekGroups: typeof rows[] = [];
  for (let i = 0; i < rows.length; i += WEEK_SIZE) {
    weekGroups.push(rows.slice(i, i + WEEK_SIZE));
  }

  const html = `<!DOCTYPE html>
<html lang="${language === 'hebrew' ? 'he' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(docTitle)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ${isRtl ? "'David', 'Times New Roman', serif" : "'Segoe UI', Tahoma, sans-serif"};
      font-size: ${fontSize}px;
      line-height: 1.4;
      color: #222;
      padding: 16px;
      direction: ${isRtl ? 'rtl' : 'ltr'};
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #333;
    }
    .org-name { font-size: 1.4em; font-weight: bold; margin-bottom: 4px; }
    .org-name-hebrew { font-size: 1.2em; margin-bottom: 4px; }
    .date-range { font-size: 0.95em; color: #555; }
    .table-wrap { overflow-x: auto; }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #ccc;
      padding: 8px 10px;
      text-align: ${isRtl ? 'right' : 'left'};
    }
    th { background: #f5f5f5; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    .day-cell { font-weight: 500; min-width: 120px; }
    .extra-cell { font-size: 0.85em; color: #555; }
    .time-cell { white-space: nowrap; }
    @media print {
      body { padding: 12px; }
      .header { break-after: avoid; }
      table { break-inside: auto; }
      tr { break-inside: avoid; break-after: auto; }
      thead { display: table-header-group; }
      .week-section { page-break-after: always; }
    .week-section:last-child { page-break-after: auto; }
    }
  </style>
</head>
<body>
  <div class="header">
    ${showEnglish ? `<div class="org-name">${escapeHtml(data.orgName)}</div>` : ''}
    ${showHebrew ? `<div class="org-name-hebrew">${escapeHtml(data.orgNameHebrew)}</div>` : ''}
    <div class="date-range">${escapeHtml(dateRangeStr)}</div>
  </div>
  <div class="table-wrap">
    ${weekGroups
      .map(
        (weekRows, weekIndex) => `
    <div class="week-section" style="${weekIndex > 0 ? 'page-break-before: always;' : ''}">
      <table>
        <thead>
          <tr>
            <th class="day-cell">${language === 'hebrew' ? 'תאריך' : 'Date'}</th>
            ${(includeParsha || includeHoliday) ? `<th class="extra-cell">${language === 'hebrew' ? 'פרשה / חג' : 'Parsha / Holiday'}</th>` : ''}
            ${zmanLabels.map((l) => `<th class="time-cell">${escapeHtml(l)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${weekRows
            .map(
              (row) => `
          <tr>
            <td class="day-cell">${escapeHtml(row.dayLabel)}</td>
            ${(includeParsha || includeHoliday) ? `<td class="extra-cell">${escapeHtml(row.extraStr)}</td>` : ''}
            ${row.cells.map((c) => `<td class="time-cell">${escapeHtml(c)}</td>`).join('')}
          </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>`,
      )
      .join('')}
  </div>
</body>
</html>`;

  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
