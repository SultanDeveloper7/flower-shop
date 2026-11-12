"use client";

import { useState, useEffect } from "react";
import { CATEGORIES, Product } from "@/constants/catalog";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirmAdd: (product: Product, quantity: number, giftMessage: string, packagingColor: string) => void;
}

const QUICK_PHRASES = [
  { label: "+ دمتَ لي شيئاً جميلاً", text: "دمتَ لي شيئاً جميلاً لا ينتهي 🤍" },
  { label: "+ عبارة اعتذار", text: "أعتذر من كل قلبي، رضاك بالدنيا 🌷" },
  { label: "+ تهنئة تخرج", text: "ألف مبروك التخرج ومنها للأعلى يارب 🎓✨" },
  { label: "+ الحمدلله على السلامة", text: "الحمد لله على السلامة وما تشوف شر 💐" },
  { label: "+ كل عام وأنت بخير", text: "كل عام وأنت أجمل أقداري، سنة حلوة تشبه قلبك 🎂🌸" },
  { label: "+ تهنئة مولود", text: "الحمد لله على تمام النعمة، يتربى في عزكم يارب 👶🤍" },
];

const PACKAGING_OPTIONS = ["نفس تنسيق الصورة", "بيج كريمي فاخر", "وردي باستيل ناعم", "أسود ملكي مع شريط ذهبي", "أبيض شفاف (أورجانزا)"];

export default function ProductModal({ product, onClose, onConfirmAdd }: ProductModalProps) {
  const [giftMessage, setGiftMessage] = useState("");
  const [packagingColor, setPackagingColor] = useState(PACKAGING_OPTIONS[0]);
  const [quantity, setQuantity] = useState(1);

  // Reset fields whenever a new product is opened
  useEffect(() => {
    if (product) {
      setGiftMessage("");
      setPackagingColor(PACKAGING_OPTIONS[0]);
      setQuantity(1);
    }
  }, [product]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (product) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const category = CATEGORIES.find((c) => c.id === product.categoryId);

  const adjustQty = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(20, prev + delta)));
  };

  const handleConfirm = () => {
    onConfirmAdd(product, quantity, giftMessage.trim(), packagingColor);
    onClose();
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-espresso-900/60 backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-cream-50 border border-cream-300 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl transform transition-all max-h-[90vh] flex flex-col"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-cream-200/70 border-b border-cream-300">
          <span className="text-xs font-bold bg-rosewarm-100 text-rosewarm-700 px-3 py-1 rounded-full">
            {category ? `القسم ${category.id}: ${category.name}` : "قسم الباقات"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-rosewarm-100 text-espresso-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Product Image */}
            <div className="sm:col-span-5 rounded-2xl overflow-hidden border border-cream-300 aspect-square bg-cream-200">
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
            </div>

            {/* Product Details */}
            <div className="sm:col-span-7 space-y-3">
              <h3 className="font-serif text-2xl font-bold text-espresso-900">{product.title}</h3>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-extrabold text-rosewarm-600">{product.price} ر.س</p>
                {product.pointsPrice && (
                  <span className="text-xs font-bold bg-gold-100 text-espresso-900 border border-gold-400/50 px-3 py-1 rounded-full">
                    <i className="fa-solid fa-gift text-rosewarm-600 ml-1" />
                    مجاناً بـ {product.pointsPrice} نقطة
                  </span>
                )}
              </div>
              <p className="text-sm text-espresso-800/80 leading-relaxed">{product.description}</p>

              <div className="pt-2 flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-cream-200 text-espresso-800 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Customization Fields (Gift Card & Packaging Note) */}
          <div className="bg-cream-200/60 p-4 sm:p-5 rounded-2xl border border-cream-300 space-y-4">
            <h4 className="font-bold text-sm text-espresso-900 flex items-center gap-2">
              <i className="fa-solid fa-feather-pointed text-gold-600" />
              <span>تخصيص الباقة وكرت الإهداء (اختياري)</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-espresso-800 mb-1.5">رسالة كرت الإهداء (تُطبع مجاناً مع الباقة):</label>
              <textarea
                rows={2}
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="اكتب عبارتك الرقيقة هنا... أو اختر من العبارات الجاهزة بالأسفل"
                className="w-full rounded-xl bg-white border border-cream-300 p-3 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none"
              />

              {/* Quick Phrase Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGiftMessage(phrase.text)}
                    className="text-[11px] bg-white hover:bg-rosewarm-100 text-espresso-800 px-2.5 py-1 rounded-full border border-cream-300 transition-colors cursor-pointer"
                  >
                    {phrase.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Wrapping Color */}
              <div>
                <label className="block text-xs font-semibold text-espresso-800 mb-1">لون التغليف المفضل:</label>
                <select
                  value={packagingColor}
                  onChange={(e) => setPackagingColor(e.target.value)}
                  className="w-full rounded-xl bg-white border border-cream-300 p-2.5 text-xs sm:text-sm text-espresso-900 focus:border-rosewarm-500 focus:outline-none cursor-pointer"
                >
                  {PACKAGING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Selector */}
              <div>
                <label className="block text-xs font-semibold text-espresso-800 mb-1">الكمية المطلوبة:</label>
                <div className="flex items-center bg-white border border-cream-300 rounded-xl overflow-hidden h-[40px]">
                  <button
                    type="button"
                    onClick={() => adjustQty(-1)}
                    className="px-4 h-full hover:bg-cream-200 text-espresso-900 font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    readOnly
                    className="w-full text-center text-sm font-bold text-espresso-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustQty(1)}
                    className="px-4 h-full hover:bg-cream-200 text-espresso-900 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-cream-200/80 border-t border-cream-300 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-espresso-800 hover:bg-cream-300 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <i className="fa-solid fa-cart-plus" />
            <span>إضافة إلى السلة ({product.price * quantity} ر.س)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
