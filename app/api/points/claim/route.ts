import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "يرجى تسجيل الدخول أولاً لإضافة النقاط إلى حسابك" }, { status: 401 });
  }

  const { tokenId } = await req.json();
  if (!tokenId) {
    return NextResponse.json({ error: "كود النقاط غير صالح" }, { status: 400 });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock the QR token row to prevent double-claiming
    const [tokens] = await connection.query<RowDataPacket[]>(`SELECT * FROM qr_tokens WHERE id = ? FOR UPDATE`, [tokenId]);

    const token = tokens[0];
    if (!token) {
      throw new Error("كود الـ QR غير موجود أو غير صحيح.");
    }
    if (token.status === "CLAIMED") {
      throw new Error("تم استخدام كود الـ QR هذا مسبقاً.");
    }
    if (new Date(token.expires_at) < new Date()) {
      throw new Error("انتهت صلاحية كود الـ QR (صالح لمدة 15 دقيقة من الإصدار).");
    }

    // 2. Mark token as CLAIMED
    await connection.query(
      `UPDATE qr_tokens 
       SET status = 'CLAIMED', claimed_by_user_id = ?, claimed_at = NOW() 
       WHERE id = ?`,
      [session.id, tokenId],
    );

    // 3. Add points to the customer's balance
    await connection.query(`UPDATE users SET points_balance = points_balance + ? WHERE id = ?`, [token.points_amount, session.id]);

    // 4. Fetch updated balance
    const [userRows] = await connection.query<RowDataPacket[]>(`SELECT points_balance FROM users WHERE id = ?`, [session.id]);

    await connection.commit();

    return NextResponse.json({
      message: "تمت إضافة النقاط إلى محفظتك بنجاح!",
      pointsAdded: Number(token.points_amount),
      newBalance: Number(userRows[0]?.points_balance || token.points_amount),
    });
  } catch (error: any) {
    await connection.rollback();
    return NextResponse.json({ error: error.message || "حدث خطأ أثناء إضافة النقاط" }, { status: 400 });
  } finally {
    connection.release();
  }
}
