"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  Boxes,
  ArrowUpDownIcon,
} from "lucide-react";
import { listarDadosDashboard } from "@/services/dashboard/dashboardService";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [dadosDashboard, setDadosDashboard] = useState<any>({});

  useEffect(() => {
    let isMounted = true;

    const fetchUsuarios = async () => {
      try {
        const data = await listarDadosDashboard();
        if (isMounted) {
          setDadosDashboard(data);
        }
      } catch (error) {
        console.error("Erro ao carregar usuários:", error);
      }
    };

    fetchUsuarios();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = [
    {
      title: "Produtos Cadastrados",
      value: dadosDashboard.produtosCadastrados,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Total em Estoque",
      value: dadosDashboard.totalEstoque,
      icon: Boxes,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "Entradas",
      value: dadosDashboard.movimentacoesEntrada,
      icon: ArrowUpCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      title: "Saídas",
      value: dadosDashboard.movimentacoesSaida,
      icon: ArrowDownCircle,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema de estoque
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards?.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bg}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {dadosDashboard?.ultimasMovimentacoes?.map((mov: any) => {
                return (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          mov.tipo_movimento === "ENTRADA"
                            ? "bg-green-100"
                            : mov.tipo_movimento === "SAIDA"
                              ? "bg-orange-100"
                              : "bg-blue-100"
                        }`}
                      >
                        {mov.tipo_movimento === "ENTRADA" ? (
                          <ArrowUpCircle className="w-4 h-4 text-green-600" />
                        ) : mov.tipo_movimento === "SAIDA" ? (
                          <ArrowDownCircle className="w-4 h-4 text-orange-600" />
                        ) : (
                          <ArrowUpDownIcon className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{mov.nome_produto}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(mov.data_criacao).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-semibold ${
                          mov.tipo_movimento === "ENTRADA"
                            ? "text-green-600"
                            : mov.tipo_movimento === "SAIDA"
                              ? "text-orange-600"
                              : "text-blue-600"
                        }`}
                      >
                        {`${mov.tipo_movimento === "ENTRADA" ? "+" : mov.tipo_movimento === "SAIDA" ? "-" : ""}` +
                          `${mov.quantidade}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
