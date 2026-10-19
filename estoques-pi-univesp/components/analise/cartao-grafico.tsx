import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabelaDados, type ColunaTabela } from "./tabela-dados";

interface CartaoGraficoProps {
  id: string;
  titulo: string;
  descricao: string;
  /** Frase que o leitor de tela lê no lugar do desenho do gráfico. */
  resumoAcessivel: string;
  /** Mostrado no lugar do gráfico quando não há dados. */
  vazio?: string;
  colunas: ColunaTabela[];
  linhas: (string | number)[][];
  children: ReactNode;
}

/*
  Cartão padrão dos gráficos da Análise de Dados.

  Acessibilidade:
  - O desenho do gráfico fica dentro de um elemento role="img" com uma
    descrição em texto, para o leitor de tela não ler cada traço do SVG.
  - Os mesmos valores ficam numa tabela logo abaixo ("Ver dados em tabela"),
    que funciona com teclado e leitor de tela.
*/
export function CartaoGrafico({
  id,
  titulo,
  descricao,
  resumoAcessivel,
  vazio,
  colunas,
  linhas,
  children,
}: CartaoGraficoProps) {
  const idTitulo = `${id}-titulo`;

  return (
    <Card aria-labelledby={idTitulo} role="region">
      <CardHeader>
        <CardTitle>
          <h2 id={idTitulo} className="text-base font-semibold">
            {titulo}
          </h2>
        </CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {linhas.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">{vazio ?? "Sem dados no período."}</p>
        ) : (
          <>
            <div role="img" aria-label={resumoAcessivel}>
              {children}
            </div>
            <details className="group rounded-md border">
              <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
                Ver dados em tabela
              </summary>
              <div className="border-t px-3 py-2">
                <TabelaDados legenda={titulo} colunas={colunas} linhas={linhas} />
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}
