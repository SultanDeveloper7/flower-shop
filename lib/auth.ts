import { cookies } from "next/headers";
import { connection } from "next/server"; // 1. Import connection
import { v4 as uuidv4 } from "uuid";
import { redis } from "./redis";

const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

export interface SessionUser {
  id: number;
  name: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
}

export async function createSession(user: SessionUser) {
  const sessionId = uuidv4();
  await redis.set(`session:${sessionId}`, JSON.stringify(user), "EX", SESSION_TTL);

  const cookieStore = await cookies();
  cookieStore.set("session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  // 2. Tell Next.js this function requires a live incoming user request
  await connection();

  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (!sessionId) return null;

  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value;
  if (sessionId) {
    await redis.del(`session:${sessionId}`);
    cookieStore.delete("session_id");
  }
}
