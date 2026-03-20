import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const { searchParams } = request.nextUrl;
    const type = searchParams.get('type') ?? 'json';

    const schedules = await da.getOrgSchedules(orgId);
    const announcements = await da.getOrgAnnouncements(orgId);
    const memorials = await da.getOrgMemorials(orgId);
    const styles = await da.getOrgStyles(orgId);

    const exportData = {
      org,
      schedules,
      announcements,
      memorials,
      styles,
      exportedAt: new Date().toISOString(),
    };

    switch (type) {
      case 'json':
        return json(exportData);

      case 'csv': {
        const header = 'type,name,timeMode,fixedTime,baseZman,room\n';
        const rows = schedules
          .map((s) => {
            const time = s.fixedTime ?? s.baseZman ?? '';
            return `${s.type},${s.name},${s.timeMode ?? ''},${time},${s.baseZman ?? ''},${s.room ?? ''}`;
          })
          .join('\n');
        return new Response(header + rows, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${orgId}-schedules.csv"`,
          },
        });
      }

      case 'ics': {
        const lines = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          `PRODID:-//ZmanimApp//${orgId}//EN`,
          ...schedules.map(
            (s) => `BEGIN:VEVENT\nSUMMARY:${s.name}\nDESCRIPTION:${s.type}\nEND:VEVENT`,
          ),
          'END:VCALENDAR',
        ];
        return new Response(lines.join('\n'), {
          headers: {
            'Content-Type': 'text/calendar',
            'Content-Disposition': `attachment; filename="${orgId}-schedule.ics"`,
          },
        });
      }

      case 'pdf':
        return json({
          message: 'PDF export is not yet implemented. Use JSON export instead.',
          data: exportData,
        });

      default:
        return error(`Unsupported export type: ${type}`, 400);
    }
  } catch (err) {
    console.error('Export GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
