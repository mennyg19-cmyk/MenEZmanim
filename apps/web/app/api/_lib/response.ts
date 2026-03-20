import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}

export function options() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
