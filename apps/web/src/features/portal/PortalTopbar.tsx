/**
 * @fileoverview Portal topbar with brand and sign-out controls.
 */

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { logout } from "../../lib/api";
import { OssieBrand } from "../../components/OssieBrand";
import styles from "./PortalTopbar.module.css";

type PortalTopbarProps = {
  context: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

/** Renders the stable top row for authenticated portal pages. */
export const PortalTopbar = ({
  context,
  performLogout = logout,
  navigate = (path) => window.location.assign(path),
}: PortalTopbarProps) => {
  const [state, setState] = useState<"idle" | "signing_out">("idle");
  const [error, setError] = useState<string | null>(null);
  const signingOut = state === "signing_out";

  const handleSignOut = async () => {
    setState("signing_out");
    setError(null);

    try {
      await performLogout();
      navigate("/login");
    } catch {
      setError("Could not sign out.");
      setState("idle");
    }
  };

  return (
    <header className={styles.topbar}>
      <div>
        <a className={styles.brand} href="/projects">
          <OssieBrand />
        </a>
        <div className={styles.context}>{context}</div>
      </div>
      <div className={styles.actions}>
        {error ? <div className={styles.error}>{error}</div> : null}
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={signingOut}
          onClick={handleSignOut}
        >
          {signingOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </header>
  );
};
