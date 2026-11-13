import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getSession, SessionUser } from "@/lib/auth";

export async function GET() {
  const currentSession = await getSession();
  if (!currentSession || currentSession.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const keys = await redis.keys("session:*");
  const activeSessions: (SessionUser & { isCurrentDevice: boolean })[] = [];

  for (const key of keys) {
    const raw = await redis.get(key);
    if (raw) {
      try {
        const parsed: SessionUser = JSON.parse(raw);
        const sessionId = key.replace("session:", "");
        activeSessions.push({
          ...parsed,
          sessionId,
          isCurrentDevice: sessionId === currentSession.sessionId,
        });
      } catch {
        // Ignore malformed session entries
      }
    }
  }

  // Sort newest sessions first
  activeSessions.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return NextResponse.json({ sessions: activeSessions });
}

export async function DELETE(req: Request) {
  const currentSession = await getSession();
  if (!currentSession || currentSession.role !== "ADMIN") {
    return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const targetSessionId = searchParams.get("sessionId");

  if (!targetSessionId) {
    return NextResponse.json({ error: "معرف الجلسة مطلوب" }, { status: 400 });
  }

  await redis.del(`session:${targetSessionId}`);
  return NextResponse.json({ message: "تم تسجيل خروج الجهاز المحدد بنجاح" });
}
