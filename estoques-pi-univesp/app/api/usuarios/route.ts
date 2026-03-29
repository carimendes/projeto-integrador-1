import { NextResponse } from "next/server";
import pool from "@/lib/db";

/*
  Função que define a rota da API que irá responder a chamadas para listar todos os usuários.
  O verbo utilizado é o GET, e a rota será {urlHospedagem}/api/usuarios
*/
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

/*
  Função que define a rota da API que irá responder a chamadas para criar novos usuários.
  O verbo utilizado é o POST, e a rota será {urlHospedagem}/api/usuarios
  Os dados do usuário são passados para a API no body da request
*/
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

