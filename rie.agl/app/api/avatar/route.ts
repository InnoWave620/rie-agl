import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '../../lib/s3';
import { verifyToken, COOKIE_NAME } from '../../lib/auth';

const bucketName = process.env.R2_BUCKET || 'rie-agl-cvs';

const hasCredentials = !!(
  process.env.R2_ACCESS_KEY && process.env.R2_ACCESS_KEY !== 'xxxxxxxx' &&
  process.env.R2_SECRET_KEY && process.env.R2_SECRET_KEY !== 'xxxxxxxx' &&
  process.env.R2_ENDPOINT && !process.env.R2_ENDPOINT.includes('YOUR_ACCOUNT_ID')
);

// GET /api/avatar — Streams avatar images from Cloudflare R2 securely
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    try {
      await verifyToken(token);
    } catch {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key || !key.startsWith('avatars/')) {
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Mock mode fallback if credentials are missing
    if (!hasCredentials) {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r="50" fill="#001CB0"/>
          <text x="50" y="55" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">AGL</text>
        </svg>
      `.trim();
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Fetch image from R2
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await r2.send(command);
    if (!response.Body) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const arrayBuffer = await response.Body.transformToByteArray();

    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': response.ContentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[GET /api/avatar]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
