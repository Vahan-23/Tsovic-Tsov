import { NextResponse } from 'next/server';

const PUBLIC_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function withPublicCors(response) {
  Object.entries(PUBLIC_HEADERS).forEach(([k, v]) => {
    response.headers.set(k, v);
  });
  return response;
}

export function publicOptionsResponse() {
  return new NextResponse(null, { status: 204, headers: PUBLIC_HEADERS });
}
