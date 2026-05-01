import { NextResponse, NextRequest } from "next/server";
import pool from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";

/*
  Função que define a rota da API que irá responder a chamadas para atualizar produtos.
  O verbo utilizado é o PUT, e a rota será {urlHospedagem}/api/produtos/{idDoProduto}
  Os dados do produto que serão atualizados são passados para a API no body da request
*/
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idProduto } = await context.params;

  const session = await getAuthSession();

  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sku, nome, tipo_bobina, largura, gramatura, url_foto } = body;

    const client = await pool.connect();

    const produto = (
      await client.query(`SELECT * FROM produtos WHERE id = '${idProduto}'`)
    ).rows[0];

    const produtoAtualizado = (
      await client.query(
        `UPDATE produtos SET sku = $1, nome = $2, tipo_bobina = $3, largura = $4, gramatura = $5, url_foto = $6, data_atualizacao = NOW() WHERE id = '${idProduto}' RETURNING *`,
        [
          sku || produto.sku,
          nome || produto.nome,
          tipo_bobina || produto.tipo_bobina,
          largura || produto.largura,
          gramatura || produto.gramatura,
          url_foto || produto.url_foto,
        ],
      )
    ).rows[0];

    client.release();

    return NextResponse.json(produtoAtualizado);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}

/*
  Função que define a rota da API que irá responder a chamadas para remover produtos.
  O verbo utilizado é o DELETE, e a rota será {urlHospedagem}/api/produtos/{idDoProduto}
*/
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: idProduto } = await context.params;

  const session = await getAuthSession();

  if (!session) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const client = await pool.connect();

    const produtoRemovido = (
      await client.query(
        `DELETE FROM produtos WHERE id = '${idProduto}' RETURNING *`,
      )
    ).rows[0];

    client.release();

    return NextResponse.json(produtoRemovido);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 },
    );
  }
}
