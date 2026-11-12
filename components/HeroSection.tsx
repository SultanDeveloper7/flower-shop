import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-cream-200/70 via-cream-100 to-cream-100 pt-8 pb-14 lg:py-16 border-b border-cream-300/70"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Hero Text Column */}
          <div className="lg:col-span-7 text-right space-y-6">
            <div className="inline-flex items-center gap-2 bg-rosewarm-100 border border-rosewarm-300/60 text-rosewarm-700 px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium">
              <i className="fa-solid fa-sparkles text-gold-500" />
              <span>تشكيلة زهرة لينا الفاخرة — 10 أقسام متكاملة + نظام نقاط الولاء</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl lg:text-[54px] font-bold text-espresso-900 leading-[1.25]">
              نصنع من <span className="text-rosewarm-600 underline decoration-gold-400/60 decoration-wavy underline-offset-8">الورد</span>{" "}
              لغةً تعبّر عن أصدق مشاعركم
            </h2>

            <p className="text-espresso-800/80 text-base sm:text-lg leading-relaxed max-w-2xl">
              في <strong>زهرة لينا</strong> ننتقي أجمل الزهور الهولندية والطبيعية وننسقها بأنامل احترافية، مع تشكيلة راقية من الهدايا
              والماركات، باقات الهبة، وتوزيعات المواليد. اجمع نقاطك عند كل عملية شراء عبر مسح كود الـ QR واستبدلها بخصومات أو باقات مجانية!
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="#products-section"
                className="inline-flex items-center gap-2.5 bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold px-7 py-3.5 rounded-full shadow-luxury hover:shadow-luxury-hover transition-all"
              >
                <span>تصفح الباقات والمنتجات</span>
                <i className="fa-solid fa-arrow-left text-sm" />
              </Link>
              <Link
                href="/rewards"
                className="inline-flex items-center gap-2 bg-white hover:bg-cream-200 text-espresso-900 font-semibold px-6 py-3.5 rounded-full border border-cream-300 transition-all"
              >
                <i className="fa-solid fa-qrcode text-gold-500" />
                <span>محفظة النقاط والمكافآت</span>
              </Link>
            </div>
          </div>

          {/* Hero Arch Showcase Image */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-t-[160px] rounded-b-3xl overflow-hidden border-4 border-white shadow-luxury aspect-[4/5] bg-cream-200">
                <img
                  src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=85"
                  alt="باقة زهرة لينا الفاخرة"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/70 via-transparent to-transparent" />
                <div className="absolute bottom-5 right-5 left-5 text-white">
                  <span className="bg-gold-500 text-espresso-900 text-xs font-bold px-3 py-1 rounded-full">الأكثر طلباً هذا الأسبوع</span>
                  <h3 className="font-serif text-2xl font-bold mt-2">باقة لينا الملكية الساحرة</h3>
                  <p className="text-xs text-cream-200 mt-0.5">تناغم الورد الجوري مع الأوكالبتوس والتغليف المخملي</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
