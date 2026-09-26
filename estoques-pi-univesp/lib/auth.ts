import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { sql } from "./db";
import bcrypt from "bcryptjs";

// Extensão das tipagens padrão do NextAuth para reconhecer 'id' e 'nome'
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      nome: string;
      image?: string | null;
    };
  }
  interface User {
    id: string;
    email: string;
    nome: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    nome: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          throw new Error("Credenciais inválidas");
        }

        try {
          const [user] = await sql`
            SELECT id, email, nome, esta_ativo, senha
            FROM usuarios
            WHERE email = ${credentials.email}
          `;

          if (!user) {
            throw new Error("Usuário não encontrado");
          }

          if (!user.esta_ativo) {
            throw new Error(
              "Usuário inativo. Entre em contato com um administrador."
            );
          }

          const isValid = await bcrypt.compare(
            credentials.senha,
            user.senha
          );

          if (!isValid) {
            throw new Error("Senha incorreta");
          }

          return {
            id: user.id,
            email: user.email,
            nome: user.nome,
          };
        } catch (error) {
          console.error("Erro na autenticação por credentials:", error);
          throw new Error("Erro na autenticação");
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // 1. Verifica se o usuário já existe na tabela `usuarios`
          const existingUsers = await sql`
            SELECT id FROM usuarios WHERE email = ${user.email}
          `;

          // 2. Se não existir, cadastra automaticamente (Provisionamento SSO)
          if (existingUsers.length === 0) {
            await sql`
              INSERT INTO usuarios (nome, email, senha, esta_ativo)
              VALUES (${user.name ?? "Usuário Google"}, ${user.email}, 'SSO_GOOGLE', true)
            `;
          }

          return true;
        } catch (error) {
          console.error("Erro ao provisionar usuário SSO do Google no Neon:", error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account }) {
      // Executado na criação inicial do token/login
      if (user) {
        if (account?.provider === "google") {
          // Busca o ID persistido no banco Neon para vincular ao JWT
          const [dbUser] = await sql`
            SELECT id, nome FROM usuarios WHERE email = ${user.email}
          `;
          if (dbUser) {
            token.id = dbUser.id;
            token.nome = dbUser.nome;
          }
        } else {
          // No login via Credentials, utiliza os dados já validados no authorize
          token.id = user.id;
          token.nome = user.nome;
        }
        token.email = user.email!;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.nome = token.nome;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};