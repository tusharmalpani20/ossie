import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import {
  buildDocumentationConnectSrc,
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
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    buildDocumentationConnectSrc(tryItOrigins.origins),
  ].join("; ");
  return {
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
