import { describe, expect, it } from "vitest";
import {
  build_documentation_csp,
  parse_documentation_connect_origins,
} from "./documentation-csp-policy";

describe("Documentation CSP policy", () => {
  it("normalizes and sorts exact HTTPS origins deterministically", () => {
    expect(
      parse_documentation_connect_origins(
        "https://b.example.com, https://a.example.com:443",
      ),
    ).toEqual(["https://a.example.com", "https://b.example.com"]);
  });

  it("rejects broad origins and builds a restrictive shared policy", () => {
    expect(() =>
      parse_documentation_connect_origins("https://*.example.com"),
    ).toThrow();
    expect(
      build_documentation_csp({
        api_origin: "https://api.ossie.example.com",
        try_it_origins: ["https://customer-api.example.com"],
      }),
    ).toContain(
      "connect-src 'self' https://api.ossie.example.com https://customer-api.example.com",
    );
  });
});
