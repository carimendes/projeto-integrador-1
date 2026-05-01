"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listarProdutos } from "@/services/produtos/produtosService";

export default function EstoquePage() {
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchProdutos = async () => {
      try {
        const data = await listarProdutos();
        if (isMounted) {
          setProdutos(data);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      }
    };

    fetchProdutos();

    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Listagem de Estoque</h1>
          <p className="text-muted-foreground">
            Visualize todos os produtos cadastrados
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Produtos em Estoque</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo de Bobina</TableHead>
                    <TableHead>Largura (cm)</TableHead>
                    <TableHead>Gramatura (g/m²)</TableHead>
                    <TableHead>Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Não há produtos em estoque.
                      </TableCell>
                    </TableRow>
                  ) : (
                    produtos.map((produto: any) => (
                      <TableRow key={produto?.id}>
                        <TableCell className="font-medium">
                          {produto?.sku}
                        </TableCell>
                        <TableCell>{produto?.nome}</TableCell>
                        <TableCell>{produto?.tipo_bobina}</TableCell>
                        <TableCell>{produto?.largura}</TableCell>
                        <TableCell>{produto?.gramatura}</TableCell>
                        <TableCell className="font-semibold">
                          {produto?.quantidade_estoque}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
