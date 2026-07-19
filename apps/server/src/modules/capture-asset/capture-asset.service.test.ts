import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import {
  build_capture_asset_service,
  CaptureAssetNotFoundError,
  CaptureAssetProtectedError,
  CaptureAssetPurgeFailedError,
  CaptureSessionNotFoundError,
  FileBytesNotFoundError,
  FileStorageKeyConflictError,
  InvalidCaptureAssetInputError,
  ProjectNotFoundError,
  UnsupportedCaptureAssetUploadTypeError,
  UnsupportedFileStorageProviderError,
  UnsupportedCaptureAssetTypeError,
  UploadTooLargeError,
  type CaptureAsset,
  type CaptureAssetRepository,
} from "./capture-asset.service";

const auth = {
  organization_id: "organization_1",
  actor_org_user_id: "org_user_1",
};

const capture_asset: CaptureAsset = {
  id: "capture_asset_1",
  organization_id: "organization_1",
  project_id: "project_1",
  capture_session_id: "capture_session_1",
  file: {
    id: "file_1",
    storage_provider: "local",
    mime_type: "image/png",
    size_bytes: 123456,
    original_name: "screenshot-1.png",
    checksum_sha256: "checksum",
  },
  asset_type: "screenshot",
  status: "active",
  width: 1440,
  height: 900,
  device_pixel_ratio: 1,
  page_url: "https://example.internal/app/department",
  page_title: "Department",
  captured_at: "2026-06-05T00:00:00.000Z",
  created_by_id: "org_user_1",
  updated_by_id: "org_user_1",
  version: 1,
  created_at: "2026-06-05T00:00:00.000Z",
  updated_at: "2026-06-05T00:00:00.000Z",
};

const build_repository = (): CaptureAssetRepository & {
  session_checks: unknown[];
  creates: unknown[];
  uploaded_creates: unknown[];
  lists: unknown[];
  finds: unknown[];
  file_finds: unknown[];
  deletes: unknown[];
  transactions: number;
} => {
  const session_checks: unknown[] = [];
  const creates: unknown[] = [];
  const uploaded_creates: unknown[] = [];
  const lists: unknown[] = [];
  const finds: unknown[] = [];
  const file_finds: unknown[] = [];
  const deletes: unknown[] = [];
  let transactions = 0;

  const repository: CaptureAssetRepository & {
    session_checks: unknown[];
    creates: unknown[];
    uploaded_creates: unknown[];
    lists: unknown[];
    finds: unknown[];
    file_finds: unknown[];
    deletes: unknown[];
    transactions: number;
  } = {
    session_checks,
    creates,
    uploaded_creates,
    lists,
    finds,
    file_finds,
    deletes,
    get transactions() {
      return transactions;
    },
    async transaction(callback) {
      transactions += 1;
      return callback(repository);
    },
    async capture_session_exists(input) {
      session_checks.push(input);
      return input.capture_session_id === "capture_session_1";
    },
    async project_exists(input) {
      return (
        input.project_id === "project_1" &&
        input.organization_id === "organization_1"
      );
    },
    async create_capture_asset(input) {
      creates.push(input);
      return capture_asset;
    },
    async create_uploaded_capture_asset(input) {
      uploaded_creates.push(input);
      return capture_asset;
    },
    async list_capture_assets(input) {
      lists.push(input);
      return [capture_asset];
    },
    async list_project_capture_assets(input) {
      lists.push(input);
      return [capture_asset];
    },
    async find_capture_asset(input) {
      finds.push(input);
      return input.capture_asset_id === "capture_asset_1"
        ? capture_asset
        : null;
    },
    async find_capture_asset_file(input) {
      file_finds.push(input);
      if (input.capture_asset_id !== "capture_asset_1") {
        return null;
      }

      return {
        capture_asset,
        file: {
          id: "file_1",
          storage_provider: "local",
          storage_key:
            "organizations/organization_1/projects/project_1/capture-sessions/capture_session_1/file_1.png",
          mime_type: "image/png",
          size_bytes: 14,
        },
      };
    },
    async transition_capture_asset(input) {
      deletes.push(input);
      return input.capture_asset_id === "capture_asset_1"
        ? { ...capture_asset, status: input.status, version: 2 }
        : null;
    },
    async get_capture_asset_protection(input) {
      return input.capture_asset_id === "capture_asset_1"
        ? {
            capture_asset_id: input.capture_asset_id,
            status: "archived" as const,
            purge_operation_status: null,
            can_purge: true,
            total_dependency_count: 0,
            dependencies: [],
          }
        : null;
    },
    async find_completed_capture_asset_purge() {
      return null;
    },
    async begin_capture_asset_purge(input) {
      return {
        operation: {
          capture_asset_id: input.capture_asset_id,
          purge_operation_id: "purge_1",
          status: "pending" as const,
          attempt_count: 1,
        },
        storage_key: "asset.png",
        completed: false,
      };
    },
    async fail_capture_asset_purge(input) {
      return {
        capture_asset_id: input.capture_asset_id,
        purge_operation_id: input.operation_id,
        status: "failed" as const,
        attempt_count: 1,
      };
    },
    async complete_capture_asset_purge(input) {
      return {
        capture_asset_id: input.capture_asset_id,
        purge_operation_id: input.operation_id,
        status: "completed" as const,
        attempt_count: 1,
      };
    },
  };

  return repository;
};

const build_file_storage = () => {
  const puts: unknown[] = [];
  const gets: unknown[] = [];
  const deletes: unknown[] = [];

  return {
    puts,
    gets,
    deletes,
    async put(input: unknown) {
      puts.push(input);
      return {
        storage_provider: "local" as const,
        storage_key:
          "organizations/organization_1/projects/project_1/capture-sessions/capture_session_1/file_1.png",
        size_bytes: 14,
        checksum_sha256: "checksum",
      };
    },
    async get(input: unknown) {
      gets.push(input);
      return {
        stream: Readable.from(Buffer.from("fake png bytes")),
        size_bytes: 14,
      };
    },
    async delete_best_effort(input: unknown) {
      deletes.push(input);
    },
    async purge_exact(input: unknown) {
      deletes.push(input);
    },
  };
};

describe("capture asset service", () => {
  it("uploads screenshot bytes only after verifying project and capture session scope", async () => {
    const repository = build_repository();
    const file_storage = build_file_storage();
    const service = build_capture_asset_service(repository, {
      file_storage,
      max_upload_bytes: 20,
    });

    await expect(
      service.upload_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        file: {
          stream: Readable.from(Buffer.from("fake png bytes")),
          mime_type: "image/png",
          original_name: " screenshot.png ",
        },
        data: {
          width: 1440,
          height: 900,
          device_pixel_ratio: 2,
          page_url: " https://example.internal ",
          page_title: " Example ",
          metadata: { step: 1 },
        },
      }),
    ).resolves.toEqual(capture_asset);

    expect(repository.session_checks).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      },
    ]);
    expect(file_storage.puts).toHaveLength(1);
    expect(file_storage.puts[0]).toMatchObject({
      organization_id: "organization_1",
      project_id: "project_1",
      capture_session_id: "capture_session_1",
      mime_type: "image/png",
      max_size_bytes: 20,
    });
    expect(repository.uploaded_creates).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        actor_org_user_id: "org_user_1",
        file_id: expect.any(String),
        capture_asset_id: expect.any(String),
        data: {
          asset_type: "screenshot",
          width: 1440,
          height: 900,
          device_pixel_ratio: 2,
          page_url: "https://example.internal",
          page_title: "Example",
          captured_at: undefined,
          metadata: { step: 1 },
          file: {
            storage_provider: "local",
            storage_key:
              "organizations/organization_1/projects/project_1/capture-sessions/capture_session_1/file_1.png",
            mime_type: "image/png",
            size_bytes: 14,
            original_name: "screenshot.png",
            checksum_sha256: "checksum",
            metadata: undefined,
          },
        },
      },
    ]);
  });

  it("rejects invalid uploads before writing file bytes", async () => {
    const repository = build_repository();
    const file_storage = build_file_storage();
    const service = build_capture_asset_service(repository, {
      file_storage,
      max_upload_bytes: 4,
    });

    await expect(
      service.upload_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        file: {
          stream: Readable.from(Buffer.from("html")),
          mime_type: "text/html",
          original_name: "capture.html",
        },
        data: {},
      }),
    ).rejects.toBeInstanceOf(UnsupportedCaptureAssetUploadTypeError);

    await expect(
      service.upload_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        file: {
          stream: Readable.from(Buffer.from("fake png bytes")),
          mime_type: "image/png",
          original_name: "capture.png",
          declared_size_bytes: 5,
        },
        data: {},
      }),
    ).rejects.toBeInstanceOf(UploadTooLargeError);

    expect(file_storage.puts).toEqual([]);
    expect(repository.uploaded_creates).toEqual([]);
  });

  it("deletes uploaded bytes if capture asset metadata creation fails", async () => {
    const repository = build_repository();
    const file_storage = build_file_storage();
    repository.create_uploaded_capture_asset = async () => {
      throw new FileStorageKeyConflictError();
    };
    const service = build_capture_asset_service(repository, {
      file_storage,
      max_upload_bytes: 20,
    });

    await expect(
      service.upload_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        file: {
          stream: Readable.from(Buffer.from("fake png bytes")),
          mime_type: "image/png",
          original_name: "capture.png",
        },
        data: {},
      }),
    ).rejects.toBeInstanceOf(FileStorageKeyConflictError);

    expect(file_storage.deletes).toEqual([
      {
        storage_key:
          "organizations/organization_1/projects/project_1/capture-sessions/capture_session_1/file_1.png",
      },
    ]);
  });

  it("deletes uploaded bytes if the enclosing Audit transaction fails at commit", async () => {
    const repository = build_repository();
    const file_storage = build_file_storage();
    const original_transaction = repository.transaction.bind(repository);
    repository.transaction = async (callback) => {
      await original_transaction(callback);
      throw new Error("synthetic audit commit failure");
    };
    const service = build_capture_asset_service(repository, {
      file_storage,
      max_upload_bytes: 20,
    });

    await expect(
      service.upload_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        file: {
          stream: Readable.from(Buffer.from("fake png bytes")),
          mime_type: "image/png",
          original_name: "capture.png",
        },
        data: {},
      }),
    ).rejects.toThrow("synthetic audit commit failure");

    expect(file_storage.deletes).toEqual([
      {
        storage_key:
          "organizations/organization_1/projects/project_1/capture-sessions/capture_session_1/file_1.png",
      },
    ]);
  });

  it("streams stored file bytes for an accessible capture asset", async () => {
    const repository = build_repository();
    const file_storage = build_file_storage();
    const service = build_capture_asset_service(repository, { file_storage });

    await expect(
      service.get_capture_asset_file({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
      }),
    ).resolves.toMatchObject({
      mime_type: "image/png",
      size_bytes: 14,
    });

    expect(repository.file_finds).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
      },
    ]);
    expect(file_storage.gets).toEqual([
      {
        storage_key:
          "organizations/organization_1/projects/project_1/capture-sessions/capture_session_1/file_1.png",
      },
    ]);
  });

  it("maps missing and unsupported stored file reads", async () => {
    const repository = build_repository();
    const file_storage = build_file_storage();
    file_storage.get = async () => {
      throw new FileBytesNotFoundError();
    };
    const service = build_capture_asset_service(repository, { file_storage });

    await expect(
      service.get_capture_asset_file({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "missing",
      }),
    ).rejects.toBeInstanceOf(CaptureAssetNotFoundError);

    await expect(
      service.get_capture_asset_file({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
      }),
    ).rejects.toBeInstanceOf(FileBytesNotFoundError);

    repository.find_capture_asset_file = async () => ({
      capture_asset,
      file: {
        id: "file_1",
        storage_provider: "external",
        storage_key: "external://file",
        mime_type: "image/png",
        size_bytes: 14,
      },
    });

    await expect(
      service.get_capture_asset_file({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
      }),
    ).rejects.toBeInstanceOf(UnsupportedFileStorageProviderError);
  });

  it("creates screenshot asset metadata under an accessible capture session transactionally", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(
      service.create_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: {
          asset_type: "screenshot",
          width: 1440,
          height: 900,
          device_pixel_ratio: 1,
          page_url: " https://example.internal/app/department ",
          page_title: " Department ",
          file: {
            storage_provider: "local",
            storage_key: " captures/org/project/session/screenshot-1.png ",
            mime_type: " image/png ",
            size_bytes: 123456,
            original_name: " screenshot-1.png ",
            checksum_sha256: " checksum ",
          },
          metadata: { capture_mode: "manual" },
        },
      }),
    ).resolves.toEqual(capture_asset);

    expect(repository.transactions).toBe(1);
    expect(repository.session_checks).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
      },
    ]);
    expect(repository.creates).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        actor_org_user_id: "org_user_1",
        data: {
          asset_type: "screenshot",
          width: 1440,
          height: 900,
          device_pixel_ratio: 1,
          page_url: "https://example.internal/app/department",
          page_title: "Department",
          captured_at: undefined,
          metadata: { capture_mode: "manual" },
          file: {
            storage_provider: "local",
            storage_key: "captures/org/project/session/screenshot-1.png",
            mime_type: "image/png",
            size_bytes: 123456,
            original_name: "screenshot-1.png",
            checksum_sha256: "checksum",
            metadata: undefined,
          },
        },
      },
    ]);
  });

  it("rejects unsupported asset types and non-image screenshot files", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(
      service.create_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: {
          asset_type: "html_snapshot",
          file: {
            storage_key: "capture.html",
            mime_type: "text/html",
            size_bytes: 1,
          },
        },
      }),
    ).rejects.toBeInstanceOf(UnsupportedCaptureAssetTypeError);

    await expect(
      service.create_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: {
          asset_type: "screenshot",
          file: {
            storage_key: "capture.txt",
            mime_type: "text/plain",
            size_bytes: 1,
          },
        },
      }),
    ).rejects.toBeInstanceOf(InvalidCaptureAssetInputError);
  });

  it("maps missing capture sessions and duplicate storage keys", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(
      service.create_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "missing",
        data: {
          asset_type: "screenshot",
          file: {
            storage_key: "capture.png",
            mime_type: "image/png",
            size_bytes: 1,
          },
        },
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    repository.create_capture_asset = async () => {
      throw new FileStorageKeyConflictError();
    };

    await expect(
      service.create_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        data: {
          asset_type: "screenshot",
          file: {
            storage_key: "capture.png",
            mime_type: "image/png",
            size_bytes: 1,
          },
        },
      }),
    ).rejects.toBeInstanceOf(FileStorageKeyConflictError);
  });

  it("rejects operations when the project is missing before checking capture sessions", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(
      service.create_capture_asset({
        auth,
        project_id: "missing_project",
        capture_session_id: "capture_session_1",
        data: {
          asset_type: "screenshot",
          file: {
            storage_key: "capture.png",
            mime_type: "image/png",
            size_bytes: 1,
          },
        },
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(
      service.list_capture_assets({
        auth,
        project_id: "missing_project",
        capture_session_id: "capture_session_1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(
      service.get_capture_asset({
        auth,
        project_id: "missing_project",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
    await expect(
      service.archive_capture_asset({
        auth,
        project_id: "missing_project",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 1,
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);

    expect(repository.session_checks).toEqual([]);
    expect(repository.creates).toEqual([]);
    expect(repository.lists).toEqual([]);
    expect(repository.finds).toEqual([]);
    expect(repository.deletes).toEqual([]);
  });

  it("lists, gets, and archives capture assets in scope after checking the capture session", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(
      service.list_capture_assets({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
        include_archived: undefined,
      }),
    ).resolves.toEqual([capture_asset]);
    await expect(
      service.get_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
      }),
    ).resolves.toEqual(capture_asset);
    await expect(
      service.get_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "missing",
      }),
    ).rejects.toBeInstanceOf(CaptureAssetNotFoundError);
    await expect(
      service.archive_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 1,
      }),
    ).resolves.toMatchObject({ status: "archived", version: 2 });

    expect(repository.lists).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        asset_type: "screenshot",
      },
    ]);
    expect(repository.session_checks).toHaveLength(4);
    expect(repository.finds).toHaveLength(3);
    expect(repository.deletes).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        actor_org_user_id: "org_user_1",
        expected_asset_version: 1,
        status: "archived",
      },
    ]);
  });

  it("lists project screenshot assets and rejects non-screenshot picker filters", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(
      service.list_project_capture_assets({
        auth,
        project_id: "project_1",
        project_version_id: "version_1",
      }),
    ).resolves.toEqual([
      {
        ...capture_asset,
        file_url:
          "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/file",
      },
    ]);

    await expect(
      service.list_project_capture_assets({
        auth,
        project_id: "project_1",
        project_version_id: "version_1",
        asset_type: "redacted_screenshot",
      }),
    ).resolves.toEqual([
      {
        ...capture_asset,
        file_url:
          "/api/v1/projects/project_1/capture-sessions/capture_session_1/assets/capture_asset_1/file",
      },
    ]);

    await expect(
      service.list_project_capture_assets({
        auth,
        project_id: "project_1",
        project_version_id: "version_1",
        asset_type: "html_snapshot",
      }),
    ).rejects.toBeInstanceOf(UnsupportedCaptureAssetTypeError);

    expect(repository.lists).toEqual([
      {
        organization_id: "organization_1",
        project_id: "project_1",
        project_version_id: "version_1",
        asset_type: "screenshot",
      },
      {
        organization_id: "organization_1",
        project_id: "project_1",
        project_version_id: "version_1",
        asset_type: "redacted_screenshot",
      },
    ]);
  });

  it("rejects list get and delete when the capture session is missing", async () => {
    const repository = build_repository();
    const service = build_capture_asset_service(repository);

    await expect(
      service.list_capture_assets({
        auth,
        project_id: "project_1",
        capture_session_id: "missing",
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);
    await expect(
      service.get_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "missing",
        capture_asset_id: "capture_asset_1",
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);
    await expect(
      service.archive_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "missing",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 1,
      }),
    ).rejects.toBeInstanceOf(CaptureSessionNotFoundError);

    expect(repository.lists).toEqual([]);
    expect(repository.finds).toEqual([]);
    expect(repository.deletes).toEqual([]);
  });

  it("physically purges outside the database transaction and then completes the tombstone", async () => {
    const repository = build_repository();
    const file_storage = build_file_storage();
    const service = build_capture_asset_service(repository, { file_storage });

    await expect(
      service.purge_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 2,
      }),
    ).resolves.toMatchObject({ status: "completed" });
    expect(file_storage.deletes).toEqual([{ storage_key: "asset.png" }]);
    expect(repository.transactions).toBe(2);
  });

  it("returns the bounded dependency report when protection blocks purge", async () => {
    const repository = build_repository();
    const protection = {
      capture_asset_id: "capture_asset_1",
      status: "archived" as const,
      purge_operation_status: null,
      can_purge: false,
      total_dependency_count: 1,
      dependencies: [
        {
          dependency_type: "guide_revision" as const,
          artifact_id: "guide_1",
          edition_id: "edition_1",
          revision_number: 2,
        },
      ],
    };
    repository.get_capture_asset_protection = async () => protection;
    const service = build_capture_asset_service(repository, {
      file_storage: build_file_storage(),
    });

    const error = await service
      .purge_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 2,
      })
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(CaptureAssetProtectedError);
    expect(error).toMatchObject({ details: protection });
  });

  it("turns a database protection race into the same actionable conflict", async () => {
    const repository = build_repository();
    const protection = {
      capture_asset_id: "capture_asset_1",
      status: "archived" as const,
      purge_operation_status: null,
      can_purge: true,
      total_dependency_count: 0,
      dependencies: [],
    };
    repository.get_capture_asset_protection = async () => protection;
    repository.begin_capture_asset_purge = async () => {
      throw { constraint: "capture_asset_purge_protection_guard" };
    };
    const service = build_capture_asset_service(repository, {
      file_storage: build_file_storage(),
    });

    const error = await service
      .purge_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 2,
      })
      .catch((value: unknown) => value);

    expect(error).toBeInstanceOf(CaptureAssetProtectedError);
    expect(error).toMatchObject({ details: protection });
  });

  it("returns a completed purge for a stale Row Version without touching storage", async () => {
    const repository = build_repository();
    repository.find_completed_capture_asset_purge = async () => ({
      capture_asset_id: "capture_asset_1",
      purge_operation_id: "purge_1",
      status: "completed",
      attempt_count: 2,
    });
    repository.get_capture_asset_protection = async () => {
      throw new Error("completed replay must not require a live Asset");
    };
    const file_storage = build_file_storage();
    const service = build_capture_asset_service(repository, { file_storage });

    await expect(
      service.purge_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 1,
      }),
    ).resolves.toMatchObject({ status: "completed", attempt_count: 2 });
    expect(file_storage.deletes).toEqual([]);
    expect(repository.transactions).toBe(1);
  });

  it("records exact storage failure and surfaces a retryable purge error", async () => {
    const repository = build_repository();
    const file_storage = build_file_storage();
    file_storage.purge_exact = async () => {
      throw new Error("disk unavailable");
    };
    const service = build_capture_asset_service(repository, { file_storage });

    await expect(
      service.purge_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 2,
      }),
    ).rejects.toBeInstanceOf(CaptureAssetPurgeFailedError);
    expect(repository.transactions).toBe(2);
  });

  it("returns a concurrent completed purge when storage failure loses the completion race", async () => {
    const repository = build_repository();
    repository.fail_capture_asset_purge = async (input) => ({
      capture_asset_id: input.capture_asset_id,
      purge_operation_id: input.operation_id,
      status: "completed",
      attempt_count: 1,
    });
    const file_storage = build_file_storage();
    file_storage.purge_exact = async () => {
      throw new Error("concurrent request removed the bytes");
    };
    const service = build_capture_asset_service(repository, { file_storage });

    await expect(
      service.purge_capture_asset({
        auth,
        project_id: "project_1",
        capture_session_id: "capture_session_1",
        capture_asset_id: "capture_asset_1",
        expected_asset_version: 2,
      }),
    ).resolves.toMatchObject({ status: "completed" });
  });
});
