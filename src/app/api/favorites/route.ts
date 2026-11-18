// src/app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ favoritedListingIds: [] });
  }

  try {
    const items = await prisma.wantedItem.findMany({
      where: {
        userId: user.id,
        listingId: { not: null },
        status: 'active',
      },
      select: { listingId: true },
    });

    const favoritedListingIds = items
      .map((item) => item.listingId)
      .filter((id): id is string => Boolean(id));

    return NextResponse.json({ favoritedListingIds });
  } catch (err) {
    console.error('GET /api/favorites error:', err);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { listingId } = body;

    if (!listingId || typeof listingId !== 'string') {
      return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    }

    // Check if user already favorited this item (exists in WantedItem)
    const existing = await prisma.wantedItem.findFirst({
      where: {
        userId: user.id,
        listingId,
      },
    });

    if (existing) {
      // Remove all matching records to guarantee no duplicates
      await prisma.wantedItem.deleteMany({
        where: {
          userId: user.id,
          listingId,
        },
      });

      return NextResponse.json({
        favorited: false,
        listingId,
        message: 'Product removed from your Wanted Items.',
      });
    }

    // Fetch listing details to populate WantedItem accurately
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        title: true,
        description: true,
        categoryId: true,
        price: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const created = await prisma.wantedItem.create({
      data: {
        userId: user.id,
        categoryId: listing.categoryId,
        listingId: listing.id,
        title: listing.title,
        description: listing.description || null,
        budget: listing.price ? Number(listing.price) : null,
        status: 'active',
      },
    });

    return NextResponse.json({
      favorited: true,
      listingId,
      wantedItemId: created.id,
      message: 'Product automatically added to your Wanted Items!',
    });
  } catch (err) {
    console.error('POST /api/favorites error:', err);
    return NextResponse.json({ error: 'Failed to update favorite' }, { status: 500 });
  }
}
