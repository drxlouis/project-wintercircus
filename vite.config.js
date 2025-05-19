// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/project-wintercirucs/", // Ensure this matches your GitHub Pages repo name
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
