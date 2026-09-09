// src/app/api/upload/route.ts
// Stores images in Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production),
// and falls back to the local public/uploads directory in development.
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { currentUser } from '@/lib/authz';
import { rateLimit, clientIp } from '@/lib/ratelimit';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 3 * 1024 * 1024; // 3 MB per image

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ip = clientIp(req);
  if (!rateLimit(`upload:${ip}`, { max: 20, window: 60 })) {
    return NextResponse.json({ error: 'Too many uploads. Please wait.' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 3 MB.' }, { status: 400 });
    }

    const ext = file.name.split('.').pop();
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Production (Vercel): persistent object storage.
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: file.type,
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      url = blob.url;
    } else {
      // Development: local disk under /public/uploads.
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, filename), buffer);
      url = `/uploads/${filename}`;
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}
