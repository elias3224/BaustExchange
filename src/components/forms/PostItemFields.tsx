import { Dispatch, SetStateAction } from 'react';

const CONDITION_LABELS: Record<string, string> = {
  new: 'New', like_new: 'Like New', good: 'Good', used: 'Used', damaged: 'Damaged',
};
const CONDITION_VALUES = ['new', 'like_new', 'good', 'used', 'damaged'];
const TRANSACTION_LABELS: Record<string, string> = {
  sell: 'Sell', exchange: 'Exchange', give_away: 'Give Away', sell_or_exchange: 'Sell or Exchange',
};
const TRANSACTION_VALUES = ['sell', 'exchange', 'give_away', 'sell_or_exchange'];

export { CONDITION_LABELS, CONDITION_VALUES, TRANSACTION_LABELS, TRANSACTION_VALUES };

interface FormState {
  title: string; description: string; categoryId: string; condition: string;
  transactionType: string; price: string; quantity: string; exchangeFor: string; location: string; contactPreference: string;
}

export function PostItemFields({
  form, setForm, isFreeType,
}: {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  isFreeType: boolean;
}) {
  const qtyNum = Math.max(1, Number(form.quantity) || 1);
  const priceNum = Number(form.price) || 0;
  const totalPrice = priceNum * qtyNum;

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-1">Condition *</label>
        <select value={form.condition}
          onChange={(e) => setForm({ ...form, condition: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500">
          {CONDITION_VALUES.map((c) => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Transaction Type *</label>
        <select value={form.transactionType}
          onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500">
          {TRANSACTION_VALUES.map((t) => <option key={t} value={t}>{TRANSACTION_LABELS[t]}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Available Quantity (Item Count) *</label>
        <input type="number" min="1" required value={form.quantity || '1'}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="1" />
      </div>

      {!isFreeType && (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium">
            Price per Item (৳) {form.transactionType === 'sell' ? '*' : ''}
          </label>
          <input type="number" min="0" step="0.01" value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500" placeholder="0" />
          
          {qtyNum > 1 && priceNum > 0 && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-semibold text-emerald-800 flex items-center justify-between">
              <span>Total Price for {qtyNum} items:</span>
              <span className="text-sm font-bold">৳{totalPrice.toLocaleString()} <span className="text-[10px] font-normal text-emerald-700">(৳{priceNum} × {qtyNum})</span></span>
            </div>
          )}

          {form.transactionType === 'sell_or_exchange' && (
            <p className="text-xs text-gray-500">Leave as 0 if you only want to exchange.</p>
          )}
        </div>
      )}

      {(form.transactionType === 'exchange' || form.transactionType === 'sell_or_exchange') && (
        <div>
          <label className="block text-sm font-medium mb-1">What are you looking for? *</label>
          <input type="text" required value={form.exchangeFor}
            onChange={(e) => setForm({ ...form, exchangeFor: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="e.g. DBMS Book, Calculus textbook" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input type="text" value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="e.g. Room 101, Academic Building" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contact Preference</label>
        <input type="text" value={form.contactPreference}
          onChange={(e) => setForm({ ...form, contactPreference: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="e.g. Meet on campus, Phone call" />
      </div>
    </>
  );
}
