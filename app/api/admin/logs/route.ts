import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, user_id, user_name, action_type, description, ip_address, created_at
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT 100`,
    );

    const logs = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || "مدير النظام",
      actionType: r.action_type,
      description: r.description,
      ipAddress: r.ipAddress || "127.0.0.1",
      createdAt: new Date(r.created_at).toISOString(),
    }));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Fetch audit logs error:", error);
    return NextResponse.json({ error: "تعذر جلب سجل النشاطات والتحديثات" }, { status: 500 });
  }
}
