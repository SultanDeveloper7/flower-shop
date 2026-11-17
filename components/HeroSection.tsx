import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-cream-200/80 via-cream-100 to-cream-100 pt-6 pb-12 sm:pt-10 sm:pb-16 lg:py-20 border-b border-cream-300/70"
    >
      {/* Decorative background blur blobs for a luxury feel */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-72 h-72 bg-rosewarm-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-80 h-80 bg-gold-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Hero Text Column */}
          <div className="lg:col-span-7 text-right space-y-5 sm:space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 bg-rosewarm-100/90 border border-rosewarm-300/80 text-rosewarm-800 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-2xs">
              <i className="fa-solid fa-sparkles text-gold-500 text-xs" />
              <span>تشكيلة زهرة لينا الفاخرة — أقسام متجددة + نظام ولاء</span>
            </div>

            {/* Main Headline */}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[52px] font-bold text-espresso-900 leading-[1.2] sm:leading-[1.25]">
              نصنع من <span className="text-rosewarm-600 underline decoration-gold-400/60 decoration-wavy underline-offset-8">الورد</span>{" "}
              لغةً تعبّر عن أصدق مشاعركم
            </h2>

            {/* Description */}
            <p className="text-espresso-800/85 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
              في <strong>زهرة لينا</strong> ننتقي أجمل الزهور الهولندية والطبيعية وننسقها بأنامل احترافية، مع تشكيلة راقية من الهدايا، باقات
              الهبة، وتوزيعات المواليد. اجمع نقاطك عند كل عملية شراء واستبدلها بخصومات وباقات مجانية!
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="#products-section"
                className="inline-flex items-center justify-center gap-2 bg-rosewarm-500 hover:bg-rosewarm-600 text-white text-xs sm:text-sm font-bold px-6 sm:px-7 py-3 sm:py-3.5 rounded-full shadow-md hover:shadow-lg transition-all"
              >
                <span>تصفح الباقات والمنتجات</span>
                <i className="fa-solid fa-arrow-left text-xs" />
              </Link>
              <Link
                href="/rewards"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-cream-200 text-espresso-900 text-xs sm:text-sm font-semibold px-5 sm:px-6 py-3 sm:py-3.5 rounded-full border border-cream-300 transition-all shadow-2xs"
              >
                <i className="fa-solid fa-qrcode text-gold-500 text-sm" />
                <span>محفظة النقاط والمكافآت</span>
              </Link>
            </div>
          </div>

          {/* Hero Arch Showcase Image (Optimized for Mobile) */}
          <div className="lg:col-span-5 relative px-4 sm:px-12 lg:px-0">
            <div className="relative mx-auto max-w-xs sm:max-w-sm lg:max-w-none">
              <div className="relative rounded-t-[140px] sm:rounded-t-[160px] rounded-b-3xl overflow-hidden border-4 border-white shadow-xl aspect-[4/5] bg-cream-200">
                <img
                  src="https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=85"
                  alt="باقة زهرة لينا الفاخرة"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/75 via-espresso-900/10 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 sm:bottom-5 sm:right-5 sm:left-5 text-white">
                  <span className="bg-gold-500 text-espresso-900 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-xs">
                    الأكثر طلباً هذا الأسبوع
                  </span>
                  <h3 className="font-serif text-lg sm:text-2xl font-bold mt-1.5 sm:mt-2">باقة لينا الملكية الساحرة</h3>
                  <p className="text-[11px] sm:text-xs text-cream-200 mt-0.5 line-clamp-1">
                    تناغم الورد الجوري مع الأوكالبتوس والتغليف المخملي
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
