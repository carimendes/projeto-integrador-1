import { NextResponse } from "next/server";
import pool from "@/lib/db";

/*
  Função que define a rota da API que irá responder a chamadas para listar todos os produtos.
  O verbo utilizado é o GET, e a rota será {urlHospedagem}/api/produtos
*/
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

/*
  Função que define a rota da API que irá responder a chamadas para criar novos produtos.
  O verbo utilizado é o POST, e a rota será {urlHospedagem}/api/produtos
  Os dados do produto são passados para a API no body da request
*/
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
