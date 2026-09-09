import Link from 'next/link';
import { FileText, ShieldAlert, CheckCircle2, ArrowLeft, Mail, MapPin, Scale } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | BAUST Exchange',
  description: 'Terms of Service and Community Rules for BAUST Exchange campus marketplace.',
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8 text-gray-800">
      {/* Header */}
      <div className="space-y-3 border-b border-gray-200 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to BAUST Exchange
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-emerald-100/80 text-emerald-700">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Terms of Service</h1>
            <p className="text-xs text-gray-500 font-medium">Last updated: September 9, 2026</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed pt-2">
          Welcome to <strong>BAUST Exchange</strong>. By accessing or using our campus marketplace platform, you agree to comply with and be bound by these Terms of Service. Please read them carefully before creating listings, making exchange requests, or conducting transactions.
        </p>
      </div>

      {/* Sections Container */}
      <div className="space-y-8 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            1. Eligibility & Campus Scope
          </div>
          <p className="text-gray-600">
            BAUST Exchange is an exclusive peer-to-peer platform designed for students, faculty, staff, and authorized members of the <strong>Bangladesh Army University of Science and Technology (BAUST)</strong> community.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-gray-700 pl-2">
            <li>Users must register and authenticate using Google authentication.</li>
            <li>Users are responsible for maintaining accurate profile information.</li>
            <li>Accounts found to be created by unauthorized third parties outside the campus scope may be suspended.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            2. Rules for Buying, Selling, Exchanging, & Donating
          </div>
          <p className="text-gray-600">
            BAUST Exchange supports multiple transaction models: <strong>Sell</strong>, <strong>Exchange</strong>, <strong>Give Away (Free)</strong>, and <strong>Wanted Requests</strong>. All users agree to follow these rules:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
            <li><strong>Fair Pricing:</strong> Sellers must state accurate unit prices per item in Bangladeshi Taka (৳). Price gouging or misleading zero-price listings on items intended for sale are prohibited.</li>
            <li><strong>Listing Accuracy:</strong> Product titles, descriptions, condition tags (New, Like New, Good, Used, Damaged), and stock quantities (`quantity`) must accurately reflect the physical item.</li>
            <li><strong>Donation Integrity:</strong> Items listed under "Give Away" must be completely free of charge with no hidden fees.</li>
            <li><strong>Respectful Interaction:</strong> In-app messages, exchange offers, and meeting arrangements must remain polite, civil, and professional.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            3. Prohibited Content & Restricted Items
          </div>
          <p className="text-gray-600">
            The following items and behaviors are strictly prohibited on BAUST Exchange:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
            <li>Illegal drugs, prescription medications, weapons, firearms, or hazardous chemicals.</li>
            <li>Counterfeit items, pirated digital goods, or stolen property.</li>
            <li>Academic dishonesty materials, leaked examination papers, or unauthorized test solutions.</li>
            <li>Hate speech, harassment, abusive language, explicit material, or fraudulent schemes.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            4. User-to-User Transactions & Limitation of Liability
          </div>
          <p className="text-gray-600">
            BAUST Exchange provides the technical marketplace platform to connect campus buyers and sellers. We do not own, inspect, or store the physical items listed by users:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
            <li><strong>Physical Handovers:</strong> Physical item inspection, exchange, and cash/mobile handovers occur directly between users. We strongly advise meeting in safe, public areas on the BAUST campus.</li>
            <li><strong>No Warranty:</strong> BAUST Exchange makes no warranties regarding the quality, safety, or legality of items traded between users.</li>
            <li><strong>Limitation of Liability:</strong> BAUST Exchange, its developers, and university administration shall not be liable for any direct or indirect losses, damaged goods, or dispute outcomes resulting from user transactions.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600" />
            5. Moderation & Account Suspension
          </div>
          <p className="text-gray-600">
            To maintain a trustworthy campus community, platform administrators reserve the right to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
            <li>Review and remove listings that violate community rules or receive user reports.</li>
            <li>Suspend or block user accounts (`UserStatus = blocked`) involved in fraud, harassment, or severe rule violations.</li>
            <li>Grant or revoke `✓ Verified Seller` badges and `📌 Featured` listing placements upon moderation review.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="bg-emerald-50/60 border border-emerald-200/80 p-6 rounded-2xl space-y-3">
          <h2 className="text-base font-bold text-emerald-950 flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" /> 6. Questions & Contact Information
          </h2>
          <p className="text-emerald-900 text-xs sm:text-sm">
            If you have questions regarding these Terms of Service or wish to report a policy violation, please contact us:
          </p>
          <div className="pt-2 text-xs space-y-1.5 font-medium text-emerald-900">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Email: <a href="mailto:support@baust-exchange.local" className="underline font-bold">support@baust-exchange.local</a></span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Address: Bangladesh Army University of Science and Technology (BAUST), Saidpur Cantonment, Nilphamari-5310, Bangladesh.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

