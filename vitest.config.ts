import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Alias "@/…" igual que en tsconfig, para poder probar rutas de la API que lo usan.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
});
