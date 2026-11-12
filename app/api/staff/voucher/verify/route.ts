import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء" }, { status: 403 });
  }

  const { rewardCode, action } = await req.json(); // action: 'CHECK' | 'USE'
  const cleanCode = (rewardCode || "").trim().toUpperCase();

  if (!cleanCode) {
    return NextResponse.json({ error: "يرجى إدخال كود المكافأة" }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT r.*, u.name AS customer_name, u.phone_or_email 
       FROM redemptions r
       JOIN users u ON r.user_id = u.id
       WHERE r.reward_code = ? FOR UPDATE`,
      [cleanCode],
    );

    const voucher = rows[0];
    if (!voucher) {
      await connection.rollback();
      return NextResponse.json({ error: "كود المكافأة غير صحيح أو غير موجود" }, { status: 404 });
    }

    if (action === "USE") {
      if (voucher.status === "USED") {
        await connection.rollback();
        return NextResponse.json({ error: "هذا الكود تم استخدامه مسبقاً!" }, { status: 400 });
      }

      await connection.query(`UPDATE redemptions SET status = 'USED' WHERE id = ?`, [voucher.id]);
      voucher.status = "USED";
    }

    await connection.commit();
    return NextResponse.json({
      voucher: {
        id: voucher.id,
        rewardCode: voucher.reward_code,
        rewardType: voucher.reward_type,
        discountAmount: Number(voucher.discount_amount),
        pointsSpent: voucher.points_spent,
        status: voucher.status,
        customerName: voucher.customer_name,
        customerContact: voucher.phone_or_email,
        createdAt: voucher.created_at,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Voucher verification error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء التحقق من الكود" }, { status: 500 });
  } finally {
    connection.release();
  }
}
