"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RecentToken {
  id: string;
  points_amount: number;
  status: "PENDING" | "CLAIMED" | "EXPIRED";
  created_at: string;
  claimed_by_name?: string | null;
}

interface VoucherDetails {
  id: number;
  rewardCode: string;
  rewardType: "DISCOUNT" | "FREE_BOUQUET";
  discountAmount: number;
  pointsSpent: number;
  status: "ACTIVE" | "USED";
  customerName: string;
  customerContact: string;
}

export default function StaffPOSClient({ recentTokens }: { recentTokens: RecentToken[] }) {
  const router = useRouter();

  // QR Generator State
  const [invoiceAmount, setInvoiceAmount] = useState<string>("");
  const [points, setPoints] = useState<number>(25);
  const [qrData, setQrData] = useState<{
    tokenId: string;
    qrDataUrl: string;
    claimUrl: string;
    points: number;
  } | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [qrError, setQrError] = useState("");

  // Voucher Verification State
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherResult, setVoucherResult] = useState<VoucherDetails | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [voucherSuccess, setVoucherSuccess] = useState("");
  const [loadingVoucher, setLoadingVoucher] = useState(false);

  // Calculate 10 points per 100 SAR (or 1 pt per 10 SAR) automatically
  const handleInvoiceChange = (val: string) => {
    setInvoiceAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setPoints(Math.max(5, Math.round(num * 0.2))); // Example: 200 SAR -> 40 pts
    }
  };

  const handleGenerateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    setQrError("");
    setLoadingQR(true);

    try {
      const res = await fetch("/api/staff/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: Number(points) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setQrError(data.error || "تعذر توليد كود الـ QR");
      } else {
        setQrData(data);
        router.refresh();
      }
    } catch {
      setQrError("تعذر الاتصال بالخادم");
    } finally {
      setLoadingQR(false);
    }
  };

  const handleVoucherAction = async (action: "CHECK" | "USE") => {
    setVoucherError("");
    setVoucherSuccess("");
    setLoadingVoucher(true);

    try {
      const res = await fetch("/api/staff/voucher/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardCode: voucherInput, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        setVoucherError(data.error || "كود غير صالح");
        if (action === "CHECK") setVoucherResult(null);
      } else {
        setVoucherResult(data.voucher);
        if (action === "USE") {
          setVoucherSuccess("تم تأكيد استخدام الكود بنجاح وتطبيقه للعميل! 🎉");
          router.refresh();
        }
      }
    } catch {
      setVoucherError("حدث خطأ في الشبكة");
    } finally {
      setLoadingVoucher(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Right Column (7 Cols): Generate Loyalty QR Code */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-cream-300 shadow-luxury p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-cream-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rosewarm-100 text-rosewarm-600 flex items-center justify-center text-xl">
                <i className="fa-solid fa-qrcode" />
              </div>
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900">إصدار كود نقاط الولاء (QR)</h2>
                <p className="text-xs text-espresso-800/70">يُمسح لمرة واحدة فقط بكاميرا جوال العميل وتُضاف النقاط فوراً لحسابه</p>
              </div>
            </div>
            <span className="hidden sm:inline-block bg-gold-100 text-espresso-900 border border-gold-400/50 text-xs font-bold px-3 py-1 rounded-full">
              صالح لمدة 15 دقيقة
            </span>
          </div>

          {qrError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-circle-exclamation" />
              <span>{qrError}</span>
            </div>
          )}

          <form onSubmit={handleGenerateQR} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Optional Invoice Calculator */}
              <div className="bg-cream-50 p-4 rounded-2xl border border-cream-300">
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">حاسبة سريعة: قيمة الفاتورة (ر.س)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    placeholder="مثال: 250 ر.س"
                    className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2.5 text-sm font-bold text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-espresso-800/60 font-bold">ر.س</span>
                </div>
                <p className="text-[11px] text-espresso-800/60 mt-1.5">تُحتسب تلقائياً (20% من قيمة الفاتورة كنقاط) أو عدّلها يدوياً</p>
              </div>

              {/* Points to Award */}
              <div className="bg-rosewarm-100/50 p-4 rounded-2xl border border-rosewarm-300/60">
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                  عدد النقاط الممنوحة للعميل <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    required
                    className="w-full rounded-xl bg-white border border-rosewarm-300 px-3.5 py-2.5 text-lg font-extrabold text-rosewarm-600 text-center focus:border-rosewarm-600 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-rosewarm-700 font-semibold mt-1.5 text-center">سيحصل العميل على +{points} نقطة في محفظته</p>
              </div>
            </div>

            {/* Quick Preset Point Pills */}
            <div>
              <span className="block text-xs font-bold text-espresso-800/80 mb-2">أو اختر نقاط سريعة حسب الباقة:</span>
              <div className="flex flex-wrap gap-2">
                {[15, 25, 50, 75, 100, 150].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setPoints(preset);
                      setInvoiceAmount("");
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                      points === preset
                        ? "bg-espresso-900 text-gold-400 border-espresso-900 shadow-sm"
                        : "bg-cream-100 hover:bg-cream-200 text-espresso-900 border-cream-300"
                    }`}
                  >
                    +{preset} نقطة
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingQR}
              className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-full shadow-luxury hover:shadow-luxury-hover transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loadingQR ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin" />
                  <span>جاري توليد الكود...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles text-gold-100" />
                  <span>توليد كود الـ QR للعميل الآن (+{points} نقطة)</span>
                </>
              )}
            </button>
          </form>

          {/* Generated QR Display Card */}
          {qrData && (
            <div className="mt-6 bg-gradient-to-b from-espresso-900 to-espresso-800 text-cream-50 rounded-3xl p-6 sm:p-8 border-2 border-gold-500 shadow-2xl text-center space-y-4 relative overflow-hidden">
              <div className="inline-flex items-center gap-2 bg-gold-500 text-espresso-900 text-xs font-extrabold px-4 py-1 rounded-full">
                <i className="fa-solid fa-sparkles" />
                <span>جاهز للمسح بكاميرا جوال العميل</span>
              </div>

              <h3 className="font-serif text-3xl font-bold text-white">+{qrData.points} نقطة ولاء</h3>

              <div className="bg-white p-4 rounded-3xl inline-block mx-auto shadow-lg border-4 border-gold-400">
                <img src={qrData.qrDataUrl} alt="Customer Loyalty QR Code" className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto" />
              </div>

              <p className="text-xs text-cream-200 max-w-sm mx-auto leading-relaxed">
                اطلب من العميل فتح كاميرا الجوال وتوجيهها نحو الكود لإضافة النقاط مباشرة إلى حسابه في <strong>زهرة لينا</strong>.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold px-4 py-2 rounded-full transition"
                >
                  <i className="fa-solid fa-print ml-1.5 text-gold-400" />
                  طباعة مع الفاتورة
                </button>
                <button
                  type="button"
                  onClick={() => setQrData(null)}
                  className="bg-rosewarm-600/80 hover:bg-rosewarm-600 text-white text-xs font-bold px-4 py-2 rounded-full transition"
                >
                  إغلاق الكود
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Left Column (5 Cols): Verify & Redeem Customer Voucher Code */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-cream-300 shadow-luxury p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-cream-200 pb-4">
            <div className="w-11 h-11 rounded-2xl bg-gold-100 text-gold-600 flex items-center justify-center text-xl border border-gold-400/40">
              <i className="fa-solid fa-ticket" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900">التحقق من كود مكافأة أو خصم</h2>
              <p className="text-xs text-espresso-800/70">أدخل الكود الذي يظهر في جوال العميل (مثال: FLW-8A9B2C)</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-espresso-900">كود القسيمة / المكافأة:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                placeholder="FLW-XXXXXX"
                dir="ltr"
                className="flex-1 text-center font-mono tracking-widest uppercase font-bold text-base rounded-2xl bg-cream-50 border border-cream-300 px-4 py-3 text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />
              <button
                type="button"
                disabled={loadingVoucher || !voucherInput.trim()}
                onClick={() => handleVoucherAction("CHECK")}
                className="bg-espresso-900 hover:bg-espresso-800 disabled:opacity-50 text-gold-400 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition cursor-pointer shrink-0"
              >
                {loadingVoucher ? "..." : "فحص الكود"}
              </button>
            </div>
          </div>

          {voucherError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-circle-xmark" />
              <span>{voucherError}</span>
            </div>
          )}

          {voucherSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-circle-check" />
              <span>{voucherSuccess}</span>
            </div>
          )}

          {/* Voucher Lookup Result Card */}
          {voucherResult && (
            <div className="p-5 rounded-2xl bg-cream-100 border border-cream-300 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-base bg-white px-3 py-1 rounded-xl border border-cream-300">
                  {voucherResult.rewardCode}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    voucherResult.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {voucherResult.status === "ACTIVE" ? "صالح للاستخدام ✓" : "مستخدم مسبقاً ✗"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm">
                <p className="font-bold text-espresso-900 text-base">
                  {voucherResult.rewardType === "FREE_BOUQUET"
                    ? "💐 مكافأة: باقة ورد مجانية (500 نقطة)"
                    : `🏷️ مكافأة: خصم ${voucherResult.discountAmount} ر.س (100 نقطة)`}
                </p>
                <p className="text-espresso-800/80">
                  <strong>اسم العميل:</strong> {voucherResult.customerName}
                </p>
                <p className="text-espresso-800/80">
                  <strong>الجوال/البريد:</strong> <span dir="ltr">{voucherResult.customerContact}</span>
                </p>
              </div>

              {voucherResult.status === "ACTIVE" && (
                <button
                  type="button"
                  disabled={loadingVoucher}
                  onClick={() => handleVoucherAction("USE")}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow transition text-xs sm:text-sm cursor-pointer"
                >
                  تأكيد تسليم المكافأة وتحويل الكود إلى (مستخدم)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Recent QR Codes Log */}
      <div className="bg-white rounded-3xl border border-cream-300 shadow-luxury p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-cream-200 pb-3">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-espresso-900 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-gold-600" />
            <span>آخر أكواد النقاط الصادرة من الفرع</span>
          </h3>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="text-xs font-bold text-rosewarm-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <i className="fa-solid fa-rotate" /> تحديث الحالة
          </button>
        </div>

        {recentTokens.length === 0 ? (
          <p className="text-xs text-espresso-800/60 text-center py-6">لم يتم إصدار أي أكواد QR حتى الآن.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-cream-200 text-espresso-800/70">
                  <th className="py-3 px-2">النقاط</th>
                  <th className="py-3 px-2">الحالة</th>
                  <th className="py-3 px-2">العميل المستفيد</th>
                  <th className="py-3 px-2">وقت الإصدار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200/70">
                {recentTokens.map((t) => (
                  <tr key={t.id} className="hover:bg-cream-50">
                    <td className="py-3 px-2 font-extrabold text-rosewarm-600">+{t.points_amount} نقطة</td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          t.status === "CLAIMED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.status === "CLAIMED" ? "تم المسح ✓" : "بانتظار المسح..."}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-semibold text-espresso-900">{t.claimed_by_name || "—"}</td>
                    <td className="py-3 px-2 text-xs text-espresso-800/60">
                      {new Date(t.created_at).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
