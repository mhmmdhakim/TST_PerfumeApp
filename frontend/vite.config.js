import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ["qrcode.react"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "lucide-react": "lucide-react/dist/esm",
    },
  },
});
