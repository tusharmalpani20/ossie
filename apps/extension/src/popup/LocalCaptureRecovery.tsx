import { useRef, useState } from "react";
import { Button } from "@repo/ui/button";

export const LocalCaptureRecovery = ({
  busy,
  onClear,
}: {
  busy: boolean;
  onClear: () => Promise<void>;
}) => {
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (!confirming) {
    return (
      <Button
        ref={triggerRef}
        variant="secondary"
        className="secondary"
        disabled={busy}
        onClick={() => setConfirming(true)}
      >
        Clear local capture state
      </Button>
    );
  }

  return (
    <div className="confirmation" role="group" aria-label="Confirm local clear">
      <p>
        This only clears extension state. It does not cancel or delete the
        server Capture Session.
      </p>
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}
      <Button
        variant="secondary"
        className="secondary"
        disabled={busy || clearing}
        onClick={() => {
          setConfirming(false);
          setTimeout(() => triggerRef.current?.focus(), 0);
        }}
      >
        Keep capture
      </Button>
      <Button
        autoFocus
        disabled={busy || clearing}
        onClick={() => {
          setClearing(true);
          setError(null);
          void onClear().catch((clearError: unknown) => {
            setError(
              clearError instanceof Error
                ? clearError.message
                : "Could not clear local capture state.",
            );
            setClearing(false);
          });
        }}
      >
        {clearing ? "Clearing..." : "Clear local state"}
      </Button>
    </div>
  );
};
