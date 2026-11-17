"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface AdminReviewItem {
  id: number;
  productId: number;
  userId: number | null;
  authorName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  productTitle: string;
  reviewStrikes: number;
}

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedProductId, setSelectedProductId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      if (res.ok && data.reviews) {
        setReviews(data.reviews);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleApproval = async (reviewId: number, currentStatus: boolean) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, isApproved: !currentStatus }),
    });
    if (res.ok) {
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, isApproved: !currentStatus } : r)));
      showToast("تم تحديث حالة العرض في المتجر بنجاح ✓");
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا التقييم نهائياً؟")) return;
    const res = await fetch(`/api/admin/reviews?id=${reviewId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast("تم حذف التقييم");
    }
  };

  const handleResetStrikes = async (userId: number | null, authorName: string) => {
    if (!userId) {
      alert("هذا التقييم أُرسل بواسطة زائر غير مسجل.");
      return;
    }
    if (!confirm(`هل تريد تصفير الإنذارات وفك الحظر عن المستخدم (${authorName})؟`)) return;

    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, resetStrikes: true }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      fetchReviews();
    } else {
      alert(data.error || "تعذر تصفير الإنذارات");
    }
  };

  // Extract unique products for the product filter dropdown
  const uniqueProducts = Array.from(new Map(reviews.map((r) => [r.productId, r.productTitle])).entries()).map(([id, title]) => ({
    id,
    title,
  }));

  const filteredReviews = reviews.filter((r) => {
    const matchesStatus =
      filterStatus === "ALL" || (filterStatus === "PENDING" && !r.isApproved) || (filterStatus === "APPROVED" && r.isApproved);

    const matchesProduct = selectedProductId === "ALL" || r.productId === Number(selectedProductId);

    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || r.authorName.toLowerCase().includes(q) || r.productTitle.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q);

    return matchesStatus && matchesProduct && matchesSearch;
  });

  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div dir="rtl" className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-6">
      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-600" />
            <span>{feedback}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-xs opacity-60 hover:opacity-100 cursor-pointer">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-200 pb-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
            <i className="fa-solid fa-star text-amber-500" />
            <span>إدارة ومراجعة تقييمات العملاء ({filteredReviews.length})</span>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full border border-amber-300">
                {pendingCount} بانتظار الموافقة
              </span>
            )}
          </h2>
          <p className="text-xs text-espresso-800/70 mt-1">فلترة التقييمات حسب الباقة أو الحالة، وعرض صفحة المنتج مباشرة</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Product Filter Dropdown */}
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="rounded-full bg-cream-100 border border-cream-300 py-2 px-3.5 text-xs font-bold text-espresso-900 cursor-pointer max-w-[180px] truncate"
          >
            <option value="ALL">كل الباقات ({reviews.length})</option>
            {uniqueProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-full bg-cream-100 border border-cream-300 py-2 px-3.5 text-xs font-bold text-espresso-900 cursor-pointer"
          >
            <option value="ALL">كل الحالات</option>
            <option value="PENDING">معلقة للمراجعة 🔔</option>
            <option value="APPROVED">منشورة في المتجر ✓</option>
          </select>

          {/* Search Input */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم العميل أو التعليق..."
            className="rounded-full bg-cream-100 border border-cream-300 py-2 px-4 text-xs text-espresso-900 focus:border-rosewarm-500 focus:outline-none w-48"
          />

          <button
            type="button"
            onClick={fetchReviews}
            className="bg-cream-100 hover:bg-cream-200 text-espresso-900 border border-cream-300 text-xs font-bold px-3.5 py-2 rounded-full transition flex items-center gap-1.5 cursor-pointer"
          >
            <i className={`fa-solid fa-rotate ${loading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-12 text-center text-sm font-bold text-espresso-800/60">جاري تحميل التقييمات...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-12 text-center text-sm text-espresso-800/60">لا توجد تقييمات مطابقة للفلاتر الحالية.</div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`p-5 rounded-2xl border transition space-y-3 shadow-2xs ${
                rev.isApproved ? "bg-white border-cream-300" : "bg-amber-50/50 border-amber-200"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-espresso-900 text-gold-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {rev.rating} ★
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-espresso-900">{rev.authorName}</h4>
                      {/* View Product Button */}
                      <Link
                        href={`/bouquet/${rev.productId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] bg-cream-200 hover:bg-gold-200 text-espresso-900 font-bold px-2.5 py-0.5 rounded-md transition"
                        title="عرض صفحة الباقة في نافذة جديدة"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" />
                        <span>{rev.productTitle}</span>
                      </Link>
                    </div>
                    <span className="text-[11px] text-espresso-800/60">
                      {new Date(rev.createdAt).toLocaleString("ar-SA")}
                      {rev.reviewStrikes > 0 && (
                        <span className="text-rose-600 font-bold mr-2">({rev.reviewStrikes} إنذارات تعليقات مسيئة)</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                      rev.isApproved ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-900 border-amber-300"
                    }`}
                  >
                    {rev.isApproved ? "منشور ✓" : "معلق 🔔"}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleApproval(rev.id, rev.isApproved)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      rev.isApproved ? "bg-amber-100 hover:bg-amber-200 text-amber-900" : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {rev.isApproved ? "إلغاء النشر" : "نشر التقييم"}
                  </button>

                  {rev.reviewStrikes > 0 && rev.userId && (
                    <button
                      type="button"
                      onClick={() => handleResetStrikes(rev.userId, rev.authorName)}
                      className="bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                      title="تصفير الإنذارات وفك الحظر"
                    >
                      تصفير الإنذارات
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="w-8 h-8 rounded-xl bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                    title="حذف التقييم"
                  >
                    <i className="fa-solid fa-trash-can text-xs" />
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-espresso-800/90 leading-relaxed bg-cream-50 p-3.5 rounded-xl border border-cream-200">
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
