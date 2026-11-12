import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import TopBar from "@/components/TopBar";
import LogoutButton from "@/components/LogoutButton";
import UploadBouquetForm from "./UploadBouquetForm";
import { Product } from "@/constants/catalog";

export default async function AdminBouquetsPage() {
  const session = await getSession();

  // Redirect non-admins immediately
  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch all products for the Admin Manager list
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM products ORDER BY created_at DESC");

  const products: Product[] = rows.map((r) => ({
    id: r.id,
    categoryId: r.category_id || 1,
    title: r.title,
    price: Number(r.price),
    description: r.description || "",
    image: r.image_url,
    tags: r.tags
      ? String(r.tags)
          .split(",")
          .map((t: string) => t.trim())
      : ["ورد طبيعي"],
    featured: Boolean(r.is_featured),
    pointsPrice: r.points_price,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-espresso-900">
      <TopBar />

      {/* Admin Header */}
      <header className="sticky top-0 z-40 bg-espresso-900 text-cream-50 border-b border-gold-500/40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gold-500 text-espresso-900 flex items-center justify-center font-bold shadow-sm">
              <i className="fa-solid fa-camera-retro text-lg" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-white leading-none">لوحة تحكم الآدمن — زهرة لينا</h1>
              <p className="text-[11px] text-gold-400 mt-1">مرحباً {session.name} • إدارة الأقسام العشرة والباقات</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/staff/pos"
              className="inline-flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-espresso-900 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all shadow-sm"
            >
              <i className="fa-solid fa-qrcode" />
              <span>توليد كود نقاط (POS)</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-espresso-800 hover:bg-rosewarm-500 text-cream-50 border border-cream-300/20 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-full transition-all"
            >
              <i className="fa-solid fa-store text-gold-400" />
              <span className="hidden sm:inline">عرض المتجر</span>
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <UploadBouquetForm initialProducts={products} />
      </main>
    </div>
  );
}
