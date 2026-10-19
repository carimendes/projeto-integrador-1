import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";
import { validarProduto } from "@/lib/validacoes";
import {
  MENSAGENS,
  codigoErroBanco,
  erroServidor,
  erroValidacao,
  naoAutenticado,
} from "@/lib/respostas-api";

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
  Validação com mensagens em linguagem simples (seção 3.8) e campo
  estoque_minimo para o módulo de Análise de Dados (seção 3.7).
*/
export async function POST(request: Request) {
  const session = await getAuthSession();

  if (!session) {
    return naoAutenticado();
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return erroValidacao(MENSAGENS.corpoInvalido);
  }

  const validacao = validarProduto(body);
  if (!validacao.ok) {
    return erroValidacao(validacao.mensagem, validacao.campo);
  }
  const dados = validacao.dados;

  try {
    const [novoProduto] = await sql`
      INSERT INTO produtos (
        sku,
        nome,
        tipo_bobina,
        largura,
        gramatura,
        quantidade_estoque,
        estoque_minimo
      )
      VALUES (
        ${dados.sku},
        ${dados.nome},
        ${dados.tipo_bobina},
        ${dados.largura},
        ${dados.gramatura},
        ${dados.quantidade_estoque},
        ${dados.estoque_minimo}
      )
      RETURNING *
    `;

    return NextResponse.json(novoProduto);
  } catch (error) {
    console.error(error);
    if (codigoErroBanco(error) === "23505") {
      return erroValidacao("Já existe um produto com este SKU. Use outro código.", "sku");
    }
    return erroServidor("Não foi possível cadastrar o produto. Tente novamente em alguns instantes.");
  }
}
