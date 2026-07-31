import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import { build_documentation_csp } from "@repo/documentation-domain/policies/documentation-csp-policy";
import {
  parseDocumentationTryItConnectOrigins,
} from "./src/lib/documentationCsp";

export default defineConfig(({ mode }) => {
  const environment = {
    ...process.env,
    ...loadEnv(mode, process.cwd(), ""),
  };
  const apiProxyTarget =
    environment.VITE_OSSIE_API_URL ?? "http://localhost:3002";
  const tryItOrigins = parseDocumentationTryItConnectOrigins(
    environment.OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS ??
      environment.VITE_OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS,
  );
  const apiOrigin = (() => {
    try {
      return new URL(apiProxyTarget).origin;
    } catch {
      return null;
    }
  })();
  const csp = build_documentation_csp({
    ...(apiOrigin ? { api_origin: apiOrigin } : {}),
    try_it_origins: tryItOrigins.origins,
    ...(mode === "development"
      ? { development_script_origin: "'unsafe-inline'" }
      : {}),
  });
  return {
    build: {
      manifest: true,
    },
    define: {
      __OSSIE_DOCUMENTATION_TRY_IT_ORIGIN_SET_DIGEST__: JSON.stringify(
        tryItOrigins.digest,
      ),
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "ossie-documentation-csp",
        transformIndexHtml: {
          order: "pre",
          handler: () => [
            {
              tag: "meta",
              attrs: {
                "http-equiv": "Content-Security-Policy",
                content: csp,
              },
              injectTo: "head-prepend",
            },
          ],
        },
      },
    ],
    server: {
      port: 3000,
      headers: { "Content-Security-Policy": csp },
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3000,
      headers: { "Content-Security-Policy": csp },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  };
});
