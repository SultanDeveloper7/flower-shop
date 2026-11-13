"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category, Product } from "@/constants/catalog";

// Expanded 28-icon collection tailored for flowers, occasions, and luxury gifts
export const ICON_OPTIONS = [
  { label: "وردة لوتس / سبا", value: "fa-solid fa-spa" },
  { label: "قلب (حب ورومانسية)", value: "fa-solid fa-heart" },
  { label: "نبتة / زهور طبيعية", value: "fa-solid fa-seedling" },
  { label: "ورقة شجر (طبيعة)", value: "fa-solid fa-leaf" },
  { label: "حمامة (اعتذار / سلام)", value: "fa-solid fa-dove" },
  { label: "شمس (إشراقة / صباح)", value: "fa-solid fa-sun" },
  { label: "كيكة (عيد ميلاد)", value: "fa-solid fa-cake-candles" },
  { label: "قبعة (تخرج ونجاح)", value: "fa-solid fa-graduation-cap" },
  { label: "قلب باليد (سلامة وعافية)", value: "fa-solid fa-hand-holding-heart" },
  { label: "عربة طفل (مواليد)", value: "fa-solid fa-baby-carriage" },
  { label: "طفل رضيع (استقبال مولود)", value: "fa-solid fa-baby" },
  { label: "عصا سحرية (باقات الهبة)", value: "fa-solid fa-wand-magic-sparkles" },
  { label: "شعلة (ترند الموسم)", value: "fa-solid fa-fire-flame-curved" },
  { label: "جوهرة (ماركات وفخامة)", value: "fa-solid fa-gem" },
  { label: "تاج ملكي (باقات ملكية)", value: "fa-solid fa-crown" },
  { label: "صندوق هدية", value: "fa-solid fa-gift" },
  { label: "هدايا متعددة", value: "fa-solid fa-gifts" },
  { label: "حقيبة تسوق / أكياس هدايا", value: "fa-solid fa-bag-shopping" },
  { label: "خاتم (خطوبة / زواج)", value: "fa-solid fa-ring" },
  { label: "كأس احتفال (مناسبات سعيدة)", value: "fa-solid fa-champagne-glasses" },
  { label: "نجمة متألقة (مميز)", value: "fa-solid fa-star" },
  { label: "قمر وهلال (رمضان / أعياد)", value: "fa-solid fa-moon" },
  { label: "شريطة / وسام", value: "fa-solid fa-ribbon" },
  { label: "رسالة إهداء بقلب", value: "fa-solid fa-envelope-open-text" },
  { label: "ريشة كتابة (كرت إهداء)", value: "fa-solid fa-feather-pointed" },
  { label: "فراشة / تنسيق ربيعي", value: "fa-solid fa-bugs" },
  { label: "قهوة وورد (صباحيات)", value: "fa-solid fa-mug-hot" },
  { label: "منزل (تبطين وتنسيق منزلي)", value: "fa-solid fa-house-chimney-heart" },
];

interface Props {
  initialCategories: Category[];
  products: Product[];
  onCategoriesChange: (updated: Category[]) => void;
}

export default function CategoriesManager({ initialCategories, products, onCategoriesChange }: Props) {
  const router = useRouter();

  // Add Category Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(ICON_OPTIONS[0].value);
  const [badge, setBadge] = useState("قسم مميز");
  const [sortOrder, setSortOrder] = useState<number>(initialCategories.length + 1);
  const [loading, setLoading] = useState(false);

  // Edit Category Modal State
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editSortOrder, setEditSortOrder] = useState<number>(1);
  const [savingEdit, setSavingEdit] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedIconObj = ICON_OPTIONS.find((opt) => opt.value === icon) || ICON_OPTIONS[0];
  const selectedEditIconObj = ICON_OPTIONS.find((opt) => opt.value === editIcon) || ICON_OPTIONS[0];

  const refreshCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (res.ok && data.categories) {
      onCategoriesChange(data.categories);
      router.refresh();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, icon, badge, sortOrder }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedback({ type: "error", text: data.error || "تعذر إضافة القسم" });
      } else {
        setFeedback({ type: "success", text: data.message });
        setName("");
        setDescription("");
        setBadge("قسم مميز");
        setSortOrder(initialCategories.length + 2);
        await refreshCategories();
      }
    } catch {
      setFeedback({ type: "error", text: "تعذر الاتصال بالخادم" });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
    setEditIcon(cat.icon || ICON_OPTIONS[0].value);
    setEditBadge(cat.badge || "قسم مميز");
    setEditSortOrder(cat.sortOrder || cat.id);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;

    setSavingEdit(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCat.id,
          name: editName,
          description: editDescription,
          icon: editIcon,
          badge: editBadge,
          sortOrder: editSortOrder,
          isActive: editingCat.isActive ?? true,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "تعذر حفظ التعديلات");
      } else {
        setFeedback({ type: "success", text: data.message });
        setEditingCat(null);
        await refreshCategories();
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`هل أنت متأكد من حذف قسم "${cat.name}"؟`)) return;

    setFeedback(null);
    const res = await fetch(`/api/admin/categories?id=${cat.id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok) {
      setFeedback({ type: "error", text: data.error || "تعذر حذف القسم" });
    } else {
      setFeedback({ type: "success", text: data.message });
      await refreshCategories();
    }
  };

  return (
    <div className="space-y-8">
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-between ${
            feedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-xs opacity-70">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* 1. Add New Section Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-6">
        <div className="border-b border-cream-200 pb-4">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900 flex items-center gap-2">
            <i className="fa-solid fa-folder-plus text-rosewarm-500" />
            <span>إضافة قسم باقات جديد للمتجر</span>
          </h2>
          <p className="text-xs text-espresso-800/70 mt-1">يظهر القسم الجديد فوراً في الصفحة الرئيسية وشريط التصفح وقائمة رفع الباقات</p>
        </div>

        <form onSubmit={handleAddCategory} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-espresso-900 mb-1.5">
                اسم القسم (مثال: باقات خطوبة / باقات عيد): <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: باقات خطوبة وعقد قران"
                className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-espresso-900 mb-1.5">شارة مصغرة:</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="مثال: الأكثر طلباً"
                className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3 py-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-espresso-900 mb-1.5">ترتيب الظهور:</label>
              <input
                type="number"
                min="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3 py-2.5 text-xs sm:text-sm font-bold text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Visual Icon Grid Selector with Live Preview */}
          <div className="bg-cream-50 p-4 rounded-2xl border border-cream-300 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-espresso-900">اختر أيقونة القسم (اضغط على الأيقونة لمعاينتها):</label>

              {/* Live Selected Icon Preview Pill */}
              <div className="inline-flex items-center gap-2 bg-white border border-gold-400 px-3.5 py-1.5 rounded-full shadow-2xs">
                <div className="w-7 h-7 rounded-lg bg-rosewarm-500 text-white flex items-center justify-center text-sm">
                  <i className={icon} />
                </div>
                <span className="text-xs font-extrabold text-espresso-900">الأيقونة المختارة: {selectedIconObj.label}</span>
              </div>
            </div>

            {/* Grid of Clickable Icons */}
            <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-7 gap-2 max-h-48 overflow-y-auto p-1">
              {ICON_OPTIONS.map((opt) => {
                const isSelected = icon === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIcon(opt.value)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                      isSelected
                        ? "bg-espresso-900 text-gold-400 border-espresso-900 shadow-md scale-[1.03]"
                        : "bg-white hover:bg-rosewarm-100/60 text-espresso-800 border-cream-300"
                    }`}
                  >
                    <i className={`${opt.value} text-lg ${isSelected ? "text-gold-400" : "text-rosewarm-600"}`} />
                    <span className="text-[10px] font-bold leading-tight line-clamp-1">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-9">
              <label className="block text-xs font-bold text-espresso-900 mb-1.5">وصف قصير للقسم:</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: تنسيقات فاخرة مخصصة لمناسبات الخطوبة والملكة..."
                className="w-full rounded-xl bg-cream-50 border border-cream-300 px-3.5 py-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
              >
                <i className={icon} />
                <span>{loading ? "جاري الإضافة..." : "إضافة القسم"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. Existing Sections List */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-luxury space-y-5">
        <h3 className="font-serif text-lg sm:text-xl font-bold text-espresso-900 flex items-center gap-2">
          <i className="fa-solid fa-layer-group text-gold-600" />
          <span>الأقسام الحالية في المتجر ({initialCategories.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {initialCategories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl border border-cream-300 bg-cream-50 hover:bg-white transition flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-rosewarm-100 text-rosewarm-600 flex items-center justify-center text-lg shrink-0 border border-rosewarm-300/60">
                    <i className={cat.icon || "fa-solid fa-spa"} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold bg-espresso-900 text-gold-400 px-2 py-0.5 rounded-md">
                        #{cat.sortOrder || cat.id}
                      </span>
                      <h4 className="font-bold text-sm sm:text-base text-espresso-900">{cat.name}</h4>
                      {cat.badge && (
                        <span className="text-[10px] bg-gold-100 text-espresso-900 border border-gold-400/50 px-2 py-0.5 rounded-full font-bold">
                          {cat.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-espresso-800/70 mt-1 leading-relaxed">{cat.description}</p>
                    <span className="inline-block mt-1.5 text-[11px] font-bold text-rosewarm-600">يحتوي على ({count}) باقة</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="w-8 h-8 rounded-xl bg-gold-100 hover:bg-gold-500 text-espresso-900 flex items-center justify-center transition cursor-pointer"
                    title="تعديل القسم"
                  >
                    <i className="fa-solid fa-pen-to-square text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="w-8 h-8 rounded-xl bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white flex items-center justify-center transition cursor-pointer"
                    title="حذف القسم"
                  >
                    <i className="fa-solid fa-trash-can text-xs" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Edit Category Modal with Visual Icon Picker */}
      {editingCat && (
        <div
          onClick={() => setEditingCat(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-cream-50 border-2 border-gold-400 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="px-6 py-4 bg-espresso-900 text-cream-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gold-500 text-espresso-900 flex items-center justify-center text-base">
                  <i className={editIcon} />
                </div>
                <h3 className="font-serif text-lg font-bold">تعديل القسم: {editingCat.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCat(null)}
                className="w-8 h-8 rounded-full bg-espresso-800 hover:bg-rosewarm-500 text-white flex items-center justify-center cursor-pointer"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-espresso-900 mb-1">اسم القسم:</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl bg-white border border-cream-300 px-3.5 py-2 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-espresso-900 mb-1">الشارة:</label>
                  <input
                    type="text"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    className="w-full rounded-xl bg-white border border-cream-300 px-3 py-2 text-xs text-espresso-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-espresso-900 mb-1">الترتيب:</label>
                  <input
                    type="number"
                    min="1"
                    value={editSortOrder}
                    onChange={(e) => setEditSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl bg-white border border-cream-300 px-3 py-2 text-xs font-bold text-espresso-900"
                  />
                </div>
              </div>

              {/* Visual Icon Grid inside Edit Modal */}
              <div className="bg-white p-3.5 rounded-2xl border border-cream-300 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-espresso-900">اختر أيقونة القسم:</span>
                  <span className="text-xs font-bold text-rosewarm-600 flex items-center gap-1.5">
                    <i className={editIcon} />
                    <span>{selectedEditIconObj.label}</span>
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-44 overflow-y-auto p-1">
                  {ICON_OPTIONS.map((opt) => {
                    const isSelected = editIcon === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setEditIcon(opt.value)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer text-center ${
                          isSelected
                            ? "bg-espresso-900 text-gold-400 border-espresso-900 shadow-sm"
                            : "bg-cream-50 hover:bg-rosewarm-100/60 text-espresso-800 border-cream-300"
                        }`}
                      >
                        <i className={`${opt.value} text-base ${isSelected ? "text-gold-400" : "text-rosewarm-600"}`} />
                        <span className="text-[9px] font-bold line-clamp-1">{opt.label}</span>
                      </button>
                    );
                  })}
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

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-espresso-800 hover:bg-cream-200 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                >
                  <i className={editIcon} />
                  <span>{savingEdit ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
