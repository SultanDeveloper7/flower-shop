import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ResultSetHeader } from "mysql2";

export interface OrderItemPayload {
  productId: number;
  title: string;
  categoryName?: string;
  price: number;
  quantity: number;
  packagingColor?: string;
  giftMessage?: string;
  imageUrl?: string;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const body = await req.json();

    const {
      customerName,
      customerPhone,
      customerAddress,
      orderSource = "CART",
      items,
      totalAmount,
    } = body as {
      customerName?: string;
      customerPhone?: string;
      customerAddress?: string;
      orderSource?: "CART" | "DIRECT_PRODUCT";
      items: OrderItemPayload[];
      totalAmount: number;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "الطلب لا يحتوي على منتجات" }, { status: 400 });
    }

    // Generate a clean human-readable order number: ZL-XXXXXX
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `ZL-${randomDigits}`;

    const finalName = customerName?.trim() || session?.name || "عميل زهرة لينا";
    const finalPhone = customerPhone?.trim() || null;
    const finalAddress = customerAddress?.trim() || "سيتم تحديده عبر محادثة واتساب";

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO orders (
         order_number,
         user_id,
         customer_name,
         customer_phone,
         customer_address,
         order_source,
         items_json,
         total_amount,
         status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'NEW')`,
      [
        orderNumber,
        session?.id || null,
        finalName,
        finalPhone,
        finalAddress,
        orderSource === "DIRECT_PRODUCT" ? "DIRECT_PRODUCT" : "CART",
        JSON.stringify(items),
        Number(totalAmount) || 0,
      ],
    );

    return NextResponse.json({
      id: result.insertId,
      orderNumber,
      message: "تم تسجيل الطلب بنجاح",
    });
  } catch (error) {
    console.error("Create WhatsApp order log error:", error);
    return NextResponse.json({ error: "تعذر حفظ الطلب في السجل" }, { status: 500 });
  }
}
