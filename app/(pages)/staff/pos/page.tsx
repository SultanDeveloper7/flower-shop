import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import TopBar from "@/components/TopBar";
import LogoutButton from "@/components/LogoutButton";
import StaffPOSClient from "./StaffPOSClient";

export default async function StaffPOSPage() {
  const session = await getSession();

  // Only allow STAFF and ADMIN roles
  if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
    redirect("/login");
  }

  // Fetch the 10 most recent QR tokens generated in the shop
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT q.id, q.points_amount, q.status, q.created_at, u.name AS claimed_by_name
     FROM qr_tokens q
     LEFT JOIN users u ON q.claimed_by_user_id = u.id
     ORDER BY q.created_at DESC
     LIMIT 10`,
  );

  const recentTokens = rows.map((r) => ({
    id: r.id,
    points_amount: Number(r.points_amount),
    status: r.status,
    created_at: new Date(r.created_at).toISOString(),
    claimed_by_name: r.claimed_by_name || null,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-espresso-900">
      <TopBar />

      {/* Staff POS Header */}
      <header className="sticky top-0 z-40 bg-espresso-900 text-cream-50 border-b border-gold-500/40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rosewarm-500 to-rosewarm-700 text-white flex items-center justify-center font-bold shadow-sm">
              <i className="fa-solid fa-qrcode text-lg" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-white leading-none">نقطة مبيعات الفرع (POS) — زهرة لينا</h1>
              <p className="text-[11px] text-gold-400 mt-1">
                الموظف الحالي: {session.name} ({session.role === "ADMIN" ? "مدير" : "موظف مبيعات"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {session.role === "ADMIN" && (
              <Link
                href="/admin/bouquets"
                className="inline-flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-espresso-900 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all"
              >
                <i className="fa-solid fa-camera-retro" />
                <span className="hidden sm:inline">إدارة الباقات</span>
              </Link>
            )}

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-espresso-800 hover:bg-rosewarm-500 text-cream-50 border border-cream-300/20 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all"
            >
              <i className="fa-solid fa-store text-gold-400" />
              <span className="hidden sm:inline">المتجر</span>
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* POS Workspace */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <StaffPOSClient recentTokens={recentTokens} />
      </main>
    </div>
  );
}
