import { defineConfig, loadEnv } from "vite";
import reactSWC from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  // 本番環境またはCI環境ではHTTPSを無効に
  const isProduction = mode === "production" || process.env.CI === "true";

  return {
    plugins: [reactSWC()],
    base: env.VITE_BASE_PATH || "/",    
    server: {
      // 開発環境でのみHTTPSを有効化
      https: !isProduction
        ? {
            key: fs.readFileSync(path.resolve(__dirname, ".local/localhost.key")),
            cert: fs.readFileSync(path.resolve(__dirname, ".local/localhost.crt")),
          }
        : undefined,
    },
  };
});
