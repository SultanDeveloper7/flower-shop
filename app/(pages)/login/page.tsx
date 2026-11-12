"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/TopBar";

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const initialMode = searchParams.get("mode");

  const [isLogin, setIsLogin] = useState(initialMode !== "register");

  // const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const payload = isLogin
      ? { phone_or_email: phoneOrEmail.trim(), password }
      : { name: name.trim(), phone_or_email: phoneOrEmail.trim(), password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "حدث خطأ أثناء تسجيل الدخول، يرجى التأكد من البيانات.");
        setLoading(false);
        return;
      }

      // Redirect Priority:
      // 1. Return to QR code claim page if they scanned a code (?redirect=/claim/...)
      // 2. Admin -> Bouquet Upload & Management
      // 3. Staff -> QR Point Generator (POS)
      // 4. Customer -> Main Storefront
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (data.role === "ADMIN") {
        router.push("/admin/bouquets");
      } else if (data.role === "STAFF") {
        router.push("/staff/pos");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-espresso-900 selection:bg-rosewarm-500 selection:text-white">
      {/* Top Announcement Bar */}
      <TopBar />

      {/* Minimal Boutique Header */}
      <header className="bg-cream-100/95 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rosewarm-500 to-rosewarm-700 flex items-center justify-center text-cream-50 shadow-md group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-spa text-lg" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 leading-none">زهرة لينا</h1>
              <p className="text-[10px] tracking-widest uppercase text-gold-600 font-semibold mt-1">ZAHRAT LINA FLOWERS &amp; GIFTS</p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-200 text-espresso-900 border border-cream-300 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-2xs"
          >
            <span>العودة للمتجر</span>
            <i className="fa-solid fa-arrow-left text-rosewarm-500 text-xs" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
        {/* Decorative Blurred Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rosewarm-300/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gold-400/15 blur-3xl pointer-events-none" />

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-cream-300 shadow-luxury overflow-hidden relative z-10">
          {/* Right Column: Login / Register Form (7 cols on Desktop) */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
            <div>
              {/* Loyalty Badge */}
              <div className="inline-flex items-center gap-2 bg-rosewarm-100 border border-rosewarm-300/60 text-rosewarm-700 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6">
                <i className="fa-solid fa-crown text-gold-500" />
                <span>نادي ولاء ومكافآت زهرة لينا</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-espresso-900">
                {isLogin ? "أهلاً بعودتك إلى زهرة لينا" : "إنشاء حساب جديد في نادي الولاء"}
              </h2>
              <p className="text-xs sm:text-sm text-espresso-800/75 mt-2 leading-relaxed">
                {isLogin
                  ? "سجّل دخولك لاستعراض رصيد نقاطك، مسح أكواد الـ QR عند الشراء، والحصول على خصومات وباقات مجانية."
                  : "انضم إلينا مجاناً واجمع النقاط مع كل باقة تشتريها من الفرع لتستبدلها بهدايا وخصومات حصرية."}
              </p>

              {/* Notice if redirected from QR scan */}
              {redirectUrl && (
                <div className="mt-4 p-3.5 rounded-2xl bg-gold-100/80 border border-gold-400/60 text-espresso-900 text-xs font-bold flex items-center gap-2.5">
                  <i className="fa-solid fa-qrcode text-gold-600 text-base" />
                  <span>سجّل دخولك أو أنشئ حساباً الآن لإضافة نقاط فاتورتك فوراً إلى محفظتك!</span>
                </div>
              )}

              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-cream-100 rounded-2xl border border-cream-300 mt-6 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError("");
                  }}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isLogin ? "bg-espresso-900 text-cream-50 shadow-sm" : "text-espresso-800/70 hover:text-espresso-900"
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError("");
                  }}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    !isLogin ? "bg-rosewarm-500 text-white shadow-sm" : "text-espresso-800/70 hover:text-espresso-900"
                  }`}
                >
                  حساب جديد
                </button>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2">
                  <i className="fa-solid fa-circle-exclamation text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                      الاسم الكريم <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: سارة أحمد"
                        required
                        className="w-full rounded-2xl bg-cream-50 focus:bg-white border border-cream-300 focus:border-rosewarm-500 py-3 pr-10 pl-4 text-sm text-espresso-900 focus:outline-none transition-all"
                      />
                      <i className="fa-regular fa-user absolute right-3.5 top-1/2 -translate-y-1/2 text-rosewarm-500 text-sm" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                    رقم الجوال أو البريد الإلكتروني <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneOrEmail}
                      onChange={(e) => setPhoneOrEmail(e.target.value)}
                      placeholder="05XXXXXXXX أو example@mail.com"
                      dir="ltr"
                      required
                      className="w-full text-right rounded-2xl bg-cream-50 focus:bg-white border border-cream-300 focus:border-rosewarm-500 py-3 pr-10 pl-4 text-sm text-espresso-900 focus:outline-none transition-all"
                    />
                    <i className="fa-solid fa-phone-flip absolute right-3.5 top-1/2 -translate-y-1/2 text-rosewarm-500 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                    كلمة المرور <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      required
                      className="w-full text-right rounded-2xl bg-cream-50 focus:bg-white border border-cream-300 focus:border-rosewarm-500 py-3 pr-10 pl-10 text-sm text-espresso-900 focus:outline-none transition-all"
                    />
                    <i className="fa-solid fa-lock absolute right-3.5 top-1/2 -translate-y-1/2 text-rosewarm-500 text-sm" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-espresso-800/50 hover:text-rosewarm-600 text-xs"
                      tabIndex={-1}
                    >
                      <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`} />
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-full shadow-luxury hover:shadow-luxury-hover transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin" />
                        <span>جاري المعالجة...</span>
                      </>
                    ) : (
                      <>
                        <span>{isLogin ? "دخول إلى حسابي" : "إنشاء الحساب والانضمام الآن"}</span>
                        <i className="fa-solid fa-arrow-left text-xs" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Bottom Help & Quick Switch */}
            <div className="mt-8 pt-5 border-t border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-espresso-800/75">
              <div>
                {isLogin ? "ليس لديك حساب في زهرة لينا؟ " : "لديك حساب بالفعل؟ "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="text-rosewarm-600 font-bold hover:underline"
                >
                  {isLogin ? "سجّل حساباً جديداً" : "سجّل دخولك هنا"}
                </button>
              </div>

              <a
                href="https://wa.me/966530346444"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline font-semibold"
              >
                <i className="fa-brands fa-whatsapp" />
                <span>مساعدة عبر واتساب</span>
              </a>
            </div>
          </div>

          {/* Left Column: Luxury Floral Showcase & Perks (5 cols on Desktop) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-espresso-900 via-espresso-800 to-espresso-900 text-cream-50 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-60 h-60 rounded-full bg-rosewarm-500/20 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Arched Featured Image */}
              <div className="relative mx-auto max-w-[240px] rounded-t-[120px] rounded-b-2xl overflow-hidden border-2 border-gold-400/60 shadow-xl aspect-[4/5] bg-espresso-800">
                <img
                  src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=700&q=80"
                  alt="باقات زهرة لينا"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/85 via-transparent to-transparent" />
                <div className="absolute bottom-3 right-3 left-3 text-center">
                  <span className="bg-gold-500 text-espresso-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">مكافآت حصرية</span>
                  <p className="font-serif text-base font-bold text-white mt-1">اجمع النقاط مع كل باقة</p>
                </div>
              </div>

              {/* How the Loyalty Program Works */}
              <div className="space-y-3 pt-2">
                <h3 className="font-serif text-xl font-bold text-gold-400 text-center">كيف يعمل نظام نقاط زهرة لينا؟</h3>

                <div className="space-y-2.5 text-xs text-cream-200/90">
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-gold-500 text-espresso-900 font-bold flex items-center justify-center shrink-0">
                      1
                    </div>
                    <span>اشترِ أي باقة من فرعنا في جازان (حي السويس) أو عبر الموقع.</span>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-rosewarm-500 text-white font-bold flex items-center justify-center shrink-0">
                      2
                    </div>
                    <span>امسح كود الـ QR الذي يظهره لك الموظف بكاميرا جوالك.</span>
                  </div>

                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
                    <div className="w-8 h-8 rounded-xl bg-gold-500 text-espresso-900 font-bold flex items-center justify-center shrink-0">
                      3
                    </div>
                    <span>استبدل 100 نقطة بخصم 20 ر.س، أو 500 نقطة بباقة ورد مجانية!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-6 border-t border-white/10 text-center text-[11px] text-cream-300/70">
              <i className="fa-solid fa-location-dot text-gold-400 ml-1" />
              جازان - حي السويس - مقابل النقل الجماعي • 0530346444
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream-100 flex items-center justify-center text-espresso-900 font-bold">جاري التحميل...</div>
      }
    >
      <AuthFormContent />
    </Suspense>
  );
}
