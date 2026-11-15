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
      `SELECT 
         o.*,
         u.name AS registered_user_name,
         u.phone_or_email AS registered_user_contact
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 150`,
    );

    const orders = rows.map((r) => {
      let parsedItems = [];
      try {
        parsedItems = typeof r.items_json === "string" ? JSON.parse(r.items_json) : r.items_json || [];
      } catch {
        parsedItems = [];
      }

      return {
        id: r.id,
        orderNumber: r.order_number,
        userId: r.user_id,
        customerName: r.customer_name,
        customerPhone: r.customer_phone || r.registered_user_contact || "",
        customerAddress: r.customer_address || "",
        orderSource: r.order_source as "CART" | "DIRECT_PRODUCT",
        items: parsedItems,
        totalAmount: Number(r.total_amount),
        status: r.status as "NEW" | "CONFIRMED" | "COMPLETED" | "CANCELLED",
        createdAt: new Date(r.created_at).toISOString(),
        registeredUserName: r.registered_user_name || null,
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Admin fetch orders error:", error);
    return NextResponse.json({ error: "تعذر جلب سجل الطلبات" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { orderId, status } = await req.json();
    const validStatuses = ["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"];

    if (!orderId || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "بيانات الحالة غير صالحة" }, { status: 400 });
    }

    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);

    return NextResponse.json({
      message: "تم تحديث حالة الطلب بنجاح ✓",
    });
  } catch (error) {
    console.error("Admin update order status error:", error);
    return NextResponse.json({ error: "تعذر تحديث حالة الطلب" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ error: "رقم الطلب غير صالح" }, { status: 400 });
    }

    await pool.query("DELETE FROM orders WHERE id = ?", [id]);
    return NextResponse.json({ message: "تم حذف الطلب من السجل" });
  } catch (error) {
    console.error("Admin delete order error:", error);
    return NextResponse.json({ error: "تعذر حذف الطلب" }, { status: 500 });
  }
}
