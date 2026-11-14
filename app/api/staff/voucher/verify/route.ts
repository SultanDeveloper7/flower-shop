import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET: Check a customer's FLW-XXXXXX voucher code
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "يرجى إدخال كود القسيمة" }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         r.id,
         r.reward_code,
         r.reward_type,
         r.discount_amount,
         r.points_spent,
         r.status,
         r.created_at,
         u.name AS customer_name,
         u.phone_or_email AS customer_phone
       FROM redemptions r
       JOIN users u ON r.user_id = u.id
       WHERE r.reward_code = ?
       LIMIT 1`,
      [code],
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "كود القسيمة غير موجود في النظام، يرجى التأكد من الكود" }, { status: 404 });
    }

    const v = rows[0];
    return NextResponse.json({
      voucher: {
        id: v.id,
        rewardCode: v.reward_code,
        rewardType: v.reward_type,
        discountAmount: Number(v.discount_amount || 0),
        pointsSpent: Number(v.points_spent || 0),
        status: v.status,
        customerName: v.customer_name,
        customerPhone: v.customer_phone,
        createdAt: new Date(v.created_at).toISOString(),
      },
    });
  } catch (error) {
    console.error("Voucher verify error:", error);
    return NextResponse.json({ error: "تعذر فحص القسيمة" }, { status: 500 });
  }
}

// POST: Mark the voucher as USED after applying the discount/free bouquet
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { code } = await req.json();
    const cleanCode = code?.trim().toUpperCase();

    const [rows] = await pool.query<RowDataPacket[]>("SELECT id, status FROM redemptions WHERE reward_code = ?", [cleanCode]);

    if (!rows[0]) {
      return NextResponse.json({ error: "القسيمة غير موجودة" }, { status: 404 });
    }

    if (rows[0].status === "USED") {
      return NextResponse.json({ error: "تم استخدام هذه القسيمة مسبقاً ولا يمكن استخدامها مرتين" }, { status: 400 });
    }

    await pool.query(`UPDATE redemptions SET status = 'USED' WHERE reward_code = ?`, [cleanCode]);

    return NextResponse.json({
      message: `تم تفعيل واستهلاك القسيمة (${cleanCode}) بنجاح ✓`,
    });
  } catch (error) {
    console.error("Voucher redeem error:", error);
    return NextResponse.json({ error: "تعذر تحديث حالة القسيمة" }, { status: 500 });
  }
}
