import Link from 'next/link';
import { RoleBadge } from '@/components/ui/SessionContext';
import { CONDITION_LABELS, TRANSACTION_LABELS, formatPrice } from '@/lib/utils';

export interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    condition: string;
    transactionType: string;
    price: number | null;
    quantity?: number;
    exchangeFor: string | null;
    status: string;
    isFeatured?: boolean;
    category: { name: string } | null;
    user: {
      id: string;
      name: string | null;
      image: string | null;
      role: string;
      department: string | null;
      isVerifiedSeller?: boolean;
    } | null;
    images: { id: string; url: string }[];
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const isFree =
    listing.transactionType === 'give_away' ||
    (listing.transactionType === 'sell' && (!listing.price || listing.price === 0)) ||
    (listing.transactionType === 'sell_or_exchange' && (!listing.price || listing.price === 0));

  const qty = listing.quantity && listing.quantity > 1 ? listing.quantity : 1;

  return (
    <Link
      href={`/item/${listing.id}`}
      className={`block border rounded-md overflow-hidden bg-white hover:shadow transition-shadow relative ${
        listing.isFeatured ? 'border-amber-400 ring-1 ring-amber-400/50 shadow-md' : 'border-gray-200'
      }`}
    >
      <div className="aspect-[4/3] bg-gray-100 relative">
        {listing.isFeatured && (
          <span className="absolute top-2 left-2 text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500 text-white shadow-sm flex items-center gap-1 z-10">
            📌 Featured
          </span>
        )}
        {listing.images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
        <span
          className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded z-10 ${
            listing.transactionType === 'give_away'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {TRANSACTION_LABELS[listing.transactionType] || listing.transactionType}
        </span>
      </div>

      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm text-gray-800 line-clamp-1">{listing.title}</h3>
        <div className="text-xs text-gray-500">{listing.category?.name ?? 'Uncategorized'}</div>
        <div className="text-xs text-gray-500">Condition: {CONDITION_LABELS[listing.condition] || listing.condition}</div>
        
        <div className="flex items-center justify-between pt-0.5">
          <div className="text-sm font-bold text-gray-900">
            {isFree ? 'FREE' : formatPrice(listing.price ?? 0)}
            {!isFree && qty > 1 && <span className="text-[11px] font-normal text-gray-500"> / item</span>}
          </div>
          {qty > 1 && (
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
              Stock: {qty}
            </span>
          )}
        </div>

        {listing.exchangeFor && listing.transactionType === 'exchange' && (
          <div className="text-xs text-gray-500">Looking for: {listing.exchangeFor}</div>
        )}

        {listing.user && (
          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-gray-100">
            {listing.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.user.image} alt={listing.user.name ?? ''} className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-200" />
            )}
            <span className="text-xs text-gray-600 truncate">{listing.user.name}</span>
            <RoleBadge role={listing.user.role} />
            {listing.user.isVerifiedSeller && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                ✓ Verified
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
