"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  cartCount: number;
  onOpenCart: () => void;
  onResetFilters: () => void;
  session: { id: number; name: string; role: "CUSTOMER" | "STAFF" | "ADMIN" } | null;
  userPoints: number;
}

export default function Header({ searchQuery, onSearchChange, cartCount, onOpenCart, onResetFilters, session, userPoints }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-md border-b border-cream-300 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Row: Logo + Actions */}
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Brand Logo */}
          <Link
            href="/"
            onClick={() => {
              onResetFilters();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-rosewarm-500 to-rosewarm-700 flex items-center justify-center text-cream-50 shadow-md">
              <i className="fa-solid fa-spa text-base sm:text-xl" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-3xl font-bold text-espresso-900 leading-none">زهرة لينا</h1>
              <p className="text-[9px] sm:text-[11px] tracking-widest uppercase text-gold-600 font-semibold mt-0.5">ZAHRAT LINA FLOWERS</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6 text-sm font-medium text-espresso-800">
            <Link href="#hero" className="hover:text-rosewarm-600 transition-colors py-1">
              الرئيسية
            </Link>
            <Link href="#categories-overview" className="hover:text-rosewarm-600 transition-colors py-1">
              الأقسام العشرة
            </Link>
            <Link href="#products-section" className="hover:text-rosewarm-600 transition-colors py-1">
              كتالوج الباقات
            </Link>
            <Link href="/rewards" className="hover:text-rosewarm-600 transition-colors py-1 flex items-center gap-1">
              <i className="fa-solid fa-crown text-gold-500 text-xs" />
              <span>نقاطي ومكافآتي</span>
            </Link>
            <Link href="#footer" className="hover:text-rosewarm-600 transition-colors py-1">
              تواصل معنا
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Desktop Search Input (Hidden on small mobile, shown in Row 2 instead) */}
            <div className="hidden md:block relative w-56 lg:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث عن باقة، هدية..."
                className="w-full bg-cream-200/80 focus:bg-white text-espresso-900 placeholder-espresso-800/50 text-xs sm:text-sm rounded-full py-2 pr-9 pl-8 border border-cream-300 focus:border-rosewarm-500 focus:outline-none"
              />
              <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-rosewarm-500 text-xs" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-espresso-800/50 hover:text-rosewarm-600 text-xs p-1"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>

            {/* Admin & Staff Quick Links (Desktop) */}
            {session?.role === "ADMIN" && (
              <Link
                href="/admin/bouquets"
                className="hidden sm:flex items-center gap-1.5 bg-gold-100 hover:bg-gold-400 text-espresso-900 border border-gold-400 px-3 py-2 rounded-full text-xs font-bold transition-all shrink-0"
              >
                <i className="fa-solid fa-user-gear text-rosewarm-600" />
                <span className="hidden lg:inline">الآدمن</span>
              </Link>
            )}

            {(session?.role === "STAFF" || session?.role === "ADMIN") && (
              <Link
                href="/staff/pos"
                className="hidden sm:flex items-center gap-1.5 bg-rosewarm-100 hover:bg-rosewarm-300 text-espresso-900 border border-rosewarm-300 px-3 py-2 rounded-full text-xs font-bold transition-all shrink-0"
              >
                <i className="fa-solid fa-qrcode text-rosewarm-700" />
                <span className="hidden lg:inline">نقاط QR</span>
              </Link>
            )}

            {/* User Points / Login Button */}
            {session ? (
              <Link
                href="/rewards"
                className="flex items-center gap-1.5 bg-white border border-gold-400/70 px-2.5 sm:px-3 py-1.5 rounded-full shadow-2xs shrink-0"
              >
                <i className="fa-solid fa-gift text-rosewarm-600 text-xs" />
                <div className="text-right leading-tight">
                  <span className="text-[9px] text-espresso-800/70 block max-w-[65px] truncate">{session.name}</span>
                  <strong className="text-[11px] sm:text-xs font-extrabold text-rosewarm-600">{userPoints} نقطة</strong>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-rosewarm-500 hover:bg-rosewarm-600 text-white px-3 py-2 rounded-full text-xs font-bold transition-all shrink-0"
              >
                <i className="fa-regular fa-user text-xs" />
                <span>دخول</span>
              </Link>
            )}

            {/* Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 bg-espresso-900 hover:bg-rosewarm-600 text-cream-50 px-3 sm:px-4 py-2 rounded-full text-xs font-medium transition-all shadow-sm shrink-0"
            >
              <i className="fa-solid fa-bag-shopping text-gold-400 text-sm" />
              <span className="hidden sm:inline">السلة</span>
              <span className="bg-gold-500 text-espresso-900 font-bold text-[11px] px-1.5 py-0.2 rounded-full min-w-[20px] text-center">
                {cartCount}
              </span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden w-9 h-9 rounded-full bg-white border border-cream-300 text-espresso-900 flex items-center justify-center shrink-0"
              aria-label="القائمة"
            >
              <i className={`fa-solid ${mobileMenuOpen ? "fa-xmark" : "fa-bars"} text-sm`} />
            </button>
          </div>
        </div>

        {/* Second Row on Mobile Only: Full-Width Search Bar */}
        <div className="md:hidden pb-2.5">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث عن باقة، هدية، مناسبة..."
              className="w-full bg-white text-espresso-900 placeholder-espresso-800/50 text-xs rounded-full py-2.5 pr-9 pl-8 border border-cream-300 focus:border-rosewarm-500 focus:outline-none shadow-2xs"
            />
            <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-rosewarm-500 text-xs" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-espresso-800/50 hover:text-rosewarm-600 text-xs p-1"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide-Down Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-cream-300 px-4 py-4 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link
              href="/rewards"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-3 rounded-2xl bg-cream-100 text-espresso-900 border border-cream-300"
            >
              <i className="fa-solid fa-crown text-gold-500" />
              <span>محفظة نقاطي ({userPoints})</span>
            </Link>

            {!session ? (
              <Link
                href="/login?mode=register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-3 rounded-2xl bg-rosewarm-100 text-rosewarm-700 border border-rosewarm-300"
              >
                <i className="fa-solid fa-user-plus" />
                <span>حساب جديد</span>
              </Link>
            ) : (
              <div className="flex items-center justify-center p-2 rounded-2xl bg-cream-100 border border-cream-300">
                <LogoutButton />
              </div>
            )}

            {session?.role === "ADMIN" && (
              <Link
                href="/admin/bouquets"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-3 rounded-2xl bg-gold-100 text-espresso-900 border border-gold-400"
              >
                <i className="fa-solid fa-user-gear text-rosewarm-600" />
                <span>لوحة تحكم الآدمن</span>
              </Link>
            )}

            {(session?.role === "STAFF" || session?.role === "ADMIN") && (
              <Link
                href="/staff/pos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-3 rounded-2xl bg-espresso-900 text-gold-400"
              >
                <i className="fa-solid fa-qrcode" />
                <span>إصدار نقاط QR (POS)</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
