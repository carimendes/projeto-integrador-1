import { defineConfig } from "vitest/config";
import path from "node:path";

/*
  Testes automatizados dos módulos de Análise de Dados e Acessibilidade.
  Rodar com: pnpm test
  Os testes de banco (tests/banco) só rodam se TEST_DATABASE_URL estiver
  definida — veja docs/testes.md.
*/
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname) },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/apoio/setup.ts"],
    environment: "node",
    testTimeout: 20000,
  },
});
