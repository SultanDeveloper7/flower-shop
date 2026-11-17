import { pool } from "@/lib/db";
import { headers } from "next/headers";

export async function logAdminAction(userId: number | null, userName: string | null, actionType: string, description: string) {
  try {
    const headerStore = await headers();
    const ipAddress = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "127.0.0.1";

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action_type, description, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, userName || "مدير النظام", actionType, description, ipAddress],
    );
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
