import { afterEach, describe, expect, it } from "vitest";
import { get_cors_config } from "./cors.config";

describe("cors config", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("allows any browser origin outside production", () => {
    process.env.NODE_ENV = "development";
    process.env.DEV_TYPE = "development";
    delete process.env.OSSIE_CORS_ALLOWED_ORIGINS;

    const config = get_cors_config();

    expect(config.is_origin_allowed("http://localhost:3000")).toBe(true);
    expect(config.is_origin_allowed("http://example.test")).toBe(true);
  });

  it("rejects missing production allowed origins", () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_TYPE = "production";
    delete process.env.OSSIE_CORS_ALLOWED_ORIGINS;

    expect(() => get_cors_config()).toThrow(
      "OSSIE_CORS_ALLOWED_ORIGINS must be defined in production"
    );
  });

  it("allows only configured production origins including chrome extension origins", () => {
    process.env.NODE_ENV = "production";
    process.env.DEV_TYPE = "production";
    process.env.OSSIE_CORS_ALLOWED_ORIGINS = [
      "https://portal.example.com",
      "chrome-extension://abcdefghijklmnopabcdefghijklmnop",
    ].join(",");

    const config = get_cors_config();

    expect(config.is_origin_allowed(undefined)).toBe(true);
    expect(config.is_origin_allowed("https://portal.example.com")).toBe(true);
    expect(config.is_origin_allowed("chrome-extension://abcdefghijklmnopabcdefghijklmnop")).toBe(true);
    expect(config.is_origin_allowed("https://evil.example.com")).toBe(false);
  });

  it("allows the bounded public access-surface hint header", () => {
    const config = get_cors_config();

    expect(config.fastify_options.allowedHeaders).toContain(
      "X-Ossie-Access-Surface",
    );
  });
});
