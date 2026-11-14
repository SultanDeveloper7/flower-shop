import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// GET: Preview QR token status before claiming (optional helper for /claim/[token])
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get("token")?.trim();

    if (!tokenId) {
      return NextResponse.json({ error: "رمز الكود مطلوب" }, { status: 400 });
    }

    // Auto-expire if past 15 minutes using MySQL's clock
    await pool.query(
      `UPDATE qr_tokens
       SET status = 'EXPIRED'
       WHERE id = ?
         AND status = 'PENDING'
         AND IFNULL(expires_at, DATE_ADD(created_at, INTERVAL 15 MINUTE)) <= NOW()`,
      [tokenId],
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         id,
         points_amount,
         status,
         GREATEST(
           0,
           TIMESTAMPDIFF(
             SECOND,
             NOW(),
             IFNULL(expires_at, DATE_ADD(created_at, INTERVAL 15 MINUTE))
           )
         ) AS remaining_seconds
       FROM qr_tokens
       WHERE id = ?
       LIMIT 1`,
      [tokenId],
    );

    if (!rows[0]) {
      return NextResponse.json({ error: "كود النقاط غير موجود أو غير صالح" }, { status: 404 });
    }

    const token = rows[0];
    const remainingSeconds = Number(token.remaining_seconds || 0);
    const effectiveStatus = token.status === "PENDING" && remainingSeconds <= 0 ? "EXPIRED" : token.status;

    return NextResponse.json({
      tokenId: token.id,
      points: Number(token.points_amount),
      status: effectiveStatus,
      remainingSeconds,
    });
  } catch (error) {
    console.error("QR claim preview error:", error);
    return NextResponse.json({ error: "تعذر التحقق من حالة الكود" }, { status: 500 });
  }
}

// POST: Claim the QR code points into the logged-in user's balance
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "يرجى تسجيل الدخول أولاً لتحصيل نقاط الولاء 🌸" }, { status: 401 });
  }

  let body: { token?: string; tokenId?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 });
  }

  // Support both { token } and { tokenId } payloads from the frontend
  const tokenId = (body.token || body.tokenId)?.trim();
  if (!tokenId) {
    return NextResponse.json({ error: "معرف الكود مفقود" }, { status: 400 });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Lock the QR token row and let MySQL calculate remaining seconds
    const [tokens] = await connection.query<RowDataPacket[]>(
      `SELECT 
         id,
         points_amount,
         status,
         created_by_staff_id,
         claimed_by_user_id,
         GREATEST(
           0,
           TIMESTAMPDIFF(
             SECOND,
             NOW(),
             IFNULL(expires_at, DATE_ADD(created_at, INTERVAL 15 MINUTE))
           )
         ) AS remaining_seconds
       FROM qr_tokens
       WHERE id = ?
       FOR UPDATE`,
      [tokenId],
    );

    const token = tokens[0];

    if (!token) {
      await connection.rollback();
      return NextResponse.json({ error: "كود الـ QR غير موجود أو غير صالح." }, { status: 404 });
    }

    // 2. Check if already claimed
    if (token.status === "CLAIMED") {
      await connection.rollback();
      const claimedByCurrentUser = Number(token.claimed_by_user_id) === session.id;
      return NextResponse.json(
        {
          error: claimedByCurrentUser
            ? "لقد قمت بتحصيل نقاط هذا الكود مسبقاً في حسابك ✓"
            : "تم استخدام كود النقاط هذا مسبقاً ولا يمكن استخدامه مرتين.",
        },
        { status: 409 },
      );
    }

    // 3. Check 15-minute expiration using MySQL's clock (remaining_seconds <= 0)
    const remainingSeconds = Number(token.remaining_seconds || 0);
    if (token.status === "EXPIRED" || remainingSeconds <= 0) {
      // Persist EXPIRED status in DB and commit so the POS table updates immediately
      if (token.status !== "EXPIRED") {
        await connection.query(`UPDATE qr_tokens SET status = 'EXPIRED' WHERE id = ?`, [tokenId]);
      }
      await connection.commit();
      return NextResponse.json(
        {
          error: "انتهت صلاحية كود الـ QR (الكود صالح لمدة 15 دقيقة فقط من وقت الإصدار). يرجى طلب كود جديد من موظف زهرة لينا.",
          status: "EXPIRED",
        },
        { status: 410 },
      );
    }

    const pointsEarned = Number(token.points_amount);

    // 4. Mark QR token as CLAIMED using exact column names
    await connection.query(
      `UPDATE qr_tokens
       SET status = 'CLAIMED',
           claimed_by_user_id = ?,
           claimed_at = NOW()
       WHERE id = ?`,
      [session.id, tokenId],
    );

    // 5. Add points to the customer's balance
    await connection.query(
      `UPDATE users
       SET points_balance = points_balance + ?
       WHERE id = ?`,
      [pointsEarned, session.id],
    );

    // 6. Fetch updated total balance
    const [userRows] = await connection.query<RowDataPacket[]>(`SELECT points_balance FROM users WHERE id = ?`, [session.id]);
    const newBalance = Number(userRows[0]?.points_balance || 0);

    await connection.commit();

    return NextResponse.json({
      success: true,
      pointsAdded: pointsEarned,
      points: pointsEarned,
      newBalance,
      message: `مبارك! تمت إضافة +${pointsEarned} نقطة ولاء إلى حسابك بنجاح 🌸`,
    });
  } catch (error) {
    await connection.rollback();
    console.error("QR claim transaction error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة النقاط، يرجى المحاولة مرة أخرى." }, { status: 500 });
  } finally {
    connection.release();
  }
}
