import { describe, expect, it } from "vitest";
import {
  calcularInicioPeriodo,
  ehPeriodoValido,
  formatarMesCurto,
  formatarMesExtenso,
} from "@/lib/analise/periodo";

// 17/10/2026 às 12:00 no horário de São Paulo (15:00 UTC)
const AGORA = new Date("2026-10-17T12:00:00-03:00");

describe("Filtro de período da Análise de Dados", () => {
  it("aceita só os três períodos do relatório", () => {
    expect(ehPeriodoValido("30d")).toBe(true);
    expect(ehPeriodoValido("6m")).toBe(true);
    expect(ehPeriodoValido("1a")).toBe(true);
    expect(ehPeriodoValido("7d")).toBe(false);
    expect(ehPeriodoValido("")).toBe(false);
    expect(ehPeriodoValido(undefined)).toBe(false);
  });

  it("últimos 30 dias = 30 dias corridos antes de agora", () => {
    expect(calcularInicioPeriodo("30d", AGORA).toISOString()).toBe("2026-09-17T15:00:00.000Z");
  });

  it("últimos 6 meses = do dia 1º de maio (meia-noite em São Paulo) até agora", () => {
    expect(calcularInicioPeriodo("6m", AGORA).toISOString()).toBe("2026-05-01T03:00:00.000Z");
  });

  it("último ano = 12 meses do calendário, começando em novembro do ano anterior", () => {
    expect(calcularInicioPeriodo("1a", AGORA).toISOString()).toBe("2025-11-01T03:00:00.000Z");
  });

  it("usa o mês de São Paulo, não o de UTC (31/10 às 22h em SP já é 01/11 em UTC)", () => {
    const noiteDe31 = new Date("2026-11-01T01:00:00Z"); // 31/10 22:00 em São Paulo
    expect(calcularInicioPeriodo("6m", noiteDe31).toISOString()).toBe("2026-05-01T03:00:00.000Z");
  });

  it("formata os meses em português", () => {
    expect(formatarMesCurto("2026-09")).toBe("set/26");
    expect(formatarMesCurto("2026-01")).toBe("jan/26");
    expect(formatarMesExtenso("2026-09")).toBe("setembro de 2026");
  });
});
