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

  const { userId, isBlocked, role } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
  }

  // Prevent admin from accidentally blocking their own account
  if (Number(userId) === session.id && isBlocked === true) {
    return NextResponse.json({ error: "لا يمكنك حظر حسابك الشخصي كمدير للنظام!" }, { status: 400 });
  }

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
