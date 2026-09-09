import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, ArrowRight, Heart, MessageSquare, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900 flex flex-col font-sans text-white select-none">
      {/* Background Image: Clean dark opacity for high readability without heavy glass blur */}
      <Image
        src="/images/campus.jpeg"
        alt="BAUST Campus"
        fill
        priority
        sizes="100vw"
        quality={75}
        className="object-cover object-center opacity-30 -z-10"
      />

      {/* Navbar: Simple & Clean */}
      <nav className="relative z-10 flex justify-between items-center px-6 sm:px-8 py-4 max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 shrink-0 relative">
            <Image src="/images/campus.jpeg" alt="BAUST Logo" fill className="object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-emerald-400 leading-tight">BAUST Exchange</h1>
            <p className="text-xs text-gray-300">Campus Network</p>
          </div>
        </div>

        <Link
          href="/login"
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-full font-medium text-sm transition-colors shadow-md flex items-center gap-1.5"
        >
          Sign In <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Main Content: Fits inside viewport without vertical scroll */}
      <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 w-full max-w-5xl mx-auto text-center">
        {/* Top Badge */}
        <div className="mb-3 px-4 py-1.5 bg-gray-800/90 border border-gray-700 rounded-full text-xs text-emerald-300 flex items-center gap-1.5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Official Student Marketplace for BAUST
        </div>

        {/* Hero Section */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-center mb-3 leading-tight tracking-tight">
          Buy, Sell & Exchange <br />
          <span className="text-emerald-400">Campus Essentials</span>
        </h2>

        <p className="text-gray-300 text-center max-w-2xl mb-6 text-xs sm:text-sm md:text-base leading-relaxed">
          The simple, trusted platform for BAUST students to trade books, electronics, furniture, stationery, and academic materials hassle-free.
        </p>

        {/* CTA Button */}
        <Link
          href="/login"
          className="bg-white hover:bg-gray-100 text-gray-800 px-6 py-2.5 rounded-full font-semibold flex items-center gap-3 mb-6 sm:mb-8 transition-colors shadow-lg border border-gray-200 hover:scale-105 active:scale-95 duration-200"
        >
          <span className="flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
          </span>
          Continue with Google
        </Link>

        {/* Bottom Feature Cards: Solid dark color (bg-gray-800) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 w-full mt-auto mb-4 text-left">
          {/* Card 1 */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-md hover:border-gray-600 transition-colors">
            <div className="bg-gray-700/80 w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-emerald-400 text-xl">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-sm sm:text-base mb-1 text-white">Campus Marketplace</h3>
            <p className="text-xs text-gray-400">Browse and post listings for CSE, EEE, ME, Civil & campus departments.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-md hover:border-gray-600 transition-colors">
            <div className="bg-gray-700/80 w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-rose-400 text-xl">
              <Heart className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="font-bold text-sm sm:text-base mb-1 text-white">Wanted Board</h3>
            <p className="text-xs text-gray-400">Request specific textbooks or items and get responses from students.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700 shadow-md hover:border-gray-600 transition-colors">
            <div className="bg-gray-700/80 w-10 h-10 rounded-lg flex items-center justify-center mb-3 text-cyan-400 text-xl">
              <MessageSquare className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-bold text-sm sm:text-base mb-1 text-white">Student Chat</h3>
            <p className="text-xs text-gray-400">Message buyers & sellers directly on campus with built-in instant messaging.</p>
          </div>
        </div>
      </main>

      {/* Footer Links */}
      <footer className="relative z-10 py-3 text-center text-xs text-gray-400 border-t border-gray-800/80 bg-gray-900/90 flex items-center justify-center gap-3 sm:gap-4 shrink-0">
        <span>© 2026 BAUST Exchange</span>
        <span>•</span>
        <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
      </footer>
    </div>
  );
}
