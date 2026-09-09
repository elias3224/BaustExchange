'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  Heart,
  MessageSquare,
  Zap,
  Shield,
  Users,
  User,
  GraduationCap,
  BookOpen,
  Laptop,
  Sofa,
  PenTool,
  ChevronDown,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Send,
  Menu,
  X,
} from 'lucide-react';

/* ─────────────────────── Smooth Scroll Helper ─────────────────────── */
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* ─────────────────────── Google SVG Icon ─────────────────────── */
function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/* ═══════════════════════ LANDING PAGE ═══════════════════════ */
export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Redirect authenticated users
  useEffect(() => {
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role === 'admin') {
        router.replace('/admin');
      } else if (user?.hasSelectedRole === false) {
        router.replace('/select-role');
      } else if (!user?.isVerifiedSeller) {
        router.replace('/verify-id');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [status, session, router]);

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleGoogleLogin() {
    signIn('google', { callbackUrl: '/dashboard' });
  }

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'About', href: '#about' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#071426] text-white font-sans antialiased selection:bg-emerald-500/30">
      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#071426]/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-[72px]">
            {/* Logo */}
            <button onClick={() => scrollTo('hero')} className="flex items-center gap-2.5 group cursor-pointer">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border border-white/10 shadow-md relative shrink-0 group-hover:border-emerald-400/40 transition-colors">
                <Image src="/images/campus.jpeg" alt="BAUST" fill className="object-cover" />
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg leading-tight">
                  <span className="text-white">BAUST</span>{' '}
                  <span className="text-emerald-400">Exchange</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400 leading-none">Campus Network</p>
              </div>
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href.replace('#', ''))}
                  className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    link.label === 'Home'
                      ? 'text-emerald-400'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                  {link.label === 'Home' && (
                    <span className="block h-0.5 bg-emerald-400 rounded-full mt-0.5 mx-auto w-4" />
                  )}
                </button>
              ))}
            </div>

            {/* Desktop Sign In */}
            <div className="hidden md:block">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <User className="w-4 h-4" />
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a1c32]/98 backdrop-blur-xl border-t border-white/5">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    scrollTo(link.href.replace('#', ''));
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-3 border-t border-white/10">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
                >
                  <User className="w-4 h-4" />
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════════════════ HERO SECTION ═══════════════════ */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Image - BAUST Building */}
        <div className="absolute inset-0">
          <Image
            src="/images/baust-building.png"
            alt="BAUST Campus Building"
            fill
            priority
            sizes="100vw"
            quality={85}
            className="object-cover object-center"
          />
          {/* Left-side dark gradient overlay - building visible on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071426] via-[#071426]/85 to-transparent" />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#071426] to-transparent" />
          {/* Top subtle darkening for navbar readability */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#071426]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-12 sm:pt-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/25 rounded-full px-4 py-2 mb-6 sm:mb-8">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-medium text-emerald-300">
                Official BAUST Community Platform
              </span>
            </div>

            {/* Heading */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-4 sm:mb-6">
              Buy, Sell & Exchange{' '}
              <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#2DE0B2]">
                Campus Essentials
              </span>
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-8 sm:mb-10 max-w-xl">
              The simple, trusted platform for BAUST students to trade books,
              electronics, furniture, stationery, and academic materials hassle-free.
            </p>

            {/* CTA Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-8">
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-[#16D9A0] hover:from-emerald-400 hover:to-[#2DE0B2] text-white px-7 py-3.5 rounded-full font-bold text-sm sm:text-base transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5" />
                Continue with Google
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust Indicators */}
              <div className="flex items-center gap-4 sm:gap-5 text-xs sm:text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Quick
                </span>
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Safe
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  Trusted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => scrollTo('features')}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce cursor-pointer"
        >
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </button>
      </section>

      {/* ═══════════════════ FEATURE CARDS (Below Hero) ═══════════════════ */}
      <section id="features" className="relative z-10 -mt-4 pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1: Campus Marketplace */}
            <div className="group bg-gradient-to-br from-[#172438] to-[#0f2a3d] border border-white/[0.06] rounded-2xl p-5 sm:p-6 hover:border-emerald-400/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-400/15">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Campus Marketplace</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Browse and post listings for CSE, EEE, ME, Civil & campus departments.
              </p>
            </div>

            {/* Card 2: Wanted Board */}
            <div className="group bg-gradient-to-br from-[#1a1f38] to-[#15183a] border border-white/[0.06] rounded-2xl p-5 sm:p-6 hover:border-purple-400/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center border border-purple-400/15">
                  <Heart className="w-5 h-5 text-purple-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Wanted Board</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Request specific textbooks or items and get responses from students.
              </p>
            </div>

            {/* Card 3: Student Chat */}
            <div className="group bg-gradient-to-br from-[#0f2a3d] to-[#122840] border border-white/[0.06] rounded-2xl p-5 sm:p-6 hover:border-blue-400/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center border border-blue-400/15">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">Student Chat</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Message buyers & sellers directly on campus with built-in instant messaging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ABOUT SECTION ═══════════════════ */}
      <section id="about" className="py-16 sm:py-24 bg-[#0a1c32]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <span className="inline-flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-4">
                <GraduationCap className="w-4 h-4" />
                About BAUST Exchange
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold mb-6 leading-tight">
                Your Campus,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#2DE0B2]">
                  Your Marketplace
                </span>
              </h3>
              <p className="text-gray-300 leading-relaxed mb-6 text-sm sm:text-base">
                BAUST Exchange is a dedicated platform built exclusively for Bangladesh Army University of Science
                and Technology (BAUST) students and teachers. Buy, sell, exchange, donate, and request campus
                essentials — from textbooks and electronics to furniture and stationery — all within a trusted,
                verified community.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: BookOpen, label: 'Books & Notes', color: 'text-emerald-400' },
                  { icon: Laptop, label: 'Electronics', color: 'text-blue-400' },
                  { icon: Sofa, label: 'Furniture', color: 'text-purple-400' },
                  { icon: PenTool, label: 'Stationery', color: 'text-orange-400' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5"
                  >
                    <item.icon className={`w-4 h-4 ${item.color} shrink-0`} />
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: '100%', label: 'Verified Students', icon: CheckCircle, color: 'from-emerald-500/15 to-emerald-600/5 border-emerald-400/15' },
                { value: 'Free', label: 'To Use', icon: Star, color: 'from-yellow-500/15 to-yellow-600/5 border-yellow-400/15' },
                { value: 'Real‑time', label: 'Messaging', icon: MessageSquare, color: 'from-blue-500/15 to-blue-600/5 border-blue-400/15' },
                { value: 'Secure', label: 'Google Auth', icon: Shield, color: 'from-purple-500/15 to-purple-600/5 border-purple-400/15' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-center border transition-transform hover:scale-[1.02]`}
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-2 text-white/70" />
                  <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3">
              <TrendingUp className="w-4 h-4" />
              How It Works
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
              Start Trading in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#2DE0B2]">
                3 Simple Steps
              </span>
            </h3>
            <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
              Join the BAUST Exchange community in minutes and start buying, selling, or trading campus essentials.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '01',
                title: 'Sign In with Google',
                desc: 'Use your Google account for quick, secure authentication. No passwords to remember.',
                icon: User,
                color: 'emerald',
              },
              {
                step: '02',
                title: 'Verify Your Identity',
                desc: 'Upload your BAUST ID card to verify you\'re a real campus member. Takes under a minute.',
                icon: Shield,
                color: 'blue',
              },
              {
                step: '03',
                title: 'Start Trading',
                desc: 'Browse listings, post items, chat with students, and make campus exchanges easily.',
                icon: ShoppingBag,
                color: 'purple',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-gradient-to-br from-[#172438] to-[#0d1f30] border border-white/[0.06] rounded-2xl p-6 sm:p-8 text-center group hover:border-emerald-400/15 transition-all duration-300"
              >
                {/* Step number */}
                <div className="text-5xl sm:text-6xl font-black text-white/[0.04] absolute top-3 right-5 select-none">
                  {item.step}
                </div>
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-gradient-to-br ${
                  item.color === 'emerald' ? 'from-emerald-500/20 to-emerald-600/10 border-emerald-400/15' :
                  item.color === 'blue' ? 'from-blue-500/20 to-blue-600/10 border-blue-400/15' :
                  'from-purple-500/20 to-purple-600/10 border-purple-400/15'
                } border`}>
                  <item.icon className={`w-6 h-6 ${
                    item.color === 'emerald' ? 'text-emerald-400' :
                    item.color === 'blue' ? 'text-blue-400' :
                    'text-purple-400'
                  }`} />
                </div>
                <h4 className="font-bold text-lg mb-2 text-white">{item.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CATEGORY HIGHLIGHTS ═══════════════════ */}
      <section className="py-16 sm:py-24 bg-[#0a1c32]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3">
              <Star className="w-4 h-4" />
              Popular Categories
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold mb-4">
              What Students{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#2DE0B2]">
                Trade Most
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { icon: BookOpen, label: 'Textbooks', count: 'CSE, EEE, ME...', color: 'emerald' },
              { icon: Laptop, label: 'Electronics', count: 'Laptops, Phones', color: 'blue' },
              { icon: Sofa, label: 'Furniture', count: 'Desks, Chairs', color: 'purple' },
              { icon: PenTool, label: 'Stationery', count: 'Pens, Notebooks', color: 'orange' },
              { icon: GraduationCap, label: 'Academic', count: 'Lab Kits, Tools', color: 'cyan' },
              { icon: ShoppingBag, label: 'Others', count: 'Sports, Hobbies', color: 'rose' },
            ].map((cat) => (
              <div
                key={cat.label}
                className="bg-gradient-to-br from-[#172438] to-[#0f2a3d] border border-white/[0.06] rounded-xl p-4 text-center hover:border-white/[0.12] transition-all duration-200 hover:-translate-y-0.5 group cursor-default"
              >
                <cat.icon className={`w-6 h-6 mx-auto mb-2 ${
                  cat.color === 'emerald' ? 'text-emerald-400' :
                  cat.color === 'blue' ? 'text-blue-400' :
                  cat.color === 'purple' ? 'text-purple-400' :
                  cat.color === 'orange' ? 'text-orange-400' :
                  cat.color === 'cyan' ? 'text-cyan-400' :
                  'text-rose-400'
                }`} />
                <p className="font-semibold text-sm text-white mb-0.5">{cat.label}</p>
                <p className="text-[11px] text-gray-500">{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA BANNER ═══════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-[#16D9A0] p-8 sm:p-12 md:p-16 text-center">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                Ready to Trade on Campus?
              </h3>
              <p className="text-emerald-100 text-sm sm:text-base max-w-lg mx-auto mb-8">
                Join hundreds of BAUST students already using BAUST Exchange.
                Sign in with Google and start in under 60 seconds.
              </p>
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-800 px-7 py-3.5 rounded-full font-bold text-sm sm:text-base transition-all duration-200 shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5" />
                Continue with Google
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CONTACT SECTION ═══════════════════ */}
      <section id="contact" className="py-16 sm:py-24 bg-[#0a1c32]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-3">
              <Mail className="w-4 h-4" />
              Get In Touch
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold mb-4">
              Have Questions?{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#2DE0B2]">
                Contact Us
              </span>
            </h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {[
              { icon: MapPin, title: 'Location', info: 'BAUST Campus, Saidpur, Nilphamari', color: 'emerald' },
              { icon: Mail, title: 'Email', info: 'support@baustexchange.com', color: 'blue' },
              { icon: Clock, title: 'Response Time', info: 'Within 24 hours', color: 'purple' },
            ].map((contact) => (
              <div
                key={contact.title}
                className="bg-gradient-to-br from-[#172438] to-[#0d1f30] border border-white/[0.06] rounded-2xl p-5 sm:p-6 text-center hover:border-white/[0.1] transition-all"
              >
                <contact.icon className={`w-6 h-6 mx-auto mb-3 ${
                  contact.color === 'emerald' ? 'text-emerald-400' :
                  contact.color === 'blue' ? 'text-blue-400' :
                  'text-purple-400'
                }`} />
                <h4 className="font-bold text-white mb-1">{contact.title}</h4>
                <p className="text-sm text-gray-400">{contact.info}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-white/[0.06] bg-[#050f1d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>© 2026 BAUST Exchange</span>
              <span className="hidden sm:inline">•</span>
              <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                Terms of Service
              </Link>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <GraduationCap className="w-4 h-4 text-emerald-400/60" />
              <span>Trade</span>
              <span>•</span>
              <span>Connect</span>
              <span>•</span>
              <span>Grow</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
