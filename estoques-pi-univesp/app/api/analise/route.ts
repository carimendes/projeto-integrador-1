import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuthSession } from "@/lib/server-session";
import { buscarDadosAnalise } from "@/lib/analise/consultas";
import { ehPeriodoValido, PERIODO_PADRAO } from "@/lib/analise/periodo";
import { erroServidor, erroValidacao, naoAutenticado } from "@/lib/respostas-api";

/*
  GET /api/analise?periodo=30d|6m|1a

  Devolve os dados dos gráficos e da tabela do módulo de Análise de Dados.
  Sem "periodo", usa os últimos 6 meses. Acesso restrito a usuários logados.
*/
export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  if (!session) return naoAutenticado();

  const periodo = request.nextUrl.searchParams.get("periodo") ?? PERIODO_PADRAO;
  if (!ehPeriodoValido(periodo)) {
    return erroValidacao(
      "Período inválido. Escolha últimos 30 dias, últimos 6 meses ou último ano.",
      "periodo",
    );
  }

  try {
    const dados = await buscarDadosAnalise(sql, periodo);
    return NextResponse.json(dados);
  } catch (error) {
    console.error("Erro ao montar dados de análise:", error);
    return erroServidor(
      "Não foi possível carregar os dados de análise. Tente novamente em alguns instantes.",
    );
  }
}
