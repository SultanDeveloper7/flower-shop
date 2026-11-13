import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM categories ORDER BY sort_order ASC, id ASC");

    const categories = rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || "",
      icon: r.icon || "fa-solid fa-spa",
      badge: r.badge || "قسم مميز",
      sortOrder: Number(r.sort_order || r.id),
      isActive: Boolean(r.is_active),
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Fetch categories error:", error);
    return NextResponse.json({ error: "تعذر جلب الأقسام" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { name, description, icon, badge, sortOrder } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO categories (name, description, icon, badge, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [
        name.trim(),
        description?.trim() || "تشكيلة مميزة من تنسيقات زهرة لينا الفاخرة",
        icon?.trim() || "fa-solid fa-spa",
        badge?.trim() || "قسم مميز",
        Number(sortOrder) || 10,
      ],
    );

    return NextResponse.json({
      message: `تمت إضافة قسم "${name.trim()}" بنجاح 🌸`,
      id: result.insertId,
    });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء إضافة القسم" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك" }, { status: 403 });
    }

    const { id, name, description, icon, badge, sortOrder, isActive } = await req.json();

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: "بيانات القسم غير مكتملة" }, { status: 400 });
    }

    await pool.query(
      `UPDATE categories
       SET name = ?, description = ?, icon = ?, badge = ?, sort_order = ?, is_active = ?
       WHERE id = ?`,
      [
        name.trim(),
        description?.trim() || "",
        icon?.trim() || "fa-solid fa-spa",
        badge?.trim() || "قسم مميز",
        Number(sortOrder) || Number(id),
        isActive !== undefined ? Boolean(isActive) : true,
        id,
      ],
    );

    return NextResponse.json({
      message: `تم تحديث قسم "${name.trim()}" بنجاح ✓`,
    });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث القسم" }, { status: 500 });
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
      return NextResponse.json({ error: "معرف القسم غير صالح" }, { status: 400 });
    }

    // Check if there are products inside this category before deleting
    const [productCountRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS total FROM products WHERE category_id = ?", [id]);

    const totalProducts = Number(productCountRows[0]?.total || 0);
    if (totalProducts > 0) {
      return NextResponse.json(
        {
          error: `لا يمكن حذف هذا القسم لوجود (${totalProducts}) باقة مرتبطة به. يرجى نقل الباقات لقسم آخر أو حذفها أولاً.`,
        },
        { status: 400 },
      );
    }

    await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    return NextResponse.json({ message: "تم حذف القسم نهائياً بنجاح" });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "تعذر حذف القسم" }, { status: 500 });
  }
}
