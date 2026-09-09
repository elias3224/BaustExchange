// src/app/api/wanted/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { WantedStatus } from '@prisma/client';

const STATUSES: WantedStatus[] = ['active', 'fulfilled', 'closed'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();

    const item = await prisma.wantedItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Wanted item not found' }, { status: 404 });
    if (item.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'You do not have permission.' }, { status: 403 });
    }

    const data: any = {};
    if (body.status) {
      if (!STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.budget !== undefined) data.budget = body.budget != null ? Number(body.budget) : null;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId;

    const updated = await prisma.wantedItem.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/wanted/[id] error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const { id } = await params;
    const item = await prisma.wantedItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Wanted item not found' }, { status: 404 });
    if (item.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'You do not have permission.' }, { status: 403 });
    }

    await prisma.wantedItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/wanted/[id] error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}