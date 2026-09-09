'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Sparkles, CheckCircle2, Zap, Copy, Check, CreditCard, Smartphone, ExternalLink, AlertCircle } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';

function UpgradePageContent() {
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'pin'>('pro');
  const [paymentMode, setPaymentMode] = useState<'sslcommerz' | 'manual'>('sslcommerz');
  const [paymentMethod, setPaymentMethod] = useState<'bKash'>('bKash');
  const [trxId, setTrxId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [listingId, setListingId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const paymentNumbers = {
    bKash: '01703125674',
  };

  const amount = selectedPlan === 'pro' ? 49 : 20;

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const msgParam = searchParams.get('msg');
    const trxParam = searchParams.get('trxId');

    if (statusParam === 'success') {
      setSuccess(`🎉 Instant bKash (SSLCommerz) Payment Successful! Your ${selectedPlan === 'pro' ? 'Campus PRO Membership' : 'Item Pin'} has been activated.`);
    } else if (statusParam === 'failed') {
      setError(`Payment processing failed. ${msgParam || 'Please try again or use manual mobile banking.'}`);
    } else if (statusParam === 'cancel') {
      setError('Payment process was cancelled.');
    } else if (statusParam === 'error' && msgParam) {
      setError(decodeURIComponent(msgParam));
    }
  }, [searchParams, selectedPlan]);

  function copyNumber(num: string) {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Handle SSLCommerz Gateway Redirection
  async function handleSSLCommerzPay() {
    setError(''); setSuccess('');
    if (selectedPlan === 'pin' && !listingId) {
      return setError('Please enter a Listing ID to pin your item.');
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/sslcommerz/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedPlan === 'pro' ? 'pro_subscription' : 'item_pin',
          listingId: selectedPlan === 'pin' ? listingId : null,
          customerPhone: customerPhone || null,
        }),
      });

      const data = await res.json();
      if (res.status === 401) {
        window.location.href = '/login?callbackUrl=/upgrade';
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to initialize SSLCommerz gateway.');

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Gateway URL not returned by server.');
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  // Handle Manual TrxID Submission
  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!trxId || !senderPhone) {
      return setError('Transaction ID (TrxID) and Sender Phone Number are required.');
    }

    setSubmitting(true);
    try {
      const payload = {
        type: selectedPlan === 'pro' ? 'pro_subscription' : 'item_pin',
        listingId: selectedPlan === 'pin' ? listingId : null,
        amount,
        paymentMethod,
        trxId,
        senderPhone,
      };

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment submission failed.');

      setSuccess('Payment submitted successfully! Your account/item status will be activated upon admin review.');
      setTrxId('');
      setSenderPhone('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 select-none py-4">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-600" /> BAUST Campus PRO & Feature System
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight sm:text-4xl">
          Upgrade & Boost Your Campus Sales
        </h1>
        <p className="text-gray-600 text-sm max-w-xl mx-auto">
          Get maximum visibility on BAUST Exchange with a Verified Seller Badge and Pinned Listings at the top of the Marketplace.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campus PRO Plan */}
        <div
          onClick={() => setSelectedPlan('pro')}
          className={`cursor-pointer rounded-2xl p-6 border-2 transition-all shadow-sm ${
            selectedPlan === 'pro'
              ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-600" /> Campus PRO Seller
            </span>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              POPULAR
            </span>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-black text-gray-900">৳৪৯</span>
            <span className="text-xs text-gray-500 font-medium"> / 30 Days</span>
          </div>
          <ul className="space-y-2.5 text-xs text-gray-700 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>✓ Verified Seller Badge</strong> on profile & listings</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>🚀 Priority placement in Marketplace searches</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>💬 Direct WhatsApp / Phone quick contact button</span>
            </li>
          </ul>
          <button
            type="button"
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${
              selectedPlan === 'pro'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Select PRO Membership
          </button>
        </div>

        {/* Item Pin / Highlight Plan */}
        <div
          onClick={() => setSelectedPlan('pin')}
          className={`cursor-pointer rounded-2xl p-6 border-2 transition-all shadow-sm ${
            selectedPlan === 'pin'
              ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-lg text-gray-900 flex items-center gap-2">
              📌 Single Item Pin
            </span>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
              BOOST
            </span>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-black text-gray-900">৳২০</span>
            <span className="text-xs text-gray-500 font-medium"> / 7 Days</span>
          </div>
          <ul className="space-y-2.5 text-xs text-gray-700 mb-6">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>📌 Pin 1 item to the very top of Marketplace</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>⭐ Highlighted gold border & Featured badge</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>📈 5x more views from campus buyers</span>
            </li>
          </ul>
          <button
            type="button"
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors ${
              selectedPlan === 'pin'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Select Item Pin Boost
          </button>
        </div>
      </div>

      {/* Payment Mode Selector Tabs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Choose Payment Option
          </h2>
          <div className="inline-flex w-full sm:w-auto p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setPaymentMode('sslcommerz')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex flex-1 sm:flex-initial items-center justify-center gap-1.5 ${
                paymentMode === 'sslcommerz'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" /> ⚡ bKash via SSLCommerz (Instant)
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('manual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex flex-1 sm:flex-initial items-center justify-center gap-1.5 ${
                paymentMode === 'manual'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" /> 📲 Manual bKash (TrxID)
            </button>
          </div>
        </div>

        {/* SSLCommerz Option */}
        {paymentMode === 'sslcommerz' ? (
          <div className="space-y-6">
            <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Instant Automatic Plan Activation
              </div>
              <p className="text-gray-700 leading-relaxed">
                Pay securely with <strong>bKash</strong> immediately via the SSLCommerz Gateway. Your plan activates instantly on a successful payment.
              </p>
              <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-semibold text-emerald-800">
                <span className="bg-emerald-100/80 px-2 py-0.5 rounded">bKash</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Your Contact / Mobile Banking Number (Optional)
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {selectedPlan === 'pin' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Listing ID * (Specify the item to pin)
                </label>
                <input
                  type="text"
                  required
                  value={listingId}
                  onChange={(e) => setListingId(e.target.value)}
                  placeholder="Enter Listing ID to pin"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleSSLCommerzPay}
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base shadow-md disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Redirecting to Gateway...</span>
              ) : (
                <>
                  <span>Pay Instant ৳{amount} with bKash</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* Manual TrxID Option */
          <div className="space-y-6">
            {/* Payment Method Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['bKash'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 px-4 rounded-xl font-bold text-sm border transition-all ${
                    paymentMethod === method
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Step by step guide */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2 text-xs text-gray-700">
              <p className="font-semibold text-gray-900 text-sm">How to pay manually:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Open your <strong>{paymentMethod}</strong> app and select <strong>Send Money</strong> or <strong>Payment</strong>.</li>
                <li>Send <strong>৳{amount}</strong> to Personal Number: <strong className="text-gray-900 select-all font-mono">{paymentNumbers[paymentMethod]}</strong></li>
                <li>Copy the <strong>Transaction ID (TrxID)</strong> and paste it below.</li>
              </ol>
              <div className="pt-2 flex items-center gap-2">
                <span className="font-mono bg-white px-2.5 py-1 rounded border text-gray-800 font-bold">{paymentNumbers[paymentMethod]}</span>
                <button
                  type="button"
                  onClick={() => copyNumber(paymentNumbers[paymentMethod])}
                  className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 rounded text-[11px] font-semibold text-gray-700 inline-flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Number'}
                </button>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
              {selectedPlan === 'pin' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Listing ID (optional or enter item URL)
                  </label>
                  <input
                    type="text"
                    value={listingId}
                    onChange={(e) => setListingId(e.target.value)}
                    placeholder="Enter Listing ID to pin"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sender Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Transaction ID (TrxID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. 9K28XLP7"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Submitting Payment...' : `Submit Payment (৳${amount})`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500 text-sm">Loading upgrade plans...</div>}>
      <UpgradePageContent />
    </Suspense>
  );
}
