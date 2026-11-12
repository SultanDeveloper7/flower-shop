import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || (session.role !== "STAFF" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { points } = await req.json();
  if (!points || points <= 0) {
    return NextResponse.json({ error: "Invalid points amount" }, { status: 400 });
  }

  const tokenId = uuidv4();
  await pool.query(
    `INSERT INTO qr_tokens (id, points_amount, created_by_staff_id, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
    [tokenId, points, session.id],
  );

  // The URL the customer's camera will open when scanning
  const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/claim/${tokenId}`;
  const qrDataUrl = await QRCode.toDataURL(claimUrl, { width: 300 });

  return NextResponse.json({ tokenId, qrDataUrl, claimUrl, points });
}
