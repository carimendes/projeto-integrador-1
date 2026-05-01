"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Package,
  PackagePlus,
  ArrowLeftRight,
  LayoutDashboard,
  LogOut,
  User,
  Building,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Estoque",
    href: "/estoque",
    icon: Package,
  },
  {
    title: "Novo Produto",
    href: "/produtos/novo",
    icon: PackagePlus,
  },
  {
    title: "Movimentações",
    href: "/movimentacoes",
    icon: ArrowLeftRight,
  },
  {
    title: "Fornecedores",
    href: "/fornecedores",
    icon: Building,
  },
  {
    title: "Usuários",
    href: "/usuarios",
    icon: User,
  },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">Sistema de Estoque</span>
          </div>
          <Button variant="ghost" size="sm" className="cursor-pointer" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/30 hidden md:block">
          <nav className="p-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
          <div className="flex justify-around py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
