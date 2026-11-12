export default function TopBar() {
  return (
    <div className="bg-espresso-900 text-cream-100 text-xs sm:text-sm py-2.5 px-4 border-b border-gold-500/30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          <span>توصيل سريع وأنيق في جازان والمناطق المجاورة — تنسيق يومي بزهور طبيعية طازجة 100%</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-cream-200 text-xs">
          <span>
            <i className="fa-solid fa-location-dot text-gold-400 ml-1" />
            جازان - حي السويس - مقابل النقل الجماعي
          </span>
          <span>|</span>
          <a href="https://wa.me/966530346444" target="_blank" rel="noopener noreferrer" className="hover:text-gold-400 transition-colors">
            <i className="fa-brands fa-whatsapp text-gold-400 ml-1" /> 0530346444
          </a>
          <span>|</span>
          <span>
            <i className="fa-regular fa-clock text-gold-400 ml-1" /> يومياً: 9:00 ص - 11:30 م
          </span>
        </div>
      </div>
    </div>
  );
}
