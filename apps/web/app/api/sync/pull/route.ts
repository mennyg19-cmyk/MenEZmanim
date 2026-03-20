import { NextRequest } from 'next/server';
import { SyncServer } from '@zmanim-app/core';
import { json, error, options } from '../../_lib/response';

const syncServer = new SyncServer({ conflictStrategy: 'last-write-wins' });

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return error('orgId query parameter required', 400);
    }

    const since = sinceParam ? parseInt(sinceParam, 10) : 0;
    if (isNaN(since) || since < 0) {
      return error('Invalid since timestamp', 400);
    }

    const messages = await syncServer.getChangesSince(orgId, since);
    return json({ messages });
  } catch (err) {
    console.error('Sync pull error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
