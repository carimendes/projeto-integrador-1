import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import { getAuthSession } from "@/lib/server-session";

/*
  GET - Listar usuários
*/
export async function GET() {
  const session = await getAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const usuarios = await sql`SELECT * FROM usuarios`;

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro de banco de dados" },
      { status: 500 }
    );
  }
}

/*
  POST - Criar usuário
*/
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, nome, senha } = body;

    // hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    const [novoUsuario] = await sql`
      INSERT INTO usuarios (email, nome, senha)
      VALUES (${email}, ${nome}, ${senhaHash})
      RETURNING id, email, nome
    `;

    return NextResponse.json(novoUsuario);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}