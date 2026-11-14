import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

function getBaseUrl(req: Request) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  return process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
    ? process.env.NEXT_PUBLIC_APP_URL
    : `${protocol}://${host}`;
}

// GET: Fetch recent QR tokens using MySQL's clock for exact remaining seconds
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    // 1. Automatically mark expired PENDING tokens as EXPIRED in MySQL
    await pool.query(
      `UPDATE qr_tokens
       SET status = 'EXPIRED'
       WHERE status = 'PENDING'
         AND expires_at IS NOT NULL
         AND expires_at <= NOW()`,
    );

    // 2. Fetch the latest 25 QR tokens + exact remaining seconds calculated by MySQL
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         q.id,
         q.points_amount,
         q.created_by_staff_id,
         q.claimed_by_user_id,
         q.status,
         q.created_at,
         q.expires_at,
         q.claimed_at,
         GREATEST(0, TIMESTAMPDIFF(SECOND, NOW(), IFNULL(q.expires_at, DATE_ADD(q.created_at, INTERVAL 15 MINUTE)))) AS remaining_seconds,
         u.name AS claimed_by_name,
         s.name AS created_by_staff_name
       FROM qr_tokens q
       LEFT JOIN users u ON q.claimed_by_user_id = u.id
       LEFT JOIN users s ON q.created_by_staff_id = s.id
       ORDER BY q.created_at DESC
       LIMIT 25`,
    );

    const baseUrl = getBaseUrl(req);
    const serverNow = Date.now();

    // 3. Build response items with timezone-safe expiresAt
    const tokens = await Promise.all(
      rows.map(async (r) => {
        const claimUrl = `${baseUrl}/claim/${r.id}`;
        const remainingSeconds = Number(r.remaining_seconds || 0);
        const isStillPending = r.status === "PENDING" && remainingSeconds > 0;

        let qrDataUrl: string | undefined = undefined;
        if (isStillPending) {
          qrDataUrl = await QRCode.toDataURL(claimUrl, {
            width: 320,
            margin: 2,
            color: { dark: "#2C221E", light: "#FFFFFF" },
          });
        }

        return {
          tokenId: r.id,
          points: Number(r.points_amount),
          status: (r.status === "PENDING" && remainingSeconds <= 0 ? "EXPIRED" : r.status) as "PENDING" | "CLAIMED" | "EXPIRED",
          createdAt: new Date(r.created_at).toISOString(),
          // Anchor expiresAt to the current UTC epoch + MySQL's exact remaining_seconds
          expiresAt: new Date(serverNow + remainingSeconds * 1000).toISOString(),
          remainingSeconds,
          claimedAt: r.claimed_at ? new Date(r.claimed_at).toISOString() : null,
          claimedByName: r.claimed_by_name || null,
          createdByStaffName: r.created_by_staff_name || null,
          claimUrl,
          qrDataUrl,
        };
      }),
    );

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("Fetch QR tokens error:", error);
    return NextResponse.json({ error: "تعذر جلب سجل الأكواد" }, { status: 500 });
  }
}

// POST: Generate a new 15-minute (900 seconds) QR Code
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { points } = await req.json();
    const pointsAmount = Number(points);

    if (!pointsAmount || pointsAmount <= 0 || pointsAmount > 5000) {
      return NextResponse.json({ error: "يرجى إدخال عدد نقاط صحيح (بين 1 و 5000)" }, { status: 400 });
    }

    const tokenId = uuidv4();

    // Insert with 15-minute expiration in MySQL
    await pool.query(
      `INSERT INTO qr_tokens (id, points_amount, created_by_staff_id, status, created_at, expires_at)
       VALUES (?, ?, ?, 'PENDING', NOW(), DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
      [tokenId, pointsAmount, session.id],
    );

    const baseUrl = getBaseUrl(req);
    const claimUrl = `${baseUrl}/claim/${tokenId}`;

    const qrDataUrl = await QRCode.toDataURL(claimUrl, {
      width: 320,
      margin: 2,
      color: { dark: "#2C221E", light: "#FFFFFF" },
    });

    const nowMs = Date.now();
    const expiresAtMs = nowMs + 15 * 60 * 1000; // Guaranteed 15 minutes from now in UTC

    return NextResponse.json({
      tokenId,
      points: pointsAmount,
      claimUrl,
      qrDataUrl,
      status: "PENDING",
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(expiresAtMs).toISOString(),
      remainingSeconds: 900,
    });
  } catch (error) {
    console.error("QR generation error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إنشاء كود النقاط" }, { status: 500 });
  }
}
