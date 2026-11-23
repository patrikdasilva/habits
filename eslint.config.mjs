import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "public/**", "next-env.d.ts"]),
  {
    rules: {
      // Variáveis descartadas com "_" (ex.: tirar `_k` de um objeto) são intencionais.
      // O app não usa o React Compiler: ler Date.now() na renderização (relógios, "hoje") e
      // ler localStorage num efeito após montar (para não divergir do HTML do servidor) são intencionais.
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
]);
