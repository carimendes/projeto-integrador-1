"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listarFornecedores,
  removerFornecedor,
} from "@/services/fornecedores/fornecedoresService";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EstoquePage() {
  const [fornecedores, setFornecedores] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const fetchFornecedores = async () => {
      try {
        const data = await listarFornecedores();
        if (isMounted) {
          setFornecedores(data);
        }
      } catch (error) {
        console.error("Erro ao carregar fornecedores:", error);
      }
    };

    fetchFornecedores();

    return () => {
      isMounted = false;
    };
  }, []);

  const removerFornecedorHandler = async (idFornecedor: string) => {
    const fornecedorRemovido = await removerFornecedor(idFornecedor);
    setFornecedores((curr) =>
      curr.filter((f) => f.id != fornecedorRemovido.id),
    );
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Listagem de Fornecedores</h1>
            <p className="text-muted-foreground">
              Visualize todos os fornecedores cadastrados
            </p>
          </div>
          <div>
            <Link href="/fornecedores/novo"><Button className="cursor-pointer">Cadastrar fornecedor</Button></Link>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fornecedores.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nenhum fornecedor encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    fornecedores
                      .sort((a, b) => a.nome.localeCompare(b.nome))
                      .map((fornecedor) => (
                        <TableRow key={fornecedor.id}>
                          <TableCell>{fornecedor.nome}</TableCell>
                          <TableCell>{fornecedor.contato}</TableCell>
                          <TableCell>{fornecedor.email}</TableCell>
                          <TableCell>{fornecedor.telefone}</TableCell>
                          <TableCell>
                            <ButtonGroup>
                              <ButtonGroupText
                                className="cursor-pointer"
                                onClick={() =>
                                  removerFornecedorHandler(fornecedor.id)
                                }
                              >
                                Remover
                              </ButtonGroupText>
                            </ButtonGroup>
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
