"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TokenInfo {
  tokenId: string;
  points: number;
  status: "PENDING" | "CLAIMED" | "EXPIRED";
  remainingSeconds: number;
  claimedByUserId: number | null;
  claimedByName: string | null;
}

interface Props {
  tokenData: TokenInfo | null;
  sessionUser: { id: number; name: string } | null;
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ClaimTokenClient({ tokenData, sessionUser }: Props) {
  const [status, setStatus] = useState<"PENDING" | "CLAIMED" | "EXPIRED" | "NOT_FOUND">(tokenData ? tokenData.status : "NOT_FOUND");
  const [remaining, setRemaining] = useState<number>(tokenData?.remainingSeconds || 0);
  const [claiming, setClaiming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [claimedJustNow, setClaimedJustNow] = useState(false);

  // Live 1-second countdown timer for PENDING tokens
  useEffect(() => {
    if (status !== "PENDING") return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setStatus("EXPIRED");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const handleClaimPoints = async () => {
    if (!tokenData || status !== "PENDING") return;

    setClaiming(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/points/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenData.tokenId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 410 || data.status === "EXPIRED") {
          setStatus("EXPIRED");
        } else if (res.status === 409) {
          setStatus("CLAIMED");
        }
        setErrorMsg(data.error || "تعذر تحصيل النقاط");
      } else {
        setNewBalance(data.newBalance ?? null);
        setClaimedJustNow(true);
        setStatus("CLAIMED");
      }
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى.");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border-2 border-cream-300 shadow-luxury overflow-hidden">
        {/* Top Brand Header */}
        <div className="bg-espresso-900 text-cream-50 px-6 py-6 text-center border-b-2 border-gold-500 relative">
          <div className="w-12 h-12 rounded-2xl bg-gold-500 text-espresso-900 flex items-center justify-center mx-auto mb-2.5 text-xl shadow-md">
            <i className="fa-solid fa-spa" />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-white">زهرة لينا — برنامج الولاء</h1>
          <p className="text-xs text-gold-400 mt-1">بوابتك لتحصيل نقاط الولاء والمكافآت الفورية 🌸</p>
        </div>

        <div className="p-6 sm:p-8 text-center space-y-6">
          {/* ==========================================
              CASE 1: Token Does Not Exist
              ========================================== */}
          {status === "NOT_FOUND" && (
            <div className="space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-2xl">
                <i className="fa-solid fa-circle-xmark" />
              </div>
              <h2 className="font-serif text-xl font-bold text-espresso-900">كود الـ QR غير صالح</h2>
              <p className="text-xs sm:text-sm text-espresso-800/75 leading-relaxed">
                عذراً، هذا الرابط أو الكود غير موجود في النظام. يرجى التأكد من مسح الكود الصحيح من كاشير متجر زهرة لينا.
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full bg-espresso-900 hover:bg-rosewarm-600 text-white font-bold py-3.5 px-6 rounded-full text-xs sm:text-sm transition"
              >
                <i className="fa-solid fa-store" />
                <span>العودة لمتجر زهرة لينا</span>
              </Link>
            </div>
          )}

          {/* ==========================================
              CASE 2: Expired Token (Passed 15 Minutes)
              ========================================== */}
          {status === "EXPIRED" && tokenData && (
            <div className="space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto text-2xl">
                <i className="fa-solid fa-clock-rotate-left" />
              </div>

              <span className="inline-block bg-rose-100 text-rose-800 border border-rose-200 text-xs font-extrabold px-3.5 py-1 rounded-full">
                منتهي الصلاحية (مضى أكثر من 15 دقيقة)
              </span>

              <h2 className="font-serif text-2xl font-bold text-espresso-900">انتهت مهلة تحصيل (+{tokenData.points} نقطة)</h2>

              <p className="text-xs sm:text-sm text-espresso-800/75 leading-relaxed">
                حفاظاً على أمان نقاطك، يكون كود الـ QR صالحاً لمدة <strong>15 دقيقة فقط</strong> من وقت إصداره. يرجى طلب كود جديد من موظف
                متجر زهرة لينا.
              </p>

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  href="/rewards"
                  className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-3 px-6 rounded-full text-xs sm:text-sm transition"
                >
                  عرض رصيدي ومكافآتي الحالية
                </Link>
                <Link
                  href="/"
                  className="w-full bg-cream-100 hover:bg-cream-200 text-espresso-900 font-bold py-3 px-6 rounded-full text-xs sm:text-sm transition"
                >
                  تصفح باقات زهرة لينا
                </Link>
              </div>
            </div>
          )}

          {/* ==========================================
              CASE 3: Claimed Token (Just Claimed or Previously Claimed)
              ========================================== */}
          {status === "CLAIMED" && tokenData && (
            <div className="space-y-5 py-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl ${
                  claimedJustNow
                    ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-300"
                    : "bg-gold-100 text-espresso-900 border border-gold-400"
                }`}
              >
                <i className={`fa-solid ${claimedJustNow ? "fa-wand-magic-sparkles" : "fa-circle-check"}`} />
              </div>

              {claimedJustNow ? (
                <>
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-extrabold px-4 py-1 rounded-full">
                    تمت إضافة النقاط بنجاح ✓
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900">مبارك! حصلت على +{tokenData.points} نقطة</h2>
                  {newBalance !== null && (
                    <div className="bg-cream-100 border border-gold-400 rounded-2xl p-4">
                      <span className="text-xs text-espresso-800/70 block">رصيدك الإجمالي الآن في زهرة لينا:</span>
                      <strong className="text-2xl font-extrabold text-rosewarm-600 mt-1 block">{newBalance} نقطة ولاء 🌸</strong>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-block bg-stone-200 text-stone-800 text-xs font-extrabold px-4 py-1 rounded-full">
                    كود مستخدم مسبقاً
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900">
                    تم تحصيل (+{tokenData.points} نقطة) من هذا الكود مسبقاً
                  </h2>
                  <p className="text-xs sm:text-sm text-espresso-800/75">
                    {sessionUser && tokenData.claimedByUserId === sessionUser.id
                      ? "لقد قمت بإضافة نقاط هذا الكود إلى حسابك بالفعل ✓"
                      : "تم مسح واستخدام هذا الكود مسبقاً ولا يمكن تحصيل نفس الكود أكثر من مرة."}
                  </p>
                </>
              )}

              <div className="pt-2 flex flex-col gap-2.5">
                <Link
                  href="/rewards"
                  className="w-full bg-espresso-900 hover:bg-rosewarm-600 text-gold-400 hover:text-white font-bold py-3.5 px-6 rounded-full text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-gift" />
                  <span>الانتقال لصفحة المكافآت واستبدال النقاط</span>
                </Link>
                <Link
                  href="/"
                  className="w-full bg-cream-100 hover:bg-cream-200 text-espresso-900 font-bold py-3 px-6 rounded-full text-xs sm:text-sm transition"
                >
                  العودة للصفحة الرئيسية
                </Link>
              </div>
            </div>
          )}

          {/* ==========================================
              CASE 4: Active PENDING Token (Ready to Claim!)
              ========================================== */}
          {status === "PENDING" && tokenData && (
            <div className="space-y-5">
              {/* Live 15-Minute Countdown Badge */}
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 border border-amber-300 px-4 py-1.5 rounded-full text-xs font-extrabold">
                <i className="fa-solid fa-hourglass-half animate-pulse text-amber-700" />
                <span>ينتهي الكود خلال {formatCountdown(remaining)} دقيقة</span>
              </div>

              <div className="bg-gradient-to-b from-cream-100 to-cream-50 border-2 border-gold-400 rounded-3xl p-6 space-y-2 shadow-inner">
                <span className="text-xs font-bold text-espresso-800/70 block">هدية نقاط ولاء من متجر زهرة لينا</span>
                <div className="font-serif text-4xl sm:text-5xl font-extrabold text-rosewarm-600">+{tokenData.points}</div>
                <span className="text-sm font-bold text-espresso-900 block">نقطة ولاء جاهزة للإضافة</span>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{errorMsg}</div>
              )}

              {sessionUser ? (
                <div className="space-y-3">
                  <p className="text-xs text-espresso-800/80">
                    مرحباً <strong>{sessionUser.name}</strong>، اضغط الزر أدناه لإضافة النقاط فوراً إلى حسابك:
                  </p>
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={handleClaimPoints}
                    className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-4 px-6 rounded-full shadow-luxury hover:shadow-luxury-hover transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer disabled:opacity-50"
                  >
                    {claiming ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin" />
                        <span>جاري إضافة النقاط لحسابك...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles" />
                        <span>تحصيل +{tokenData.points} نقطة في حسابي الآن</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-cream-100 border border-cream-300 rounded-2xl p-4 space-y-3">
                  <p className="text-xs sm:text-sm font-bold text-espresso-900">
                    يرجى تسجيل الدخول أو إنشاء حساب سريع لحفظ النقاط في رصيدك 🌸
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Link
                      href={`/login?redirect=/claim/${tokenData.tokenId}`}
                      className="bg-espresso-900 hover:bg-rosewarm-600 text-gold-400 hover:text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
                    >
                      <i className="fa-solid fa-right-to-bracket" />
                      <span>تسجيل الدخول</span>
                    </Link>
                    <Link
                      href={`/register?redirect=/claim/${tokenData.tokenId}`}
                      className="bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5"
                    >
                      <i className="fa-solid fa-user-plus" />
                      <span>حساب جديد</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
