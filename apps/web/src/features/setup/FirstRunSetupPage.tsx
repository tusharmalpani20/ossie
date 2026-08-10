/**
 * @fileoverview Web First-Run Setup page for self-hosted instances.
 */

import { FormEvent, useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { StatusPanel } from "@repo/ui/status-panel";
import {
  ApiClientError,
  completeFirstRunSetup,
  getPublicInstanceStatus,
  type PublicInstanceStatus,
} from "../../lib/api";
import { EntryPageShell } from "../auth/EntryPageShell";
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

const Shell = ({ children }: { children: React.ReactNode }) => (
  <EntryPageShell>
    <Card>{children}</Card>
  </EntryPageShell>
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

        setPageState(status.setup_required ? { status: "ready" } : { status: "complete" });
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
        <StatusPanel
          className={styles.state}
          tone="loading"
          title="Loading setup..."
          description="Checking whether this Ossie instance needs first-run setup."
          titleAs="h1"
        />
      </Shell>
    );
  }

  if (pageState.status === "complete") {
    return (
      <Shell>
        <StatusPanel
          className={styles.state}
          tone="neutral"
          title="This instance is already set up."
          description="Sign in with an existing owner account to continue."
          action={
            <a className={styles.link} href="/login">
              Go to sign in
            </a>
          }
          titleAs="h1"
        />
      </Shell>
    );
  }

  if (pageState.status === "unavailable") {
    return (
      <Shell>
        <StatusPanel
          className={styles.state}
          tone="forbidden"
          title="First-run setup is not available for this instance."
          description="Use the configured onboarding flow for this deployment."
          titleAs="h1"
        />
      </Shell>
    );
  }

  if (pageState.status === "error") {
    return (
      <Shell>
        <StatusPanel
          className={styles.state}
          tone="error"
          title="Setup unavailable"
          description={pageState.message}
          titleAs="h1"
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <CardHeader>
        <h1 className={styles.title}>Set up Ossie</h1>
        <p className={styles.copy}>Create the owner account and organization for this instance.</p>
      </CardHeader>
      <CardContent>
        <form className={styles.form} onSubmit={handleSubmit}>
          <Label className={styles.field}>
            <span>Owner email</span>
            <Input
              type="email"
              value={ownerEmail}
              required
              autoComplete="email"
              disabled={submitting}
              onChange={(event) => setOwnerEmail(event.target.value)}
            />
          </Label>
          <Label className={styles.field}>
            <span>First name</span>
            <Input
              type="text"
              value={firstName}
              autoComplete="given-name"
              disabled={submitting}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </Label>
          <Label className={styles.field}>
            <span>Last name</span>
            <Input
              type="text"
              value={lastName}
              autoComplete="family-name"
              disabled={submitting}
              onChange={(event) => setLastName(event.target.value)}
            />
          </Label>
          <Label className={styles.field}>
            <span>Organization name</span>
            <Input
              type="text"
              value={organizationName}
              required
              autoComplete="organization"
              disabled={submitting}
              onChange={(event) => setOrganizationName(event.target.value)}
            />
          </Label>
          <Label className={styles.field}>
            <span>Password</span>
            <Input
              type="password"
              value={password}
              required
              autoComplete="new-password"
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Label>
          {submitError ? <Alert variant="destructive">{submitError}</Alert> : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating owner account..." : "Create owner account"}
          </Button>
        </form>
      </CardContent>
    </Shell>
  );
};
