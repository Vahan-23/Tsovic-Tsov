import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { readFigures } from '@/lib/figuresStore';
import { assertAdmin, unauthorizedResponse } from '@/lib/adminAuth';

export async function GET(request, { params }) {
  if (!assertAdmin(request)) return unauthorizedResponse();
  const idParam = decodeURIComponent((await params).id);

  try {
    const list = await readFigures();
    if (!list.some((f) => f.id === idParam)) {
      return NextResponse.json({ error: 'Unknown figure id' }, { status: 404 });
    }

    const buffer = await QRCode.toBuffer(idParam, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="qr-${idParam}.png"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'QR generation failed' }, { status: 500 });
  }
}
