import { NextResponse } from 'next/server';
import { readFigures, sortFigures, toPublicFigure } from '@/lib/figuresStore';
import { publicOptionsResponse, withPublicCors } from '@/lib/cors';

export async function OPTIONS() {
  return publicOptionsResponse();
}

export async function GET() {
  try {
    const list = sortFigures(await readFigures());
    const figures = list.map(toPublicFigure);
    const res = NextResponse.json({ figures });
    return withPublicCors(res);
  } catch (e) {
    console.error(e);
    const res = NextResponse.json(
      { error: 'Failed to load figures' },
      { status: 500 }
    );
    return withPublicCors(res);
  }
}
