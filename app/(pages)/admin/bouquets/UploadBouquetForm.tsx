"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, Product } from "@/constants/catalog";

interface Props {
  initialProducts: Product[];
}

export default function UploadBouquetForm({ initialProducts }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [categoryId, setCategoryId] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [pointsPrice, setPointsPrice] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isFeatured, setIsFeatured] = useState(true);

  // Image Upload / URL State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Filter & Feedback State
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setExternalUrl("");
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUrlChange = (url: string) => {
    setExternalUrl(url);
    if (url.trim()) {
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPreviewUrl(url.trim());
    } else {
      setPreviewUrl(null);
    }
  };

  const resetImageSelection = () => {
    setImageFile(null);
    setExternalUrl("");
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !externalUrl.trim()) {
      setStatus({
        type: "error",
        text: "يرجى رفع صورة للباقة من جهازك أو وضع رابط الصورة أولاً 📷",
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("category_id", String(categoryId));
    formData.append("title", title);
    formData.append("price", price);
    if (pointsPrice) formData.append("points_price", pointsPrice);
    formData.append("description", description || "تنسيق فاخر من متجر زهرة لينا بزهور طبيعية طازجة.");
    formData.append("tags", tags || "تنسيق خاص, ورد طبيعي");
    formData.append("is_featured", String(isFeatured));

    if (imageFile) {
      formData.append("image", imageFile);
    } else if (externalUrl.trim()) {
      formData.append("image_url", externalUrl.trim());
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", text: data.error || "حدث خطأ أثناء النشر" });
      } else {
        const catObj = CATEGORIES.find((c) => c.id === categoryId);
        setStatus({
          type: "success",
          text: `تمت إضافة "${title}" بنجاح إلى (${catObj ? catObj.name : ""}) 🌸`,
        });
        setTitle("");
        setPrice("");
        setPointsPrice("");
        setDescription("");
        setTags("");
        setIsFeatured(true);
        resetImageSelection();
        router.refresh();
      }
    } catch {
      setStatus({ type: "error", text: "تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number, productTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${productTitle}" من المتجر؟`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStatus({ type: "success", text: `تم حذف "${productTitle}" من قاعدة البيانات` });
        router.refresh();
      } else {
        const data = await res.json();
        setStatus({ type: "error", text: data.error || "تعذر الحذف" });
      }
    } catch {
      setStatus({ type: "error", text: "حدث خطأ في الشبكة أثناء الحذف" });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts =
    filterCategory === "all" ? initialProducts : initialProducts.filter((p) => p.categoryId === parseInt(filterCategory, 10));

  return (
    <div className="space-y-8">
      {/* Status Toast Banner */}
      {status && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-sm ${
            status.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <i
              className={`fa-solid ${
                status.type === "success" ? "fa-circle-check text-emerald-600" : "fa-circle-exclamation text-rose-600"
              } text-base`}
            />
            <span>{status.text}</span>
          </div>
          <button type="button" onClick={() => setStatus(null)} className="text-xs opacity-60 hover:opacity-100">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Top Section: Add New Product & Image to Any of the 10 Categories */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-cream-300 shadow-luxury space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-200 pb-4">
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-espresso-900 flex items-center gap-2.5">
            <i className="fa-solid fa-circle-plus text-rosewarm-500" />
            <span>إضافة صورة باقة / منتج جديد إلى الأقسام العشرة</span>
          </h2>
          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-3.5 py-1 rounded-full border border-emerald-200">
            <i className="fa-solid fa-database ml-1" /> يُحفظ مباشرة في قاعدة بيانات MySQL
          </span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Right Column: Image Dropzone / Preview */}
          <div className="md:col-span-5 space-y-3">
            <label className="block text-xs font-bold text-espresso-900">
              1. اختر صورة الباقة (من الجوال/الكمبيوتر أو رابط): <span className="text-rose-600">*</span>
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer aspect-square rounded-2xl border-2 border-dashed border-rosewarm-300 hover:border-rosewarm-500 bg-cream-100/70 overflow-hidden flex flex-col items-center justify-center text-center p-4 transition-all"
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="معاينة الباقة" className="absolute inset-0 w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="absolute bottom-3 right-3 bg-espresso-900/85 hover:bg-rosewarm-600 text-white text-xs px-3.5 py-1.5 rounded-full backdrop-blur-sm transition-colors"
                  >
                    <i className="fa-solid fa-rotate ml-1" /> تغيير الصورة
                  </button>
                </>
              ) : (
                <div className="space-y-2.5">
                  <div className="w-14 h-14 rounded-full bg-rosewarm-100 text-rosewarm-600 flex items-center justify-center mx-auto text-2xl group-hover:scale-110 transition-transform">
                    <i className="fa-solid fa-cloud-arrow-up" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-espresso-900">اضغط هنا لرفع صورة من جوالك أو جهازك</p>
                  <p className="text-[11px] text-espresso-800/60">يدعم صور الكاميرا والاستوديو (JPG, PNG, WEBP)</p>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            <div>
              <label className="block text-[11px] font-semibold text-espresso-800/80 mb-1">أو الصق رابط صورة مباشر (اختياري):</label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/flower.jpg"
                dir="ltr"
                className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3 py-2 text-xs text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Left Column: Category & Product Details */}
          <div className="md:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Category (1 to 10) */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                  2. اختر القسم المطلوب (من الأقسام العشرة): <span className="text-rose-600">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  required
                  className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-espresso-900 focus:border-rosewarm-500 focus:outline-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      القسم {cat.id}: {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                  3. اسم الباقة أو المنتج: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="مثال: باقة جوري ملكي فاخر"
                  className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                />
              </div>

              {/* Price (SAR) */}
              <div>
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                  4. السعر (بالريال السعودي): <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  placeholder="مثال: 220"
                  className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                />
              </div>

              {/* Points Price (Optional Loyalty Redemption) */}
              <div>
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">نقاط الاستبدال المجاني (اختياري):</label>
                <input
                  type="number"
                  min="1"
                  value={pointsPrice}
                  onChange={(e) => setPointsPrice(e.target.value)}
                  placeholder="مثال: 500 نقطة"
                  className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-espresso-900 mb-1.5">5. وصف الباقة ومحتوياتها:</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: تنسيق مميز من الورد الجوري الطبيعي مع تغليف مخملي وكرت إهداء..."
                className="w-full rounded-xl bg-cream-50 border border-cream-300 p-3 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />
            </div>

            {/* Tags & Featured Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-espresso-900 mb-1.5">وسوم سريعة (مفصولة بفاصلة):</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="جوري طبيعي, تغليف فاخر, جديد"
                  className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3.5 py-2 text-xs text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer pt-4">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-rosewarm-600 rounded"
                />
                <span className="text-xs font-bold text-espresso-900">تمييز الباقة بعلامة (⭐ مميز) في المقدمة</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-full shadow-luxury hover:shadow-luxury-hover transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin" />
                    <span>جاري النشر والحفظ...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up" />
                    <span>نشر الصورة والمنتج في القسم المحدد الآن</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom Section: Manage Existing Products in MySQL */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-cream-300 shadow-luxury space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-espresso-900 flex items-center gap-2">
              <i className="fa-solid fa-images text-gold-600" />
              <span>إدارة الصور والمنتجات الحالية ({initialProducts.length})</span>
            </h3>
            <p className="text-xs text-espresso-800/70 mt-0.5">يمكنك فلترة القسم أو حذف أي منتج بضغطة زر</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl bg-cream-100 border border-cream-300 px-3.5 py-2 text-xs font-bold text-espresso-900 focus:outline-none cursor-pointer"
            >
              <option value="all">عرض كل الأقسام (1 - 10)</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  القسم {cat.id}: {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-cream-50 rounded-2xl border border-cream-200">
            <i className="fa-solid fa-spa text-2xl text-rosewarm-500 mb-2" />
            <p className="text-xs sm:text-sm text-espresso-800/70 font-semibold">لا توجد منتجات مضافة في هذا القسم حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[420px] overflow-y-auto p-1">
            {filteredProducts.map((item) => {
              const cat = CATEGORIES.find((c) => c.id === item.categoryId);
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-cream-300 bg-cream-50 hover:bg-white transition-colors shadow-2xs"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-cream-300 bg-cream-200"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-rosewarm-600 block truncate">
                      {cat ? `القسم ${cat.id}: ${cat.name}` : ""}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-espresso-900 truncate mt-0.5">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-extrabold text-espresso-900">{item.price} ر.س</span>
                      {item.pointsPrice && (
                        <span className="text-[10px] bg-gold-100 text-espresso-900 border border-gold-400/50 px-2 py-0.5 rounded-full font-bold">
                          {item.pointsPrice} نقطة
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => handleDeleteProduct(item.id, item.title)}
                    className="w-9 h-9 rounded-xl bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    title="حذف المنتج"
                  >
                    <i className={`fa-solid ${deletingId === item.id ? "fa-spinner animate-spin" : "fa-trash-can"} text-xs`} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
