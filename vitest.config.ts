import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@/types": resolve(__dirname, "src/types/index.ts"),
      "@services": resolve(__dirname, "src/services/index.ts"),
      "@usecases": resolve(__dirname, "src/usecases"),
      "@utils": resolve(__dirname, "src/utils"),
    },
  },
  test: {
    globals: true,
  },
});
