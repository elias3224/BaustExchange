// src/app/(app)/item/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { findMatchesForListing } from '@/lib/matching';
import { ItemActions } from '@/components/listings/ItemActions';
import { RoleBadge } from '@/components/ui/SessionContext';
import {
  CONDITION_LABELS,
  STATUS_LABELS,
  TRANSACTION_LABELS,
  formatPrice,
  timeAgo,
} from '@/lib/utils';
import { MapPin, Phone, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return null;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
      category: true,
      user: { select: { id: true, name: true, image: true, role: true, department: true, studentId: true, phone: true, createdAt: true } },
    },
  });
  if (!listing) notFound();

  const isOwner = listing.userId === user.id;
  const matches = isOwner ? [] : await findMatchesForListing(listing, 3);

  const isFree =
    listing.transactionType === 'give_away' ||
    ((listing.transactionType === 'sell' || listing.transactionType === 'sell_or_exchange') && !listing.price);

  const qty = listing.quantity || 1;
  const unitPrice = listing.price || 0;
  const totalPrice = unitPrice * qty;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link href="/marketplace" className="hover:underline">Marketplace</Link>
        <span className="mx-1">/</span>
        <span className="text-gray-700">{listing.title}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-[4/3] bg-gray-100 rounded-md overflow-hidden">
            {listing.images.length > 0 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {listing.images.slice(1, 6).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt={listing.title} className="aspect-square w-full object-cover rounded-md border border-gray-200" />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-gray-800">{listing.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap mt-1 ${listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {STATUS_LABELS[listing.status] || listing.status}
            </span>
          </div>

          <div className="text-2xl font-bold text-brand-700">
            {isFree ? 'FREE' : formatPrice(unitPrice)}
            {!isFree && qty > 1 && (
              <span className="text-sm font-normal text-gray-500 ml-1">/ item</span>
            )}
            <span className="ml-2 text-xs font-medium text-gray-500 align-middle bg-gray-100 px-2 py-0.5 rounded">
              {TRANSACTION_LABELS[listing.transactionType] || listing.transactionType}
            </span>
          </div>

          {!isFree && unitPrice > 0 && qty > 1 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center justify-between shadow-xs">
              <span>Total Cost for All Stock ({qty} items):</span>
              <span className="text-base font-bold text-emerald-900">
                ৳{totalPrice.toLocaleString()}{' '}
                <span className="text-xs font-normal text-emerald-700">(৳{unitPrice} × {qty})</span>
              </span>
            </div>
          )}

          <dl className="text-sm space-y-1 text-gray-600">
            <div><span className="font-medium text-gray-700">Category:</span> {listing.category.name}</div>
            <div><span className="font-medium text-gray-700">Condition:</span> {CONDITION_LABELS[listing.condition] || listing.condition}</div>
            <div><span className="font-medium text-gray-700">Available Quantity:</span> <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">{qty} pcs available</span></div>
            {listing.exchangeFor && (listing.transactionType === 'exchange' || listing.transactionType === 'sell_or_exchange') && (
              <div><span className="font-medium text-gray-700">Looking for:</span> {listing.exchangeFor}</div>
            )}
            {listing.location && (
              <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {listing.location}</div>
            )}
            {listing.contactPreference && (
              <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {listing.contactPreference}</div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400"><Eye className="w-3.5 h-3.5" /> Posted {timeAgo(listing.createdAt)}</div>
          </dl>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Description</h2>
            <p className="text-sm text-gray-600 whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Seller card */}
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <div className="flex items-center gap-3">
              {listing.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.user.image} alt={listing.user.name ?? ''} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200" />
              )}
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  {listing.user.name} <RoleBadge role={listing.user.role} />
                </div>
                <div className="text-xs text-gray-500">
                  {listing.user.department ? `${listing.user.department} • ` : ''}Member since {timeAgo(listing.user.createdAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <ItemActions
            listingId={listing.id}
            listingTitle={listing.title}
            ownerId={listing.userId}
            ownerName={listing.user.name ?? 'the seller'}
            status={listing.status}
            isOwner={isOwner}
          />
        </div>
      </div>

      {/* Matching wanted items */}
      {matches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">People Looking for This</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {matches.map((w) => (
              <div key={w.id} className="p-3 border border-gray-200 rounded-md bg-white">
                <div className="font-medium text-sm">{w.title}</div>
                <div className="text-xs text-gray-500">{w.category?.name}</div>
                {w.budget != null && <div className="text-xs text-green-700">Budget: ৳{w.budget}</div>}
                <Link href={`/messages?with=${w.userId}`} className="text-xs text-brand-600 hover:underline mt-2 inline-block">
                  Message them
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}