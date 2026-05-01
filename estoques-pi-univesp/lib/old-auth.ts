import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "./db";
import bcrypt from "bcryptjs";

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

        const client = await pool.connect();

        try {
          const result = await client.query(
            "SELECT id, email, nome, esta_ativo, senha FROM usuarios WHERE email = $1",
            [credentials.email],
          );

          const user = result.rows[0];

          if (!user) {
            throw new Error("Usuário não encontrado");
          }

          if (!user.esta_ativo) {
            throw new Error("Usuário inativo. Entre em contato com um administrador.");
          }

          const isValid = await bcrypt.compare(credentials.senha, user.senha);

          if (!isValid) {
            throw new Error("Senha incorreta");
          }

          return {
            id: user.id,
            email: user.email,
            nome: user.nome,
          };
        } finally {
          client.release();
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.nome = user.nome;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
