import Link from "next/link";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";
import TopBar from "@/components/TopBar";
import ClaimButton from "./ClaimButton";

export default async function ClaimQRPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  const session = await getSession();

  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM qr_tokens WHERE id = ?", [tokenId]);

  const token = rows[0];
  const isExpired = token && new Date(token.expires_at) < new Date();

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-espresso-900 selection:bg-rosewarm-500 selection:text-white">
      <TopBar />

      {/* Minimal Header */}
      <header className="bg-cream-100/95 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rosewarm-500 to-rosewarm-700 flex items-center justify-center text-cream-50 shadow-md">
              <i className="fa-solid fa-spa text-lg" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso-900 leading-none">زهرة لينا</h1>
              <p className="text-[10px] tracking-widest uppercase text-gold-600 font-semibold mt-1">ZAHRAT LINA FLOWERS &amp; GIFTS</p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white hover:bg-cream-200 text-espresso-900 border border-cream-300 px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all"
          >
            <span>المتجر الرئيسي</span>
            <i className="fa-solid fa-arrow-left text-rosewarm-500 text-xs" />
          </Link>
        </div>
      </header>

      {/* Main Claim Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rosewarm-300/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gold-400/15 blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full bg-white rounded-3xl border border-cream-300 shadow-luxury overflow-hidden relative z-10">
          {/* Card Top Luxury Banner */}
          <div className="bg-gradient-to-l from-espresso-900 via-espresso-800 to-espresso-900 text-cream-50 p-6 text-center border-b-2 border-gold-500">
            <div className="w-14 h-14 rounded-2xl bg-gold-500 text-espresso-900 flex items-center justify-center text-2xl mx-auto mb-3 shadow-md">
              <i className="fa-solid fa-crown" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-gold-400 font-bold">برنامج ولاء ومكافآت زهرة لينا</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">تحصيل نقاط الفاتورة</h2>
          </div>

          <div className="p-6 sm:p-8 text-center space-y-6">
            {/* Case 1: Invalid Token */}
            {!token ? (
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto border border-rose-200">
                  <i className="fa-solid fa-qrcode" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-espresso-900">كود الـ QR غير صالح</h3>
                <p className="text-xs sm:text-sm text-espresso-800/75 leading-relaxed">
                  لم نتمكن من العثور على هذا الكود. يرجى الطلب من موظف المبيعات في فرع زهرة لينا إصدار كود جديد لك.
                </p>
              </div>
            ) : token.status === "CLAIMED" ? (
              /* Case 2: Already Claimed */
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mx-auto border border-amber-200">
                  <i className="fa-solid fa-check-double" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-espresso-900">تم تحصيل هذا الكود مسبقاً</h3>
                <p className="text-xs sm:text-sm text-espresso-800/75 leading-relaxed">
                  تمت إضافة نقاط هذا الكود (<strong>+{token.points_amount} نقطة</strong>) إلى محفظة العميل بنجاح ولا يمكن مسحه مرة أخرى.
                </p>
                {session && (
                  <Link
                    href="/rewards"
                    className="inline-flex items-center gap-2 bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition-all"
                  >
                    <i className="fa-solid fa-wallet" />
                    <span>الذهاب إلى محفظة نقاطي</span>
                  </Link>
                )}
              </div>
            ) : isExpired ? (
              /* Case 3: Expired */
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-2xl mx-auto border border-stone-200">
                  <i className="fa-regular fa-clock" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-espresso-900">انتهت صلاحية كود الـ QR</h3>
                <p className="text-xs sm:text-sm text-espresso-800/75 leading-relaxed">
                  لدواعي الأمان، تنتهي صلاحية كود النقاط بعد 15 دقيقة من إصداره. يرجى الطلب من الكاشير إصدار كود جديد.
                </p>
              </div>
            ) : !session ? (
              /* Case 4: Valid Token, Customer NOT Logged In -> Prompt Login or Sign Up */
              <div className="space-y-6">
                <div className="bg-cream-100 border border-gold-400/60 rounded-2xl p-5 space-y-2">
                  <span className="text-xs font-bold text-rosewarm-600 block">شكراً لتسوقك من زهرة لينا 🌸</span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-espresso-900">
                    +{token.points_amount} <span className="text-lg font-serif text-rosewarm-600">نقطة ولاء</span>
                  </div>
                  <p className="text-xs text-espresso-800/75">بانتظار إضافتها إلى حسابك الآن!</p>
                </div>

                <p className="text-xs sm:text-sm text-espresso-800/80 leading-relaxed">
                  لإضافة هذه النقاط إلى محفظتك فوراً، يرجى <strong>تسجيل الدخول</strong> إذا كان لديك حساب، أو{" "}
                  <strong>إنشاء حساب جديد</strong> في ثوانٍ معدودة:
                </p>

                <div className="space-y-3">
                  <Link
                    href={`/login?redirect=/claim/${tokenId}`}
                    className="w-full bg-rosewarm-500 hover:bg-rosewarm-600 text-white font-bold py-3.5 px-6 rounded-full shadow-luxury transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <i className="fa-solid fa-right-to-bracket" />
                    <span>لدي حساب — تسجيل الدخول وإضافة النقاط</span>
                  </Link>

                  <Link
                    href={`/login?mode=register&redirect=/claim/${tokenId}`}
                    className="w-full bg-espresso-900 hover:bg-espresso-800 text-gold-400 font-bold py-3.5 px-6 rounded-full shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <i className="fa-solid fa-user-plus" />
                    <span>عميل جديد — إنشاء حساب وإضافة النقاط فوراً</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Case 5: Valid Token AND Customer IS Logged In -> Auto-Claim Points */
              <div className="space-y-5">
                <div className="bg-cream-100 border border-gold-400/60 rounded-2xl p-5 space-y-1">
                  <span className="text-xs text-espresso-800/70 block">
                    أهلاً بك، <strong>{session.name}</strong>
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-rosewarm-600">+{token.points_amount} نقطة</div>
                </div>

                <ClaimButton tokenId={tokenId} points={Number(token.points_amount)} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
