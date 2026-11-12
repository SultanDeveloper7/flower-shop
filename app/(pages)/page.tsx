import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";
import StorefrontClient from "@/components/StorefrontClient";
import { Product } from "@/constants/catalog";

export default async function HomePage() {
  const session = await getSession();

  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC");

  let userPoints = 0;
  if (session) {
    const [userRows] = await pool.query<RowDataPacket[]>("SELECT points_balance FROM users WHERE id = ?", [session.id]);
    userPoints = userRows[0]?.points_balance || 0;
  }

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
          .filter(Boolean)
      : ["ورد طبيعي", "تنسيق فاخر"],
    featured: Boolean(r.is_featured),
    pointsPrice: r.points_price,
  }));

  return <StorefrontClient initialProducts={products} session={session} userPoints={userPoints} />;
}
