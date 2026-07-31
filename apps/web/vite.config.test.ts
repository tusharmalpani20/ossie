// @vitest-environment node

import { describe, expect, it } from "vitest";
import { build_documentation_csp } from "@repo/documentation-domain/policies/documentation-csp-policy";
import configFactory from "./vite.config";

describe("web CSP configuration", () => {
  it("uses the shared Documentation CSP policy in production", () => {
    process.env.VITE_OSSIE_API_URL = "https://api.ossie.example.com";
    process.env.OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS =
      "https://customer-api.example.com";

    const config = configFactory({
      command: "build",
      mode: "production",
      isSsrBuild: false,
      isPreview: false,
    });

    expect(config.preview?.headers).toEqual({
      "Content-Security-Policy": build_documentation_csp({
        api_origin: "https://api.ossie.example.com",
        try_it_origins: ["https://customer-api.example.com"],
      }),
    });
  });
});
