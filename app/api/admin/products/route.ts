import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

// External folder on the Windows Server
const UPLOAD_DIR = process.env.UPLOAD_DIR || "C:/images/bouquets";
const IMAGE_ROUTE_PREFIX = "/api/images/bouquets/";

// Helper to save an uploaded File into C:/images/bouquets/
async function saveImageToExternalFolder(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = (path.extname(file.name) || ".jpg").toLowerCase();
  const fileName = `${uuidv4()}${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, fileName), buffer);

  return `${IMAGE_ROUTE_PREFIX}${fileName}`;
}

// Helper to delete old local file from C:/images/bouquets/ when product is updated/deleted
async function deleteOldExternalImage(imageUrl?: string | null) {
  if (!imageUrl || !imageUrl.startsWith(IMAGE_ROUTE_PREFIX)) return;
  try {
    const fileName = path.basename(imageUrl);
    await unlink(path.join(UPLOAD_DIR, fileName));
  } catch {
    // Ignore if file was already removed manually
  }
}

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

    if (file && file.size > 0) {
      finalImageUrl = await saveImageToExternalFolder(file);
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
      message: "تم نشر الباقة وحفظ الصورة في المجلد الخارجي بنجاح!",
      imageUrl: finalImageUrl,
    });
  } catch (error) {
    console.error("Product upload error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء رفع المنتج" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء (للإدارة فقط)" }, { status: 403 });
    }

    const formData = await req.formData();
    const id = Number(formData.get("id"));
    const categoryId = parseInt((formData.get("category_id") as string) || "1", 10);
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || "";
    const price = parseFloat(formData.get("price") as string);
    const pointsPriceRaw = formData.get("points_price") as string;
    const pointsPrice = pointsPriceRaw ? parseInt(pointsPriceRaw, 10) : null;
    const tags = (formData.get("tags") as string)?.trim() || "ورد طبيعي, تنسيق فاخر";
    const isFeatured = formData.get("is_featured") === "true";

    const file = formData.get("image") as File | null;
    const existingOrExternalUrl = (formData.get("image_url") as string)?.trim();

    if (!id || !title || isNaN(price)) {
      return NextResponse.json({ error: "يرجى التأكد من اسم الباقة والسعر" }, { status: 400 });
    }

    let finalImageUrl = existingOrExternalUrl || "";

    // If admin uploaded a new photo, save it to C:/images/bouquets and delete the old file
    if (file && file.size > 0) {
      const [oldRows] = await pool.query<RowDataPacket[]>("SELECT image_url FROM products WHERE id = ?", [id]);
      await deleteOldExternalImage(oldRows[0]?.image_url);
      finalImageUrl = await saveImageToExternalFolder(file);
    }

    if (!finalImageUrl) {
      return NextResponse.json({ error: "صورة الباقة مطلوبة" }, { status: 400 });
    }

    await pool.query(
      `UPDATE products 
       SET category_id = ?, title = ?, description = ?, price = ?, image_url = ?, points_price = ?, tags = ?, is_featured = ?
       WHERE id = ?`,
      [categoryId, title, description, price, finalImageUrl, pointsPrice, tags, isFeatured, id],
    );

    return NextResponse.json({
      message: `تم تحديث بيانات "${title}" بنجاح!`,
      imageUrl: finalImageUrl,
    });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تحديث الباقة" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء (للإدارة فقط)" }, { status: 403 });
    }

    const { id, isActive } = await req.json();
    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "بيانات الحالة غير صالحة" }, { status: 400 });
    }

    await pool.query("UPDATE products SET is_active = ? WHERE id = ?", [isActive, id]);

    return NextResponse.json({
      message: isActive ? "تم إظهار الباقة في المتجر (متوفرة الآن) 🌸" : "تم إخفاء الباقة مؤقتاً من المتجر (نفدت الكمية)",
      isActive,
    });
  } catch (error) {
    console.error("Product toggle active error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء تغيير حالة توفر الباقة" }, { status: 500 });
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

    // Remove the image file from C:/images/bouquets/ before deleting the DB row
    const [rows] = await pool.query<RowDataPacket[]>("SELECT image_url FROM products WHERE id = ?", [id]);
    await deleteOldExternalImage(rows[0]?.image_url);

    await pool.query("DELETE FROM products WHERE id = ?", [id]);
    return NextResponse.json({ message: "تم حذف الباقة وصورتها بنجاح" });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "تعذر حذف المنتج" }, { status: 500 });
  }
}
