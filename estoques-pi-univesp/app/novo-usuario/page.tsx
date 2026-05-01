"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Package } from "lucide-react";
import { toast } from "sonner";
import { cadastrarUsuario } from "@/services/usuarios/usuariosService";

export default function PaginaCadastro() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await cadastrarUsuario(nome, email, senha);

    if (!result?.ok) {
      toast.error(result.statusText);
      setLoading(false);
    } else {
      toast.success("Cadastro realizado com sucesso! Fale com um administrador para ativar sua conta.");
      setLoading(false);
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
              <Package className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sistema de Estoque</CardTitle>
          <CardDescription>Cadastre-se e solicite sua ativação a um administrador</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCadastro} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Enviando dados..." : "Cadastrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
