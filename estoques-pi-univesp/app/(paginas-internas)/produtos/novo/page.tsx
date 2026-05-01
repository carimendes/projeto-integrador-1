"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { criarProduto } from "@/services/produtos/produtosService";

const tiposBobina = [
  "Kraft",
  "Offset",
  "Couche",
  "Duplex",
  "Cartão",
  "Reciclado",
];

export default function NovoProdutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    sku: string;
    nome: string;
    tipo_bobina: string;
    largura: string;
    gramatura: string;
    quantidade_estoque: string;
  }>({
    sku: "",
    nome: "",
    tipo_bobina: "",
    largura: "",
    gramatura: "",
    quantidade_estoque: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simula o cadastro
    const resposta = await criarProduto(formData);

    if (resposta.ok) {
      toast.success("Produto cadastrado com sucesso!");
    } else {
      toast.error("Não foi possível criar o produto no cadastro.");
    }

    setLoading(false);

    // Reseta o formulário
    setFormData({
      sku: "",
      nome: "",
      tipo_bobina: "",
      largura: "",
      gramatura: "",
      quantidade_estoque: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Cadastro de Produto</h1>
          <p className="text-muted-foreground">
            Adicione um novo tipo de bobina de papel
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Produto</CardTitle>
            <CardDescription>
              Preencha as informações da bobina de papel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  placeholder="Código de referência do produto"
                  value={formData.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="nome">Nome do Produto</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Bobina Kraft 80g"
                  value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="tipo_bobina">Tipo de Bobina</Label>
                <Select
                  value={formData.tipo_bobina}
                  onValueChange={(value) => handleChange("tipo_bobina", value)}
                  required
                >
                  <SelectTrigger id="tipo_bobina">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposBobina.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="largura">Largura (cm)</Label>
                  <Input
                    id="largura"
                    type="number"
                    placeholder="Ex: 100"
                    value={formData.largura}
                    onChange={(e) => handleChange("largura", e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="gramatura">Gramatura (g/m²)</Label>
                  <Input
                    id="gramatura"
                    type="number"
                    placeholder="Ex: 80"
                    value={formData.gramatura}
                    onChange={(e) => handleChange("gramatura", e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="quantidade_estoque">
                  Quantidade Inicial em Estoque
                </Label>
                <Input
                  id="quantidade_estoque"
                  type="number"
                  placeholder="Ex: 50"
                  value={formData.quantidade_estoque}
                  onChange={(e) =>
                    handleChange("quantidade_estoque", e.target.value)
                  }
                  min="0"
                  required
                />
              </div>

              <div className="flex gap-3 mt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar Produto"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/estoque")}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
