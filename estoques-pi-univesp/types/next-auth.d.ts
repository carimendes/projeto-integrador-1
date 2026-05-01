// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's custom role. */
      id: string,
      nome: string
    } & DefaultSession["user"]
  }

  interface User {
    /** Extend the default User interface to include custom properties */
    id: string,
    nome: string
  }
}
