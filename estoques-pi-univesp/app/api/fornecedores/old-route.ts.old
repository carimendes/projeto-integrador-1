import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";

/*
  Função que define a rota da API que irá responder a chamadas para listar todos os fornecedores.
  O verbo utilizado é o GET, e a rota será {urlHospedagem}/api/fornecedores
*/
export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

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

/*
  Função que define a rota da API que irá responder a chamadas para criar novos fornecedores.
  O verbo utilizado é o POST, e a rota será {urlHospedagem}/api/fornecedores
  Os dados do fornecedor são passados para a API no body da request
*/
export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

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
