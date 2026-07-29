import { useState, type FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { normalizeInstanceUrl } from "../lib/url";

export const ConnectInstancePanel = ({
  onSave,
}: {
  onSave: (input: {
    instanceUrl: string;
    portalUrl: string | null;
  }) => Promise<void>;
}) => {
  const [instanceUrl, setInstanceUrl] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = normalizeInstanceUrl(instanceUrl);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const portalUrlValue = portalUrl.trim();
    const normalizedPortalUrl = portalUrlValue
      ? normalizeInstanceUrl(portalUrlValue)
      : null;
    if (normalizedPortalUrl && !normalizedPortalUrl.ok) {
      setError("Enter a valid http:// or https:// portal URL.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSave({
        instanceUrl: result.value,
        portalUrl: normalizedPortalUrl?.value ?? null,
      });
    } catch {
      setError("Could not save instance URL.");
      setSubmitting(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="connect-heading">
      <h1 id="connect-heading">Connect instance</h1>
      <form className="form" onSubmit={handleSubmit}>
        <Label>
          <span>Instance URL</span>
          <Input
            type="url"
            value={instanceUrl}
            placeholder="http://localhost:3002"
            disabled={submitting}
            autoFocus
            onChange={(event) => setInstanceUrl(event.target.value)}
          />
        </Label>
        <Label>
          <span>Portal URL (optional)</span>
          <Input
            type="url"
            value={portalUrl}
            placeholder="http://localhost:3000"
            disabled={submitting}
            onChange={(event) => setPortalUrl(event.target.value)}
          />
        </Label>
        {error ? (
          <div className="error" role="alert">
            {error}
          </div>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Connecting..." : "Connect"}
        </Button>
      </form>
    </section>
  );
};
