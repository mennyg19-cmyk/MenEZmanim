import { NextRequest } from 'next/server';
import { SyncBatch, SyncResponse } from '@zmanim-app/core';
import { SyncServer } from '@zmanim-app/core';
import { json, error, options } from '../../_lib/response';

const syncServer = new SyncServer({ conflictStrategy: 'last-write-wins' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const batch = body as SyncBatch;

    if (!batch?.messages || !Array.isArray(batch.messages)) {
      return error('Invalid SyncBatch: messages array required', 400);
    }

    const response: SyncResponse = await syncServer.handlePush(batch);
    return json(response);
  } catch (err) {
    console.error('Sync push error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
