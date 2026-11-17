import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getSession, SessionUser } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// List of bad/profane words to check against (customizable)
const BLOCKED_WORDS = [
  "كلمة_سيئة_1",
  "كلمة_سيئة_2",
  // Add any prohibited words or phrases here
];

function containsProfanity(text: string): boolean {
  const clean = text.toLowerCase().trim();
  return BLOCKED_WORDS.some((word) => clean.includes(word.toLowerCase()));
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const { productId, rating, comment, authorName } = await req.json();

    const pId = Number(productId);
    const starRating = Number(rating);

    if (!pId || !starRating || starRating < 1 || starRating > 5) {
      return NextResponse.json({ error: "يرجى تحديد تقييم صحيح من 1 إلى 5 نجوم" }, { status: 400 });
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json({ error: "يرجى كتابة نص التعليق أو الانطباع" }, { status: 400 });
    }

    // 1. Check if the logged-in user is already blocked
    if (session) {
      const [userRows] = await pool.query<RowDataPacket[]>("SELECT is_blocked, review_strikes FROM users WHERE id = ? LIMIT 1", [
        session.id,
      ]);
      if (userRows[0] && Boolean(userRows[0].is_blocked)) {
        return NextResponse.json({ error: "حسابك محظور من إضافة تقييمات أو طلبات جديدة." }, { status: 403 });
      }
    }

    // 2. Check for profanity / bad words
    const hasBadWords = containsProfanity(comment);

    if (hasBadWords && session) {
      // Increment strikes for the logged-in user
      await pool.query(
        `UPDATE users 
         SET review_strikes = review_strikes + 1,
             is_blocked = CASE WHEN review_strikes + 1 >= 3 THEN TRUE ELSE is_blocked END
         WHERE id = ?`,
        [session.id],
      );

      // Check new strike count and block status
      const [updatedRows] = await pool.query<RowDataPacket[]>("SELECT review_strikes, is_blocked FROM users WHERE id = ?", [session.id]);
      const strikes = Number(updatedRows[0]?.review_strikes || 0);
      const isNowBlocked = Boolean(updatedRows[0]?.is_blocked);

      if (isNowBlocked) {
        // Terminate all active Redis sessions for this user so they get logged out instantly
        const keys = await redis.keys("session:*");
        for (const key of keys) {
          const raw = await redis.get(key);
          if (raw) {
            try {
              const parsed: SessionUser = JSON.parse(raw);
              if (parsed.id === session.id) {
                await redis.del(key);
              }
            } catch {
              // Ignore malformed keys
            }
          }
        }

        return NextResponse.json(
          {
            error: "تم حظر حسابك نهائياً بسبب تكرار استخدام ألفاظ غير لائقة في التقييمات.",
          },
          { status: 403 },
        );
      }

      return NextResponse.json(
        {
          error: `تم رفض تقييمك لاحتوائه على ألفاظ غير مسموحة. تحذير (${strikes}/3): استخدام ألفاظ مشابهة سيؤدي لحظر حسابك.`,
        },
        { status: 400 },
      );
    } else if (hasBadWords) {
      // Guest user submitted bad words -> reject immediately
      return NextResponse.json({ error: "عذراً، تقييمك يحتوي على كلمات غير مسموح بها." }, { status: 400 });
    }

    // 3. Save approved clean review
    const name = authorName?.trim() || session?.name || "عميل زهرة لينا المميز 🌸";

    await pool.query<ResultSetHeader>(
      `INSERT INTO product_reviews (product_id, user_id, author_name, rating, comment, is_approved)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [pId, session?.id || null, name, starRating, comment.trim()],
    );

    return NextResponse.json({
      message: "تم إضافة تقييمك بنجاح، شكراً لثقتك بمتجر زهرة لينا! 🌸",
    });
  } catch (error) {
    console.error("Post review error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء حفظ التقييم" }, { status: 500 });
  }
}
