import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Config separada do vite.config.ts de propósito: os testes rodam em
// jsdom (não precisam do plugin do Tailwind, que só processa CSS), e
// manter os dois arquivos separados evita mexer na config que já
// funciona para "npm run dev" / "npm run build".
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
