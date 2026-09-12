// src/app/api/profile/verify-id/route.ts
// POST -> Server-side BAUST ID card submission.
//
// Runs the SAME strict OCR check on the server (so a crafted client request
// cannot bypass verification), saves the submitted image for the admin
// review queue and sets idCardStatus = 'pending'.
//
// NOTE: isVerifiedSeller is NEVER set here. Only an admin can approve a
// pending card (via /api/admin/users/[id]).
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { idCardCheckFromText, IdCardRole } from '@/lib/idCardVerify';
import { logActivity, ActivityType } from '@/lib/activity';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 3 * 1024 * 1024; // 3 MB
const OCR_TIMEOUT_MS = 60_000;

/** Run OCR on a raw image buffer with a hard timeout. */
async function ocrBuffer(buffer: Buffer): Promise<string> {
  const worker = await createWorker('eng');
  try {
    const job = worker.recognize(buffer);
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OCR timed out')), OCR_TIMEOUT_MS)
    );
    const {
      data: { text },
    } = await Promise.race([job, timeout]);
    return text;
  } finally {
    await worker.terminate().catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  if (user.role === 'admin') {
    return NextResponse.json({ error: 'Admins do not need ID verification.' }, { status: 400 });
  }

  if (!rateLimit(`verifyid:${user.id}`, { max: 5, window: 60 })) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please wait a minute.' },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const role = (formData.get('role') as IdCardRole) || 'student';

    if (!file) return NextResponse.json({ error: 'No ID card image provided.' }, { status: 400 });
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WEBP or GIF allowed.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 3 MB.' }, { status: 400 });
    }
    if (file.size <= 5000) {
      return NextResponse.json({ error: 'Image too small / unclear. Please upload a clear photo.' }, { status: 400 });
    }

    const roleChecked: IdCardRole = role === 'teacher' ? 'teacher' : 'student';
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Store the submitted card for the admin review queue.
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const filename = `idcard-${user.id}-${randomUUID()}.${ext}`;
    let url: string;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: file.type,
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      url = blob.url;
    } else {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, filename), buffer);
      url = `/uploads/${filename}`;
    }

    // 2. Server-side OCR as a *signal* for the reviewing admin — never a
    //    hard gate (angled/glarey photos of real cards often OCR poorly).
    //    Access (isVerifiedSeller) is ONLY granted by an admin action, so a
    //    weak-OCR submission can never self-verify.
    let check: ReturnType<typeof idCardCheckFromText> | null = null;
    let ocrFailed = false;
    try {
      const preprocessed = await sharp(buffer)
        .grayscale()
        .resize({ width: 1600, withoutEnlargement: false })
        .normalise()
        .toBuffer();
      const text = await ocrBuffer(preprocessed);
      check = idCardCheckFromText(text, roleChecked);
    } catch (err) {
      console.warn('Server OCR failed:', err);
      ocrFailed = true;
    }

    const ocrNote = check?.verified
      ? `OCR PASS — matched: ${(check.matched ?? []).join(', ')}`
      : ocrFailed
        ? 'OCR FAILED — manual review required'
        : 'OCR UNCLEAR — manual review required';

    // 3. Mark as pending — an admin must approve before marketplace access.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        idCardUrl: url,
        idCardStatus: 'pending',
        idCardOcrNote: ocrNote,
        idCardRejectReason: null,
        role: roleChecked,
        hasSelectedRole: true,
      },
    });

    await logActivity(
      ActivityType.LISTING_UPDATED,
      'Submitted BAUST ID card for verification',
      user.id,
      clientIp(req)
    );

    return NextResponse.json({
      status: 'pending',
      idCardUrl: url,
      ocr: {
        verified: check?.verified ?? false,
        confidence: check?.confidence ?? 0,
        message: check?.message ?? 'Could not read the text on this photo — an admin will review it manually.',
      },
    });
  } catch (err) {
    console.error('POST /api/profile/verify-id error:', err);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}