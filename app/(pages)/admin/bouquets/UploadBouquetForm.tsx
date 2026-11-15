"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Category, Product } from "@/constants/catalog";

interface Props {
  categories: Category[];
  initialProducts: Product[];
}

export default function UploadBouquetForm({ categories, initialProducts }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Add New Bouquet Form State
  const [categoryId, setCategoryId] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [pointsPrice, setPointsPrice] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isFeatured, setIsFeatured] = useState(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 2. Edit Bouquet Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<number>(1);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editPointsPrice, setEditPointsPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editIsFeatured, setEditIsFeatured] = useState(true);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // 3. Filter & Feedback State
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggleActive = async (product: Product) => {
    const nextState = !(product.isActive ?? true);
    setTogglingId(product.id);
    setStatus(null);

    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, isActive: nextState }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", text: data.message });
        router.refresh();
      } else {
        setStatus({ type: "error", text: data.error || "تعذر تغيير الحالة" });
      }
    } catch {
      setStatus({ type: "error", text: "حدث خطأ في الشبكة أثناء تحديث الحالة" });
    } finally {
      setTogglingId(null);
    }
  };

  // --- Handlers for Add Form ---
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
        const catObj = categories.find((c) => c.id === categoryId);
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

  // --- Handlers for Edit Modal ---
  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditCategoryId(product.categoryId);
    setEditTitle(product.title);
    setEditPrice(String(product.price));
    setEditPointsPrice(product.pointsPrice ? String(product.pointsPrice) : "");
    setEditDescription(product.description || "");
    setEditTags(product.tags.join(", "));
    setEditIsFeatured(Boolean(product.featured));
    setEditImageFile(null);
    setEditImageUrl(product.image);
    setEditPreviewUrl(product.image);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditImageFile(file);
      setEditPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditUrlChange = (url: string) => {
    setEditImageUrl(url);
    if (url.trim()) {
      setEditImageFile(null);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      setEditPreviewUrl(url.trim());
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingEdit(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("id", String(editingProduct.id));
    formData.append("category_id", String(editCategoryId));
    formData.append("title", editTitle);
    formData.append("price", editPrice);
    if (editPointsPrice.trim()) {
      formData.append("points_price", editPointsPrice.trim());
    }
    formData.append("description", editDescription);
    formData.append("tags", editTags || "ورد طبيعي");
    formData.append("is_featured", String(editIsFeatured));

    if (editImageFile) {
      formData.append("image", editImageFile);
    } else {
      formData.append("image_url", editImageUrl);
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "تعذر حفظ التعديلات");
      } else {
        setStatus({ type: "success", text: data.message });
        setEditingProduct(null);
        router.refresh();
      }
    } catch {
      alert("تعذر الاتصال بالخادم أثناء التحديث");
    } finally {
      setSavingEdit(false);
    }
  };

  // --- Handler for Delete ---
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

  const filteredProducts = initialProducts.filter((p) => {
    const matchesCategory = filterCategory === "all" || p.categoryId === parseInt(filterCategory, 10);

    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCategory;

    const titleMatch = (p.title || "").toLowerCase().includes(q);
    const descMatch = (p.description || "").toLowerCase().includes(q);
    const tagsMatch = Array.isArray(p.tags) ? p.tags.some((t) => t.toLowerCase().includes(q)) : false;
    const priceMatch = String(p.price).includes(q);

    return matchesCategory && (titleMatch || descMatch || tagsMatch || priceMatch);
  });

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

      {/* Top Section: Add New Product */}
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
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      القسم {cat.id}: {cat.name}
                    </option>
                  ))}
                </select>
              </div>

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

      {/* Bottom Section: Manage Existing Products (List View + Search + Category Filter) */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-cream-300 shadow-luxury space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-cream-200 pb-4">
          <div>
            <h3 className="font-serif font-bold text-lg sm:text-xl text-espresso-900 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-gold-600" />
              <span>
                إدارة وتعديل الباقات الحالية ({filteredProducts.length} من {initialProducts.length})
              </span>
            </h3>
            <p className="text-xs text-espresso-800/70 mt-0.5">
              ابحث باسم الباقة أو الوسوم، أو قم بتعديل السعر والصورة وحالة التوفر مباشرة
            </p>
          </div>

          {/* Search Input + Category Dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم الباقة، الوصف، أو السعر..."
                className="w-full rounded-xl bg-cream-100 border border-cream-300 py-2 pr-9 pl-8 text-xs text-espresso-900 focus:border-rosewarm-500 focus:bg-white focus:outline-none transition"
              />
              <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-rosewarm-500 text-xs" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-espresso-800/50 hover:text-rose-600 text-xs cursor-pointer"
                  title="مسح البحث"
                >
                  <i className="fa-solid fa-circle-xmark" />
                </button>
              )}
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl bg-cream-100 border border-cream-300 px-3.5 py-2 text-xs font-bold text-espresso-900 focus:border-rosewarm-500 focus:outline-none cursor-pointer"
            >
              <option value="all">كل الأقسام ({initialProducts.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  القسم {cat.id}: {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-cream-50 rounded-2xl border border-cream-200 space-y-2">
            <i className="fa-solid fa-magnifying-glass text-2xl text-rosewarm-500" />
            <p className="text-xs sm:text-sm text-espresso-800/70 font-semibold">لا توجد باقات مطابقة لبحثك حالياً.</p>
            {(searchQuery || filterCategory !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategory("all");
                }}
                className="text-xs font-bold text-rosewarm-600 underline cursor-pointer"
              >
                إعادة ضبط الفلتر وعرض الكل
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-cream-200 border border-cream-300 rounded-2xl overflow-hidden bg-cream-50/40 max-h-[560px] overflow-y-auto">
            {filteredProducts.map((item) => {
              const cat = categories.find((c) => c.id === item.categoryId);
              const isItemActive = item.isActive ?? true;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:px-5 transition-colors ${
                    isItemActive ? "bg-white hover:bg-cream-50/90" : "bg-stone-100/80 opacity-75"
                  }`}
                >
                  {/* Right Side: Thumbnail + Category + Title + Description & Tags */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border border-cream-300 bg-cream-200 ${
                          !isItemActive ? "grayscale" : ""
                        }`}
                      />
                      {!isItemActive && (
                        <span className="absolute inset-0 bg-espresso-900/60 rounded-2xl flex items-center justify-center text-[10px] font-bold text-white">
                          مخفي
                        </span>
                      )}
                      {item.featured && isItemActive && (
                        <span
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold-500 text-espresso-900 flex items-center justify-center text-[10px] shadow"
                          title="باقة مميزة"
                        >
                          ⭐
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {cat && (
                          <span className="text-[10px] font-bold bg-rosewarm-100/80 text-rosewarm-700 px-2.5 py-0.5 rounded-full">
                            {cat.name}
                          </span>
                        )}
                        {item.pointsPrice && (
                          <span className="text-[10px] bg-gold-100 text-espresso-900 border border-gold-400/50 px-2 py-0.5 rounded-full font-bold">
                            🎁 مجاناً بـ {item.pointsPrice} نقطة
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm sm:text-base text-espresso-900 truncate">{item.title}</h4>

                      {item.description && <p className="text-xs text-espresso-800/70 line-clamp-1">{item.description}</p>}
                    </div>
                  </div>

                  {/* Left Side: Price + Availability Switch + Edit & Delete Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-cream-200 shrink-0">
                    {/* Price Display */}
                    <div className="text-right sm:text-left px-2">
                      <span className="text-[10px] text-espresso-800/60 block">السعر</span>
                      <span className="text-sm sm:text-base font-extrabold text-rosewarm-600 whitespace-nowrap">{item.price} ر.س</span>
                    </div>

                    {/* In-Stock / Out-of-Stock Toggle */}
                    <button
                      type="button"
                      disabled={togglingId === item.id}
                      onClick={() => handleToggleActive(item)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        isItemActive
                          ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300"
                          : "bg-stone-200 hover:bg-stone-300 text-stone-700 border-stone-300"
                      }`}
                      title={isItemActive ? "الباقة معروضة في المتجر — اضغط لإخفائها مؤقتاً" : "الباقة مخفية من المتجر — اضغط لإظهارها"}
                    >
                      <span className={`w-2 h-2 rounded-full ${isItemActive ? "bg-emerald-600" : "bg-stone-500"}`} />
                      <span>{togglingId === item.id ? "..." : isItemActive ? "متوفر ✓" : "مخفي"}</span>
                    </button>

                    {/* Edit & Delete Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="px-3 py-1.5 rounded-xl bg-gold-100 hover:bg-gold-500 text-espresso-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="تعديل بيانات وصورة الباقة"
                      >
                        <i className="fa-solid fa-pen-to-square text-xs" />
                        <span className="hidden md:inline">تعديل</span>
                      </button>

                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteProduct(item.id, item.title)}
                        className="w-8 h-8 rounded-xl bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                        title="حذف المنتج نهائياً"
                      >
                        <i className={`fa-solid ${deletingId === item.id ? "fa-spinner animate-spin" : "fa-trash-can"} text-xs`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================
          EDIT BOUQUET MODAL
          ========================================== */}
      {editingProduct && (
        <div
          onClick={() => setEditingProduct(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-espresso-900/70 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-cream-50 border-2 border-gold-400 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-espresso-900 text-cream-50 flex items-center justify-between border-b border-gold-500/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold-500 text-espresso-900 flex items-center justify-center font-bold">
                  <i className="fa-solid fa-pen-to-square" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold">تعديل بيانات الباقة</h3>
                  <p className="text-[11px] text-gold-400 truncate max-w-xs">{editingProduct.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full bg-espresso-800 hover:bg-rosewarm-500 text-white flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleUpdateSubmit} className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Right Column: Image Preview & Replacement */}
              <div className="md:col-span-5 space-y-3">
                <label className="block text-xs font-bold text-espresso-900">صورة الباقة الحالية (اضغط لتغييرها):</label>

                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="relative group cursor-pointer aspect-square rounded-2xl border-2 border-dashed border-gold-400 hover:border-rosewarm-500 bg-cream-100 overflow-hidden"
                >
                  {editPreviewUrl && <img src={editPreviewUrl} alt="معاينة التعديل" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-espresso-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-espresso-900 text-xs font-bold px-3.5 py-2 rounded-full shadow">
                      <i className="fa-solid fa-camera ml-1 text-rosewarm-600" />
                      رفع صورة جديدة
                    </span>
                  </div>
                </div>

                <input ref={editFileInputRef} type="file" accept="image/*" onChange={handleEditFileChange} className="hidden" />

                <div>
                  <label className="block text-[11px] font-semibold text-espresso-800/80 mb-1">أو رابط الصورة المباشر:</label>
                  <input
                    type="text"
                    value={editImageUrl}
                    onChange={(e) => handleEditUrlChange(e.target.value)}
                    dir="ltr"
                    className="w-full rounded-xl bg-white border border-cream-300 px-3 py-2 text-xs text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Left Column: Editable Fields */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-1">القسم:</label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(Number(e.target.value))}
                    className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-espresso-900 focus:border-rosewarm-500 focus:outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        القسم {cat.id}: {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-1">اسم الباقة:</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-espresso-900 mb-1">السعر (ر.س):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-rosewarm-600 focus:border-rosewarm-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-espresso-900 mb-1">نقاط الاستبدال المجاني (اختياري):</label>
                    <input
                      type="number"
                      min="1"
                      value={editPointsPrice}
                      onChange={(e) => setEditPointsPrice(e.target.value)}
                      placeholder="اتركه فارغاً لإلغائه"
                      className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-1">الوصف:</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full rounded-xl bg-white border border-cream-300 p-3 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-espresso-900 mb-1">الوسوم (مفصولة بفاصلة):</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2 text-xs text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editIsFeatured}
                    onChange={(e) => setEditIsFeatured(e.target.checked)}
                    className="w-4 h-4 accent-rosewarm-600 rounded"
                  />
                  <span className="text-xs font-bold text-espresso-900">تمييز الباقة بعلامة (⭐ مميز) في المقدمة</span>
                </label>

                <div className="pt-3 flex items-center gap-3 border-t border-cream-200">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-espresso-800 hover:bg-cream-200 transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="flex-1 bg-rosewarm-500 hover:bg-rosewarm-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-full shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                  >
                    {savingEdit ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin" />
                        <span>جاري حفظ التعديلات...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk" />
                        <span>حفظ التعديلات الآن</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
