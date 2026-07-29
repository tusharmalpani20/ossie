import { useState, type FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { errorMessage } from "./helpers";

export const SignInPanel = ({
  instanceUrl,
  onSignIn,
  onChangeInstance,
}: {
  instanceUrl: string;
  onSignIn: (data: { email: string; password: string }) => Promise<void>;
  onChangeInstance: () => Promise<void>;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSignIn({ email: email.trim(), password });
    } catch (submitError: unknown) {
      setError(errorMessage(submitError, "Could not sign in."));
      setSubmitting(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="sign-in-heading">
      <h1 id="sign-in-heading">Sign in</h1>
      <p className="instance" title={instanceUrl}>
        {instanceUrl}
      </p>
      <form className="form" onSubmit={handleSubmit}>
        <Label>
          <span>Email</span>
          <Input
            type="email"
            value={email}
            autoComplete="email"
            disabled={submitting}
            autoFocus
            onChange={(event) => setEmail(event.target.value)}
          />
        </Label>
        <Label>
          <span>Password</span>
          <Input
            type="password"
            value={password}
            autoComplete="current-password"
            disabled={submitting}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Label>
        {error ? (
          <div className="error" role="alert">
            {error}
          </div>
        ) : null}
        <div className="actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="secondary"
            disabled={submitting}
            onClick={() => void onChangeInstance()}
          >
            Change instance
          </Button>
        </div>
      </form>
    </section>
  );
};
