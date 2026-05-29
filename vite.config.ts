import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const backendTarget = "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/oauth2": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/login": {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  },
});
