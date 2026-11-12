import { redirect } from "next/navigation";
import Link from "next/link";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";
import TopBar from "@/components/TopBar";
import LogoutButton from "@/components/LogoutButton";
import RedeemActions from "./RedeemActions";

export default async function RewardsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/rewards");
  }

  // 1. Fetch user's current points balance
  const [userRows] = await pool.query<RowDataPacket[]>("SELECT points_balance FROM users WHERE id = ?", [session.id]);
  const currentPoints = Number(userRows[0]?.points_balance || 0);

  // 2. Fetch user's generated reward vouchers
  const [voucherRows] = await pool.query<RowDataPacket[]>("SELECT * FROM redemptions WHERE user_id = ? ORDER BY created_at DESC", [
    session.id,
  ]);

  const vouchers = voucherRows.map((v) => ({
    id: v.id,
    rewardCode: v.reward_code,
    pointsSpent: Number(v.points_spent),
    rewardType: v.reward_type as "DISCOUNT" | "FREE_BOUQUET",
    discountAmount: Number(v.discount_amount),
    status: v.status as "ACTIVE" | "USED",
    createdAt: new Date(v.created_at).toISOString(),
  }));

  // Progress bar calculation toward 100 pts (Discount) and 500 pts (Free Bouquet)
  const targetPoints = currentPoints < 100 ? 100 : 500;
  const progressPercentage = Math.min(100, Math.round((currentPoints / targetPoints) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-espresso-900 selection:bg-rosewarm-500 selection:text-white">
      <TopBar />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-cream-100/95 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rosewarm-500 to-rosewarm-700 flex items-center justify-center text-cream-50 shadow-md group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-spa text-lg" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 leading-none">زهرة لينا</h1>
              <p className="text-[10px] tracking-widest uppercase text-gold-600 font-semibold mt-1">ZAHRAT LINA LOYALTY CLUB</p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            {session.role === "ADMIN" && (
              <Link
                href="/admin/bouquets"
                className="hidden sm:inline-flex items-center gap-1.5 bg-gold-100 hover:bg-gold-400 text-espresso-900 border border-gold-400 px-3.5 py-2 rounded-full text-xs font-bold transition-all"
              >
                <i className="fa-solid fa-user-gear text-rosewarm-600" />
                <span>لوحة الآدمن</span>
              </Link>
            )}

            {(session.role === "STAFF" || session.role === "ADMIN") && (
              <Link
                href="/staff/pos"
                className="hidden sm:inline-flex items-center gap-1.5 bg-rosewarm-100 hover:bg-rosewarm-300 text-espresso-900 border border-rosewarm-300 px-3.5 py-2 rounded-full text-xs font-bold transition-all"
              >
                <i className="fa-solid fa-qrcode text-rosewarm-700" />
                <span>نقاط QR</span>
              </Link>
            )}

            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white hover:bg-cream-200 text-espresso-900 border border-cream-300 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all"
            >
              <span>تصفح الباقات</span>
              <i className="fa-solid fa-arrow-left text-rosewarm-500 text-xs" />
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-10">
        {/* Luxury Wallet Hero Card */}
        <section className="bg-gradient-to-l from-espresso-900 via-espresso-800 to-espresso-900 text-cream-50 rounded-3xl p-6 sm:p-10 border-2 border-gold-500/60 shadow-luxury relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-rosewarm-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 bg-gold-500/20 border border-gold-400/40 text-gold-400 px-3.5 py-1 rounded-full text-xs font-bold">
                <i className="fa-solid fa-crown" />
                <span>محفظة ولاء عملاء زهرة لينا</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">أهلاً بك، {session.name} 🌸</h2>

              <p className="text-xs sm:text-sm text-cream-200/85 leading-relaxed max-w-xl">
                في كل مرة تشتري فيها باقة من فرعنا في جازان (حي السويس)، امسح كود الـ QR الذي يظهره لك الموظف لتزداد نقاطك وتستبدلها بخصومات
                فورية أو باقات مجانية.
              </p>

              {/* Progress Bar */}
              <div className="pt-2 space-y-2 max-w-md">
                <div className="flex justify-between text-xs font-bold text-gold-400">
                  <span>
                    {currentPoints < 100
                      ? `متبقي ${100 - currentPoints} نقطة للحصول على خصم 20 ر.س`
                      : currentPoints < 500
                        ? `أنت مؤهل لخصم 20 ر.س! ومتبقي ${500 - currentPoints} نقطة للباقة المجانية`
                        : "مبروك! رصيدك يؤهلك للحصول على باقة ورد مجانية 🎉"}
                  </span>
                  <span>{progressPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/15">
                  <div
                    className="h-full bg-gradient-to-l from-gold-400 to-rosewarm-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Balance Box */}
            <div className="lg:col-span-5 flex lg:justify-end">
              <div className="w-full sm:w-auto min-w-[240px] bg-white/10 backdrop-blur-md border border-gold-400/40 rounded-3xl p-6 text-center space-y-2 shadow-xl">
                <span className="text-xs uppercase tracking-widest text-gold-400 font-bold block">رصيد نقاطك المتاح</span>
                <div className="text-5xl font-extrabold text-white tracking-tight">{currentPoints}</div>
                <span className="text-xs text-cream-200 block">نقطة ولاء فعالة</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Redemption & Vouchers History */}
        <RedeemActions currentPoints={currentPoints} vouchers={vouchers} />
      </main>

      {/* Minimal Footer */}
      <footer className="bg-espresso-900 text-cream-200 py-8 border-t-4 border-gold-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>
            © جميع الحقوق محفوظة لمتجر <strong>زهرة لينا للزهور والهدايا (Zahrat Lina)</strong> — جازان، حي السويس.
          </p>
          <a
            href="https://wa.me/966530346444"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 hover:underline flex items-center gap-1.5 font-bold"
          >
            <i className="fa-brands fa-whatsapp text-sm" />
            <span>تواصل معنا: 0530346444</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
