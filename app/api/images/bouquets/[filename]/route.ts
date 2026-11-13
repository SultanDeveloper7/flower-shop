import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || (process.platform === "win32" ? "C:/images/bouquets" : "/app/uploads/bouquets");

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;

    // path.basename prevents directory traversal attacks (e.g., ../../)
    const safeFileName = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeFileName);

    const fileBuffer = await readFile(filePath);
    const ext = path.extname(safeFileName).toLowerCase();
    const contentType = MIME_TYPES[ext] || "image/jpeg";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "الصورة غير موجودة" }, { status: 404 });
  }
}
