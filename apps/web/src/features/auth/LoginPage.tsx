/**
 * @fileoverview Public sign-in page for web sessions.
 */

import { FormEvent, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  ArrowRight,
  BookOpenText,
  Eye,
  EyeOff,
  FolderKanban,
  ShieldCheck,
} from "lucide-react";
import { OssieBrand } from "../../components/OssieBrand";
import { ApiClientError, login } from "../../lib/api";
import { safeNextPath } from "./navigation";
import type { AuthResponse } from "./types";
import styles from "./LoginPage.module.css";

type LoginPageProps = {
  nextPath?: string;
  submitLogin?: (data: {
    email: string;
    password: string;
  }) => Promise<AuthResponse>;
  navigate?: (path: string) => void;
};

const errorMessage = (error: unknown) =>
  error instanceof ApiClientError && error.type === "invalid_credentials"
    ? "Email or password is incorrect."
    : "Could not sign in.";

/** Renders the public web-session sign-in form. */
export const LoginPage = ({
  nextPath = "/projects",
  submitLogin = login,
  navigate = (path) => window.location.assign(path),
}: LoginPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);
  const submitting = state === "submitting";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    setError(null);

    try {
      await submitLogin({
        email: email.trim(),
        password,
      });
      navigate(safeNextPath(nextPath, "/projects"));
    } catch (submitError: unknown) {
      setError(errorMessage(submitError));
      setState("idle");
    }
  };

  return (
    <div className={styles.page}>
      <aside className={styles.brandRegion}>
        <a className={styles.brand} href="/projects" aria-label="Ossie home">
          <OssieBrand />
        </a>
        <div className={styles.brandMessage}>
          <h2>Welcome back to Ossie</h2>
          <p>
            Continue turning real product workflows into clear, reusable
            knowledge.
          </p>
          <ul className={styles.capabilities}>
            <li>
              <FolderKanban aria-hidden="true" size={20} />
              <span>Organize captures and artifacts by Project</span>
            </li>
            <li>
              <BookOpenText aria-hidden="true" size={20} />
              <span>Create Guides, Interactive Demos, and Documentation</span>
            </li>
          </ul>
        </div>
        <p className={styles.brandFooter}>
          <ShieldCheck size={34} strokeWidth={1.6} aria-hidden="true" />
          <span>
            Self-hosted. Private.
            <br />
            You&apos;re in control.
          </span>
        </p>
      </aside>
      <main className={styles.content}>
        <section className={styles.signInPanel} aria-labelledby="login-heading">
          <div className={styles.intro}>
            <h1 className={styles.title} id="login-heading">
              Sign in
            </h1>
            <p className={styles.copy}>
              Enter your account details to continue to your Ossie instance.
            </p>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                value={email}
                required
                autoComplete="email"
                disabled={submitting}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <Label htmlFor="login-password">Password</Label>
              <div className={styles.passwordControl}>
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  required
                  autoComplete="current-password"
                  disabled={submitting}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className={styles.passwordToggle}
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={submitting}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={18} />
                  ) : (
                    <Eye aria-hidden="true" size={18} />
                  )}
                </button>
              </div>
            </div>
            {error ? <Alert variant="destructive">{error}</Alert> : null}
            <Button
              className={styles.submitButton}
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}
              {!submitting ? <ArrowRight aria-hidden="true" size={17} /> : null}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
};
