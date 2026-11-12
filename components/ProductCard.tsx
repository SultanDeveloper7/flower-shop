"use client";

import { CATEGORIES, Product, STORE_WHATSAPP_NUMBER } from "@/constants/catalog";

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export default function ProductCard({ product, onOpenModal, onQuickAdd }: ProductCardProps) {
  const category = CATEGORIES.find((c) => c.id === product.categoryId);

  const directWhatsAppUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `مرحباً زهرة لينا 🌸، أود طلب الباقة التالية:\n- الاسم: ${product.title}\n- السعر: ${product.price} ر.س`,
  )}`;

  return (
    <article className="group bg-white rounded-3xl border border-cream-300 overflow-hidden shadow-luxury hover:shadow-luxury-hover transition-all duration-300 flex flex-col justify-between">
      <div>
        <div onClick={() => onOpenModal(product)} className="relative aspect-square overflow-hidden bg-cream-200 cursor-pointer">
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {category && (
            <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-espresso-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm border border-cream-300">
              {category.name}
            </span>
          )}

          {product.pointsPrice && (
            <span className="absolute top-3 left-3 bg-espresso-900/90 text-gold-400 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <i className="fa-solid fa-gift text-[10px]" /> مجاناً بـ {product.pointsPrice} نقطة
            </span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(product);
            }}
            className="absolute bottom-3 left-3 bg-espresso-900/85 hover:bg-rosewarm-600 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors flex items-center gap-1.5"
          >
            <i className="fa-solid fa-pen-fancy text-gold-400" />
            <span>تخصيص الكرت</span>
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {product.tags.map((tag, i) => (
              <span key={i} className="text-[11px] bg-cream-100 text-espresso-800/80 px-2.5 py-0.5 rounded-md border border-cream-200">
                {tag}
              </span>
            ))}
          </div>

          <h4
            onClick={() => onOpenModal(product)}
            className="font-serif text-lg sm:text-xl font-bold text-espresso-900 hover:text-rosewarm-600 cursor-pointer transition-colors line-clamp-1"
          >
            {product.title}
          </h4>

          <p className="text-xs text-espresso-800/75 mt-1.5 leading-relaxed line-clamp-2">{product.description}</p>
        </div>
      </div>

      {/* Footer Actions: Price + Add to Cart + Direct WhatsApp Link */}
      <div className="px-5 pb-5 pt-3 border-t border-cream-200 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] text-espresso-800/60 block">السعر شامل الضريبة</span>
            <span className="text-lg sm:text-xl font-extrabold text-rosewarm-600">
              {product.price} <small className="text-xs font-bold">ر.س</small>
            </span>
          </div>

          <button
            onClick={() => onQuickAdd(product)}
            className="bg-espresso-900 hover:bg-rosewarm-500 text-cream-50 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-full transition-all flex items-center gap-1.5 active:scale-95"
          >
            <i className="fa-solid fa-plus text-gold-400" />
            <span>أضف للسلة</span>
          </button>
        </div>

        <a
          href={directWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-full transition-all flex items-center justify-center gap-1.5"
        >
          <i className="fa-brands fa-whatsapp text-sm" />
          <span>اطلبها مباشرة عبر واتساب</span>
        </a>
      </div>
    </article>
  );
}
