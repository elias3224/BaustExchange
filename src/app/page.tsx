'use client';

import Link from 'next/link';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  Heart,
  MessageSquare,
  Zap,
  Shield,
  ShieldCheck,
  Users,
  User,
  GraduationCap,
  BookOpen,
  Laptop,
  Sofa,
  Shirt,
  PenTool,
  Dumbbell,
  ChevronDown,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  Mail,
  MapPin,
  Menu,
  X,
  Lock,
} from 'lucide-react';

/* ─────────────────────── Smooth Scroll Helper ─────────────────────── */
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const navOffset = 64;
    const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - navOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
}

/* ─────────────────────── Google SVG Icon ─────────────────────── */
function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
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
      } else {
        router.replace('/dashboard');
      }
    }
  }, [status, session, router]);

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleGoogleLogin() {
    signIn('google', { callbackUrl: '/dashboard' });
  }

  const navLinks = [
    { label: 'Home', href: 'hero' },
    { label: 'About', href: 'about' },
    { label: 'Features', href: 'features' },
    { label: 'How It Works', href: 'how-it-works' },
    { label: 'Categories', href: 'categories' },
    { label: 'Safety', href: 'safety' },
    { label: 'Contact', href: 'contact' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#071426] text-white font-sans antialiased selection:bg-emerald-500/30 overflow-x-hidden">
      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#071426]/95 backdrop-blur-md shadow-md shadow-black/25 border-b border-white/[0.07]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <button
              onClick={() => scrollTo('hero')}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/15 shadow-sm relative shrink-0 group-hover:border-emerald-400/50 transition-colors">
                <Image src="/images/campus.jpeg" alt="BAUST Logo" fill className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm sm:text-base leading-tight tracking-tight">
                  <span className="text-white">BAUST</span>{' '}
                  <span className="text-emerald-400">Exchange</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium leading-none">Campus Marketplace</span>
              </div>
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Desktop Sign In */}
            <div className="hidden sm:flex items-center gap-2.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm shadow-emerald-500/20 hover:shadow-emerald-400/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#08172c]/98 backdrop-blur-xl border-t border-white/[0.08] shadow-2xl">
            <div className="max-w-[1280px] mx-auto px-5 py-3 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    scrollTo(link.href);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-300 hover:text-emerald-400 hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2.5 mt-1 border-t border-white/[0.08]">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-lg font-semibold text-sm transition-colors"
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
      <section
        id="hero"
        className="relative min-h-[90vh] sm:min-h-[640px] lg:min-h-[700px] lg:max-h-[820px] flex items-center overflow-hidden pt-16 sm:pt-20"
      >
        {/* Background Image - BAUST Building */}
        <div className="absolute inset-0">
          <Image
            src="/images/baust-building.png"
            alt="BAUST Campus Building"
            fill
            priority
            sizes="100vw"
            quality={90}
            className="object-cover object-[72%_center] lg:object-right"
          />
          {/* Asymmetric Left-side dark gradient overlay (42% content readability / 58% clear campus visibility) */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071426] via-[#071426]/95 via-[38%] md:via-[44%] lg:via-[42%] to-transparent to-[75%]" />
          {/* Bottom gradient fade for smooth section connection */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#071426] to-transparent" />
          {/* Top subtle navbar shadow */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#071426]/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 w-full py-12 sm:py-16">
          <div className="max-w-xl lg:max-w-[530px]">
            {/* Compact Official Badge */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-3 py-1 mb-4 sm:mb-5">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs font-medium text-emerald-300">
                Official BAUST Community Platform
              </span>
            </div>

            {/* Compact Hero Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold leading-[1.12] tracking-tight mb-3 sm:mb-4">
              <span className="block text-white">Buy, Sell &</span>
              <span className="block text-white">Exchange</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-[#2DE0B2]">
                Campus Essentials
              </span>
            </h1>

            {/* Compact Supporting Paragraph */}
            <p className="text-sm sm:text-base lg:text-[16px] text-gray-300 leading-relaxed mb-6 sm:mb-7 max-w-lg">
              The trusted peer-to-peer campus marketplace for BAUST students & faculty.
              Trade textbooks, electronics, drawing equipment, furniture, and study materials safely on campus.
            </p>

            {/* Compact CTA & Indicators Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
              <button
                onClick={handleGoogleLogin}
                className="inline-flex items-center gap-2.5 bg-gradient-to-r from-emerald-500 to-[#16D9A0] hover:from-emerald-400 hover:to-[#2DE0B2] text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 shadow-md shadow-emerald-500/25 hover:shadow-emerald-400/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>Continue with Google</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Trust Indicators */}
              <div className="flex items-center gap-3.5 sm:gap-4 text-xs text-gray-300/90 font-medium">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Quick
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Safe
                </span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  Trusted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Scroll Down Indicator */}
        <button
          onClick={() => scrollTo('features')}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer p-2 focus:outline-none"
          aria-label="Scroll Down"
        >
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </section>

      {/* ═══════════════════ 1. FEATURES SECTION ═══════════════════ */}
      <section id="features" className="relative z-10 py-12 sm:py-16">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" />
              Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight">
              Everything You Need for Campus Trade
            </h2>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-b from-[#112033] to-[#0a1727] border border-white/[0.07] hover:border-emerald-500/30 rounded-xl p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  Campus Marketplace
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Browse and post items filtered by BAUST departments—CSE, EEE, ME, Civil, IPE, BBA & Sciences.
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-white/[0.05] flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <span>Verified student listings</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-b from-[#141d36] to-[#0c1427] border border-white/[0.07] hover:border-purple-400/30 rounded-xl p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-400/20 flex items-center justify-center mb-4">
                  <Heart className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-2 group-hover:text-purple-300 transition-colors">
                  Wanted Requests Board
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Looking for a rare textbook or drafting tool? Post a wanted request and get notified when someone has it.
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-white/[0.05] flex items-center gap-1.5 text-xs font-medium text-purple-400">
                <span>Quick peer matching</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-b from-[#0f2338] to-[#091728] border border-white/[0.07] hover:border-sky-400/30 rounded-xl p-5 sm:p-6 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center mb-4">
                  <MessageSquare className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-2 group-hover:text-sky-300 transition-colors">
                  Direct Student Chat
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Message buyers and sellers securely in real-time. Negotiate prices and coordinate safe on-campus meetups.
                </p>
              </div>
              <div className="pt-4 mt-3 border-t border-white/[0.05] flex items-center gap-1.5 text-xs font-medium text-sky-400">
                <span>Instant & encrypted</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 2. ABOUT & STATS SECTION ═══════════════════ */}
      <section id="about" className="py-12 sm:py-16 bg-[#091729]/60 border-y border-white/[0.05]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            {/* Left: Content (7 cols) */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
                <GraduationCap className="w-3.5 h-3.5" />
                About the Platform
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight mb-3 sm:mb-4 leading-snug">
                Your Campus,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#2DE0B2]">
                  Your Student Marketplace
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-5 max-w-xl">
                BAUST Exchange was built specifically for Bangladesh Army University of Science and Technology.
                We eliminate the friction of student buy-sell groups by giving our campus an organized, reliable,
                and spam-free hub for textbooks, electronics, stationery, and room furnishings.
              </p>

              {/* Department Badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  'CSE Department',
                  'EEE Department',
                  'ME Department',
                  'Civil Department',
                  'IPE Department',
                  'Business & Arts',
                ].map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center text-[11px] sm:text-xs font-medium bg-white/[0.04] text-gray-300 border border-white/[0.08] rounded-md px-2.5 py-1"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: 4 Compact Stat Cards (5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-3.5">
              {[
                {
                  value: '100%',
                  label: 'Campus-Focused',
                  desc: 'BAUST community only',
                  icon: CheckCircle,
                  accent: 'text-emerald-400',
                  bg: 'from-emerald-500/10 to-transparent border-emerald-400/20',
                },
                {
                  value: '0 Tk',
                  label: 'Zero Fees',
                  desc: 'Completely free to use',
                  icon: Star,
                  accent: 'text-amber-400',
                  bg: 'from-amber-500/10 to-transparent border-amber-400/20',
                },
                {
                  value: 'Live',
                  label: 'Instant Chat',
                  desc: 'Direct peer messaging',
                  icon: MessageSquare,
                  accent: 'text-sky-400',
                  bg: 'from-sky-500/10 to-transparent border-sky-400/20',
                },
                {
                  value: 'Safe',
                  label: 'Google Auth',
                  desc: 'Secure verified access',
                  icon: ShieldCheck,
                  accent: 'text-purple-400',
                  bg: 'from-purple-500/10 to-transparent border-purple-400/20',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.bg} border rounded-xl p-4 text-center transition-transform hover:-translate-y-0.5 duration-200`}
                >
                  <stat.icon className={`w-5 h-5 mx-auto mb-1.5 ${stat.accent}`} />
                  <p className="text-lg sm:text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs font-semibold text-gray-200 mt-0.5">{stat.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 3. HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-12 sm:py-16">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Simple Process
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight">
              Start Trading in 3 Easy Steps
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-md mx-auto">
              Join your fellow students in minutes and trade campus essentials with confidence.
            </p>
          </div>

          {/* 3 Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 relative">
            {[
              {
                step: '01',
                title: 'Sign In with Google',
                desc: 'One-click sign in with your Google account. Fast, secure, and no extra passwords to memorize.',
                icon: User,
                color: 'text-emerald-400',
                border: 'hover:border-emerald-500/30',
              },
              {
                step: '02',
                title: 'Post or Discover Items',
                desc: 'List your unused supplies with photos & price, or browse textbooks and tools needed for your semester.',
                icon: ShoppingBag,
                color: 'text-sky-400',
                border: 'hover:border-sky-500/30',
              },
              {
                step: '03',
                title: 'Meet & Safe Exchange',
                desc: 'Chat directly in-app, agree on terms, and complete the handoff right here on the BAUST campus.',
                icon: ShieldCheck,
                color: 'text-purple-400',
                border: 'hover:border-purple-500/30',
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`relative bg-gradient-to-b from-[#112033] to-[#0a1626] border border-white/[0.07] ${item.border} rounded-xl p-5 sm:p-6 transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-white/10 select-none">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white mb-1.5">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 4. MARKETPLACE CATEGORIES (8 Items) ═══════════════════ */}
      <section id="categories" className="py-12 sm:py-16 bg-[#091729]/60 border-y border-white/[0.05]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              Explore Marketplace
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight">
              Popular Campus Categories
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Find exactly what you need for your courses and hostel life.
            </p>
          </div>

          {/* 8 Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                icon: BookOpen,
                label: 'Books & Notes',
                sub: 'Textbooks, course packs & sheets',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: Laptop,
                label: 'Electronics',
                sub: 'Calculators, chargers, peripherals',
                color: 'text-sky-400',
                bg: 'bg-sky-500/10',
              },
              {
                icon: Sofa,
                label: 'Furniture',
                sub: 'Study desks, chairs, book racks',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
              },
              {
                icon: Shirt,
                label: 'Clothing',
                sub: 'Lab coats, jerseys, campus wear',
                color: 'text-pink-400',
                bg: 'bg-pink-500/10',
              },
              {
                icon: PenTool,
                label: 'Stationery',
                sub: 'Geometry sets, pens, art supplies',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10',
              },
              {
                icon: GraduationCap,
                label: 'Academic Materials',
                sub: 'Lab equipment, components & kits',
                color: 'text-teal-400',
                bg: 'bg-teal-500/10',
              },
              {
                icon: Dumbbell,
                label: 'Sports & Fitness',
                sub: 'Badminton, cricket, gym gear',
                color: 'text-rose-400',
                bg: 'bg-rose-500/10',
              },
              {
                icon: ShoppingBag,
                label: 'Others',
                sub: 'Bicycles, daily essentials & more',
                color: 'text-blue-400',
                bg: 'bg-blue-500/10',
              },
            ].map((cat) => (
              <div
                key={cat.label}
                className="group bg-gradient-to-b from-[#112033] to-[#0a1626] border border-white/[0.07] hover:border-emerald-500/25 rounded-xl p-3.5 sm:p-4 transition-all duration-200 hover:-translate-y-0.5 cursor-default flex items-start gap-3"
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${cat.bg} flex items-center justify-center shrink-0 border border-white/[0.05]`}>
                  <cat.icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${cat.color}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm text-white truncate group-hover:text-emerald-300 transition-colors">
                    {cat.label}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 truncate mt-0.5">
                    {cat.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 5. TRUST & SAFETY SECTION ═══════════════════ */}
      <section id="safety" className="py-12 sm:py-16">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Trust & Community
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-white tracking-tight">
              Safety First for BAUST Students
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-lg mx-auto">
              We design every feature around identity security, campus transparency, and trusted in-person transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                icon: ShieldCheck,
                title: 'BAUST ID Verification',
                desc: 'Students can upload their BAUST ID card to receive an official verified badge, building trust across the campus.',
                color: 'text-emerald-400',
              },
              {
                icon: MapPin,
                title: 'Safe Campus Meetups',
                desc: 'All trades happen on-campus in familiar spaces like the BAUST Cafeteria, Library lobby, or academic buildings.',
                color: 'text-sky-400',
              },
              {
                icon: Lock,
                title: 'Zero Commission or Fees',
                desc: 'BAUST Exchange is 100% free and community-driven. Deal directly with fellow students with complete transparency.',
                color: 'text-amber-400',
              },
            ].map((safety) => (
              <div
                key={safety.title}
                className="bg-gradient-to-b from-[#112033] to-[#0a1626] border border-white/[0.07] rounded-xl p-5 sm:p-6"
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3.5">
                  <safety.icon className={`w-4.5 h-4.5 ${safety.color}`} />
                </div>
                <h3 className="font-bold text-base text-white mb-1.5">{safety.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{safety.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 6. COMPACT CTA BANNER ═══════════════════ */}
      <section className="py-10 sm:py-14">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#14c794] p-6 sm:p-10 text-center shadow-xl">
            {/* Subtle glow circles */}
            <div className="absolute -top-24 -right-24 w-52 h-52 bg-white/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-black/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2.5 tracking-tight leading-snug">
                Ready to Trade on Campus?
              </h2>
              <p className="text-emerald-50 text-xs sm:text-sm leading-relaxed mb-6 max-w-md mx-auto">
                Join your BAUST classmates already buying, selling, and requesting campus essentials.
                Sign in with Google in under a minute.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleGoogleLogin}
                  className="inline-flex items-center gap-2.5 bg-white hover:bg-gray-50 text-gray-900 px-5 sm:px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>Continue with Google</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-semibold text-white/90 hover:text-white underline underline-offset-4 px-3 py-1.5 transition-colors"
                >
                  Already have an account? Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 7. CONTACT SECTION ═══════════════════ */}
      <section id="contact" className="py-12 sm:py-16 bg-[#091729]/60 border-t border-white/[0.05]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Mail className="w-3.5 h-3.5" />
              Get in Touch
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Have Questions or Feedback?
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1.5">
              We are constantly improving BAUST Exchange for our university community.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              {
                icon: MapPin,
                title: 'Campus Location',
                info: 'BAUST, Saidpur Cantonment',
                sub: 'Nilphamari, Bangladesh',
                color: 'text-emerald-400',
              },
              {
                icon: Mail,
                title: 'Support Email',
                info: 'support@baustexchange.com',
                sub: 'Reach out anytime',
                color: 'text-sky-400',
              },
              {
                icon: Clock,
                title: 'Quick Response',
                info: 'Within 24 Hours',
                sub: 'Direct student support',
                color: 'text-purple-400',
              },
            ].map((contact) => (
              <div
                key={contact.title}
                className="bg-gradient-to-b from-[#112033] to-[#0a1626] border border-white/[0.07] rounded-xl p-4 sm:p-5 text-center"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-2.5">
                  <contact.icon className={`w-4 h-4 ${contact.color}`} />
                </div>
                <h4 className="font-bold text-sm text-white mb-0.5">{contact.title}</h4>
                <p className="text-xs font-medium text-gray-300">{contact.info}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{contact.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 8. COMPACT FOOTER ═══════════════════ */}
      <footer className="border-t border-white/[0.07] bg-[#050e1a] py-6 sm:py-8">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Branding & Info */}
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md overflow-hidden border border-white/10 relative shrink-0">
                <Image src="/images/campus.jpeg" alt="BAUST Logo" fill className="object-cover" />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  BAUST <span className="text-emerald-400">Exchange</span>
                </p>
                <p className="text-[10px] text-gray-500">© 2026 BAUST Community. All rights reserved.</p>
              </div>
            </div>

            {/* Center: In-page Navigation */}
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href)}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right: Legal & Policy */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
