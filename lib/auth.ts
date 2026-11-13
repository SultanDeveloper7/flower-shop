import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { redis } from "./redis";
import { pool } from "./db";
import { RowDataPacket } from "mysql2";

const SESSION_TTL = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: number;
  name: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt?: string;
}

export async function createSession(user: { id: number; name: string; role: "CUSTOMER" | "STAFF" | "ADMIN" }) {
  const sessionId = uuidv4();
  const headerStore = await headers();

  const userAgent = headerStore.get("user-agent") || "جهاز غير معروف";
  const ipAddress = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "127.0.0.1";

  const sessionPayload: SessionUser = {
    ...user,
    sessionId,
    userAgent,
    ipAddress,
    createdAt: new Date().toISOString(),
  };

  await redis.set(`session:${sessionId}`, JSON.stringify(sessionPayload), "EX", SESSION_TTL);

  const cookieStore = await cookies();
  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.USE_SECURE_COOKIES === "true",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  await connection();

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (!sessionId) return null;

  const data = await redis.get(`session:${sessionId}`);
  if (!data) return null;

  const sessionUser: SessionUser = JSON.parse(data);

  // Verify user is not blocked in MySQL
  const [rows] = await pool.query<RowDataPacket[]>("SELECT is_blocked, role FROM users WHERE id = ?", [sessionUser.id]);

  if (!rows[0] || rows[0].is_blocked) {
    await redis.del(`session:${sessionId}`);
    return null;
  }

  sessionUser.role = rows[0].role;
  sessionUser.sessionId = sessionId;
  return sessionUser;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (sessionId) {
    await redis.del(`session:${sessionId}`);
    cookieStore.delete("session_id");
  }
}
