import { NextRequest } from 'next/server';
import {
  ZmanimEngine,
  DEFAULT_OPINIONS,
} from '@zmanim-app/core';
import type { ZmanimConfig, ZmanConfig } from '@zmanim-app/core';
import { json, error, options } from '../_lib/response';

function buildDefaultConfig(): ZmanimConfig {
  const zmanim: ZmanConfig[] = [];
  for (const [type, opinion] of DEFAULT_OPINIONS.entries()) {
    zmanim.push({
      type,
      authority: opinion.authority,
      degreesBelow: opinion.degreesBelow,
      fixedMinutes: opinion.fixedMinutes,
    });
  }

  return {
    location: {
      name: 'Jerusalem',
      latitude: 31.79,
      longitude: 35.21,
      elevation: 1000,
      timezone: 'Asia/Jerusalem',
      inIsrael: true,
    },
    zmanim,
    candleLightingMinutes: 40,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const dateParam = searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : new Date();

    if (isNaN(date.getTime())) {
      return error('Invalid date parameter', 400);
    }

    const config = buildDefaultConfig();
    const zmanimEngine = new ZmanimEngine(config);

    let zmanimResults: any[] = [];
    try {
      zmanimResults = zmanimEngine.getZmanimForDate(date);
    } catch (err) {
      console.error('Zmanim engine error:', err);
    }

    return json({
      date: date.toISOString(),
      location: config.location,
      zmanim: zmanimResults,
    });
  } catch (err) {
    console.error('Zmanim API error:', err);
    return error('Failed to compute zmanim', 500);
  }
}

export async function OPTIONS() {
  return options();
}
