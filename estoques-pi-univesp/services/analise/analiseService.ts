import type { DadosAnalise } from "@/lib/analise/consultas";
import type { Periodo } from "@/lib/analise/periodo";

export async function buscarAnalise(periodo: Periodo): Promise<DadosAnalise> {
  const resposta = await fetch(`/api/analise?periodo=${periodo}`);
  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(
      corpo?.error ?? "Não foi possível carregar os dados de análise. Tente novamente.",
    );
  }

  return corpo as DadosAnalise;
}
