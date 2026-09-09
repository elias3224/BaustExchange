import prisma from '@/lib/prisma';
import { createListingSchema } from '@/lib/validations';
import { currentUser } from '@/lib/authz';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { createNotification } from '@/lib/notifications';
import { logActivity, ActivityType } from '@/lib/activity';
import { findMatchesForListing } from '@/lib/matching';
import { NotificationType } from '@prisma/client';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const page = Number(searchParams.get('page') || 1);
    const take = 12;
    const skip = (page - 1) * take;

    const where: any = { status: 'active' };
    const q = searchParams.get('q');
    if (q) where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
    const catParam = searchParams.get('category');
    if (catParam) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ id: catParam }, { slug: catParam.toLowerCase() }, { name: catParam }] },
        select: { id: true },
      });
      if (cat) where.categoryId = cat.id;
    }
    if (searchParams.get('condition')) where.condition = searchParams.get('condition');
    if (searchParams.get('transactionType')) where.transactionType = searchParams.get('transactionType');
    if (searchParams.get('department')) where.user = { department: { contains: searchParams.get('department') } };

    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      where.AND = [];
      if (minPrice) where.AND.push({ price: { gte: Number(minPrice) } });
      if (maxPrice) where.AND.push({ price: { lte: Number(maxPrice) } });
    }

    const [total, listings] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          category: { select: { name: true } },
          images: { take: 1 },
          user: { select: { id: true, name: true, image: true, role: true, department: true, isVerifiedSeller: true, subscriptionPlan: true } },
        },
      }),
    ]);

    return NextResponse.json({ listings, total, page, pages: Math.ceil(total / take) });
  } catch (err) {
    console.error('GET /api/listings error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = clientIp(req);
  if (!rateLimit(`listing:create:${ip}`, { max: 20, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createListingSchema.safeParse(body);
    if (!parsed.success) {
      const issueMsg = parsed.error.issues[0]?.message || 'Invalid form input';
      return NextResponse.json({ error: issueMsg }, { status: 400 });
    }

    const data = parsed.data;

    // Validate category exists (by ID, slug, or exact name)
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: data.categoryId },
          { slug: data.categoryId.toLowerCase() },
          { name: data.categoryId },
        ],
      },
    });
    if (!category) {
      return NextResponse.json({ error: 'Invalid category selected.' }, { status: 400 });
    }

    // Business rule: Sell requires a positive price.
    if (data.transactionType === 'sell') {
      const priceNum = Number(data.price);
      if (!priceNum || priceNum <= 0) {
        return NextResponse.json({ error: 'A price is required for "Sell" listings.' }, { status: 400 });
      }
    }

    // Exchange requires an exchange-for value.
    if (
      (data.transactionType === 'exchange' || data.transactionType === 'sell_or_exchange') &&
      !data.exchangeFor
    ) {
      return NextResponse.json({ error: 'Specify what you are looking for in exchange.' }, { status: 400 });
    }

    // Auto-approval toggle.
    const autoApprove = process.env.LISTING_AUTO_APPROVE !== 'false';
    const status = autoApprove ? 'active' : 'pending';

    const listing = await prisma.listing.create({
      data: {
        userId: user.id,
        categoryId: category.id,
        title: data.title,
        description: data.description,
        condition: data.condition,
        transactionType: data.transactionType,
        price: data.price ? Number(data.price) : null,
        quantity: data.quantity ? Math.max(1, Number(data.quantity)) : 1,
        exchangeFor: data.exchangeFor || null,
        location: data.location || null,
        contactPreference: data.contactPreference || null,
        status,
        images: {
          create: (body.images as string[] || []).map((url: string, idx: number) => ({
            url,
            order: idx,
          })),
        },
      },
    });

    await logActivity(ActivityType.LISTING_CREATED, `Created listing "${data.title}"`, user.id, ip);

    // If admin approval is required, notify admins.
    if (!autoApprove) {
      const admins = await prisma.user.findMany({ where: { role: 'admin' } });
      for (const admin of admins) {
        await createNotification(
          admin.id,
          NotificationType.ADMIN,
          `New listing "${data.title}" awaits approval.`,
          listing.id
        );
      }
    } else {
      try {
        const matches = await findMatchesForListing(listing);
        for (const wanted of matches) {
          if (wanted.userId && wanted.userId !== user.id) {
            await createNotification(
              wanted.userId,
              NotificationType.MATCH,
              `New listing "${listing.title}" matches your wanted item "${wanted.title}".`,
              listing.id
            );
          }
        }
      } catch (matchErr) {
        console.error('listing match error:', matchErr);
      }
    }

    return NextResponse.json({ id: listing.id, status: listing.status }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/listings error:', err);
    return NextResponse.json({ error: err?.message || 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
