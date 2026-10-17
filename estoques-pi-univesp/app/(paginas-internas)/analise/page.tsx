"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import {
  GraficoEntradasFornecedor,
  GraficoEntradasSaidas,
  GraficoEstoqueAtual,
  GraficoMaisSaidas,
} from "@/components/analise/graficos";
import { TabelaAbaixoMinimo } from "@/components/analise/tabela-abaixo-minimo";
import { FiltroPeriodo } from "@/components/analise/filtro-periodo";
import type { DadosAnalise } from "@/lib/analise/consultas";
import { PERIODO_PADRAO, ROTULOS_PERIODO, type Periodo } from "@/lib/analise/periodo";
import { buscarAnalise } from "@/services/analise/analiseService";

type Estado =
  | { situacao: "carregando" }
  | { situacao: "erro"; mensagem: string }
  | { situacao: "pronto"; dados: DadosAnalise };

export default function AnaliseDadosPage() {
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_PADRAO);
  const [estado, setEstado] = useState<Estado>({ situacao: "carregando" });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    buscarAnalise(periodo)
      .then((dados) => ativo && setEstado({ situacao: "pronto", dados }))
      .catch((erro: Error) => ativo && setEstado({ situacao: "erro", mensagem: erro.message }));

    return () => {
      ativo = false;
    };
  }, [periodo, tentativa]);

  const trocarPeriodo = (novo: Periodo) => {
    setEstado({ situacao: "carregando" });
    setPeriodo(novo);
  };

  const tentarDeNovo = () => {
    setEstado({ situacao: "carregando" });
    setTentativa((t) => t + 1);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Análise de Dados</h1>
          <p className="text-muted-foreground">
            Acompanhe a evolução do estoque e planeje a reposição de materiais.
          </p>
        </div>

        <FiltroPeriodo valor={periodo} aoMudar={trocarPeriodo} />

        {/* Avisa o leitor de tela quando os dados terminam de carregar */}
        <p className="sr-only" aria-live="polite">
          {estado.situacao === "carregando"
            ? "Carregando dados de análise."
            : estado.situacao === "pronto"
              ? `Mostrando dados: ${ROTULOS_PERIODO[periodo].toLowerCase()}.`
              : ""}
        </p>

        {estado.situacao === "carregando" && (
          <div className="grid gap-6 lg:grid-cols-2" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        )}

        {estado.situacao === "erro" && (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="size-4" />
            <AlertTitle>Não foi possível carregar a análise</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
              <p>{estado.mensagem}</p>
              <Button variant="outline" size="sm" onClick={tentarDeNovo}>
                Tentar de novo
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {estado.situacao === "pronto" && (
          <>
            <TabelaAbaixoMinimo
              produtos={estado.dados.abaixoDoMinimo}
              produtosComMinimo={estado.dados.estoqueAtual.filter((p) => p.estoqueMinimo > 0).length}
            />
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <GraficoEntradasSaidas meses={estado.dados.entradasSaidasPorMes} />
              <GraficoMaisSaidas produtos={estado.dados.maisSaidas} />
              <GraficoEntradasFornecedor fornecedores={estado.dados.entradasPorFornecedor} />
              <GraficoEstoqueAtual itens={estado.dados.estoqueAtual} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
