import { useState, type FormEvent } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { normalizeInstanceUrl } from "../lib/url";

export const PortalSettingsPanel = ({
  portalUrl,
  onCancel,
  onSave,
}: {
  portalUrl: string | null;
  onCancel: () => void;
  onSave: (portalUrl: string | null) => Promise<void>;
}) => {
  const [value, setValue] = useState(portalUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    const normalized = trimmed ? normalizeInstanceUrl(trimmed) : null;
    if (normalized && !normalized.ok) {
      setError("Enter a valid http:// or https:// portal URL.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(normalized?.value ?? null);
    } catch {
      setError("Could not save portal URL.");
      setSaving(false);
    }
  };

  return (
    <form className="form confirmation" onSubmit={handleSubmit}>
      <p>
        This changes only browser portal links. The API instance, sign-in, and
        active Capture Session stay unchanged.
      </p>
      <Label>
        <span>Portal URL (optional)</span>
        <Input
          type="url"
          value={value}
          placeholder="http://localhost:4050"
          disabled={saving}
          autoFocus
          onChange={(event) => setValue(event.target.value)}
        />
      </Label>
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      <div className="actions">
        <Button
          type="button"
          variant="secondary"
          className="secondary"
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save portal URL"}
        </Button>
      </div>
    </form>
  );
};
