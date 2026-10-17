import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";
import { ehTamanhoFonte, PREFERENCIAS_PADRAO, validarPreferencias } from "@/lib/validacoes";
import { MENSAGENS, erroServidor, erroValidacao, naoAutenticado } from "@/lib/respostas-api";

/*
  Preferências de acessibilidade do usuário logado (seção 3.8).
  Ficam nas colunas usuarios.tamanho_fonte e usuarios.alto_contraste
  (migração scripts-bd/002-analise-acessibilidade.sql).

  GET  /api/preferencias  → { tamanhoFonte, altoContraste }
  PUT  /api/preferencias  ← { tamanhoFonte, altoContraste }
*/

export async function GET() {
  const session = await getAuthSession();
  if (!session) return naoAutenticado();

  try {
    const [linha] = await sql`
      SELECT tamanho_fonte, alto_contraste FROM usuarios WHERE id = ${session.user.id}
    `;

    if (!linha) return NextResponse.json(PREFERENCIAS_PADRAO);

    return NextResponse.json({
      tamanhoFonte: ehTamanhoFonte(linha.tamanho_fonte) ? linha.tamanho_fonte : "normal",
      altoContraste: Boolean(linha.alto_contraste),
    });
  } catch (error) {
    console.error("Erro ao buscar preferências:", error);
    return erroServidor("Não foi possível carregar suas preferências de acessibilidade.");
  }
}

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session) return naoAutenticado();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return erroValidacao(MENSAGENS.corpoInvalido);
  }

  const validacao = validarPreferencias(body);
  if (!validacao.ok) return erroValidacao(validacao.mensagem, validacao.campo);
  const { tamanhoFonte, altoContraste } = validacao.dados;

  try {
    await sql`
      UPDATE usuarios
      SET tamanho_fonte = ${tamanhoFonte},
          alto_contraste = ${altoContraste},
          data_atualizacao = NOW()
      WHERE id = ${session.user.id}
    `;
    return NextResponse.json({ tamanhoFonte, altoContraste });
  } catch (error) {
    console.error("Erro ao salvar preferências:", error);
    return erroServidor("Não foi possível salvar suas preferências. Elas valem só neste navegador por enquanto.");
  }
}
