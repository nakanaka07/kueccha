import { defineConfig, loadEnv } from "vite";
import reactSWC from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [reactSWC()],
    base: env.VITE_BASE_PATH || "/",
    server: {
      https: {
        key: fs.readFileSync(path.resolve(__dirname, ".local/localhost.key")),
        cert: fs.readFileSync(path.resolve(__dirname, ".local/localhost.crt")),
      },
    },
  };
});
