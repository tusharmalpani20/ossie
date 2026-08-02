import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import JSZip from "jszip";
import { afterEach, describe, expect, it } from "vitest";
import { build } from "../../app";
import { UnauthenticatedSessionError } from "../authentication/session.service";

const original_extension_root = process.env.OSSIE_EXTENSION_DIST_ROOT;
const temporary_roots: string[] = [];

const authentication_session_service = (authenticated = true) => ({
  get_current_auth_context: async () => {
    if (!authenticated) throw new UnauthenticatedSessionError();
    return {
      user: {
        id: "user_1",
        email: "member@example.com",
        display_name: "Member",
      },
      organization: { id: "organization_1", name: "Acme" },
      org_user: { id: "org_user_1", role: "member" },
      session: {
        id: "session_1",
        session_type: "web",
        expires_at: "2026-09-01T00:00:00.000Z",
      },
    };
  },
  login: async () => {
    throw new Error("not used");
  },
  logout: async () => {
    throw new Error("not used");
  },
});

afterEach(async () => {
  if (original_extension_root === undefined) {
    delete process.env.OSSIE_EXTENSION_DIST_ROOT;
  } else {
    process.env.OSSIE_EXTENSION_DIST_ROOT = original_extension_root;
  }
  await Promise.all(
    temporary_roots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

describe("extension distribution app route", () => {
  it("returns an authenticated ZIP containing the loadable extension build", async () => {
    const root = await mkdtemp(join(tmpdir(), "ossie-extension-dist-"));
    temporary_roots.push(root);
    await mkdir(join(root, "assets"));
    await writeFile(
      join(root, "manifest.json"),
      JSON.stringify({ manifest_version: 3, name: "Ossie", version: "0.1.0" }),
    );
    await writeFile(join(root, "assets", "background.js"), "export {};\n");
    process.env.OSSIE_EXTENSION_DIST_ROOT = root;

    const app = build({
      logger: false,
      access_event_writer: { append: async () => undefined },
      authentication_session_service: authentication_session_service(),
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/extension/download",
      cookies: { ossie_session: "session-token" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toBe("application/zip");
    expect(response.headers["content-disposition"]).toBe(
      'attachment; filename="ossie-extension-v0.1.0.zip"',
    );
    expect(response.headers["cache-control"]).toBe("private, no-store");
    const archive = await JSZip.loadAsync(response.rawPayload);
    expect(await archive.file("manifest.json")?.async("string")).toContain(
      '"manifest_version":3',
    );
    expect(await archive.file("assets/background.js")?.async("string")).toBe(
      "export {};\n",
    );
    await app.close();
  });

  it("requires an authenticated organization member", async () => {
    const app = build({
      logger: false,
      access_event_writer: { append: async () => undefined },
      authentication_session_service: authentication_session_service(false),
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/extension/download",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: {
        type: "unauthenticated",
        message: "Authentication is required",
      },
    });
    await app.close();
  });

  it("rejects a configured distribution root that is a symbolic link", async () => {
    const parent = await mkdtemp(join(tmpdir(), "ossie-extension-link-"));
    temporary_roots.push(parent);
    const target = join(parent, "target");
    const linked_root = join(parent, "linked-root");
    await mkdir(target);
    await writeFile(
      join(target, "manifest.json"),
      JSON.stringify({ manifest_version: 3, name: "Ossie", version: "0.1.0" }),
    );
    await symlink(target, linked_root, "dir");
    process.env.OSSIE_EXTENSION_DIST_ROOT = linked_root;

    const app = build({
      logger: false,
      access_event_writer: { append: async () => undefined },
      authentication_session_service: authentication_session_service(),
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/extension/download",
      cookies: { ossie_session: "session-token" },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: {
        type: "extension_bundle_unavailable",
        message: "The browser extension download is not available.",
      },
    });
    await app.close();
  });

  it("returns a stable unavailable response when no build can be packaged", async () => {
    process.env.OSSIE_EXTENSION_DIST_ROOT = join(
      tmpdir(),
      "missing-ossie-extension-dist",
    );
    const app = build({
      logger: false,
      access_event_writer: { append: async () => undefined },
      authentication_session_service: authentication_session_service(),
    });
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/extension/download",
      cookies: { ossie_session: "session-token" },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: {
        type: "extension_bundle_unavailable",
        message: "The browser extension download is not available.",
      },
    });
    await app.close();
  });
});
