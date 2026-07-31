import { afterEach, describe, expect, it } from "vitest";
import { validate_server_startup_config } from "./startup.config";

const valid_required_env = {
  TZ: "UTC",
  SERVER_PORT: "3002",
  DEV_TYPE: "development",
  NODE_ENV: "development",
  DB_HOST: "127.0.0.1",
  DB_PORT: "5432",
  DB_USER: "demo",
  DB_PASSWORD: "demo",
  DB_NAME: "ossie",
  DB_MAX_POOL: "10",
};

describe("startup config", () => {
  const original_env = { ...process.env };

  afterEach(() => {
    process.env = { ...original_env };
  });

  it("accepts complete development startup config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
    };

    expect(() => validate_server_startup_config()).not.toThrow();
  });

  it("rejects malformed public web URLs in every runtime mode", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      OSSIE_PUBLIC_WEB_URL: "https://portal.example.com/app",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_PUBLIC_WEB_URL must be an origin without a path, query, or hash",
    );
  });

  it("validates the optional Documentation Try-It origin ceiling in every mode", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS: "https://*.example.com",
    };
    expect(() => validate_server_startup_config()).toThrow();

    process.env.OSSIE_DOCUMENTATION_TRY_IT_ALLOWED_ORIGINS =
      "https://api.example.com";
    expect(() => validate_server_startup_config()).not.toThrow();
  });

  it("rejects missing database startup config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      DB_HOST: "",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "Database configuration must be defined",
    );
  });

  it("rejects invalid server and database numeric startup config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      SERVER_PORT: "not-a-port",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "SERVER_PORT must be a positive integer",
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      DB_PORT: "0",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DB_PORT must be a positive integer",
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      DB_MAX_POOL: "-1",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "DB_MAX_POOL must be a positive integer",
    );
  });

  it("rejects production startup config without production CORS and cookie safety", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_CORS_ALLOWED_ORIGINS must be defined in production",
    );
  });

  it("rejects production startup config without a strong cookie secret", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "COOKIE_SECRET must be defined in production",
    );
  });

  it("accepts complete production startup config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "self_hosted",
      OSSIE_ONBOARDING_MODE: "first_run_setup",
      OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
      API_URL: "https://api.example.com",
      OSSIE_PUBLIC_WEB_URL: "https://portal.example.com",
    };

    expect(() => validate_server_startup_config()).not.toThrow();
  });

  it("rejects production startup config without explicit deployment modes", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_DEPLOYMENT_MODE must be explicitly set in production",
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "self_hosted",
      OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_ONBOARDING_MODE must be explicitly set in production",
    );
  });

  it("rejects invalid production deployment modes", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "private_cloud",
      OSSIE_ONBOARDING_MODE: "first_run_setup",
      OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_DEPLOYMENT_MODE must be self_hosted or hosted",
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "self_hosted",
      OSSIE_ONBOARDING_MODE: "invite_only",
      OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_ONBOARDING_MODE must be first_run_setup or signup",
    );
  });

  it("rejects production startup config without a durable local storage root", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "self_hosted",
      OSSIE_ONBOARDING_MODE: "first_run_setup",
      OSSIE_LOCAL_STORAGE_ROOT: "./storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_LOCAL_STORAGE_ROOT must be set to a durable storage path in production",
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "self_hosted",
      OSSIE_ONBOARDING_MODE: "first_run_setup",
      OSSIE_LOCAL_STORAGE_ROOT: "storage",
      API_URL: "https://api.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_LOCAL_STORAGE_ROOT must be set to an absolute durable storage path in production",
    );
  });

  it("rejects production startup config without an absolute public API URL", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "self_hosted",
      OSSIE_ONBOARDING_MODE: "first_run_setup",
      OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
      API_URL: "/api",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "API_URL must be an absolute http(s) URL in production",
    );
  });

  it("rejects malformed production public web URLs", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "self_hosted",
      OSSIE_ONBOARDING_MODE: "first_run_setup",
      OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
      API_URL: "https://api.example.com",
      OSSIE_PUBLIC_WEB_URL: "/portal",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_PUBLIC_WEB_URL must be an absolute http(s) URL when set",
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "self_hosted",
      OSSIE_ONBOARDING_MODE: "first_run_setup",
      OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
      API_URL: "https://api.example.com",
      OSSIE_PUBLIC_WEB_URL: "ftp://portal.example.com",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_PUBLIC_WEB_URL must be an absolute http(s) URL when set",
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      NODE_ENV: "production",
      DEV_TYPE: "production",
      COOKIE_SECRET: "a-very-strong-cookie-secret",
      OSSIE_CORS_ALLOWED_ORIGINS: "https://portal.example.com",
      OSSIE_DEPLOYMENT_MODE: "self_hosted",
      OSSIE_ONBOARDING_MODE: "first_run_setup",
      OSSIE_LOCAL_STORAGE_ROOT: "/var/lib/ossie/storage",
      API_URL: "https://api.example.com",
      OSSIE_PUBLIC_WEB_URL: "https://portal.example.com/app",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_PUBLIC_WEB_URL must be an origin without a path, query, or hash",
    );
  });

  it("rejects invalid numeric production hardening config", () => {
    process.env = {
      ...original_env,
      ...valid_required_env,
      OSSIE_JSON_BODY_LIMIT_BYTES: "0",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_JSON_BODY_LIMIT_BYTES must be a positive integer",
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES: "not-a-number",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_MAX_SCREENSHOT_UPLOAD_BYTES must be a positive integer",
    );

    process.env = {
      ...original_env,
      ...valid_required_env,
      OSSIE_RATE_LIMIT_MAX_ATTEMPTS: "-1",
    };

    expect(() => validate_server_startup_config()).toThrow(
      "OSSIE_RATE_LIMIT_MAX_ATTEMPTS must be a positive integer",
    );
  });
});
