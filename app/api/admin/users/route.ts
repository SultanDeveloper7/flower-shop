import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getSession, SessionUser } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const [users] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, phone_or_email, role, points_balance, is_blocked, created_at
     FROM users
     ORDER BY created_at DESC`,
  );

  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const { userId, isBlocked, role, pointsDelta } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
  }

  // 1. Handle Manual Points Addition / Deduction
  if (typeof pointsDelta === "number" && !isNaN(pointsDelta) && pointsDelta !== 0) {
    await pool.query(
      `UPDATE users 
       SET points_balance = GREATEST(0, points_balance + ?) 
       WHERE id = ?`,
      [pointsDelta, userId],
    );

    const [updatedRows] = await pool.query<RowDataPacket[]>("SELECT points_balance FROM users WHERE id = ?", [userId]);

    const newBalance = updatedRows[0]?.points_balance ?? 0;
    return NextResponse.json({
      message:
        pointsDelta > 0
          ? `تمت إضافة +${pointsDelta} نقطة بنجاح (الرصيد الجديد: ${newBalance} نقطة)`
          : `تم خصم ${Math.abs(pointsDelta)} نقطة بنجاح (الرصيد الجديد: ${newBalance} نقطة)`,
      newBalance,
    });
  }

  // 2. Prevent admin from accidentally blocking their own account
  if (Number(userId) === session.id && isBlocked === true) {
    return NextResponse.json({ error: "لا يمكنك حظر حسابك الشخصي كمدير للنظام!" }, { status: 400 });
  }

  // 3. Handle Block / Unblock
  if (typeof isBlocked === "boolean") {
    await pool.query("UPDATE users SET is_blocked = ? WHERE id = ?", [isBlocked, userId]);

    // If blocked, immediately terminate all active Redis sessions for this user
    if (isBlocked) {
      const keys = await redis.keys("session:*");
      for (const key of keys) {
        const raw = await redis.get(key);
        if (raw) {
          try {
            const parsed: SessionUser = JSON.parse(raw);
            if (parsed.id === Number(userId)) {
              await redis.del(key);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  }

  // 4. Handle Role Change
  if (role && ["CUSTOMER", "STAFF", "ADMIN"].includes(role)) {
    if (Number(userId) === session.id && role !== "ADMIN") {
      return NextResponse.json({ error: "لا يمكنك إلغاء صلاحية الآدمن عن حسابك الحالي" }, { status: 400 });
    }
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
  }

  return NextResponse.json({
    message: isBlocked ? "تم حظر المستخدم وإنهاء جميع جلساته النشطة فوراً" : "تم تحديث حالة المستخدم بنجاح",
  });
}
