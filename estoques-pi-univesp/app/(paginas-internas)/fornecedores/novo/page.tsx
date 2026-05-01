"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cadastrarFornecedor } from "@/services/fornecedores/fornecedoresService";

export default function NovoProdutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    contato: "",
    email: "",
    telefone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const resposta = await cadastrarFornecedor(formData);

    if (resposta.ok) {
      toast.success("Fornecedor cadastrado com sucesso!");
    } else {
      toast.error("Não foi possível cadastrar o fornecedor.");
    }

    setLoading(false);

    // Reseta o formulário
    setFormData({
      nome: "",
      contato: "",
      email: "",
      telefone: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">Cadastro de Fornecedor</h1>
        </div>

        <Card>
          <CardHeader>
            <CardDescription>
              Preencha as informações do fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  placeholder="Nome fantasia da empresa"
                  value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="nome">Contato</Label>
                <Input
                  id="contato"
                  placeholder="Nome do contato no fornecedor"
                  value={formData.contato}
                  onChange={(e) => handleChange("contato", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  placeholder="E-mail"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="Telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  type="tel"
                  required
                />
              </div>

              <div className="flex gap-3 mt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar fornecedor"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/fornecedores")}
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
