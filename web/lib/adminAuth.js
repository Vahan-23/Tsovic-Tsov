import { NextResponse } from 'next/server';

export function getBearerToken(request) {
  const h = request.headers.get('authorization');
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice(7).trim();
}

export function assertAdmin(request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const token = getBearerToken(request);
  return token === secret;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
