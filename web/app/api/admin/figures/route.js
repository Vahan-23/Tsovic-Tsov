import { NextResponse } from 'next/server';
import {
  readFigures,
  sortFigures,
  writeFigures,
  toPublicFigure,
} from '@/lib/figuresStore';
import { assertAdmin, unauthorizedResponse } from '@/lib/adminAuth';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export async function GET(request) {
  if (!assertAdmin(request)) return unauthorizedResponse();
  try {
    const list = sortFigures(await readFigures());
    return NextResponse.json({ figures: list.map(toPublicFigure) });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: 'Failed to read figures' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  if (!assertAdmin(request)) return unauthorizedResponse();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description =
    typeof body.description === 'string' ? body.description.trim() : '';
  const image =
    body.image == null || body.image === ''
      ? null
      : String(body.image).trim();
  const sortOrder =
    typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)
      ? body.sortOrder
      : undefined;

  if (!ID_RE.test(id)) {
    return NextResponse.json(
      {
        error:
          'Invalid id: use lowercase letters, digits, hyphen (2–64 chars, start with letter or digit).',
      },
      { status: 400 }
    );
  }
  if (!name || !description) {
    return NextResponse.json(
      { error: 'name and description are required' },
      { status: 400 }
    );
  }

  try {
    const list = await readFigures();
    if (list.some((f) => f.id === id)) {
      return NextResponse.json({ error: 'Figure id already exists' }, { status: 409 });
    }
    const nextSort =
      sortOrder ??
      list.reduce((m, f) => Math.max(m, f.sortOrder ?? 0), -1) + 1;
    list.push({ id, name, description, image, sortOrder: nextSort });
    await writeFigures(list);
    return NextResponse.json({ figure: toPublicFigure(list[list.length - 1]) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
