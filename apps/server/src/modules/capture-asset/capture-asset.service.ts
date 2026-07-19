import type { CaptureAssetType, FileStorageProvider } from "@repo/constants";
import {
  assert_supported_screenshot_upload_mime_type,
  assert_upload_size_within_limit,
  compact_optional_string,
} from "@repo/file-domain";
import {
  CaptureAssetNotFoundError,
  CaptureSessionNotFoundError,
  InvalidCaptureAssetInputError,
  InvalidCaptureAssetUploadError,
  UnsupportedCaptureAssetTypeError,
  UnsupportedCaptureAssetUploadTypeError,
  UploadTooLargeError,
  assert_project_screenshot_picker_asset_type,
  build_capture_session_asset_file_url,
  map_file_domain_upload_policy_error,
  normalize_create_capture_asset,
  normalize_upload_capture_asset,
  type CreateCaptureAssetInput,
  type NormalizedCreateCaptureAssetInput,
  type UploadCaptureAssetInput,
} from "@repo/capture-domain";
import { ulid } from "ulid";
import {
  type ReadStoredFile,
  type StoredFile,
  FileBytesNotFoundError,
  FileStorageUploadTooLargeError,
  FileStorageWriteFailedError,
} from "../file-storage/local-file-storage.provider.js";

export {
  FileBytesNotFoundError,
  FileStorageUploadTooLargeError,
  FileStorageWriteFailedError,
};

export type { CaptureAssetType, FileStorageProvider };

export type CaptureAssetAuthContext = {
  organization_id: string;
  actor_org_user_id: string;
};

export type CaptureAsset = {
  id: string;
  organization_id: string;
  project_id: string;
  capture_session_id: string;
  file: {
    id: string;
    storage_provider: FileStorageProvider;
    mime_type: string;
    size_bytes: number;
    original_name: string | null;
    checksum_sha256: string | null;
  };
  asset_type: CaptureAssetType;
  width: number | null;
  height: number | null;
  device_pixel_ratio: number | null;
  page_url: string | null;
  page_title: string | null;
  captured_at: string;
  created_by_id: string;
  updated_by_id: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type CaptureAssetWithFileUrl = CaptureAsset & {
  file_url: string;
};

export type {
  CreateCaptureAssetInput,
  NormalizedCreateCaptureAssetInput,
  UploadCaptureAssetInput,
};

export type CaptureAssetFile = {
  capture_asset: CaptureAsset;
  file: {
    id: string;
    storage_provider: FileStorageProvider;
    storage_key: string;
    mime_type: string;
    size_bytes: number;
  };
};

export type CaptureAssetFileRead = ReadStoredFile & {
  mime_type: string;
};

export type CaptureAssetFileStorage = {
  put: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    file_id: string;
    mime_type: string;
    stream: NodeJS.ReadableStream;
    max_size_bytes: number;
  }) => Promise<StoredFile>;
  get: (input: { storage_key: string }) => Promise<ReadStoredFile>;
  delete_best_effort: (input: { storage_key: string }) => Promise<void>;
};

export type CaptureAssetRepository = {
  transaction: <Result>(
    callback: (
      repository: CaptureAssetTransactionalRepository,
    ) => Promise<Result>,
  ) => Promise<Result>;
} & CaptureAssetTransactionalRepository;

export type CaptureAssetTransactionalRepository = {
  project_exists: (input: {
    organization_id: string;
    project_id: string;
  }) => Promise<boolean>;
  capture_session_exists: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => Promise<boolean>;
  create_capture_asset: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    data: NormalizedCreateCaptureAssetInput;
  }) => Promise<CaptureAsset>;
  create_uploaded_capture_asset: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    actor_org_user_id: string;
    file_id: string;
    capture_asset_id: string;
    data: NormalizedCreateCaptureAssetInput;
  }) => Promise<CaptureAsset>;
  list_capture_assets: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    asset_type?: CaptureAssetType;
  }) => Promise<CaptureAsset[]>;
  list_project_capture_assets: (input: {
    organization_id: string;
    project_id: string;
    project_version_id: string;
    asset_type?: CaptureAssetType;
  }) => Promise<CaptureAsset[]>;
  find_capture_asset: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) => Promise<CaptureAsset | null>;
  find_capture_asset_file: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) => Promise<CaptureAssetFile | null>;
  delete_capture_asset: (input: {
    organization_id: string;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
    actor_org_user_id: string;
  }) => Promise<boolean>;
};

export class ProjectNotFoundError extends Error {
  constructor() {
    super("Project was not found");
  }
}

export class UploadFileRequiredError extends Error {
  constructor() {
    super("Upload file is required");
  }
}

export class UnsupportedFileStorageProviderError extends Error {
  constructor() {
    super("File storage provider is not supported");
  }
}

export class FileStorageKeyConflictError extends Error {
  constructor() {
    super("File storage key already exists");
  }
}

export {
  CaptureAssetNotFoundError,
  CaptureSessionNotFoundError,
  InvalidCaptureAssetInputError,
  InvalidCaptureAssetUploadError,
  UnsupportedCaptureAssetTypeError,
  UnsupportedCaptureAssetUploadTypeError,
  UploadTooLargeError,
};

export const build_capture_asset_service = (
  repository: CaptureAssetRepository,
  options: {
    file_storage?: CaptureAssetFileStorage;
    max_upload_bytes?: number;
  } = {},
) => {
  const max_upload_bytes = options.max_upload_bytes ?? 10 * 1024 * 1024;

  const ensure_project_exists = async (input: {
    repository: CaptureAssetTransactionalRepository;
    organization_id: string;
    project_id: string;
  }) => {
    const exists = await input.repository.project_exists({
      organization_id: input.organization_id,
      project_id: input.project_id,
    });

    if (!exists) {
      throw new ProjectNotFoundError();
    }
  };

  const ensure_capture_session_exists = async (input: {
    repository: CaptureAssetTransactionalRepository;
    organization_id: string;
    project_id: string;
    capture_session_id: string;
  }) => {
    const exists = await input.repository.capture_session_exists({
      organization_id: input.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    if (!exists) {
      throw new CaptureSessionNotFoundError();
    }
  };

  const create_capture_asset = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    data: CreateCaptureAssetInput;
  }) => {
    const data = normalize_create_capture_asset(input.data);

    return repository.transaction(async (transactional_repository) => {
      await ensure_project_exists({
        repository: transactional_repository,
        organization_id: input.auth.organization_id,
        project_id: input.project_id,
      });

      await ensure_capture_session_exists({
        repository: transactional_repository,
        organization_id: input.auth.organization_id,
        project_id: input.project_id,
        capture_session_id: input.capture_session_id,
      });

      return transactional_repository.create_capture_asset({
        organization_id: input.auth.organization_id,
        project_id: input.project_id,
        capture_session_id: input.capture_session_id,
        actor_org_user_id: input.auth.actor_org_user_id,
        data,
      });
    });
  };

  const upload_capture_asset = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    file: {
      stream: NodeJS.ReadableStream;
      mime_type: string;
      original_name?: string | null;
      declared_size_bytes?: number;
    };
    data: UploadCaptureAssetInput;
  }) => {
    if (!options.file_storage) {
      throw new FileStorageWriteFailedError();
    }
    const file_storage = options.file_storage;

    let mime_type: string;

    try {
      mime_type = assert_supported_screenshot_upload_mime_type(
        input.file.mime_type,
      );
      assert_upload_size_within_limit({
        declared_size_bytes: input.file.declared_size_bytes,
        max_upload_bytes,
      });
    } catch (error) {
      const capture_error = map_file_domain_upload_policy_error(error);
      if (capture_error) {
        throw capture_error;
      }

      throw error;
    }

    const data = normalize_upload_capture_asset(input.data);

    const storage_state: { file: StoredFile | null } = { file: null };
    try {
      return await repository.transaction(async (transactional_repository) => {
        await ensure_project_exists({
          repository: transactional_repository,
          organization_id: input.auth.organization_id,
          project_id: input.project_id,
        });

        await ensure_capture_session_exists({
          repository: transactional_repository,
          organization_id: input.auth.organization_id,
          project_id: input.project_id,
          capture_session_id: input.capture_session_id,
        });

        const file_id = ulid();
        const capture_asset_id = ulid();
        storage_state.file = await file_storage.put({
          organization_id: input.auth.organization_id,
          project_id: input.project_id,
          capture_session_id: input.capture_session_id,
          file_id,
          mime_type,
          stream: input.file.stream,
          max_size_bytes: max_upload_bytes,
        });

        return transactional_repository.create_uploaded_capture_asset({
          organization_id: input.auth.organization_id,
          project_id: input.project_id,
          capture_session_id: input.capture_session_id,
          actor_org_user_id: input.auth.actor_org_user_id,
          file_id,
          capture_asset_id,
          data: {
            asset_type: "screenshot",
            width: data.width,
            height: data.height,
            device_pixel_ratio: data.device_pixel_ratio,
            page_url: data.page_url,
            page_title: data.page_title,
            captured_at: data.captured_at,
            metadata: data.metadata,
            file: {
              storage_provider: storage_state.file.storage_provider,
              storage_key: storage_state.file.storage_key,
              mime_type,
              size_bytes: storage_state.file.size_bytes,
              original_name: compact_optional_string(input.file.original_name),
              checksum_sha256: storage_state.file.checksum_sha256,
              metadata: undefined,
            },
          },
        });
      });
    } catch (error) {
      if (storage_state.file) {
        await file_storage.delete_best_effort({
          storage_key: storage_state.file.storage_key,
        });
      }
      if (error instanceof FileStorageUploadTooLargeError) {
        throw new UploadTooLargeError();
      }
      throw error;
    }
  };

  const list_capture_assets = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    asset_type?: CaptureAssetType;
  }) => {
    await ensure_project_exists({
      repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    await ensure_capture_session_exists({
      repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    return repository.list_capture_assets({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      asset_type: input.asset_type,
    });
  };

  const list_project_capture_assets = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    project_version_id: string;
    asset_type?: CaptureAssetType;
  }): Promise<CaptureAssetWithFileUrl[]> => {
    const asset_type = assert_project_screenshot_picker_asset_type(
      input.asset_type,
    );

    await ensure_project_exists({
      repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    const assets = await repository.list_project_capture_assets({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      project_version_id: input.project_version_id,
      asset_type,
    });

    return assets.map((asset) => ({
      ...asset,
      file_url: build_capture_session_asset_file_url(asset),
    }));
  };

  const get_capture_asset = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) => {
    await ensure_project_exists({
      repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    await ensure_capture_session_exists({
      repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    const capture_asset = await repository.find_capture_asset({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      capture_asset_id: input.capture_asset_id,
    });

    if (!capture_asset) {
      throw new CaptureAssetNotFoundError();
    }

    return capture_asset;
  };

  const get_capture_asset_file = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }): Promise<CaptureAssetFileRead> => {
    if (!options.file_storage) {
      throw new UnsupportedFileStorageProviderError();
    }

    await ensure_project_exists({
      repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
    });

    await ensure_capture_session_exists({
      repository,
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
    });

    const capture_asset_file = await repository.find_capture_asset_file({
      organization_id: input.auth.organization_id,
      project_id: input.project_id,
      capture_session_id: input.capture_session_id,
      capture_asset_id: input.capture_asset_id,
    });

    if (!capture_asset_file) {
      throw new CaptureAssetNotFoundError();
    }

    if (capture_asset_file.file.storage_provider !== "local") {
      throw new UnsupportedFileStorageProviderError();
    }

    const stored_file = await options.file_storage.get({
      storage_key: capture_asset_file.file.storage_key,
    });

    return {
      ...stored_file,
      mime_type: capture_asset_file.file.mime_type,
    };
  };

  const delete_capture_asset = async (input: {
    auth: CaptureAssetAuthContext;
    project_id: string;
    capture_session_id: string;
    capture_asset_id: string;
  }) =>
    repository.transaction(async (transactional_repository) => {
      await ensure_project_exists({
        repository: transactional_repository,
        organization_id: input.auth.organization_id,
        project_id: input.project_id,
      });

      await ensure_capture_session_exists({
        repository: transactional_repository,
        organization_id: input.auth.organization_id,
        project_id: input.project_id,
        capture_session_id: input.capture_session_id,
      });

      const deleted = await transactional_repository.delete_capture_asset({
        organization_id: input.auth.organization_id,
        project_id: input.project_id,
        capture_session_id: input.capture_session_id,
        capture_asset_id: input.capture_asset_id,
        actor_org_user_id: input.auth.actor_org_user_id,
      });

      if (!deleted) {
        throw new CaptureAssetNotFoundError();
      }
    });

  return {
    create_capture_asset,
    upload_capture_asset,
    list_capture_assets,
    list_project_capture_assets,
    get_capture_asset,
    get_capture_asset_file,
    delete_capture_asset,
  };
};
