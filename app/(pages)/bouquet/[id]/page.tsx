import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { Category, Product } from "@/constants/catalog";
import ProductDetailsClient from "./ProductDetailsClient";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);

  if (isNaN(productId)) {
    return <div className="py-24 text-center text-lg font-bold">الباقة غير موجودة</div>;
  }
  // Safe tag parser helper
  const parseTags = (rawTags: any): string[] => {
    if (!rawTags) return [];
    if (Array.isArray(rawTags)) return rawTags;
    if (typeof rawTags === "string") {
      const trimmed = rawTags.trim();
      // Try parsing as JSON first (if stored as '["tag1", "tag2"]')
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Not JSON, treat as comma-separated string ('tag1, tag2')
      }
      return trimmed
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  };

  // 1. Fetch categories from MySQL with an empty array fallback
  let categories: Category[] = [];
  try {
    const [catRows] = await pool.query<RowDataPacket[]>("SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC");
    if (catRows.length > 0) {
      categories = catRows.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || "",
        icon: c.icon || "fa-solid fa-spa",
        badge: c.badge || "قسم مميز",
      }));
    }
  } catch {
    // Fallback if table query fails
  }

  // 2. Fetch the target product
  const [productRows] = await pool.query<RowDataPacket[]>("SELECT * FROM products WHERE id = ? LIMIT 1", [productId]);

  if (!productRows[0]) {
    return (
      <div className="py-32 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold">عذراً، هذه الباقة غير متوفرة</h2>
        <a href="/" className="inline-block bg-espresso-900 text-white px-6 py-2.5 rounded-full text-sm">
          العودة للرئيسية
        </a>
      </div>
    );
  }

  const p = productRows[0];
  const product: Product = {
    id: p.id,
    categoryId: p.category_id,
    title: p.title,
    description: p.description || "",
    price: Number(p.price),
    image: p.image_url || "",
    tags: parseTags(p.tags), // <--- Use safe parser here
    featured: Boolean(p.is_featured),
    isActive: Boolean(p.is_active),
    pointsPrice: p.points_price ? Number(p.points_price) : undefined,
  };

  // 3. Fetch similar products from the same category
  const [similarRows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM products WHERE category_id = ? AND id != ? AND is_active = TRUE LIMIT 4",
    [product.categoryId, product.id],
  );

  const similarProducts: Product[] = similarRows.map((r) => ({
    id: r.id,
    categoryId: r.category_id,
    title: r.title,
    description: r.description || "",
    price: Number(r.price),
    image: r.image_url || "",
    tags: parseTags(r.tags), // <--- Use safe parser here too
    featured: Boolean(r.is_featured),
    isActive: Boolean(r.is_active),
    pointsPrice: r.points_price ? Number(r.points_price) : undefined,
  }));

  const [reviewRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, author_name, rating, comment, created_at 
     FROM product_reviews 
     WHERE product_id = ? AND is_approved = TRUE 
     ORDER BY created_at DESC`,
    [productId],
  );

  const reviews = reviewRows.map((r) => ({
    id: r.id,
    authorName: r.author_name || "عميل زهرة لينا",
    rating: Number(r.rating),
    comment: r.comment,
    createdAt: new Date(r.created_at).toISOString(),
  }));

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "5.0";

  return (
    <ProductDetailsClient
      product={product}
      categories={categories}
      similarProducts={similarProducts}
      initialReviews={reviews}
      averageRating={avgRating}
    />
  );
}
