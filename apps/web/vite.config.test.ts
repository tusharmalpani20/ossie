// @vitest-environment node

import { describe, expect, it } from "vitest";
import viteConfig from "./vite.config";

describe("web vite config", () => {
  it("proxies same-origin API calls to the backend development port", async () => {
    const resolved =
      typeof viteConfig === "function"
        ? await viteConfig({
            command: "serve",
            mode: "development",
            isSsrBuild: false,
            isPreview: false,
          })
        : viteConfig;
    expect(resolved).toMatchObject({
      server: {
        proxy: {
          "/api": {
            target: "http://localhost:3002",
          },
        },
      },
    });
  });
});
