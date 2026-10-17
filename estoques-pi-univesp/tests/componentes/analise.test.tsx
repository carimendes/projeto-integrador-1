// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraficoEntradasSaidas, GraficoMaisSaidas } from "@/components/analise/graficos";
import { TabelaAbaixoMinimo } from "@/components/analise/tabela-abaixo-minimo";
import { FiltroPeriodo } from "@/components/analise/filtro-periodo";
import { violacoesAcessibilidade } from "../apoio/axe";

/*
  Testes de acessibilidade das telas da Análise de Dados (seções 3.7 e 3.8):
  regras automáticas do axe-core + comportamento com teclado e leitor de tela.
*/

const meses = [
  { mes: "2026-09", entradas: 107, saidas: 70 },
  { mes: "2026-10", entradas: 50, saidas: 40 },
];

describe("Gráfico de entradas e saídas por mês", () => {
  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<GraficoEntradasSaidas meses={meses} />);
    expect(await violacoesAcessibilidade(container)).toEqual([]);
  });

  it("descreve o gráfico em texto para o leitor de tela", () => {
    render(<GraficoEntradasSaidas meses={meses} />);
    expect(
      screen.getByRole("img", {
        name: /comparando entradas e saídas em 2 meses: 157 unidades entraram e 110 saíram/i,
      }),
    ).toBeInTheDocument();
  });

  it("mostra os mesmos valores numa tabela", async () => {
    render(<GraficoEntradasSaidas meses={meses} />);
    await userEvent.click(screen.getByText("Ver dados em tabela"));
    const tabela = screen.getByRole("table", { name: "Entradas e saídas por mês" });
    const linhas = within(tabela).getAllByRole("row");
    expect(linhas[1]).toHaveTextContent("setembro de 2026");
    expect(linhas[1]).toHaveTextContent("107");
    expect(linhas[1]).toHaveTextContent("70");
    expect(linhas[2]).toHaveTextContent("outubro de 2026");
  });

  it("período sem movimentos mostra aviso em vez de gráfico vazio", () => {
    render(<GraficoEntradasSaidas meses={[{ mes: "2026-10", entradas: 0, saidas: 0 }]} />);
    expect(screen.getByText("Nenhuma entrada ou saída registrada no período.")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("Gráfico de produtos com mais saídas", () => {
  it("não tem violações e cita o primeiro colocado na descrição", async () => {
    const { container } = render(
      <GraficoMaisSaidas
        produtos={[
          { id: "1", nome: "Bobina B", quantidade: 85 },
          { id: "2", nome: "Bobina A", quantidade: 25 },
        ]}
      />,
    );
    expect(await violacoesAcessibilidade(container)).toEqual([]);
    expect(screen.getByRole("img", { name: /o primeiro é Bobina B, com 85 unidades/ })).toBeInTheDocument();
  });
});

describe("Tabela de produtos abaixo do estoque mínimo", () => {
  const produtos = [
    { id: "1", nome: "Bobina A", sku: "A", quantidade: 5, estoqueMinimo: 10, falta: 5 },
    { id: "2", nome: "Bobina F", sku: "F", quantidade: 1, estoqueMinimo: 3, falta: 2 },
  ];

  it("não tem violações de acessibilidade", async () => {
    const { container } = render(<TabelaAbaixoMinimo produtos={produtos} produtosComMinimo={4} />);
    expect(await violacoesAcessibilidade(container)).toEqual([]);
  });

  it("o destaque não depende só da cor: cada linha diz 'Abaixo do mínimo'", () => {
    render(<TabelaAbaixoMinimo produtos={produtos} produtosComMinimo={4} />);
    const tabela = screen.getByRole("table", { name: "2 produtos abaixo do estoque mínimo" });
    const linhas = within(tabela).getAllByRole("row").slice(1);
    expect(linhas).toHaveLength(2);
    for (const linha of linhas) expect(linha).toHaveTextContent("Abaixo do mínimo");
    expect(within(tabela).getByRole("rowheader", { name: "Bobina A" })).toBeInTheDocument();
  });

  it("explica o que fazer quando nenhum produto tem mínimo definido", () => {
    render(<TabelaAbaixoMinimo produtos={[]} produtosComMinimo={0} />);
    expect(screen.getByText(/Nenhum produto tem estoque mínimo definido/)).toBeInTheDocument();
  });

  it("avisa quando está tudo certo", () => {
    render(<TabelaAbaixoMinimo produtos={[]} produtosComMinimo={3} />);
    expect(screen.getByText(/Todos os produtos estão com estoque igual ou acima do mínimo/)).toBeInTheDocument();
  });
});

describe("Filtro de período", () => {
  it("é um grupo de opções com nome, operável pelo teclado", async () => {
    const aoMudar = vi.fn();
    const { container } = render(<FiltroPeriodo valor="6m" aoMudar={aoMudar} />);

    expect(await violacoesAcessibilidade(container)).toEqual([]);
    const grupo = screen.getByRole("group", { name: "Período" });
    const opcoes = within(grupo).getAllByRole("radio");
    expect(opcoes.map((o) => o.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);

    // teclado: Tab chega na opção marcada e a seta para a direita muda o período
    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "Últimos 6 meses" })).toHaveFocus();
    // (a tecla fica pressionada até o foco mudar, como num teclado de verdade)
    await userEvent.keyboard("{ArrowRight>}");
    await vi.waitFor(() => expect(aoMudar).toHaveBeenLastCalledWith("1a"));
    await userEvent.keyboard("{/ArrowRight}");
  });

  it("também muda com clique no texto da opção", async () => {
    const aoMudar = vi.fn();
    render(<FiltroPeriodo valor="6m" aoMudar={aoMudar} />);
    await userEvent.click(screen.getByText("Últimos 30 dias"));
    expect(aoMudar).toHaveBeenLastCalledWith("30d");
  });
});
