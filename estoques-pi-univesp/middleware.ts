import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  const { pathname } = req.nextUrl;

  const publicRoutes = ["/", "/novo-usuario"];

  const isPublicFile =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/usuarios") ||
    pathname.includes(".");

  if (isPublicFile) {
    return NextResponse.next();
  }

  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

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
