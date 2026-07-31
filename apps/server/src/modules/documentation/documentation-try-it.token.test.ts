import { describe, expect, it } from "vitest";
import {
  create_documentation_try_it_attempt_token,
  verify_documentation_try_it_attempt_token,
} from "./documentation-try-it.token";

describe("Documentation Try-It attempt token", () => {
  it("round-trips only opaque keyed bindings and expires", () => {
    const now = new Date("2026-07-31T12:00:00.000Z");
    const token = create_documentation_try_it_attempt_token({
      secret: "test-signing-secret-at-least-32-bytes",
      surface: "public",
      authorization_binding: "link-entry-publication",
      policy_binding: "policy-origin-operation",
      now,
      nonce: "fixed-test-nonce",
    });
    expect(token).not.toContain("link-entry-publication");
    expect(token).not.toContain("policy-origin-operation");
    expect(
      verify_documentation_try_it_attempt_token({
        token,
        secret: "test-signing-secret-at-least-32-bytes",
        surface: "public",
        authorization_binding: "link-entry-publication",
        policy_binding: "policy-origin-operation",
        now: new Date("2026-07-31T12:04:59.000Z"),
      }),
    ).toMatchObject({ surface: "public" });
    expect(() =>
      verify_documentation_try_it_attempt_token({
        token,
        secret: "test-signing-secret-at-least-32-bytes",
        surface: "public",
        authorization_binding: "link-entry-publication",
        policy_binding: "policy-origin-operation",
        now: new Date("2026-07-31T12:05:01.000Z"),
      }),
    ).toThrow("expired");
  });

  it("rejects tampering and scope substitution", () => {
    const input = {
      secret: "test-signing-secret-at-least-32-bytes",
      surface: "internal" as const,
      authorization_binding: "edition",
      policy_binding: "policy",
      now: new Date("2026-07-31T12:00:00.000Z"),
      nonce: "fixed-test-nonce",
    };
    const token = create_documentation_try_it_attempt_token(input);
    expect(() =>
      verify_documentation_try_it_attempt_token({
        ...input,
        token: `${token.slice(0, -1)}x`,
        now: new Date("2026-07-31T12:00:01.000Z"),
      }),
    ).toThrow();
    expect(() =>
      verify_documentation_try_it_attempt_token({
        ...input,
        token,
        policy_binding: "other-policy",
        now: new Date("2026-07-31T12:00:01.000Z"),
      }),
    ).toThrow();
  });
});
