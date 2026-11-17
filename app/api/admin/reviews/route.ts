import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET: Fetch all reviews for admin moderation
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         r.id,
         r.product_id,
         r.user_id,
         r.author_name,
         r.rating,
         r.comment,
         r.is_approved,
         r.created_at,
         p.title AS product_title,
         u.review_strikes
       FROM product_reviews r
       JOIN products p ON r.product_id = p.id
       LEFT JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`,
    );

    const reviews = rows.map((r) => ({
      id: r.id,
      productId: r.product_id,
      userId: r.user_id,
      authorName: r.author_name || "عميل زهرة لينا",
      rating: Number(r.rating),
      comment: r.comment,
      isApproved: Boolean(r.is_approved),
      createdAt: new Date(r.created_at).toISOString(),
      productTitle: r.product_title || "باقة غير معروفة",
      reviewStrikes: r.review_strikes !== null ? Number(r.review_strikes) : 0,
    }));

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Admin fetch reviews error:", error);
    return NextResponse.json({ error: "تعذر جلب التقييمات" }, { status: 500 });
  }
}

// PATCH: Approve/Reject review OR Reset user strikes
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { reviewId, userId, isApproved, resetStrikes } = await req.json();

    // 1. Reset user review strikes if requested
    if (resetStrikes && userId) {
      await pool.query("UPDATE users SET review_strikes = 0, is_blocked = FALSE WHERE id = ?", [userId]);
      return NextResponse.json({
        message: "تم تصفير إنذارات وحظر المستخدم بنجاح ✓",
      });
    }

    // 2. Update review approval status
    if (reviewId !== undefined && isApproved !== undefined) {
      await pool.query("UPDATE product_reviews SET is_approved = ? WHERE id = ?", [Boolean(isApproved), reviewId]);
      return NextResponse.json({
        message: "تم تحديث حالة التقييم بنجاح ✓",
      });
    }

    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  } catch (error) {
    console.error("Admin update review error:", error);
    return NextResponse.json({ error: "تعذر تحديث التقييم" }, { status: 500 });
  }
}

// DELETE: Remove spam or inappropriate review
export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const reviewId = Number(searchParams.get("id"));

    if (!reviewId) {
      return NextResponse.json({ error: "معرف التقييم مطلوب" }, { status: 400 });
    }

    await pool.query("DELETE FROM product_reviews WHERE id = ?", [reviewId]);
    return NextResponse.json({ message: "تم حذف التقييم نهائياً" });
  } catch (error) {
    console.error("Admin delete review error:", error);
    return NextResponse.json({ error: "تعذر حذف التقييم" }, { status: 500 });
  }
}
