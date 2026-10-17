/*
  Períodos do filtro do módulo de Análise de Dados (seção 3.7 do relatório).

  - "30d": últimos 30 dias corridos, contados a partir de agora.
  - "6m":  os últimos 6 meses do calendário, incluindo o mês atual
           (ex.: em 17/10 → de 01/05 até agora).
  - "1a":  os últimos 12 meses do calendário, incluindo o mês atual.

  Os meses são de calendário (e não "agora menos 6 meses") para que o gráfico
  de entradas e saídas por mês não comece com um mês cortado pela metade.

  Fuso horário: America/Sao_Paulo. Desde 2019 o Brasil não tem horário de
  verão, então o fuso é fixo em UTC-03:00 e o início de um mês em São Paulo
  é sempre o dia 1 às 03:00 UTC.
*/

export const PERIODOS = ["30d", "6m", "1a"] as const;
export type Periodo = (typeof PERIODOS)[number];

export const PERIODO_PADRAO: Periodo = "6m";

export const ROTULOS_PERIODO: Record<Periodo, string> = {
  "30d": "Últimos 30 dias",
  "6m": "Últimos 6 meses",
  "1a": "Último ano",
};

export const FUSO_HORARIO = "America/Sao_Paulo";
const DESLOCAMENTO_UTC_HORAS = 3;

export function ehPeriodoValido(valor: unknown): valor is Periodo {
  return typeof valor === "string" && (PERIODOS as readonly string[]).includes(valor);
}

/** Primeiro instante do mês (horário de São Paulo), `mesesAtras` meses antes do mês de `agora`. */
function inicioDoMesSaoPaulo(agora: Date, mesesAtras: number): Date {
  // Converte "agora" para a data local de São Paulo deslocando o relógio.
  const local = new Date(agora.getTime() - DESLOCAMENTO_UTC_HORAS * 60 * 60 * 1000);
  const ano = local.getUTCFullYear();
  const mes = local.getUTCMonth() - mesesAtras; // Date.UTC trata meses negativos
  return new Date(Date.UTC(ano, mes, 1, DESLOCAMENTO_UTC_HORAS, 0, 0, 0));
}

export function calcularInicioPeriodo(periodo: Periodo, agora: Date = new Date()): Date {
  switch (periodo) {
    case "30d":
      return new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "6m":
      return inicioDoMesSaoPaulo(agora, 5);
    case "1a":
      return inicioDoMesSaoPaulo(agora, 11);
  }
}

/** "2026-09" → "set/26" */
export function formatarMesCurto(mes: string): string {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const nome = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(ano, numeroMes - 1, 1)))
    .replace(".", "");
  return `${nome}/${String(ano).slice(2)}`;
}

/** "2026-09" → "setembro de 2026" (usado nas tabelas e leitores de tela) */
export function formatarMesExtenso(mes: string): string {
  const [ano, numeroMes] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(ano, numeroMes - 1, 1)),
  );
}
