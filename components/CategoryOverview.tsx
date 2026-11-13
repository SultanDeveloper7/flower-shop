// src/components/CategoryOverview.tsx
"use client";

import { Category, Product } from "@/constants/catalog";

interface Props {
  activeCategoryId: number | "all";
  onSelectCategory: (id: number | "all") => void;
  products: Product[];
  categories: Category[];
}

export default function CategoryOverview({ categories, activeCategoryId, onSelectCategory, products }: Props) {
  return (
    <section id="categories-overview" className="py-12 bg-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-rosewarm-600 font-bold text-xs tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-6 h-[2px] bg-gold-500 inline-block" />
              تصفح حسب المناسبة
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-espresso-900 mt-1">أقسام متجر زهرة لينا العشرة</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const isSelected = activeCategoryId === cat.id;
            const count = products.filter((p) => p.categoryId === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  document.getElementById("products-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`group text-right p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-full ${
                  isSelected
                    ? "bg-espresso-900 text-cream-50 border-gold-500 shadow-luxury"
                    : "bg-white hover:bg-rosewarm-100/50 text-espresso-900 border-cream-300 hover:border-rosewarm-300 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isSelected ? "bg-gold-500 text-espresso-900" : "bg-cream-200 text-espresso-800"
                    }`}
                  >
                    القسم {cat.id}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      isSelected ? "bg-rosewarm-500 text-white" : "bg-rosewarm-100 text-rosewarm-600"
                    }`}
                  >
                    <i className={`${cat.icon} text-sm`} />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2">{cat.name}</h3>
                  <p className={`text-[11px] mt-1 ${isSelected ? "text-cream-200/80" : "text-espresso-800/60"}`}>{count} تنسيقات متوفرة</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
