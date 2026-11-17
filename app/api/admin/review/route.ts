import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET: Fetch all pending & approved reviews for admin moderation
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.*, p.title AS product_title 
       FROM product_reviews r
       JOIN products p ON r.product_id = p.id
       ORDER BY r.created_at DESC`,
    );

    return NextResponse.json({ reviews: rows });
  } catch (error) {
    return NextResponse.json({ error: "تعذر جلب التقييمات" }, { status: 500 });
  }
}

// PATCH: Approve a review
export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { reviewId, isApproved } = await req.json();
    await pool.query("UPDATE product_reviews SET is_approved = ? WHERE id = ?", [Boolean(isApproved), reviewId]);

    return NextResponse.json({ message: "تم تحديث حالة التقييم بنجاح ✓" });
  } catch (error) {
    return NextResponse.json({ error: "تعذر تحديث التقييم" }, { status: 500 });
  }
}
