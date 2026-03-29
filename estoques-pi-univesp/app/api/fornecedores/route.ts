import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM fornecedores");
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
    const { nome, contato, email, telefone, notas } = body;

    const client = await pool.connect();
    const { rows } = await client.query(
      "INSERT INTO fornecedores(nome, contato, email, telefone, notas) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [nome, contato, email, telefone, notas],
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
