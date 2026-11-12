"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STORE_WHATSAPP_NUMBER } from "@/constants/catalog";

interface VoucherItem {
  id: number;
  rewardCode: string;
  pointsSpent: number;
  rewardType: "DISCOUNT" | "FREE_BOUQUET";
  discountAmount: number;
  status: "ACTIVE" | "USED";
  createdAt: string;
}

export default function RedeemActions({ currentPoints, vouchers }: { currentPoints: number; vouchers: VoucherItem[] }) {
  const router = useRouter();
  const [loadingType, setLoadingType] = useState<"DISCOUNT" | "FREE_BOUQUET" | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
    code?: string;
  } | null>(null);

  const handleRedeem = async (rewardType: "DISCOUNT" | "FREE_BOUQUET") => {
    setLoadingType(rewardType);
    setFeedback(null);

    try {
      const res = await fetch("/api/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", message: data.error || "تعذر استبدال النقاط" });
      } else {
        setFeedback({
          type: "success",
          message: `مبروك! تم إصدار قسيمة مكافأتك بنجاح. أظهر الكود لموظف المبيعات في الفرع أو أرسله عبر واتساب:`,
          code: data.rewardCode,
        });
        router.refresh();
      }
    } catch {
      setFeedback({ type: "error", message: "تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى." });
    } finally {
      setLoadingType(null);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Feedback Alert Banner */}
      {feedback && (
        <div
          className={`p-5 rounded-3xl border text-xs sm:text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
            feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-base ${
                feedback.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              }`}
            >
              <i className={`fa-solid ${feedback.type === "success" ? "fa-gift" : "fa-circle-exclamation"}`} />
            </div>
            <div>
              <p>{feedback.message}</p>
              {feedback.code && (
                <span className="inline-block mt-1 font-mono text-base font-extrabold bg-white px-3 py-1 rounded-xl border border-emerald-300 text-espresso-900">
                  {feedback.code}
                </span>
              )}
            </div>
          </div>

          <button type="button" onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100 self-end sm:self-center">
            <i className="fa-solid fa-xmark text-base" />
          </button>
        </div>
      )}

      {/* 1. Reward Tiers Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-rosewarm-600 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-6 h-[2px] bg-gold-500 inline-block" />
              استبدال النقاط الفوري
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 mt-1">اختر مكافأتك من زهرة لينا</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tier 1: 100 Points = 20 SAR Discount */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-cream-300 shadow-luxury hover:shadow-luxury-hover transition-all flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="bg-gold-100 text-espresso-900 border border-gold-400/50 text-xs font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                  <i className="fa-solid fa-coins text-gold-600" />
                  <span>التكلفة: 100 نقطة</span>
                </span>
                <div className="w-12 h-12 rounded-2xl bg-cream-100 text-gold-600 flex items-center justify-center text-xl border border-cream-300">
                  <i className="fa-solid fa-tags" />
                </div>
              </div>

              <h3 className="font-serif text-2xl font-bold text-espresso-900">قسيمة خصم 20 ريال سعودي</h3>
              <p className="text-xs sm:text-sm text-espresso-800/75 mt-2 leading-relaxed">
                احصل على كود خصم فوري بقيمة <strong>20 ر.س</strong> يمكنك استخدامه عند شراء أي باقة أو هدية من فرعنا في جازان أو عند الطلب
                عبر واتساب.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-cream-200">
              <button
                type="button"
                onClick={() => handleRedeem("DISCOUNT")}
                disabled={currentPoints < 100 || loadingType !== null}
                className="w-full bg-espresso-900 hover:bg-rosewarm-600 disabled:bg-cream-200 disabled:text-espresso-800/40 text-cream-50 font-bold py-3.5 px-6 rounded-full transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {loadingType === "DISCOUNT" ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin" />
                    <span>جاري إصدار القسيمة...</span>
                  </>
                ) : currentPoints < 100 ? (
                  <>
                    <i className="fa-solid fa-lock text-xs" />
                    <span>تحتاج إلى {100 - currentPoints} نقطة إضافية لفتح المكافأة</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-ticket text-gold-400" />
                    <span>استبدال 100 نقطة بخصم 20 ر.س الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tier 2: 500 Points = Free Signature Bouquet */}
          <div className="bg-gradient-to-br from-rosewarm-100/70 via-white to-gold-100/50 rounded-3xl p-6 sm:p-7 border-2 border-gold-400 shadow-luxury hover:shadow-luxury-hover transition-all flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="bg-rosewarm-500 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <i className="fa-solid fa-crown text-gold-100" />
                  <span>التكلفة: 500 نقطة</span>
                </span>
                <div className="w-12 h-12 rounded-2xl bg-rosewarm-100 text-rosewarm-600 flex items-center justify-center text-xl border border-rosewarm-300">
                  <i className="fa-solid fa-spa" />
                </div>
              </div>

              <h3 className="font-serif text-2xl font-bold text-espresso-900">باقة زهرة لينا الفاخرة مجاناً</h3>
              <p className="text-xs sm:text-sm text-espresso-800/80 mt-2 leading-relaxed">
                المكافأة الكبرى! استبدل <strong>500 نقطة</strong> بكود قسيمة يمنحك باقة ورد طبيعي مجانية بالكامل من تشكيلة المكافآت المختارة
                لدينا.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-rosewarm-300/40">
              <button
                type="button"
                onClick={() => handleRedeem("FREE_BOUQUET")}
                disabled={currentPoints < 500 || loadingType !== null}
                className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 disabled:bg-cream-200 disabled:text-espresso-800/40 text-white font-bold py-3.5 px-6 rounded-full shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:cursor-not-allowed"
              >
                {loadingType === "FREE_BOUQUET" ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin" />
                    <span>جاري إصدار قسيمة الباقة المجانية...</span>
                  </>
                ) : currentPoints < 500 ? (
                  <>
                    <i className="fa-solid fa-lock text-xs" />
                    <span>تحتاج إلى {500 - currentPoints} نقطة إضافية لفتح الباقة المجانية</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles text-gold-100" />
                    <span>استبدال 500 نقطة بباقة مجانية الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Customer's Active & Past Vouchers List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-rosewarm-600 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-6 h-[2px] bg-gold-500 inline-block" />
              سجل القسائم
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 mt-1">
              قسائم المكافآت الخاصة بك ({vouchers.length})
            </h2>
          </div>
        </div>

        {vouchers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-cream-300 p-10 text-center space-y-3 shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-cream-100 text-rosewarm-500 flex items-center justify-center mx-auto text-2xl border border-cream-300">
              <i className="fa-solid fa-ticket" />
            </div>
            <h3 className="font-serif text-xl font-bold text-espresso-900">لا توجد لديك قسائم مستبدلة حتى الآن</h3>
            <p className="text-xs sm:text-sm text-espresso-800/70 max-w-md mx-auto">
              عند وصول رصيدك إلى 100 نقطة، يمكنك استبدالها هنا ليظهر لك كود القسيمة الفوري لاستخدامه في المتجر أو عبر واتساب.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {vouchers.map((v) => {
              const isActive = v.status === "ACTIVE";
              const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                `مرحباً متجر زهرة لينا 🌸، أود استخدام كود قسيمة المكافأة الخاص بي:\n- الكود: ${v.rewardCode}\n- نوع المكافأة: ${
                  v.rewardType === "FREE_BOUQUET" ? "باقة ورد مجانية (500 نقطة)" : `خصم ${v.discountAmount} ر.س (100 نقطة)`
                }`,
              )}`;

              return (
                <div
                  key={v.id}
                  className={`rounded-3xl border p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                    isActive ? "bg-white border-gold-400 shadow-luxury" : "bg-cream-100/70 border-cream-300 opacity-75"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        dir="ltr"
                        className="font-mono text-lg sm:text-xl font-extrabold bg-cream-100 text-espresso-900 px-3.5 py-1 rounded-xl border border-cream-300 tracking-wider"
                      >
                        {v.rewardCode}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(v.rewardCode)}
                        className="text-xs bg-cream-200 hover:bg-gold-100 text-espresso-900 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <i className={`fa-regular ${copiedCode === v.rewardCode ? "fa-circle-check text-emerald-600" : "fa-copy"}`} />
                        <span>{copiedCode === v.rewardCode ? "تم النسخ!" : "نسخ الكود"}</span>
                      </button>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          isActive ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {isActive ? "فعال — جاهز للاستخدام ✓" : "تم الاستخدام ✗"}
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-espresso-900">
                      {v.rewardType === "FREE_BOUQUET"
                        ? "💐 قسيمة باقة ورد طبيعية مجانية"
                        : `🏷️ قسيمة خصم بقيمة ${v.discountAmount} ريال سعودي`}
                    </p>

                    <p className="text-xs text-espresso-800/60">
                      تم الاستبدال مقابل {v.pointsSpent} نقطة • بتاريخ {new Date(v.createdAt).toLocaleDateString("ar-SA")}
                    </p>
                  </div>

                  {isActive && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-5 py-3 rounded-full shadow-sm transition-all shrink-0"
                    >
                      <i className="fa-brands fa-whatsapp text-base" />
                      <span>استخدام القسيمة عبر واتساب</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
