// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/project-wintercirucs/",
  root: "src", // Set the root directory to "src"
  plugins: [react()],
  build: {
    outDir: "../dist", // Adjust output directory since "src" is now the root
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
