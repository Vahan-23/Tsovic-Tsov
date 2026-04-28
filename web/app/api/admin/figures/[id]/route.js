import { NextResponse } from 'next/server';
import { readFigures, writeFigures, toPublicFigure } from '@/lib/figuresStore';
import { assertAdmin, unauthorizedResponse } from '@/lib/adminAuth';

const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export async function PUT(request, { params }) {
  if (!assertAdmin(request)) return unauthorizedResponse();
  const idParam = decodeURIComponent((await params).id);
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const list = await readFigures();
    const idx = list.findIndex((f) => f.id === idParam);
    if (idx === -1) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const current = list[idx];
    let nextId = current.id;

    if (body.id !== undefined) {
      const raw = String(body.id).trim();
      if (!ID_RE.test(raw)) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
      }
      if (raw !== current.id && list.some((f) => f.id === raw)) {
        return NextResponse.json({ error: 'Target id already exists' }, { status: 409 });
      }
      nextId = raw;
    }

    const next = {
      id: nextId,
      name:
        body.name !== undefined
          ? String(body.name).trim()
          : current.name,
      description:
        body.description !== undefined
          ? String(body.description).trim()
          : current.description,
      image:
        body.image === undefined
          ? current.image
          : body.image == null || body.image === ''
            ? null
            : String(body.image).trim(),
      sortOrder:
        typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)
          ? body.sortOrder
          : current.sortOrder,
    };

    if (!next.name || !next.description) {
      return NextResponse.json(
        { error: 'name and description must be non-empty' },
        { status: 400 }
      );
    }

    let savedList;
    if (nextId !== idParam) {
      const withoutOld = list.filter((f) => f.id !== idParam);
      if (withoutOld.some((f) => f.id === nextId)) {
        return NextResponse.json({ error: 'Target id already exists' }, { status: 409 });
      }
      withoutOld.push(next);
      savedList = withoutOld;
    } else {
      list[idx] = next;
      savedList = list;
    }

    await writeFigures(savedList);
    const saved = savedList.find((f) => f.id === next.id);
    return NextResponse.json({ figure: toPublicFigure(saved) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!assertAdmin(request)) return unauthorizedResponse();
  const idParam = decodeURIComponent((await params).id);

  try {
    const list = await readFigures();
    const next = list.filter((f) => f.id !== idParam);
    if (next.length === list.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await writeFigures(next);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
