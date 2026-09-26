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

// Função para aplicar a máscara 00.000.000/0000-00
const formatarCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove caracteres não numéricos
    .slice(0, 14) // Limita a 14 dígitos
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export default function NovoProdutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cnpj: "",
    nome: "",
    contato: "",
    email: "",
    telefone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Se a sua API/Banco esperar o CNPJ sem formatação, descomente a linha abaixo:
    // const payload = { ...formData, cnpj: formData.cnpj.replace(/\D/g, "") };

    const resposta = await cadastrarFornecedor(formData);

    if (resposta.ok) {
      toast.success("Fornecedor cadastrado com sucesso!");
      setFormData({
        cnpj: "",
        nome: "",
        contato: "",
        email: "",
        telefone: "",
      });
    } else {
      toast.error("Não foi possível cadastrar o fornecedor.");
    }

    setLoading(false);
  };

  const handleChange = async (field: string, value: string) => {
    if (field === "cnpj") {
      // Aplica a máscara visual
      const cnpjFormatado = formatarCNPJ(value);
      // Extrai apenas os números para a busca
      const cleanCnpj = value.replace(/\D/g, "");

      setFormData((prev) => ({ ...prev, cnpj: cnpjFormatado }));

      // Dispara a consulta na API somente quando atinge os 14 dígitos
      if (cleanCnpj.length === 14) {
        try {
          const response = await fetch(`/api/consulta-cnpj/${cleanCnpj}`);

          if (response.ok) {
            const data = await response.json();

            const telefoneFormatado = data.ddd_telefone_1
              ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}`
              : "";

            setFormData((prev) => ({
              ...prev,
              cnpj: cnpjFormatado,
              nome: data.nome_fantasia || data.razao_social || "",
              email: data.email || "",
              telefone: telefoneFormatado,
            }));

            toast.success("Informações do CNPJ carregadas com sucesso.");
          } else {
            toast.error("CNPJ não encontrado.");
          }
        } catch (error) {
          console.error(error);
          toast.error("Erro ao buscar informações do CNPJ.");
        }
      }
      return;
    }

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
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => handleChange("cnpj", e.target.value)}
                  maxLength={18} // 14 dígitos + 4 caracteres da máscara (pontos, barra e hífen)
                  required
                />
              </div>

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
                <Label htmlFor="contato">Contato</Label>
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
                  type="email"
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