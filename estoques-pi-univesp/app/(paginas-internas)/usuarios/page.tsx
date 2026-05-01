"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import {
  getTodosUsuarios,
  alterarStatusUsuario,
  removerUsuario,
} from "@/services/usuarios/usuariosService";
import { formatarData } from "@/lib/formatador-data";

export default function EstoquePage() {
  const [usuarios, setUsuarios] = useState([]);

  const identificaStatusUsuario = (esta_ativo: boolean) => {
    if (esta_ativo) {
      return <Badge className="bg-green-600 hover:bg-green-700">Ativo</Badge>;
    }
    return <Badge variant="destructive">Inativo</Badge>;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUsuarios = async () => {
      try {
        const data = await getTodosUsuarios();
        if (isMounted) {
          setUsuarios(data);
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

  const mudarStatusHandler = async (idUsuario: string, esta_ativo: boolean) => {
    const updatedUser: [] = await alterarStatusUsuario(idUsuario, !esta_ativo);
    setUsuarios((curr) => [
      ...curr.filter((u: any) => u.id != idUsuario),
      ...updatedUser,
    ]);
  };

  const removerUsuarioHandler = async (idUsuario: string) => {
    const removedUser = await removerUsuario(idUsuario);
    console.log(removedUser);
    setUsuarios((curr) => curr.filter((u: any) => u.id != removedUser?.id));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Administação de usuários</h1>
          <p className="text-muted-foreground">Controle de usuários</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Usuários</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data de criação</TableHead>
                    <TableHead>Última atualização</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuarios
                      .sort((a: any, b: any) => a.nome.localeCompare(b.nome))
                      .map((usuario: any) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="w-25 text-center">
                            {identificaStatusUsuario(usuario.esta_ativo)}
                          </TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>{usuario.nome}</TableCell>
                          <TableCell>
                            {formatarData(usuario.data_criacao)}
                          </TableCell>
                          <TableCell>
                            {formatarData(usuario.data_atualizacao)}
                          </TableCell>
                          <TableCell className="w-50 font-semibold">
                            <ButtonGroup>
                              <ButtonGroupText
                                className="cursor-pointer text-center"
                                onClick={() =>
                                  mudarStatusHandler(
                                    usuario.id,
                                    usuario.esta_ativo,
                                  )
                                }
                              >
                                {usuario.esta_ativo ? "Desativar" : "Ativar"}
                              </ButtonGroupText>
                              <ButtonGroupText
                                className="cursor-pointer text-center"
                                onClick={() =>
                                  removerUsuarioHandler(usuario.id)
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
