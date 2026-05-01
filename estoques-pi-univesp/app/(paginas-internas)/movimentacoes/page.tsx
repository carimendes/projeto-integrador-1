"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowUpCircle, ArrowDownCircle, ArrowUpDownIcon } from "lucide-react";
import {
  lancarMovimentacao,
  listarMovimentacoes,
} from "@/services/movimentacoes/movimentacoesService";
import { formatarData } from "@/lib/formatador-data";
import { listarFornecedores } from "@/services/fornecedores/fornecedoresService";
import { listarProdutos } from "@/services/produtos/produtosService";

export default function MovimentacoesPage() {
  const [loading, setLoading] = useState(false);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
  const [fornecedoresDisponiveis, setFornecedoresDisponiveis] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [formData, setFormData] = useState({
    id_produto: "",
    id_fornecedor: "",
    motivacao: "",
    referencia_externa: "",
    tipo_movimento: "",
    quantidade: "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchFornecedores = async () => {
      try {
        const data = await listarFornecedores();
        if (isMounted) {
          setFornecedoresDisponiveis(data);
        }
      } catch (error) {
        console.error("Erro ao carregar fornecedores:", error);
      }
    };

    const fetchProdutos = async () => {
      try {
        const data = await listarProdutos();
        if (isMounted) {
          setProdutosDisponiveis(data);
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
      }
    };

    fetchProdutos();

    fetchFornecedores();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectHistorico = async () => {
    setLoading(true);
    const dadosMovimentacoes = await listarMovimentacoes();
    setMovimentacoes(dadosMovimentacoes);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simula o registro da movimentação
    const respostaMovimentacao = await lancarMovimentacao(formData);

    if (respostaMovimentacao.ok) {
      const tipoTexto =
        formData.tipo_movimento === "ENTRADA"
          ? "Entrada"
          : formData.tipo_movimento === "SAIDA"
            ? "Saída"
            : "Ajuste";
      toast.success(`${tipoTexto} registrada com sucesso!`);
    } else {
      toast.error("Não foi possível lançar a movimentação.");
    }

    setLoading(false);

    // Reseta o formulário
    setFormData({
      id_produto: "",
      id_fornecedor: "",
      motivacao: "",
      referencia_externa: "",
      tipo_movimento: "",
      quantidade: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Movimentações</h1>
          <p className="text-muted-foreground">
            Registre entradas e saídas de produtos
          </p>
        </div>

        <Tabs defaultValue="registrar" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="registrar">Nova Movimentação</TabsTrigger>
            <TabsTrigger value="historico" onClick={handleSelectHistorico}>
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registrar" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Registrar Movimentação</CardTitle>
                <CardDescription>
                  Adicione uma entrada ou saída de produto do estoque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="produto">Produto</Label>
                    <Select
                      value={formData.id_produto}
                      onValueChange={(value) =>
                        handleChange("id_produto", value)
                      }
                      required
                    >
                      <SelectTrigger id="produto" className="w-100">
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtosDisponiveis.map((produto: any) => (
                          <SelectItem
                            key={produto.id}
                            value={produto.id.toString()}
                          >
                            {produto.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="fornecedor">Fornecedor</Label>
                    <Select
                      value={formData.id_fornecedor}
                      onValueChange={(value) =>
                        handleChange("id_fornecedor", value)
                      }
                    >
                      <SelectTrigger id="fornecedor" className="w-100">
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {fornecedoresDisponiveis.map((fornecedor: any) => (
                          <SelectItem
                            key={fornecedor.id}
                            value={fornecedor.id.toString()}
                          >
                            {fornecedor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tipo">Tipo de movimentação</Label>
                    <Select
                      value={formData.tipo_movimento}
                      onValueChange={(value) =>
                        handleChange("tipo_movimento", value)
                      }
                      required
                    >
                      <SelectTrigger id="tipo" className="w-100">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ENTRADA">
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle className="w-4 h-4 text-green-600" />
                            Entrada
                          </div>
                        </SelectItem>
                        <SelectItem value="SAIDA">
                          <div className="flex items-center gap-2">
                            <ArrowDownCircle className="w-4 h-4 text-orange-600" />
                            Saída
                          </div>
                        </SelectItem>
                        <SelectItem value="AJUSTE">
                          <div className="flex items-center gap-2">
                            <ArrowUpDownIcon className="w-4 h-4 text-blue-600" />
                            Ajuste
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="tel"
                      placeholder="Digite a quantidade"
                      value={formData.quantidade}
                      onChange={(e) =>
                        handleChange("quantidade", e.target.value)
                      }
                      min="1"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="referencia_externa">
                      Referência externa
                    </Label>
                    <Input
                      id="referencia_externa"
                      placeholder="Referência da origem da movimentação, ex: código do pedido da Shopee"
                      value={formData.referencia_externa}
                      onChange={(e) =>
                        handleChange("referencia_externa", e.target.value)
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="motivacao">Motivação</Label>
                    <Input
                      id="motivacao"
                      placeholder="Descreva o motivo da movimentação para melhor identificação futura"
                      value={formData.motivacao}
                      onChange={(e) =>
                        handleChange("motivacao", e.target.value)
                      }
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="mt-4">
                    {loading ? "Registrando..." : "Registrar Movimentação"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Movimentações</CardTitle>
                <CardDescription>
                  Todas as entradas e saídas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead>Motivação</TableHead>
                        <TableHead>Referência externa</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimentacoes
                        .sort((a: any, b: any) => {
                          const dateA = Date.parse(
                            a.data_criacao.replace(" ", "T"),
                          );
                          const dateB = Date.parse(
                            b.data_criacao.replace(" ", "T"),
                          );
                          return dateB - dateA;
                        })
                        .map((mov: any) => {
                          return (
                            <TableRow key={mov.id}>
                              <TableCell>{mov?.nome_produto}</TableCell>
                              <TableCell>
                                {mov.nome_fornecedor || "-"}
                              </TableCell>
                              <TableCell>{mov.motivacao || "-"}</TableCell>
                              <TableCell>
                                {mov.referencia_externa || "-"}
                              </TableCell>
                              <TableCell>{mov.nome_usuario}</TableCell>
                              <TableCell>
                                {formatarData(mov.data_criacao)}
                              </TableCell>
                              <TableCell>
                                {mov.tipo_movimento === "ENTRADA" ? (
                                  <Badge className="bg-green-600 hover:bg-green-700">
                                    <ArrowUpCircle className="w-3 h-3 mr-1" />
                                    Entrada
                                  </Badge>
                                ) : mov.tipo_movimento === "SAIDA" ? (
                                  <Badge
                                    variant="secondary"
                                    className="bg-orange-100 text-orange-700 hover:bg-orange-200"
                                  >
                                    <ArrowDownCircle className="w-3 h-3 mr-1" />
                                    Saída
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                    <ArrowUpDownIcon className="w-3 h-3 mr-1" />
                                    Ajuste
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell
                                className={`font-semibold text-right ${
                                  mov.tipo_movimento === "ENTRADA"
                                    ? "text-green-600"
                                    : mov.tipo_movimento === "SAIDA"
                                      ? "text-orange-600"
                                      : "text-blue-600"
                                }`}
                              >
                                {`${mov.tipo_movimento === "ENTRADA" ? "+" : mov.tipo_movimento === "SAIDA" ? "-" : ""}` +
                                  `${mov.quantidade}`}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
