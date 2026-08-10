/**
 * @fileoverview Public organization invite acceptance page.
 */

import { type FormEvent, useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { StatusPanel } from "@repo/ui/status-panel";
import {
  acceptPublicOrganizationInvite,
  ApiClientError,
  getPublicOrganizationInvite,
} from "../../lib/api";
import { EntryPageShell } from "../auth/EntryPageShell";
import { signInUrl } from "../auth/navigation";
import type { AuthResponse } from "../auth/types";
import type { AcceptOrganizationInviteInput, PublicOrganizationInvite } from "./types";
import styles from "./InviteAcceptPage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "loaded"; invite: PublicOrganizationInvite }
  | { status: "unavailable" }
  | { status: "error" };

type InviteAcceptPageProps = {
  token: string;
  loadInvite?: (token: string) => Promise<{ invite: PublicOrganizationInvite }>;
  acceptInvite?: (token: string, input: AcceptOrganizationInviteInput) => Promise<AuthResponse>;
  navigate?: (path: string) => void;
};

const unavailableError = (error: unknown) => (
  error instanceof ApiClientError
  && (
    error.kind === "not_found"
    || error.status === 410
    || error.type === "invite_not_found"
    || error.type === "invite_expired"
    || error.type === "invite_revoked"
    || error.type === "invite_accepted"
  )
);

const invitePath = (token: string) => `/invites/${encodeURIComponent(token)}`;

/** Renders the public organization invite acceptance flow. */
export const InviteAcceptPage = ({
  token,
  loadInvite = getPublicOrganizationInvite,
  acceptInvite = acceptPublicOrganizationInvite,
  navigate = (path) => window.location.assign(path),
}: InviteAcceptPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    loadInvite(token)
      .then((response) => {
        if (active) {
          setState({ status: "loaded", invite: response.invite });
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setState(unavailableError(loadError) ? { status: "unavailable" } : { status: "error" });
        }
      });

    return () => {
      active = false;
    };
  }, [loadInvite, token, reloadKey]);

  const accept = async (input: AcceptOrganizationInviteInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await acceptInvite(token, input);
      navigate("/projects");
    } catch (acceptError: unknown) {
      if (acceptError instanceof ApiClientError && acceptError.kind === "unauthenticated") {
        setError("Sign in before accepting this invite.");
      } else if (unavailableError(acceptError)) {
        setState({ status: "unavailable" });
      } else {
        setError("Could not accept invite.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNewUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError("Password is required to create your account.");
      return;
    }

    void accept({
      display_name: displayName.trim() || null,
      password: trimmedPassword,
    });
  };

  if (state.status === "loading") {
    return (
      <InviteShell>
        <StatusPanel
          className={styles.state}
          tone="loading"
          title="Loading invite"
          description="Loading invite..."
          titleAs="h1"
        />
      </InviteShell>
    );
  }

  if (state.status === "unavailable") {
    return (
      <InviteShell>
        <StatusPanel
          className={styles.state}
          tone="not-found"
          title="Invite unavailable"
          description="This invite is no longer available."
          titleAs="h1"
        />
      </InviteShell>
    );
  }

  if (state.status === "error") {
    return (
      <InviteShell>
        <StatusPanel
          className={styles.state}
          tone="error"
          title="Invite unavailable"
          description="Could not load this invite."
          action={
            <Button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Try again
            </Button>
          }
          titleAs="h1"
        />
      </InviteShell>
    );
  }

  const { invite } = state;

  return (
    <InviteShell>
      <Card className={styles.card}>
        <CardHeader>
          <div className={styles.eyebrow}>Organization invite</div>
          <h1 className={styles.title}>Join {invite.organization_name}</h1>
        </CardHeader>
        <CardContent>
        <div className={styles.details}>
          <div>
            <span>Email</span>
            <strong>{invite.email}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{invite.role}</strong>
          </div>
        </div>
        {error ? <Alert className={styles.error} variant="destructive">{error}</Alert> : null}

        {invite.requires_login ? (
          <div className={styles.existingUser}>
            <p className={styles.copy}>This email already has an account. Sign in first, then return to accept the invite.</p>
            <div className={styles.actions}>
              <a className={styles.secondaryLink} href={signInUrl(invitePath(token))}>Sign in to accept</a>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => void accept({})}
              >
                {isSubmitting ? "Accepting..." : "Accept with current session"}
              </Button>
            </div>
          </div>
        ) : (
          <form className={styles.form} noValidate onSubmit={submitNewUser}>
            <Label className={styles.field}>
              <span>Display name</span>
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </Label>
            <Label className={styles.field}>
              <span>Password</span>
              <Input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Label>
            <Button className={styles.submitButton} type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Accepting..." : "Accept invite"}
            </Button>
          </form>
        )}
        </CardContent>
      </Card>
    </InviteShell>
  );
};

const InviteShell = ({ children }: { children: React.ReactNode }) => (
  <EntryPageShell width="standard">{children}</EntryPageShell>
);
