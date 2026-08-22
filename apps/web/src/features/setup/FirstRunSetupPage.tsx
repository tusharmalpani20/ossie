/**
 * @fileoverview Web First-Run Setup page for self-hosted instances.
 */

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import {
  ApiClientError,
  completeFirstRunSetup,
  getPublicInstanceStatus,
  type PublicInstanceStatus,
} from "../../lib/api";
import { OssieBrand } from "../../components/OssieBrand";
import type { FirstRunSetupInput } from "./types";
import type { FirstRunSetupResponse } from "@repo/types/setup";
import styles from "./FirstRunSetupPage.module.css";

type FirstRunSetupPageProps = {
  getInstanceStatus?: () => Promise<PublicInstanceStatus>;
  completeSetup?: (input: FirstRunSetupInput) => Promise<FirstRunSetupResponse>;
  navigate?: (path: string) => void;
};

type PageState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "complete" }
  | { status: "unavailable" }
  | { status: "error"; message: string };

const textOrNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const setupErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.type === "first_run_setup_completed") {
      return "This instance is already set up.";
    }

    return error.message;
  }

  return "Could not complete first-run setup.";
};

const Shell = ({ children }: { children: ReactNode }) => (
  <div className={styles.page}>
    <aside className={styles.brandRegion}>
      <a className={styles.brand} href="/projects" aria-label="Ossie home">
        <OssieBrand />
      </a>
      <div className={styles.brandMessage}>
        <h2>Your Ossie instance is ready.</h2>
        <p>
          Complete this one-time step to create your Organization and owner
          account.
        </p>
        <ol className={styles.steps} aria-label="Setup steps">
          <li>
            <span className={styles.stepNumber} aria-hidden="true">
              01
            </span>
            <span>Create your Organization</span>
          </li>
          <li>
            <span className={styles.stepNumber} aria-hidden="true">
              02
            </span>
            <span>Create the owner account</span>
          </li>
          <li>
            <span className={styles.stepNumber} aria-hidden="true">
              03
            </span>
            <span>Start your first Project</span>
          </li>
        </ol>
      </div>
      <p className={styles.brandFooter}>
        <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>
          Self-hosted setup. Your Organization stays on this deployment.
        </span>
      </p>
    </aside>
    <main className={styles.content}>
      <div className={styles.formColumn}>{children}</div>
    </main>
  </div>
);

/** Renders the self-hosted Web First-Run Setup flow. */
export const FirstRunSetupPage = ({
  getInstanceStatus = getPublicInstanceStatus,
  completeSetup = completeFirstRunSetup,
  navigate = (path) => window.location.assign(path),
}: FirstRunSetupPageProps) => {
  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [ownerEmail, setOwnerEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setPageState({ status: "loading" });

    getInstanceStatus()
      .then((status) => {
        if (!active) return;

        if (status.onboarding_mode !== "first_run_setup") {
          setPageState({ status: "unavailable" });
          return;
        }

        setPageState(
          status.setup_required ? { status: "ready" } : { status: "complete" },
        );
      })
      .catch(() => {
        if (active) {
          setPageState({
            status: "error",
            message: "Could not load instance setup status.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [getInstanceStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      await completeSetup({
        owner: {
          email: ownerEmail.trim(),
          password,
          first_name: textOrNull(firstName),
          last_name: textOrNull(lastName),
        },
        organization: {
          name: organizationName.trim(),
        },
      });
      navigate("/projects");
    } catch (error: unknown) {
      const message = setupErrorMessage(error);
      setSubmitError(message);
      setSubmitting(false);

      if (message === "This instance is already set up.") {
        setPageState({ status: "complete" });
      }
    }
  };

  if (pageState.status === "loading") {
    return (
      <Shell>
        <section
          className={styles.statePanel}
          aria-labelledby="setup-loading-heading"
        >
          <h1 className={styles.title} id="setup-loading-heading">
            Loading setup...
          </h1>
        </section>
      </Shell>
    );
  }

  if (pageState.status === "complete") {
    return (
      <Shell>
        <section
          className={styles.statePanel}
          aria-labelledby="setup-complete-heading"
        >
          <h1 className={styles.title} id="setup-complete-heading">
            This instance is already set up.
          </h1>
          <p className={styles.copy}>
            Sign in with an existing owner account to continue.
          </p>
          <a className={styles.link} href="/login">
            Go to sign in
          </a>
        </section>
      </Shell>
    );
  }

  if (pageState.status === "unavailable") {
    return (
      <Shell>
        <section
          className={styles.statePanel}
          aria-labelledby="setup-unavailable-heading"
        >
          <h1 className={styles.title} id="setup-unavailable-heading">
            First-run setup is not available for this instance.
          </h1>
          <p className={styles.copy}>
            Use the configured onboarding flow for this deployment.
          </p>
        </section>
      </Shell>
    );
  }

  if (pageState.status === "error") {
    return (
      <Shell>
        <section
          className={styles.statePanel}
          aria-labelledby="setup-error-heading"
        >
          <h1 className={styles.title} id="setup-error-heading">
            Setup unavailable
          </h1>
          <Alert variant="destructive">{pageState.message}</Alert>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={styles.intro}>
        <h1 className={styles.title}>Set up your Ossie Organization</h1>
        <p className={styles.copy}>
          Create the first Organization and owner account for this instance.
        </p>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Organization</legend>
          <div className={styles.field}>
            <Label htmlFor="setup-organization">Organization name</Label>
            <Input
              id="setup-organization"
              name="organization_name"
              type="text"
              value={organizationName}
              required
              autoComplete="organization"
              placeholder="e.g. Acme Inc."
              disabled={submitting}
              onChange={(event) => setOrganizationName(event.target.value)}
            />
          </div>
        </fieldset>
        <fieldset className={styles.group}>
          <legend className={styles.groupTitle}>Owner account</legend>
          <div className={styles.nameRow}>
            <div className={styles.field}>
              <Label htmlFor="setup-first-name">First name</Label>
              <Input
                id="setup-first-name"
                name="first_name"
                type="text"
                value={firstName}
                autoComplete="given-name"
                placeholder="John"
                disabled={submitting}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <Label htmlFor="setup-last-name">Last name</Label>
              <Input
                id="setup-last-name"
                name="last_name"
                type="text"
                value={lastName}
                autoComplete="family-name"
                placeholder="Doe"
                disabled={submitting}
                onChange={(event) => setLastName(event.target.value)}
              />
            </div>
          </div>
          <div className={styles.field}>
            <Label htmlFor="setup-email">Owner email</Label>
            <Input
              id="setup-email"
              name="owner_email"
              type="email"
              value={ownerEmail}
              required
              autoComplete="email"
              placeholder="you@example.com"
              disabled={submitting}
              onChange={(event) => setOwnerEmail(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <Label htmlFor="setup-password">Password</Label>
            <div className={styles.passwordControl}>
              <Input
                id="setup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                required
                autoComplete="new-password"
                disabled={submitting}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={submitting}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} aria-hidden="true" />
                ) : (
                  <Eye size={18} strokeWidth={1.8} aria-hidden="true" />
                )}
              </button>
            </div>
            <p className={styles.fieldHint}>Use at least 12 characters.</p>
          </div>
        </fieldset>
        {submitError ? (
          <Alert variant="destructive">{submitError}</Alert>
        ) : null}
        <Button
          className={styles.submitButton}
          type="submit"
          size="lg"
          disabled={submitting}
        >
          {submitting ? "Completing setup..." : "Complete setup"}
        </Button>
      </form>
    </Shell>
  );
};
