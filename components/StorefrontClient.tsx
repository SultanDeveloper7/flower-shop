"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartItem, Category, Product } from "@/constants/catalog";
import TopBar from "./TopBar";
import Header from "./Header";
import HeroSection from "./HeroSection";
import CategoryOverview from "./CategoryOverview";
import ProductCard from "./ProductCard";
import CartDrawer from "./CartDrawer";

interface Props {
  initialProducts: Product[];
  categories: Category[];
  session: { id: number; name: string; role: "CUSTOMER" | "STAFF" | "ADMIN" } | null;
  userPoints: number;
}

const CART_STORAGE_KEY = "zahrat_lina_cart_v1";

export default function StorefrontClient({ initialProducts, categories, session, userPoints }: Props) {
  const router = useRouter();

  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Load saved cart from localStorage when the website first opens
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCart(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    } finally {
      setHasLoadedCart(true);
    }
  }, []);

  // 2. Save cart to localStorage automatically whenever items are added, updated, or removed
  useEffect(() => {
    if (!hasLoadedCart) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cart, hasLoadedCart]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // 3. Unified Cart Add Function
  const addItemToCart = (product: Product, quantity: number, giftMessage: string, packagingColor: string) => {
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
  };

  const handleQuickAdd = (product: Product) => {
    addItemToCart(product, 1, "", "نفس تنسيق الصورة");
    triggerToast(`تمت إضافة "${product.title}" إلى السلة 🌸`);
  };

  // Navigate to product page instead of opening a modal
  const handleOpenProduct = (product: Product) => {
    router.push(`/products/${product.id}`);
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

  // 4. Data Segregation for Sections
  const featuredProducts = initialProducts.filter((p) => p.featured).slice(0, 10);
  const newestProducts = [...initialProducts].reverse().slice(0, 10); // Reversing to simulate "newest"

  // 5. Filter & Sort for the Main Grid
  const filteredProducts = initialProducts
    .filter((item) => {
      const matchesCat = activeCategoryId === "all" || item.categoryId === activeCategoryId;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });

  const activeCategoryObj = activeCategoryId === "all" ? null : categories.find((c) => c.id === activeCategoryId);

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      <TopBar />
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onResetFilters={() => {
          setActiveCategoryId("all");
          setSearchQuery("");
          setSortBy("default");
        }}
        session={session}
        userPoints={userPoints}
      />

      <HeroSection />

      <CategoryOverview
        categories={categories}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
        products={initialProducts}
      />

      {/* --- NEW HORIZONTAL SECTIONS --- */}
      <section className="py-12 bg-cream-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {/* Featured Section */}
          {featuredProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-espresso-900">الباقات المميزة</h2>
                <button
                  onClick={() => {
                    setActiveCategoryId("all");
                    setSortBy("default");
                  }}
                  className="text-sm font-semibold text-rosewarm-500 hover:text-rosewarm-600 transition-colors"
                >
                  عرض الكل &larr;
                </button>
              </div>
              {/* Reduced gap and adjusted card widths */}
              <div className="flex items-stretch overflow-x-auto gap-4 sm:gap-6 pb-6 snap-x snap-mandatory no-scrollbar">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="w-[200px] sm:w-[240px] md:w-[300px] snap-start shrink-0 grid">
                    <ProductCard categories={categories} product={product} onOpenModal={handleOpenProduct} onQuickAdd={handleQuickAdd} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Newest Section */}
          {newestProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-espresso-900">وصل حديثاً</h2>
                <button
                  onClick={() => {
                    setActiveCategoryId("all");
                  }}
                  className="text-sm font-semibold text-rosewarm-500 hover:text-rosewarm-600 transition-colors"
                >
                  استكشف المزيد &larr;
                </button>
              </div>
              {/* Reduced gap and adjusted card widths */}
              <div className="flex items-stretch overflow-x-auto gap-4 sm:gap-6 pb-6 snap-x snap-mandatory no-scrollbar">
                {newestProducts.map((product) => (
                  <div key={product.id} className="w-[200px] sm:w-[240px] md:w-[300px] snap-start shrink-0 grid">
                    <ProductCard categories={categories} product={product} onOpenModal={handleOpenProduct} onQuickAdd={handleQuickAdd} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Catalog with Sticky Category Bar */}
      <section id="products-section" className="py-8 flex-1">
        <div className="sticky top-[108px] md:top-20 z-30 bg-cream-50/95 backdrop-blur-md border-y border-cream-200 py-3 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategoryId("all")}
              className={`shrink-0 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-sm ${
                activeCategoryId === "all"
                  ? "bg-espresso-900 text-cream-50 border-espresso-900"
                  : "bg-white text-espresso-800 border-cream-200 hover:border-espresso-900/30"
              }`}
            >
              الكل ({initialProducts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`shrink-0 px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition-all cursor-pointer shadow-sm ${
                  activeCategoryId === cat.id
                    ? "bg-rosewarm-500 text-white border-rosewarm-500"
                    : "bg-white text-espresso-800 border-cream-200 hover:border-rosewarm-500/30"
                }`}
              >
                {cat.id}. {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active Category Banner & Sort Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-10 bg-white p-5 sm:p-6 rounded-3xl border border-cream-200 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-rosewarm-50 text-rosewarm-600 border border-rosewarm-200 text-xs font-bold px-3 py-1.5 rounded-xl">
                  {activeCategoryObj ? `القسم ${activeCategoryObj.id}` : "كافة الأقسام (1 - 10)"}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900">
                  {activeCategoryObj ? activeCategoryObj.name : "جميع الباقات والمنتجات"}
                </h3>
              </div>
              <p className="text-sm text-espresso-800/70 mt-2">
                {activeCategoryObj ? activeCategoryObj.description : "استعرض كامل تشكيلة زهرة لينا عبر الأقسام العشرة المتنوعة"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
              <span className="text-xs font-semibold bg-cream-50 px-4 py-2.5 rounded-2xl border border-cream-200 text-espresso-800">
                {filteredProducts.length} منتج
              </span>

              <div className="flex items-center gap-2 bg-cream-50 px-4 py-2 rounded-2xl border border-cream-200">
                <i className="fa-solid fa-arrow-up-wide-short text-gold-600 text-xs" />
                <label className="text-xs font-medium text-espresso-800/70">الترتيب:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "default" | "price-asc" | "price-desc")}
                  className="bg-transparent text-sm font-semibold text-espresso-900 focus:outline-none cursor-pointer"
                >
                  <option value="default">الأكثر تميزاً</option>
                  <option value="price-asc">السعر: من الأقل للأعلى</option>
                  <option value="price-desc">السعر: من الأعلى للأقل</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
            {filteredProducts.map((product) => (
              <ProductCard
                categories={categories}
                key={product.id}
                product={product}
                onOpenModal={handleOpenProduct}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-espresso-900 text-cream-200 pt-16 pb-8 border-t-4 border-gold-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
          <p>
            © جميع الحقوق محفوظة لمتجر <strong>زهرة لينا للزهور والهدايا (Zahrat Lina)</strong> جازان، حي السويس.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/rewards" className="text-gold-400 hover:text-gold-300 transition-colors">
              محفظة نقاط الولاء
            </Link>
            <Link href="/login" className="text-cream-100 hover:text-white transition-colors">
              حسابي
            </Link>
            <Link href="/admin/bouquets" className="text-gold-400 hover:text-gold-300 transition-colors">
              دخول الإدارة
            </Link>
          </div>
        </div>
      </footer>

      {/* Slide-Out Shopping Cart Drawer */}
      <CartDrawer
        categories={categories}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveCartItem}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-espresso-900 text-cream-50 px-6 py-4 rounded-2xl shadow-2xl border border-gold-500/40 flex items-center gap-4 max-w-sm animate-bounce">
          <div className="w-8 h-8 rounded-full bg-gold-500 text-espresso-900 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-check text-sm" />
          </div>
          <p className="text-sm font-medium leading-relaxed">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
