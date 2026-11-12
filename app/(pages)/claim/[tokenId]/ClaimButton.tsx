"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClaimButton({ tokenId, points }: { tokenId: string; points: number }) {
  const router = useRouter();
  const hasTriggeredRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [claimed, setClaimed] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/points/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "تعذر إضافة النقاط، يرجى المحاولة مرة أخرى.");
      } else {
        setClaimed(true);
        setNewBalance(data.newBalance);
        router.refresh();
      }
    } catch {
      setError("تعذر الاتصال بالخادم، يرجى التأكد من الإنترنت والمحاولة مجدداً.");
    } finally {
      setLoading(false);
    }
  };

  // Automatically claim points as soon as the logged-in user lands on this page
  useEffect(() => {
    if (!hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      handleClaim();
    }
  }, []);

  if (loading) {
    return (
      <div className="py-6 space-y-3 text-center">
        <div className="w-12 h-12 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center mx-auto text-xl">
          <i className="fa-solid fa-spinner animate-spin" />
        </div>
        <p className="text-sm font-bold text-espresso-900">جاري إضافة +{points} نقطة إلى محفظتك تلقائياً...</p>
      </div>
    );
  }

  if (claimed) {
    return (
      <div className="space-y-5">
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-lg">
            <i className="fa-solid fa-check" />
          </div>
          <h3 className="font-serif text-xl font-bold text-emerald-900">مبروك! تمت إضافة +{points} نقطة بنجاح</h3>
          {newBalance !== null && (
            <p className="text-xs sm:text-sm text-emerald-800">
              رصيدك الحالي في زهرة لينا: <strong className="text-base font-extrabold underline">{newBalance} نقطة</strong>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/rewards"
            className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-3.5 px-5 rounded-full shadow-luxury transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <i className="fa-solid fa-gift text-gold-100" />
            <span>استبدال نقاطي بالمكافآت</span>
          </Link>

          <Link
            href="/"
            className="w-full bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 font-bold py-3.5 px-5 rounded-full transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
          >
            <span>تصفح باقات المتجر</span>
            <i className="fa-solid fa-arrow-left text-xs text-rosewarm-500" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-2 justify-center">
          <i className="fa-solid fa-circle-exclamation" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleClaim}
        className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-3.5 px-6 rounded-full shadow-luxury transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
      >
        <i className="fa-solid fa-wand-magic-sparkles text-gold-100" />
        <span>إعادة المحاولة لإضافة +{points} نقطة</span>
      </button>
    </div>
  );
}
