import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء (للإدارة فقط)" }, { status: 403 });
    }

    const formData = await req.formData();
    const categoryId = parseInt((formData.get("category_id") as string) || "1", 10);
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || "";
    const price = parseFloat(formData.get("price") as string);
    const pointsPriceRaw = formData.get("points_price") as string;
    const pointsPrice = pointsPriceRaw ? parseInt(pointsPriceRaw, 10) : null;
    const tags = (formData.get("tags") as string)?.trim() || "ورد طبيعي, تنسيق فاخر";
    const isFeatured = formData.get("is_featured") === "true";

    const file = formData.get("image") as File | null;
    const externalImageUrl = (formData.get("image_url") as string)?.trim();

    if (!title || isNaN(price)) {
      return NextResponse.json({ error: "يرجى إدخال اسم الباقة والسعر بشكل صحيح" }, { status: 400 });
    }

    let finalImageUrl = externalImageUrl || "";

    // If a file was uploaded from device, save it to public/uploads
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || ".jpg";
      const fileName = `${uuidv4()}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);

      finalImageUrl = `/uploads/${fileName}`;
    }

    if (!finalImageUrl) {
      return NextResponse.json({ error: "يرجى رفع صورة للباقة من جهازك أو وضع رابط صورة مباشر" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO products (category_id, title, description, price, image_url, points_price, tags, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, title, description, price, finalImageUrl, pointsPrice, tags, isFeatured],
    );

    return NextResponse.json({
      message: "تم نشر الباقة بنجاح في المتجر!",
      imageUrl: finalImageUrl,
    });
  } catch (error) {
    console.error("Product upload error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء رفع المنتج" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك بالحذف" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "رقم المنتج غير صالح" }, { status: 400 });
    }

    await pool.query("DELETE FROM products WHERE id = ?", [id]);
    return NextResponse.json({ message: "تم حذف الباقة بنجاح" });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "تعذر حذف المنتج" }, { status: 500 });
  }
}
