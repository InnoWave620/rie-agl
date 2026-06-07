import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '../../lib/auth';
import { uploadAvatar } from '../../lib/s3';

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    try {
      await verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let s3Url = '';
    if (type === 'avatar') {
      s3Url = await uploadAvatar(buffer, file.name, file.type);
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported upload type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, url: s3Url });
  } catch (error) {
    console.error('[POST /api/upload]', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
