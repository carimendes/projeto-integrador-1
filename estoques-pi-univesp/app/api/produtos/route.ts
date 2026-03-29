import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM produtos");
    client.release();
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sku, nome, tipo_bobina, largura, gramatura, url_foto } = body;

    const client = await pool.connect();
    const { rows } = await client.query(
      "INSERT INTO produtos(sku, nome, tipo_bobina, largura, gramatura, url_foto) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [sku, nome, tipo_bobina, largura, gramatura, url_foto],
    );
    client.release();
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}
