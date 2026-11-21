import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    // In dev the API runs separately (npm run dev -w server); in production Fastify serves both.
    proxy: { "/api": "http://127.0.0.1:3000" },
  },
});
