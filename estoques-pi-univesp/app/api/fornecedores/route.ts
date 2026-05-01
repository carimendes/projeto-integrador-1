import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";

/*
  GET - Listar fornecedores
*/
export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const fornecedores = await sql`
      SELECT * FROM fornecedores
    `;

    return NextResponse.json(fornecedores);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}

/*
  POST - Criar fornecedor
*/
export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const { nome, contato, email, telefone, notas } = body;

    // validação básica
    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const [novoFornecedor] = await sql`
      INSERT INTO fornecedores (
        nome,
        contato,
        email,
        telefone,
        notas
      )
      VALUES (
        ${nome},
        ${contato ?? null},
        ${email ?? null},
        ${telefone ?? null},
        ${notas ?? null}
      )
      RETURNING *
    `;

    return NextResponse.json(novoFornecedor);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}