// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  vite: {
    envDir: "..",
    envPrefix: ["PUBLIC_", "REACT_APP_"],
    plugins: [tailwindcss()],
    server: {
      proxy: {
        "/app": {
          target: "http://127.0.0.1:3000",
          changeOrigin: true,
          ws: true
        },
        "/ws": {
          target: "http://127.0.0.1:3000",
          ws: true
        }
      }
    }
  }
});
