"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Category, Product, CartItem, STORE_WHATSAPP_NUMBER } from "@/constants/catalog";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";

interface ReviewItem {
  id: number;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const PACKAGING_COLORS = [
  { name: "نفس تنسيق الصورة", colorBg: "bg-gradient-to-tr from-rose-200 to-amber-100" },
  { name: "غلاف أسود ملكي فخم", colorBg: "bg-stone-900" },
  { name: "غلاف أبيض ناصع", colorBg: "bg-white border border-stone-300" },
  { name: "غلاف وردي ناعم", colorBg: "bg-rose-200" },
  { name: "غلاف ذهبي كلاسيكي", colorBg: "bg-amber-300" },
];

const CART_STORAGE_KEY = "zahrat_lina_cart_v1";

interface Props {
  product: Product;
  categories: Category[];
  similarProducts: Product[];
  initialReviews: ReviewItem[];
  averageRating: string;
}

export default function ProductDetailsClient({ product, categories, similarProducts, initialReviews, averageRating }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [packagingColor, setPackagingColor] = useState(PACKAGING_COLORS[0].name);
  const [giftMessage, setGiftMessage] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Cart & Header State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Reviews State
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const category = categories.find((c) => c.id === product.categoryId);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getFullImageUrl = (imgPath: string) => {
    if (!imgPath) return "";
    if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
      return imgPath;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
  };

  const handleAddToCart = () => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.giftMessage === giftMessage && item.packagingColor === packagingColor,
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [
        ...prev,
        {
          cartItemId: `${product.id}-${Date.now()}-${Math.random()}`,
          product,
          quantity,
          giftMessage,
          packagingColor,
        },
      ];
    });

    triggerToast(`تمت إضافة "${product.title}" إلى السلة بنجاح 🌸`);
  };

  const handleUpdateQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleWhatsAppOrder = () => {
    const fullImg = getFullImageUrl(product.image);
    const lines = [
      `مرحباً زهرة لينا 🌸، أود طلب الباقة التالية:`,
      `• *الاسم:* ${product.title}`,
      category ? `• *القسم:* ${category.name}` : null,
      `• *السعر:* ${product.price * quantity} ر.س (${quantity}×)`,
      `• *التغليف:* ${packagingColor}`,
      giftMessage ? `• *💌 عبارة الكرت:* "${giftMessage}"` : null,
      fullImg ? `• *🖼️ صورة الباقة:*\n${fullImg}` : null,
    ].filter(Boolean);

    window.open(`https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    setReviewMsg(null);

    try {
      const res = await fetch("/api/products/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: newRating,
          comment: newComment,
          authorName: authorName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewMsg({ type: "error", text: data.error || "تعذر إرسال التقييم" });
      } else {
        setReviewMsg({ type: "success", text: data.message });
        setNewComment("");
        setAuthorName("");
        // Refresh reviews list
        const revRes = await fetch(`/api/products/reviews?productId=${product.id}`);
        const revData = await revRes.json();
        if (revRes.ok && revData.reviews) {
          setReviews(revData.reviews);
        }
      }
    } catch {
      setReviewMsg({ type: "error", text: "حدث خطأ في الاتصال بالخادم" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const currentAvgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : averageRating;

  return (
    <div className="min-h-screen bg-cream-50 text-espresso-900 flex flex-col justify-between">
      <div>
        <TopBar />
        <Header
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim()) window.location.href = `/?search=${encodeURIComponent(q)}`;
          }}
          cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          onResetFilters={() => {}}
          session={null}
          userPoints={0}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
          {/* Main Product Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 bg-white rounded-3xl p-4 border border-cream-300 shadow-luxury overflow-hidden relative">
              <div className="aspect-square rounded-2xl overflow-hidden bg-cream-200 relative">
                <img src={getFullImageUrl(product.image)} alt={product.title} className="w-full h-full object-cover" />
                {category && (
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-espresso-900 text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm border border-cream-300">
                    {category.name}
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury">
              <div className="space-y-2 border-b border-cream-200 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {product.tags.map((tag, i) => (
                      <span key={i} className="text-[11px] bg-cream-100 text-espresso-800 px-3 py-1 rounded-md border border-cream-200">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full text-xs font-extrabold text-amber-900">
                    <i className="fa-solid fa-star text-amber-500" />
                    <span>{currentAvgRating}</span>
                    <span className="text-[10px] opacity-70">({reviews.length} تقييم)</span>
                  </div>
                </div>

                <h1 className="font-serif text-2xl sm:text-4xl font-bold text-espresso-900">{product.title}</h1>

                <div className="flex items-baseline gap-3 pt-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-rosewarm-600">
                    {product.price * quantity} <small className="text-sm">ر.س</small>
                  </span>
                  {quantity > 1 && <span className="text-xs text-espresso-800/60">({product.price} ر.س للقطعة)</span>}
                </div>
              </div>

              <p className="text-sm sm:text-base text-espresso-800/80 leading-relaxed">{product.description}</p>

              {/* Customization Options */}
              <div className="space-y-4 pt-2 border-t border-cream-200">
                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-2">🎨 لون وتنسيق الغلاف:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PACKAGING_COLORS.map((pkg) => (
                      <button
                        key={pkg.name}
                        type="button"
                        onClick={() => setPackagingColor(pkg.name)}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                          packagingColor === pkg.name
                            ? "border-rosewarm-500 bg-rosewarm-50/50 ring-2 ring-rosewarm-500/20"
                            : "border-cream-300 bg-cream-50 hover:bg-white"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full shrink-0 ${pkg.colorBg}`} />
                        <span className="truncate">{pkg.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-1.5">💌 عبارة كرت الإهداء (اختياري):</label>
                  <textarea
                    rows={2}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder="اكتب عبارة التهنئة التي ستوضع على كرت الباقة..."
                    className="w-full rounded-xl bg-cream-50 border border-cream-300 p-3 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-cream-100 rounded-xl px-3 py-2 border border-cream-300">
                    <span className="text-xs font-bold text-espresso-800">الكمية:</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="text-sm font-extrabold px-2 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-sm font-extrabold w-6 text-center">{quantity}</span>
                    <button type="button" onClick={() => setQuantity(quantity + 1)} className="text-sm font-extrabold px-2 cursor-pointer">
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 bg-espresso-900 hover:bg-rosewarm-600 text-cream-50 font-bold py-3.5 px-6 rounded-xl shadow-md transition text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-bag-shopping text-gold-400" />
                    <span>إضافة للسلة</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleWhatsAppOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <i className="fa-brands fa-whatsapp text-lg" />
                  <span>اطلبها مباشرة عبر واتساب</span>
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================
              CUSTOMER REVIEWS & RATINGS SECTION
              ============================================================ */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-cream-300 shadow-luxury space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cream-200 pb-5">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
                  <i className="fa-solid fa-comments text-rosewarm-600" />
                  <span>آراء وتقييمات العملاء ({reviews.length})</span>
                </h2>
                <p className="text-xs text-espresso-800/70 mt-1">شاركنا تجربتك مع هذه الباقة واكتب انطباعك</p>
              </div>

              <div className="flex items-center gap-2 bg-cream-100 border border-cream-300 px-4 py-2 rounded-2xl">
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`fa-solid fa-star text-sm ${
                        star <= Math.round(Number(currentAvgRating)) ? "text-amber-500" : "text-stone-300"
                      }`}
                    />
                  ))}
                </div>
                <strong className="text-sm font-extrabold text-espresso-900">{currentAvgRating} من 5</strong>
              </div>
            </div>

            {/* Submit Review Form */}
            <form onSubmit={handleSubmitReview} className="bg-cream-50/80 p-5 sm:p-6 rounded-2xl border border-cream-300 space-y-4">
              <h3 className="font-serif font-bold text-base text-espresso-900">أضف تقييمك للباقة 🌸</h3>

              {reviewMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-bold ${
                    reviewMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}
                >
                  {reviewMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-1.5">الاسم (اختياري):</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="مثال: سارة محمد"
                    className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-1.5">التقييم بالنجوم:</label>
                  <div className="flex items-center gap-2 pt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="text-xl sm:text-2xl cursor-pointer transition transform hover:scale-110"
                      >
                        <i className={`fa-solid fa-star ${star <= newRating ? "text-amber-500" : "text-stone-300"}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-espresso-800 mr-2">({newRating} / 5)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                  رأيك أو انطباعك عن الباقة: <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="كيف كانت جودة الزهور؟ هل وصلت في الوقت المناسب؟"
                  className="w-full rounded-xl bg-white border border-cream-300 p-3.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-espresso-900 hover:bg-rosewarm-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs sm:text-sm transition cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? "جاري الإرسال..." : "إرسال التقييم"}
                </button>
              </div>
            </form>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="text-center py-10 text-xs sm:text-sm text-espresso-800/60">
                لا توجد تقييمات لهذه الباقة حتى الآن. كن أول من يقيّمها! 🌸
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 sm:p-5 rounded-2xl border border-cream-200 bg-cream-50/40 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-espresso-900">{rev.authorName}</span>
                        <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i key={star} className={`fa-solid fa-star ${star <= rev.rating ? "text-amber-500" : "text-stone-300"}`} />
                          ))}
                        </div>
                      </div>

                      <span className="text-[11px] text-espresso-800/60">{new Date(rev.createdAt).toLocaleDateString("ar-SA")}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-espresso-800/90 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Similar Products Section */}
          {similarProducts.length > 0 && (
            <div className="space-y-6 pt-8 border-t border-cream-300">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 flex items-center gap-2">
                <i className="fa-solid fa-spa text-rosewarm-500" />
                <span>باقات مشابهة قد تعجبك</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {similarProducts.map((item) => (
                  <Link
                    key={item.id}
                    href={`/bouquet/${item.id}`}
                    className="group bg-white rounded-3xl border border-cream-300 overflow-hidden shadow-luxury hover:shadow-luxury-hover transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square overflow-hidden bg-cream-200">
                        <img
                          src={getFullImageUrl(item.image)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="font-serif font-bold text-base text-espresso-900 group-hover:text-rosewarm-600 transition line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-rosewarm-600 font-extrabold">{item.price} ر.س</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer id="footer" className="bg-espresso-900 text-cream-200 pt-12 pb-8 border-t-4 border-gold-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            © جميع الحقوق محفوظة لمتجر <strong>زهرة لينا للزهور والهدايا (Zahrat Lina)</strong> - جازان، حي السويس.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/rewards" className="text-gold-400 hover:underline">
              محفظة نقاط الولاء
            </Link>
            <Link href="/login" className="text-cream-100 hover:underline">
              حسابي
            </Link>
            <Link href="/admin/bouquets" className="text-gold-400 hover:underline">
              دخول الإدارة
            </Link>
          </div>
        </div>
      </footer>

      <CartDrawer
        categories={categories}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveCartItem}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-espresso-900 text-cream-50 px-5 py-3.5 rounded-2xl shadow-xl border border-gold-500/40 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-gold-500 text-espresso-900 flex items-center justify-center text-xs">
            <i className="fa-solid fa-check" />
          </div>
          <p className="text-xs sm:text-sm font-bold">{toast}</p>
        </div>
      )}
    </div>
  );
}
