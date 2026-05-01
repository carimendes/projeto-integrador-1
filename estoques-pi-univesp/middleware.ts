import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  // rotas públicas
  const publicRoutes = ["/", "/novo-usuario"];

  // arquivos estáticos e API do NextAuth
  const isPublicFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/usuarios") ||
    pathname.startsWith("/api/dashboard") ||
    pathname.includes(".");

  if (isPublicFile) {
    return NextResponse.next();
  }

  // se não está logado e tenta acessar rota privada
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // se está logado e tenta acessar login
  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protege tudo exceto:
     * - api/auth (NextAuth)
     * - _next (assets internos)
     * - arquivos estáticos
     */
    "/((?!api/auth|_next|favicon.ico).*)",
  ],
};