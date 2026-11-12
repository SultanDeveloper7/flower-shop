import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  try {
    const { name, phone_or_email, password } = await req.json();

    if (!name || !phone_or_email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if phone or email is already registered
    const [existing] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE phone_or_email = ?", [phone_or_email]);

    if (existing.length > 0) {
      return NextResponse.json({ error: "Phone or Email already registered" }, { status: 409 });
    }

    // Hash password and insert user
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO users (name, phone_or_email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, phone_or_email, passwordHash, "CUSTOMER"],
    );

    // Automatically log the user in via Redis session
    await createSession({
      id: result.insertId,
      name,
      role: "CUSTOMER",
    });

    return NextResponse.json({ message: "Account created", role: "CUSTOMER" }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
