import axe from "axe-core";

/*
  Roda o axe-core (o mesmo motor de regras do Lighthouse) num pedaço da tela
  e devolve as violações de acessibilidade encontradas, em texto legível.

  "color-contrast" fica desligada aqui porque o jsdom não calcula cores de
  verdade; o contraste é verificado no Lighthouse/WAVE (docs/testes.md).
*/
export async function violacoesAcessibilidade(elemento: Element): Promise<string[]> {
  const resultado = await axe.run(elemento, {
    rules: { "color-contrast": { enabled: false } },
  });
  return resultado.violations.map(
    (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`,
  );
}
