"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type {
  EntradasSaidasMes,
  FornecedorEntradas,
  ItemEstoque,
  ProdutoSaidas,
} from "@/lib/analise/consultas";
import { formatarMesCurto, formatarMesExtenso } from "@/lib/analise/periodo";
import { CartaoGrafico } from "./cartao-grafico";

/*
  Gráficos do módulo de Análise de Dados (Recharts).

  Padrões visuais:
  - Barras finas (no máximo 24px), cantos arredondados só na ponta do valor.
  - Uma cor por significado, igual em todas as telas: entradas = azul,
    saídas = laranja, estoque atual = violeta (variáveis em globals.css,
    com versões para modo escuro e alto contraste).
  - Barras horizontais mostram o valor escrito na ponta, então a leitura
    não depende só da cor nem do passar do mouse.
*/

const ALTURA_LINHA = 36;
const ALTURA_MINIMA = 160;
const MAX_CARACTERES_NOME = 24;

const encurtar = (nome: string) =>
  nome.length > MAX_CARACTERES_NOME ? `${nome.slice(0, MAX_CARACTERES_NOME - 1)}…` : nome;

/** Nome do item no eixo, sempre em uma linha (o nome completo aparece no tooltip e na tabela). */
function RotuloEixo({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <text x={x} y={y} dy={4} textAnchor="end" className="fill-muted-foreground text-xs">
      {encurtar(String(payload?.value ?? ""))}
    </text>
  );
}

const plural = (n: number, singular: string, pluralTexto: string) =>
  `${n} ${n === 1 ? singular : pluralTexto}`;

// ---------------------------------------------------------------------------
// Barras horizontais reutilizáveis (um valor por item)
// ---------------------------------------------------------------------------

interface BarrasHorizontaisProps {
  dados: { nome: string; quantidade: number }[];
  chave: string;
  rotulo: string;
  cor: string;
}

function BarrasHorizontais({ dados, chave, rotulo, cor }: BarrasHorizontaisProps) {
  const config = { [chave]: { label: rotulo, color: cor } } satisfies ChartConfig;
  const altura = Math.max(ALTURA_MINIMA, dados.length * ALTURA_LINHA + 24);

  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: altura }}>
      <BarChart
        data={dados.map((d) => ({ nome: d.nome, [chave]: d.quantidade }))}
        layout="vertical"
        margin={{ left: 4, right: 48, top: 4, bottom: 4 }}
        barCategoryGap={8}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="nome"
          width={170}
          tickLine={false}
          axisLine={false}
          tick={<RotuloEixo />}
        />
        <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
        <Bar
          dataKey={chave}
          fill={`var(--color-${chave})`}
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
          isAnimationActive={false}
        >
          <LabelList dataKey={chave} position="right" className="fill-foreground text-xs" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// 1. Quantidade atual em estoque por produto
// ---------------------------------------------------------------------------

export function GraficoEstoqueAtual({ itens }: { itens: ItemEstoque[] }) {
  return (
    <CartaoGrafico
      id="estoque-atual"
      titulo="Quantidade atual em estoque por produto"
      descricao="Situação de agora, independente do período escolhido."
      resumoAcessivel={`Gráfico de barras com a quantidade em estoque de ${plural(itens.length, "produto", "produtos")}. Os valores estão na tabela abaixo.`}
      vazio="Nenhum produto ativo cadastrado."
      colunas={[
        { titulo: "Produto" },
        { titulo: "SKU" },
        { titulo: "Em estoque", numerica: true },
        { titulo: "Estoque mínimo", numerica: true },
      ]}
      linhas={itens.map((i) => [i.nome, i.sku, i.quantidade, i.estoqueMinimo])}
    >
      <BarrasHorizontais
        dados={itens}
        chave="estoque"
        rotulo="Em estoque"
        cor="var(--serie-estoque)"
      />
    </CartaoGrafico>
  );
}

// ---------------------------------------------------------------------------
// 2. Entradas e saídas por mês
// ---------------------------------------------------------------------------

const configEntradasSaidas = {
  entradas: { label: "Entradas", color: "var(--serie-entradas)" },
  saidas: { label: "Saídas", color: "var(--serie-saidas)" },
} satisfies ChartConfig;

export function GraficoEntradasSaidas({ meses }: { meses: EntradasSaidasMes[] }) {
  const totalEntradas = meses.reduce((s, m) => s + m.entradas, 0);
  const totalSaidas = meses.reduce((s, m) => s + m.saidas, 0);
  const semMovimento = totalEntradas === 0 && totalSaidas === 0;

  return (
    <CartaoGrafico
      id="entradas-saidas"
      titulo="Entradas e saídas por mês"
      descricao="Soma das unidades que entraram e saíram em cada mês. Ajustes de inventário não entram na conta."
      resumoAcessivel={`Gráfico de colunas comparando entradas e saídas em ${plural(meses.length, "mês", "meses")}: ${totalEntradas} unidades entraram e ${totalSaidas} saíram no total. Os valores de cada mês estão na tabela abaixo.`}
      vazio="Nenhuma entrada ou saída registrada no período."
      colunas={[
        { titulo: "Mês" },
        { titulo: "Entradas", numerica: true },
        { titulo: "Saídas", numerica: true },
      ]}
      linhas={semMovimento ? [] : meses.map((m) => [formatarMesExtenso(m.mes), m.entradas, m.saidas])}
    >
      <ChartContainer config={configEntradasSaidas} className="aspect-auto h-72 w-full">
        <BarChart data={meses} margin={{ left: 0, right: 8, top: 8, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="mes" tickFormatter={formatarMesCurto} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <ChartTooltip
            cursor={{ fillOpacity: 0.4 }}
            content={<ChartTooltipContent labelFormatter={(mes) => formatarMesExtenso(String(mes))} />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="entradas" fill="var(--color-entradas)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          <Bar dataKey="saidas" fill="var(--color-saidas)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </CartaoGrafico>
  );
}

// ---------------------------------------------------------------------------
// 3. Produtos com maior número de saídas
// ---------------------------------------------------------------------------

export function GraficoMaisSaidas({ produtos }: { produtos: ProdutoSaidas[] }) {
  return (
    <CartaoGrafico
      id="mais-saidas"
      titulo="Produtos com mais saídas"
      descricao="Os 10 produtos com mais unidades vendidas ou retiradas no período."
      resumoAcessivel={`Gráfico de barras com os ${plural(produtos.length, "produto", "produtos")} com mais saídas no período${produtos[0] ? `; o primeiro é ${produtos[0].nome}, com ${produtos[0].quantidade} unidades` : ""}. Os valores estão na tabela abaixo.`}
      vazio="Nenhuma saída registrada no período."
      colunas={[{ titulo: "Produto" }, { titulo: "Unidades que saíram", numerica: true }]}
      linhas={produtos.map((p) => [p.nome, p.quantidade])}
    >
      <BarrasHorizontais dados={produtos} chave="saidas" rotulo="Saídas" cor="var(--serie-saidas)" />
    </CartaoGrafico>
  );
}

// ---------------------------------------------------------------------------
// 4. Quantidade de entradas por fornecedor
// ---------------------------------------------------------------------------

export function GraficoEntradasFornecedor({ fornecedores }: { fornecedores: FornecedorEntradas[] }) {
  return (
    <CartaoGrafico
      id="entradas-fornecedor"
      titulo="Entradas por fornecedor"
      descricao="Unidades recebidas de cada fornecedor no período."
      resumoAcessivel={`Gráfico de barras com as entradas de ${plural(fornecedores.length, "fornecedor", "fornecedores")} no período. Os valores estão na tabela abaixo.`}
      vazio="Nenhuma entrada registrada no período."
      colunas={[
        { titulo: "Fornecedor" },
        { titulo: "Unidades recebidas", numerica: true },
        { titulo: "Nº de entradas", numerica: true },
      ]}
      linhas={fornecedores.map((f) => [f.nome, f.quantidade, f.movimentacoes])}
    >
      <BarrasHorizontais
        dados={fornecedores}
        chave="entradas"
        rotulo="Unidades recebidas"
        cor="var(--serie-entradas)"
      />
    </CartaoGrafico>
  );
}
