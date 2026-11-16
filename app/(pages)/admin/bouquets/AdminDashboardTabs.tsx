"use client";

import { useState, useEffect } from "react";
import { Category, Product } from "@/constants/catalog";
import UploadBouquetForm from "./UploadBouquetForm";
import CategoriesManager from "./CategoriesManager";
import OrdersManager from "./OrdersManager";
import Link from "next/link";
import UsersManager from "./UsersManager";

type TabKey = "bouquets" | "categories" | "orders" | "sessions" | "users";

interface ActiveSessionItem {
  id: number;
  name: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt?: string;
  isCurrentDevice: boolean;
}

function formatDeviceAgent(ua?: string) {
  if (!ua) return { label: "جهاز غير معروف", icon: "fa-solid fa-laptop" };
  const lower = ua.toLowerCase();

  const isMobile = lower.includes("iphone") || lower.includes("ipad") || lower.includes("android") || lower.includes("mobile");

  let os = "جهاز كمبيوتر";
  if (lower.includes("iphone")) os = "آيفون (iPhone)";
  else if (lower.includes("ipad")) os = "آيباد (iPad)";
  else if (lower.includes("android")) os = "جوال أندرويد (Android)";
  else if (lower.includes("macintosh")) os = "ماك (Mac)";
  else if (lower.includes("windows")) os = "ويندوز (Windows)";

  let browser = "متصفح";
  if (lower.includes("edg/")) browser = "Edge";
  else if (lower.includes("chrome")) browser = "Chrome";
  else if (lower.includes("safari")) browser = "Safari";
  else if (lower.includes("firefox")) browser = "Firefox";

  return {
    label: `${os} — ${browser}`,
    icon: isMobile ? "fa-solid fa-mobile-screen-button" : "fa-solid fa-laptop",
  };
}

export default function AdminDashboardTabs({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("bouquets");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/admin/sessions");
      const data = await res.json();
      if (res.ok) setSessions(data.sessions || []);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") fetchSessions();
  }, [activeTab]);

  // Lock background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileDrawerOpen]);

  const handleRevokeSession = async (sessionId: string, userName: string) => {
    const res = await fetch(`/api/admin/sessions?sessionId=${sessionId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      showToast(`تم تسجيل خروج جهاز (${userName}) بنجاح ✓`);
      fetchSessions();
    }
  };

  const navItems: {
    key: TabKey;
    label: string;
    subtitle: string;
    icon: string;
    badgeCount?: number;
  }[] = [
    {
      key: "bouquets",
      label: "إدارة الباقات",
      subtitle: "إضافة وتعديل الصور والأسعار",
      icon: "fa-solid fa-spa",
      badgeCount: initialProducts.length,
    },
    {
      key: "categories",
      label: "إدارة الأقسام",
      subtitle: "أقسام المتجر والأيقونات",
      icon: "fa-solid fa-layer-group",
      badgeCount: categories.length,
    },
    {
      key: "orders",
      label: "سجل الطلبات",
      subtitle: "طلبات الواتساب والمبيعات",
      icon: "fa-brands fa-whatsapp",
    },
    {
      key: "sessions",
      label: "الجلسات والأجهزة",
      subtitle: "الأجهزة المتصلة وتسجيل الخروج",
      icon: "fa-solid fa-desktop",
      badgeCount: sessions.length > 0 ? sessions.length : undefined,
    },
    {
      key: "users",
      label: "المستخدمين والنقاط",
      subtitle: "تعديل النقاط وحظر الحسابات",
      icon: "fa-solid fa-user-shield",
    },
  ];

  const activeNavItem = navItems.find((item) => item.key === activeTab) || navItems[0];

  const handleSelectTab = (key: TabKey) => {
    setActiveTab(key);
    setMobileDrawerOpen(false);
  };

  /* Shared Sidebar Content (used by both Desktop Sidebar & Mobile Left Drawer) */
  const renderSidebarContent = (isMobileDrawer = false) => (
    <div dir="rtl" className="flex flex-col h-full justify-between bg-white">
      <div>
        {/* Brand Header */}
        <div className="p-5 bg-espresso-900 text-cream-50 border-b border-gold-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gold-500 text-espresso-900 flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
              <i className="fa-solid fa-crown" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-base sm:text-lg font-bold text-white truncate">لوحة تحكم زهرة لينا</h2>
              <p className="text-[11px] text-gold-400">إدارة المتجر والولاء</p>
            </div>
          </div>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="إغلاق القائمة"
              className="w-9 h-9 rounded-full bg-espresso-800 hover:bg-rosewarm-600 text-white flex items-center justify-center transition cursor-pointer shrink-0"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelectTab(item.key)}
                className={`w-full text-right p-3.5 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isActive ? "bg-espresso-900 text-gold-400 shadow-md" : "text-espresso-900 hover:bg-cream-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 transition-colors ${
                      isActive ? "bg-gold-500 text-espresso-900" : "bg-cream-100 text-rosewarm-600"
                    }`}
                  >
                    <i className={item.icon} />
                  </div>
                  <div className="min-w-0">
                    <span className={`block text-xs sm:text-sm font-bold truncate ${isActive ? "text-white" : "text-espresso-900"}`}>
                      {item.label}
                    </span>
                    <span className={`block text-[10px] truncate mt-0.5 ${isActive ? "text-gold-400/90" : "text-espresso-800/60"}`}>
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {item.badgeCount !== undefined && (
                  <span
                    className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 ${
                      isActive ? "bg-gold-500 text-espresso-900" : "bg-cream-200 text-espresso-800"
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Links Footer */}
      <div className="p-3 pt-2 border-t border-cream-200 space-y-1.5 bg-cream-50/60">
        <Link
          href="/staff/pos"
          onClick={() => setMobileDrawerOpen(false)}
          className="w-full p-2.5 rounded-xl text-xs font-bold text-espresso-800 hover:bg-cream-200/70 transition flex items-center gap-2.5"
        >
          <i className="fa-solid fa-qrcode text-rosewarm-600 w-5 text-center" />
          <span>شاشة الكاشير ونقاط الـ QR</span>
        </Link>
        <Link
          href="/"
          onClick={() => setMobileDrawerOpen(false)}
          className="w-full p-2.5 rounded-xl text-xs font-bold text-espresso-800 hover:bg-cream-200/70 transition flex items-center gap-2.5"
        >
          <i className="fa-solid fa-store text-gold-600 w-5 text-center" />
          <span>معاينة المتجر الرئيسي</span>
        </Link>
      </div>
    </div>
  );

  return (
    /* Outer flex container with dir="ltr" so the sidebar & drawer are pinned on the LEFT side */
    <div dir="ltr" className="flex flex-col lg:flex-row gap-6 items-start">
      {/* ============================================================
          MOBILE TOP HEADER WITH LEFT DRAWER BUTTON (< lg screens)
          ============================================================ */}
      <div className="w-full lg:hidden bg-espresso-900 text-cream-50 px-4 py-3.5 rounded-2xl border border-gold-500/40 shadow-luxury flex items-center justify-between gap-3">
        {/* Left Drawer Trigger Button */}
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="فتح قائمة الأقسام"
          className="flex items-center gap-2.5 bg-gold-500 hover:bg-gold-400 text-espresso-900 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition cursor-pointer shrink-0"
        >
          <i className="fa-solid fa-bars text-sm" />
          <span>الأقسام</span>
        </button>

        {/* Active Section Indicator (RTL) */}
        <div dir="rtl" className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0 text-right">
            <span className="block text-[10px] text-gold-400">القسم الحالي</span>
            <span className="block text-sm font-bold text-white truncate">{activeNavItem.label}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-espresso-800 border border-gold-500/30 text-gold-400 flex items-center justify-center text-sm shrink-0">
            <i className={activeNavItem.icon} />
          </div>
        </div>
      </div>

      {/* ============================================================
          MOBILE LEFT SLIDE-OUT DRAWER OVERLAY (< lg screens)
          ============================================================ */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-start">
          {/* Dark Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-espresso-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Left Drawer Panel */}
          <aside className="relative z-10 w-80 max-w-[85vw] h-full bg-white shadow-2xl border-r-2 border-gold-500/40 overflow-y-auto animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* ============================================================
          DESKTOP PERMANENT LEFT SIDEBAR (lg+ screens)
          ============================================================ */}
      <aside className="hidden lg:block w-72 shrink-0 bg-white rounded-3xl border border-cream-300 shadow-luxury overflow-hidden sticky top-6">
        {renderSidebarContent(false)}
      </aside>

      {/* ============================================================
          RIGHT MAIN CONTENT AREA (dir="rtl" for Arabic layout)
          ============================================================ */}
      <div dir="rtl" className="flex-1 w-full min-w-0 space-y-6">
        {/* Feedback Banner */}
        {feedback && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-circle-check text-emerald-600" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        )}

        {/* TAB 1: Bouquets Manager */}
        {activeTab === "bouquets" && <UploadBouquetForm categories={categories} initialProducts={initialProducts} />}

        {/* TAB 2: Categories Manager */}
        {activeTab === "categories" && (
          <CategoriesManager initialCategories={categories} products={initialProducts} onCategoriesChange={setCategories} />
        )}

        {/* TAB 3: WhatsApp Orders History */}
        {activeTab === "orders" && <OrdersManager />}

        {/* TAB 4: Active Sessions Manager */}
        {activeTab === "sessions" && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
                  <i className="fa-solid fa-tower-broadcast text-emerald-600" />
                  <span>الأجهزة والجلسات المتصلة حالياً ({sessions.length})</span>
                </h2>
                <p className="text-xs text-espresso-800/70 mt-1">
                  يمكنك مراقبة جميع الأجهزة المسجّل دخولها وإنهاء جلسة أي جهاز فوراً عن بُعد
                </p>
              </div>

              <button
                type="button"
                onClick={fetchSessions}
                className="bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 text-xs font-bold px-4 py-2.5 rounded-full transition flex items-center gap-1.5 cursor-pointer"
              >
                <i className={`fa-solid fa-rotate ${loadingSessions ? "animate-spin" : ""}`} />
                <span>تحديث القائمة</span>
              </button>
            </div>

            {loadingSessions ? (
              <div className="py-12 text-center text-sm font-bold text-espresso-800/60">جاري فحص الجلسات النشطة في Redis...</div>
            ) : sessions.length === 0 ? (
              <div className="py-12 text-center text-sm text-espresso-800/60">لا توجد جلسات نشطة حالياً.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.map((s) => {
                  const device = formatDeviceAgent(s.userAgent);
                  return (
                    <div
                      key={s.sessionId}
                      className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition ${
                        s.isCurrentDevice ? "bg-gold-100/40 border-gold-400" : "bg-cream-50 border-cream-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-espresso-900 text-gold-400 flex items-center justify-center text-lg shrink-0">
                            <i className={device.icon} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-sm sm:text-base text-espresso-900">{s.name}</h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rosewarm-100 text-rosewarm-700">
                                {s.role}
                              </span>
                              {s.isCurrentDevice && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  جهازك الحالي
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-espresso-800/80 mt-0.5">{device.label}</p>
                            <p className="text-[11px] text-espresso-800/60 mt-0.5" dir="ltr">
                              IP: {s.ipAddress || "غير معروف"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-cream-200 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-espresso-800/60">
                          {s.createdAt ? `بدأ: ${new Date(s.createdAt).toLocaleString("ar-SA")}` : "جلسة نشطة"}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRevokeSession(s.sessionId, s.name)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <i className="fa-solid fa-power-off" />
                          <span>تسجيل خروج الجهاز</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Users, Points Adjustment & Block Management */}
        {activeTab === "users" && <UsersManager />}
      </div>
    </div>
  );
}
