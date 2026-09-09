import Link from 'next/link';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Mail, MapPin } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | BAUST Exchange',
  description: 'Privacy Policy for BAUST Exchange campus marketplace platform.',
};

export default function PrivacyPolicyPage() {
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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-gray-500 font-medium">Last updated: September 9, 2026</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed pt-2">
          At <strong>BAUST Exchange</strong>, we are committed to protecting your privacy and ensuring a safe, secure campus marketplace for all students, faculty, and staff at the Bangladesh Army University of Science and Technology (BAUST). This Privacy Policy explains how we collect, use, store, and safeguard your personal information.
        </p>
      </div>

      {/* Sections Container */}
      <div className="space-y-8 text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            1. Information We Collect
          </div>
          <p className="text-gray-600">
            We collect minimal personal information necessary to provide a functioning and verified campus trading platform:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
            <li>
              <strong>Google Authentication Data:</strong> When you log in, we receive your full name, institutional email address, and Google profile picture. <em>We never store or request your Google account password.</em>
            </li>
            <li>
              <strong>Marketplace Listings & Posts:</strong> Title, description, price per item, stock quantity, condition, location, contact preferences, and item photos uploaded by you.
            </li>
            <li>
              <strong>User Communication:</strong> In-app messages, exchange requests, and wanted item requests sent to other verified campus users.
            </li>
            <li>
              <strong>Technical & Audit Data:</strong> IP addresses and system activity logs (`Activity` records) recorded for account security, spam prevention, and anti-fraud monitoring.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <Eye className="w-5 h-5 text-emerald-600" />
            2. How We Use Your Information
          </div>
          <p className="text-gray-600">
            Your information is strictly used for platform operations and user safety:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
            <li>To verify campus affiliation and maintain an exclusive marketplace for BAUST community members.</li>
            <li>To display your public seller profile, verified badges, and item listings to prospective buyers.</li>
            <li>To enable buyer-seller messaging, exchange requests, and system notifications.</li>
            <li>To process Campus PRO subscriptions and item highlight payments securely via SSLCommerz or manual banking.</li>
            <li>To prevent fraud, impersonation, and policy violations across the platform.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            3. Data Storage & Security
          </div>
          <p className="text-gray-600">
            We implement robust industry-standard security measures to protect your personal data:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
            <li>
              <strong>Encryption:</strong> All network traffic between your browser and our servers is encrypted using 256-bit SSL/TLS HTTPS protocols.
            </li>
            <li>
              <strong>No Plain Password Storage:</strong> Authentication is handled entirely via Google OAuth 2.0. No user passwords are stored on our servers.
            </li>
            <li>
              <strong>Strict Confidentiality:</strong> We do <strong>NOT</strong> sell, rent, or lease your personal information to third-party advertisers or data brokers.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white p-6 border border-gray-200 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            4. User Rights & Controls
          </div>
          <p className="text-gray-600">
            You retain full control over your personal data on BAUST Exchange:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 pl-2">
            <li><strong>Edit or Remove Listings:</strong> You can edit or delete your active item listings and wanted posts at any time.</li>
            <li><strong>Profile Settings:</strong> You can update your phone number, department, and contact preferences under Profile Settings.</li>
            <li><strong>Account Deletion:</strong> You may request complete deletion of your user profile and associated data by contacting support.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="bg-emerald-50/60 border border-emerald-200/80 p-6 rounded-2xl space-y-3">
          <h2 className="text-base font-bold text-emerald-950 flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" /> 5. Contact Information & Support
          </h2>
          <p className="text-emerald-900 text-xs sm:text-sm">
            If you have any questions, concerns, or requests regarding this Privacy Policy, please reach out to the BAUST Exchange team:
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

