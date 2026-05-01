import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";

/*
  GET - Listar produtos
*/
export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const produtos = await sql`SELECT * FROM produtos`;

    return NextResponse.json(produtos);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}

/*
  POST - Criar produto
*/
export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const {
      sku,
      nome,
      tipo_bobina,
      largura,
      gramatura,
      quantidade_estoque = 0,
    } = body;

    // validação básica (evita dor em produção)
    if (!sku || !nome) {
      return NextResponse.json(
        { error: "Dados obrigatórios não informados" },
        { status: 400 }
      );
    }

    const [novoProduto] = await sql`
      INSERT INTO produtos (
        sku,
        nome,
        tipo_bobina,
        largura,
        gramatura,
        quantidade_estoque
      )
      VALUES (
        ${sku},
        ${nome},
        ${tipo_bobina},
        ${largura},
        ${gramatura},
        ${quantidade_estoque}
      )
      RETURNING *
    `;

    return NextResponse.json(novoProduto);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}