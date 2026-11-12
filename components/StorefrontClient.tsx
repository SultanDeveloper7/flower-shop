"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES, CartItem, Product } from "@/constants/catalog";
import TopBar from "./TopBar";
import Header from "./Header";
import HeroSection from "./HeroSection";
import CategoryOverview from "./CategoryOverview";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import CartDrawer from "./CartDrawer";

interface Props {
  initialProducts: Product[];
  session: { id: number; name: string; role: "CUSTOMER" | "STAFF" | "ADMIN" } | null;
  userPoints: number;
}

const CART_STORAGE_KEY = "zahrat_lina_cart_v1";

export default function StorefrontClient({ initialProducts, session, userPoints }: Props) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  // 2. Load saved cart from localStorage when the website first opens
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

  // 3. Save cart to localStorage automatically whenever items are added, updated, or removed
  useEffect(() => {
    if (!hasLoadedCart) return; // Prevent overwriting storage before initial load completes
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cart, hasLoadedCart]);

  // Modal & Toast State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Unified Cart Add Function (merges identical items with same gift card & wrapping)
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

  const handleModalConfirmAdd = (product: Product, quantity: number, giftMessage: string, packagingColor: string) => {
    addItemToCart(product, quantity, giftMessage, packagingColor);
    triggerToast(`تمت إضافة "${product.title}" مع تخصيص الإهداء إلى السلة 💌`);
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

  // Filter & Sort Products
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

  const activeCategoryObj = activeCategoryId === "all" ? null : CATEGORIES.find((c) => c.id === activeCategoryId);

  return (
    <>
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

      <CategoryOverview activeCategoryId={activeCategoryId} onSelectCategory={setActiveCategoryId} products={initialProducts} />

      {/* Sticky Category Bar & Catalog */}
      <section id="products-section" className="py-8 flex-1">
        <div className="sticky top-[108px] md:top-20 z-30 bg-cream-100/95 backdrop-blur-md border-y border-cream-300 py-2.5 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategoryId("all")}
              className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                activeCategoryId === "all"
                  ? "bg-espresso-900 text-cream-50 border-espresso-900"
                  : "bg-white text-espresso-800 border-cream-300"
              }`}
            >
              الكل ({initialProducts.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  activeCategoryId === cat.id
                    ? "bg-rosewarm-500 text-white border-rosewarm-500"
                    : "bg-white text-espresso-800 border-cream-300"
                }`}
              >
                {cat.id}. {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active Category Banner & Sort Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-cream-200/60 p-4 sm:p-5 rounded-2xl border border-cream-300">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="bg-rosewarm-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  {activeCategoryObj ? `القسم ${activeCategoryObj.id}` : "كافة الأقسام (1 - 10)"}
                </span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-espresso-900">
                  {activeCategoryObj ? activeCategoryObj.name : "جميع الباقات والمنتجات"}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-espresso-800/75 mt-1">
                {activeCategoryObj ? activeCategoryObj.description : "استعرض كامل تشكيلة زهرة لينا عبر الأقسام العشرة المتنوعة"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
              <span className="text-xs font-semibold bg-white px-3 py-2 rounded-xl border border-cream-300 text-espresso-800">
                {filteredProducts.length} منتج
              </span>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-cream-300">
                <i className="fa-solid fa-arrow-up-wide-short text-gold-600 text-xs" />
                <label className="text-xs text-espresso-800/70">الترتيب:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "default" | "price-asc" | "price-desc")}
                  className="bg-transparent text-xs sm:text-sm font-semibold text-espresso-900 focus:outline-none cursor-pointer"
                >
                  <option value="default">الأكثر تميزاً</option>
                  <option value="price-asc">السعر: من الأقل للأعلى</option>
                  <option value="price-desc">السعر: من الأعلى للأقل</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenModal={(prod) => setSelectedProduct(prod)}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        </div>
      </section>

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

      {/* Gift Card & Wrapping Customization Modal */}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onConfirmAdd={handleModalConfirmAdd} />

      {/* Slide-Out Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveCartItem}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-espresso-900 text-cream-50 px-5 py-3.5 rounded-2xl shadow-xl border border-gold-500/40 flex items-center gap-3 max-w-sm animate-bounce">
          <div className="w-7 h-7 rounded-full bg-gold-500 text-espresso-900 flex items-center justify-center shrink-0 text-xs">
            <i className="fa-solid fa-check" />
          </div>
          <p className="text-xs sm:text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </>
  );
}
