import path from "node:path";
import { DEPLOYMENT_MODES, ONBOARDING_MODES } from "@repo/constants";
import { get_cookie_config } from "./cookie.config";
import { get_cors_config } from "./cors.config";
import {
  get_json_body_limit_bytes,
  get_max_screenshot_upload_bytes,
  get_rate_limit_config,
} from "./production-hardening.config";
import { assert_public_web_url_config } from "./public-web-url.config";
import { is_production_runtime } from "./runtime.config";
import { get_documentation_try_it_origin_config } from "./documentation-try-it.config";

const required_database_env = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "DB_MAX_POOL",
];

const assert_env = (name: string, message: string) => {
  if (!process.env[name]) {
    throw new Error(message);
  }
};

const assert_positive_integer_env = (name: string) => {
  const raw_value = process.env[name];
  const parsed_value = Number(raw_value);

  if (!raw_value || !Number.isInteger(parsed_value) || parsed_value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
};

const assert_production_enum_env = (
  name: string,
  allowed_values: string[],
  missing_message: string,
  invalid_message: string,
) => {
  const raw_value = process.env[name];

  if (!raw_value) {
    throw new Error(missing_message);
  }

  if (!allowed_values.includes(raw_value)) {
    throw new Error(invalid_message);
  }
};

const assert_production_public_api_url = () => {
  const raw_value = process.env.API_URL;

  if (!raw_value) {
    throw new Error("API_URL must be an absolute http(s) URL in production");
  }

  try {
    const url = new URL(raw_value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error("API_URL must be an absolute http(s) URL in production");
  }
};

const validate_production_startup_config = () => {
  assert_production_enum_env(
    "OSSIE_DEPLOYMENT_MODE",
    [...DEPLOYMENT_MODES],
    "OSSIE_DEPLOYMENT_MODE must be explicitly set in production",
    "OSSIE_DEPLOYMENT_MODE must be self_hosted or hosted",
  );
  assert_production_enum_env(
    "OSSIE_ONBOARDING_MODE",
    [...ONBOARDING_MODES],
    "OSSIE_ONBOARDING_MODE must be explicitly set in production",
    "OSSIE_ONBOARDING_MODE must be first_run_setup or signup",
  );

  const local_storage_root = process.env.OSSIE_LOCAL_STORAGE_ROOT;

  if (!local_storage_root || local_storage_root === "./storage") {
    throw new Error(
      "OSSIE_LOCAL_STORAGE_ROOT must be set to a durable storage path in production",
    );
  }

  if (!path.isAbsolute(local_storage_root)) {
    throw new Error(
      "OSSIE_LOCAL_STORAGE_ROOT must be set to an absolute durable storage path in production",
    );
  }

  assert_production_public_api_url();
};

export const validate_server_startup_config = () => {
  assert_env("TZ", "Timezone must be defined");
  assert_env("SERVER_PORT", "SERVER_PORT must be defined");
  assert_env("DEV_TYPE", "DEV_TYPE must be defined");

  if (required_database_env.some((name) => !process.env[name])) {
    throw new Error("Database configuration must be defined");
  }

  assert_positive_integer_env("SERVER_PORT");
  assert_positive_integer_env("DB_PORT");
  assert_positive_integer_env("DB_MAX_POOL");

  get_cookie_config();
  get_cors_config();
  assert_public_web_url_config();

  if (is_production_runtime()) {
    validate_production_startup_config();
  }

  get_json_body_limit_bytes();
  get_max_screenshot_upload_bytes();
  get_rate_limit_config();
  get_documentation_try_it_origin_config();
};
