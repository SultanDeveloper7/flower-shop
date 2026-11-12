import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "يرجى تسجيل الدخول أولاً" }, { status: 401 });
  }

  const { rewardType } = await req.json(); // 'DISCOUNT' | 'FREE_BOUQUET'
  if (rewardType !== "DISCOUNT" && rewardType !== "FREE_BOUQUET") {
    return NextResponse.json({ error: "نوع المكافأة غير صالح" }, { status: 400 });
  }

  const cost = rewardType === "FREE_BOUQUET" ? 500 : 100;
  const discountValue = rewardType === "DISCOUNT" ? 20.0 : 0.0;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Lock the user row to safely check points balance
    const [users] = await connection.query<RowDataPacket[]>("SELECT points_balance FROM users WHERE id = ? FOR UPDATE", [session.id]);

    const currentBalance = Number(users[0]?.points_balance || 0);
    if (!users[0] || currentBalance < cost) {
      throw new Error(`رصيد نقاطك غير كافٍ. تحتاج إلى ${cost} نقطة لإتمام الاستبدال.`);
    }

    // 2. Deduct points
    await connection.query("UPDATE users SET points_balance = points_balance - ? WHERE id = ?", [cost, session.id]);

    // 3. Generate a unique 6-character voucher code (FLW-XXXXXX)
    const rewardCode = "FLW-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    await connection.query(
      `INSERT INTO redemptions (user_id, reward_code, points_spent, reward_type, discount_amount, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [session.id, rewardCode, cost, rewardType, discountValue],
    );

    await connection.commit();
    return NextResponse.json({
      rewardCode,
      pointsDeducted: cost,
      newBalance: currentBalance - cost,
    });
  } catch (err: any) {
    await connection.rollback();
    return NextResponse.json({ error: err.message || "حدث خطأ أثناء استبدال النقاط" }, { status: 400 });
  } finally {
    connection.release();
  }
}
