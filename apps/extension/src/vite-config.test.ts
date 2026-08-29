// @vitest-environment node

import type { UserConfig } from "vite";
import { describe, expect, it } from "vitest";
import config from "../vite.config";

describe("extension Vite configuration", () => {
  it("does not emit module preload links for extension pages", () => {
    expect((config as UserConfig).build?.modulePreload).toBe(false);
  });
});
