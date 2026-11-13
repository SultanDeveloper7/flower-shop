import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { pool } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  const { phone_or_email, password } = await req.json();

  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users WHERE phone_or_email = ?", [phone_or_email]);

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  if (user.is_blocked) {
    return NextResponse.json(
      { error: 'This account has been blocked from logging in. Please contact Lena Flower Shop management.' },
      { status: 403 }
    );
  }

  await createSession({ id: user.id, name: user.name, role: user.role });
  return NextResponse.json({ message: "Logged in", role: user.role });
}
