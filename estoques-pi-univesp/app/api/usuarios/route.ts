// app/api/users/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM usuarios");
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
    const { email, nome, senha } = body;

    const client = await pool.connect();
    const { rows } = await client.query(
      "INSERT INTO usuarios(email, nome, senha) VALUES($1, $2, $3) RETURNING *",
      [email, nome, senha],
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, email, nome, senha } = body;

    const client = await pool.connect();


    const { rows } = await client.query(
      `UPDATE usuarios SET email = $1, nome = $2, senha = $3, data_atualizacao = NOW() WHERE id = '${id}' RETURNING *`,
      [email, nome, senha],
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
