"use client";

import { useState, useEffect, useCallback } from "react";

export interface QRTokenRecord {
  tokenId: string;
  points: number;
  claimUrl: string;
  qrDataUrl?: string;
  status: "PENDING" | "CLAIMED" | "EXPIRED";
  createdAt: string;
  expiresAt: string;
  claimedByName?: string | null;
  createdByStaffName?: string | null;
}

interface VerifiedVoucher {
  id: number;
  rewardCode: string;
  rewardType: "DISCOUNT" | "FREE_BOUQUET";
  discountAmount: number;
  pointsSpent: number;
  status: "ACTIVE" | "USED";
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

// Calculate remaining seconds until expiresAt
function getRemainingSeconds(expiresAt: string, nowMs: number): number {
  const diff = Math.floor((new Date(expiresAt).getTime() - nowMs) / 1000);
  return Math.max(0, diff);
}

// Format seconds as MM:SS
function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function StaffPOSClient({ initialTokens = [] }: { initialTokens?: QRTokenRecord[] }) {
  // 1. QR Generation State
  const [points, setPoints] = useState<number>(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qrData, setQrData] = useState<QRTokenRecord | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // 2. Voucher Verification State ("التحقق من كود مكافأة أو خصم")
  const [voucherCode, setVoucherCode] = useState("");
  const [verifyingVoucher, setVerifyingVoucher] = useState(false);
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [voucherResult, setVoucherResult] = useState<VerifiedVoucher | null>(null);
  const [voucherFeedback, setVoucherFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 3. QR History Table State
  const [tokensHistory, setTokensHistory] = useState<QRTokenRecord[]>(initialTokens);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  // 1-second ticker for live 15-minute countdowns
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/staff/qr/generate");
      const data = await res.json();
      if (res.ok && data.tokens) {
        setTokensHistory(data.tokens);
      }
    } catch {
      // Ignore background poll errors
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const poll = setInterval(fetchHistory, 30000);
    return () => clearInterval(poll);
  }, [fetchHistory]);

  // 1-second interval to update countdown timers and flip expired PENDING codes to EXPIRED
  useEffect(() => {
    const timer = setInterval(() => {
      const current = Date.now();
      setNowMs(current);

      setTokensHistory((prev) =>
        prev.map((item) => {
          if (item.status === "PENDING" && new Date(item.expiresAt).getTime() <= current) {
            return { ...item, status: "EXPIRED" };
          }
          return item;
        }),
      );

      setQrData((prev) => {
        if (prev && prev.status === "PENDING" && new Date(prev.expiresAt).getTime() <= current) {
          return { ...prev, status: "EXPIRED" };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const handleCopyClaimLink = (url: string) => {
    copyToClipboard(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyRowLink = (tokenId: string, url: string) => {
    copyToClipboard(url);
    setCopiedRowId(tokenId);
    setTimeout(() => setCopiedRowId(null), 2000);
  };

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/staff/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "تعذر إنشاء كود النقاط");
      } else {
        setQrData(data);
        fetchHistory();
      }
    } catch {
      setError("تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleShowCodeAgain = (item: QRTokenRecord) => {
    setQrData(item);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Voucher Check & Redeem Handlers ---
  const handleCheckVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = voucherCode.trim().toUpperCase();
    if (!cleanCode) return;

    setVerifyingVoucher(true);
    setVoucherFeedback(null);
    setVoucherResult(null);

    try {
      const res = await fetch(`/api/staff/voucher/verify?code=${encodeURIComponent(cleanCode)}`);
      const data = await res.json();

      if (!res.ok) {
        setVoucherFeedback({
          type: "error",
          text: data.error || "كود القسيمة غير صحيح أو غير موجود",
        });
      } else {
        setVoucherResult(data.voucher);
      }
    } catch {
      setVoucherFeedback({
        type: "error",
        text: "تعذر التحقق من الكود، تأكد من الاتصال بالخادم",
      });
    } finally {
      setVerifyingVoucher(false);
    }
  };

  const handleMarkVoucherUsed = async () => {
    if (!voucherResult) return;

    setRedeemingVoucher(true);
    setVoucherFeedback(null);

    try {
      const res = await fetch("/api/staff/voucher/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: voucherResult.rewardCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setVoucherFeedback({
          type: "error",
          text: data.error || "تعذر تفعيل القسيمة",
        });
      } else {
        setVoucherResult({ ...voucherResult, status: "USED" });
        setVoucherFeedback({
          type: "success",
          text: data.message || "تم تأكيد استخدام القسيمة وتطبيق المكافأة للعميل بنجاح ✓",
        });
      }
    } catch {
      setVoucherFeedback({
        type: "error",
        text: "حدث خطأ أثناء تأكيد استخدام القسيمة",
      });
    } finally {
      setRedeemingVoucher(false);
    }
  };

  const activeQrRemaining = qrData ? getRemainingSeconds(qrData.expiresAt, nowMs) : 0;
  const isActiveQrExpired = qrData?.status === "EXPIRED" || (qrData?.status === "PENDING" && activeQrRemaining === 0);

  return (
    <div className="space-y-8">
      {/* Top Grid: 1. Generate QR Code (Right) + 2. Verify Reward Voucher (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ============================================================
            SECTION 1: Generate 15-Minute QR Code
            ============================================================ */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-6">
          <div className="border-b border-cream-200 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
                <i className="fa-solid fa-qrcode text-rosewarm-600" />
                <span>إصدار كود نقاط ولاء للعميل</span>
              </h2>
              <p className="text-xs text-espresso-800/70 mt-1">اختر عدد النقاط ليتم إنشاء كود QR ورابط مباشر صالح لمدة 15 دقيقة</p>
            </div>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
              <i className="fa-regular fa-clock" />
              <span>صالح لـ 15 دقيقة</span>
            </span>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold">{error}</div>
          )}

          <form onSubmit={handleGenerateQR} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-espresso-900 mb-2">اختيار سريع للنقاط حسب الطلب:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { pts: 15, desc: "باقة صغيرة" },
                  { pts: 25, desc: "باقة متوسطة" },
                  { pts: 50, desc: "باقة ملكية" },
                  { pts: 100, desc: "بوكس هدايا" },
                  { pts: 200, desc: "طلب مناسبة" },
                ].map((preset) => (
                  <button
                    key={preset.pts}
                    type="button"
                    onClick={() => setPoints(preset.pts)}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      points === preset.pts
                        ? "bg-espresso-900 text-gold-400 border-espresso-900 shadow-md"
                        : "bg-cream-50 hover:bg-rosewarm-100/50 text-espresso-900 border-cream-300"
                    }`}
                  >
                    <div className="text-sm sm:text-base font-extrabold">+{preset.pts} نقطة</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-6">
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">أو أدخل عدد النقاط يدوياً:</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  required
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full rounded-xl bg-cream-50 border border-cream-300 px-4 py-2.5 text-sm font-extrabold text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                >
                  <i className="fa-solid fa-qrcode" />
                  <span>{loading ? "جاري الإنشاء..." : "توليد كود النقاط الآن"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Active / Reopened QR Spotlight Card */}
          {qrData && (
            <div className="mt-6 bg-gradient-to-b from-espresso-900 to-espresso-800 text-cream-50 rounded-3xl p-5 sm:p-7 border-2 border-gold-500 shadow-2xl text-center space-y-4 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {qrData.status === "CLAIMED" ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-extrabold px-4 py-1.5 rounded-full">
                    <i className="fa-solid fa-circle-check" />
                    <span>تم تحصيل هذا الكود بنجاح ✓</span>
                  </span>
                ) : isActiveQrExpired ? (
                  <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs font-extrabold px-4 py-1.5 rounded-full">
                    <i className="fa-solid fa-clock-rotate-left" />
                    <span>منتهي الصلاحية (مضى أكثر من 15 دقيقة)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 bg-gold-500 text-espresso-900 text-xs font-extrabold px-4 py-1.5 rounded-full">
                    <i className="fa-solid fa-hourglass-half animate-pulse" />
                    <span>صالح للمسح — ينتهي خلال {formatCountdown(activeQrRemaining)} دقيقة</span>
                  </span>
                )}
              </div>

              <h3 className="font-serif text-3xl font-bold text-white">+{qrData.points} نقطة ولاء</h3>

              {qrData.qrDataUrl && !isActiveQrExpired && qrData.status === "PENDING" ? (
                <div className="bg-white p-4 rounded-3xl inline-block mx-auto shadow-lg border-4 border-gold-400">
                  <img src={qrData.qrDataUrl} alt="Customer Loyalty QR Code" className="w-48 h-48 sm:w-56 sm:h-56 object-contain mx-auto" />
                </div>
              ) : (
                <div className="max-w-sm mx-auto py-6 px-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-cream-200">
                  {qrData.status === "CLAIMED"
                    ? "تم مسح هذا الكود وإضافة النقاط لحساب العميل."
                    : "انتهت مهلة الـ 15 دقيقة لهذا الكود. يمكنك إنشاء كود جديد بالأعلى."}
                </div>
              )}

              {/* Direct Claim Link Copy Box */}
              <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md border border-gold-400/40 rounded-2xl p-3.5 text-right space-y-2">
                <div className="flex items-center justify-between text-[11px] text-gold-400 font-bold px-1">
                  <span>
                    <i className="fa-solid fa-link ml-1" />
                    رابط تحصيل النقاط المباشر (بديل المسح):
                  </span>
                  {copiedLink && <span className="text-emerald-400">تم نسخ الرابط ✓</span>}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={qrData.claimUrl}
                    dir="ltr"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-espresso-900/90 border border-white/15 rounded-xl px-3 py-2 text-xs text-cream-100 font-mono truncate focus:outline-none select-all"
                  />

                  <button
                    type="button"
                    disabled={isActiveQrExpired || qrData.status !== "PENDING"}
                    onClick={() => handleCopyClaimLink(qrData.claimUrl)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 ${
                      copiedLink ? "bg-emerald-600 text-white" : "bg-gold-500 hover:bg-gold-400 text-espresso-900"
                    }`}
                  >
                    <i className={`fa-solid ${copiedLink ? "fa-check" : "fa-copy"}`} />
                    <span>{copiedLink ? "تم النسخ!" : "نسخ الرابط"}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                {!isActiveQrExpired && qrData.status === "PENDING" && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `شكراً لتسوقك من متجر زهرة لينا 🌸!\nاضغط على الرابط التالي خلال 15 دقيقة لتحصيل (+${qrData.points} نقطة ولاء) في حسابك:\n${qrData.claimUrl}`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5"
                  >
                    <i className="fa-brands fa-whatsapp text-sm" />
                    <span>إرسال عبر واتساب</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setQrData(null)}
                  className="bg-rosewarm-600/80 hover:bg-rosewarm-600 text-white text-xs font-bold px-4 py-2 rounded-full transition cursor-pointer"
                >
                  إخفاء الكود
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            SECTION 2: التحقق من كود مكافأة أو خصم (Voucher Verification)
            ============================================================ */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-5">
          <div className="border-b border-cream-200 pb-4">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
              <i className="fa-solid fa-ticket text-gold-600" />
              <span>التحقق من كود مكافأة أو خصم</span>
            </h2>
            <p className="text-xs text-espresso-800/70 mt-1">
              أدخل كود القسيمة الذي يظهره العميل (مثل <code dir="ltr">FLW-XXXXXX</code>) للتحقق من صلاحيته وتفعيله
            </p>
          </div>

          <form onSubmit={handleCheckVoucher} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-espresso-900 mb-1.5">كود قسيمة العميل:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  placeholder="FLW-8A9B2C"
                  className="flex-1 rounded-xl bg-cream-50 border border-cream-300 px-4 py-2.5 text-sm font-mono font-extrabold uppercase tracking-wider text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={verifyingVoucher}
                  className="bg-espresso-900 hover:bg-rosewarm-600 text-cream-50 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <i className="fa-solid fa-magnifying-glass text-gold-400" />
                  <span>{verifyingVoucher ? "جاري الفحص..." : "فحص الكود"}</span>
                </button>
              </div>
            </div>
          </form>

          {voucherFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
                voucherFeedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}
            >
              <i
                className={`fa-solid ${
                  voucherFeedback.type === "success" ? "fa-circle-check text-emerald-600" : "fa-circle-exclamation text-rose-600"
                } text-base`}
              />
              <span>{voucherFeedback.text}</span>
            </div>
          )}

          {/* Verified Voucher Details Card */}
          {voucherResult && (
            <div
              className={`p-5 rounded-2xl border-2 space-y-4 ${
                voucherResult.status === "ACTIVE" ? "bg-gold-100/40 border-gold-400" : "bg-stone-100 border-stone-300 opacity-80"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  dir="ltr"
                  className="font-mono text-base font-extrabold bg-white px-3 py-1 rounded-xl border border-cream-300 text-espresso-900"
                >
                  {voucherResult.rewardCode}
                </span>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    voucherResult.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-rose-100 text-rose-800 border border-rose-200"
                  }`}
                >
                  {voucherResult.status === "ACTIVE" ? "صالح للاستخدام ✓" : "مستخدم مسبقاً ✗"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm">
                <p className="font-bold text-base text-rosewarm-600">
                  {voucherResult.rewardType === "FREE_BOUQUET"
                    ? "💐 مكافأة: باقة ورد طبيعي مجانية (500 نقطة)"
                    : `🏷️ مكافأة: خصم فوري بقيمة ${voucherResult.discountAmount} ر.س (100 نقطة)`}
                </p>
                <p className="text-espresso-800">
                  <strong>اسم العميل:</strong> {voucherResult.customerName}
                </p>
                <p className="text-espresso-800" dir="ltr">
                  <strong>الجوال / الحساب:</strong> {voucherResult.customerPhone}
                </p>
              </div>

              {voucherResult.status === "ACTIVE" && (
                <button
                  type="button"
                  disabled={redeemingVoucher}
                  onClick={handleMarkVoucherUsed}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                >
                  <i className="fa-solid fa-check-double" />
                  <span>{redeemingVoucher ? "جاري تأكيد الاستخدام..." : "تأكيد استخدام القسيمة وتطبيق الخصم الآن"}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          SECTION 3: Created QR Codes History Table
          ============================================================ */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 pb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-espresso-900 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-gold-600" />
              <span>سجل أكواد الـ QR الصادرة ({tokensHistory.length})</span>
            </h3>
            <p className="text-xs text-espresso-800/70 mt-0.5">
              اضغط على &quot;إظهار الكود والرابط&quot; لإعادة عرض أي كود أو نسخ رابطه المباشر
            </p>
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            className="bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 text-xs font-bold px-4 py-2 rounded-full transition flex items-center gap-1.5 cursor-pointer"
          >
            <i className={`fa-solid fa-rotate ${loadingHistory ? "animate-spin" : ""}`} />
            <span>تحديث السجل</span>
          </button>
        </div>

        {tokensHistory.length === 0 ? (
          <div className="py-12 text-center text-xs sm:text-sm text-espresso-800/60">لم يتم إصدار أي أكواد QR حتى الآن.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-espresso-800/70">
                  <th className="py-3 px-3">النقاط</th>
                  <th className="py-3 px-3">الموظف / العميل</th>
                  <th className="py-3 px-3">الحالة والوقت المتبقي</th>
                  <th className="py-3 px-3">وقت الإصدار</th>
                  <th className="py-3 px-3 text-left">إظهار الكود والرابط</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200/70">
                {tokensHistory.map((item) => {
                  const remaining = getRemainingSeconds(item.expiresAt, nowMs);
                  const effectiveStatus = item.status === "PENDING" && remaining === 0 ? "EXPIRED" : item.status;

                  return (
                    <tr
                      key={item.tokenId}
                      className={`transition ${effectiveStatus === "EXPIRED" ? "bg-stone-100/70 opacity-70" : "hover:bg-cream-50"}`}
                    >
                      <td className="py-3.5 px-3 font-extrabold text-rosewarm-600">+{item.points} نقطة</td>

                      <td className="py-3.5 px-3 text-espresso-800">
                        <span className="block text-xs">بواسطة: {item.createdByStaffName || "موظف الفرع"}</span>
                        {item.claimedByName && (
                          <span className="block text-[11px] text-emerald-700 font-bold mt-0.5">حصل عليها: {item.claimedByName}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {effectiveStatus === "CLAIMED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <i className="fa-solid fa-check" />
                            <span>تم التحصيل ✓</span>
                          </span>
                        ) : effectiveStatus === "EXPIRED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <i className="fa-regular fa-clock" />
                            <span>منتهي الصلاحية (Expired)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            <i className="fa-solid fa-hourglass-half text-amber-700" />
                            <span>متاح ({formatCountdown(remaining)})</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-xs text-espresso-800/70">
                        {new Date(item.createdAt).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="py-3.5 px-3 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleShowCodeAgain(item)}
                            className="bg-espresso-900 hover:bg-rosewarm-600 text-cream-50 text-[11px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <i className="fa-solid fa-qrcode text-gold-400" />
                            <span>إظهار الكود والرابط</span>
                          </button>

                          {effectiveStatus === "PENDING" && (
                            <button
                              type="button"
                              onClick={() => handleCopyRowLink(item.tokenId, item.claimUrl)}
                              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                                copiedRowId === item.tokenId
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-gold-100 hover:bg-gold-400 text-espresso-900 border-gold-400/60"
                              }`}
                            >
                              <i className={`fa-solid ${copiedRowId === item.tokenId ? "fa-check" : "fa-link"}`} />
                              <span>{copiedRowId === item.tokenId ? "نُسخ!" : "نسخ الرابط"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
