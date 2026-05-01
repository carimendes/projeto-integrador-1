import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";

/*
  PUT - Atualizar produto
*/
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idProduto } = await context.params;

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
      url_foto,
    } = body;

    const [produtoAtualizado] = await sql`
      UPDATE produtos
      SET
        sku = COALESCE(${sku}, sku),
        nome = COALESCE(${nome}, nome),
        tipo_bobina = COALESCE(${tipo_bobina}, tipo_bobina),
        largura = COALESCE(${largura}, largura),
        gramatura = COALESCE(${gramatura}, gramatura),
        url_foto = COALESCE(${url_foto}, url_foto),
        data_atualizacao = NOW()
      WHERE id = ${idProduto}
      RETURNING *
    `;

    return NextResponse.json(produtoAtualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}

/*
  DELETE - Remover produto
*/
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idProduto } = await context.params;

  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const [produtoRemovido] = await sql`
      DELETE FROM produtos
      WHERE id = ${idProduto}
      RETURNING *
    `;

    return NextResponse.json(produtoRemovido);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}