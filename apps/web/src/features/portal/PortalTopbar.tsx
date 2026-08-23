/**
 * @fileoverview Portal topbar with brand and account controls.
 */

import type { AuthContext } from "@repo/types/auth";
import { Button } from "@repo/ui/button";
import { ChevronDown, LogOut, Menu, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OssieBrand } from "../../components/OssieBrand";
import { logout } from "../../lib/api";
import styles from "./PortalTopbar.module.css";

type PortalTopbarProps = {
  context?: string;
  account?: AuthContext | null;
  projectLibrary?: boolean;
  onOpenNavigation?: () => void;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const accountInitials = (account: AuthContext) => {
  const words = account.user.display_name.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return initials.toUpperCase() || account.user.email[0]?.toUpperCase() || "U";
};

const organizationRoleLabel = (account: AuthContext) =>
  account.org_user.role === "owner"
    ? "Organization owner"
    : "Organization member";

/** Renders the stable top row for authenticated portal pages. */
export const PortalTopbar = ({
  context,
  account,
  projectLibrary = false,
  onOpenNavigation,
  performLogout = logout,
  navigate = (path) => window.location.assign(path),
}: PortalTopbarProps) => {
  const [state, setState] = useState<"idle" | "signing_out">("idle");
  const [error, setError] = useState<string | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const signingOut = state === "signing_out";

  useEffect(() => {
    if (!accountMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

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
    <header
      className={`${styles.topbar} ${projectLibrary ? styles.projectLibrary : ""}`}
    >
      <div className={styles.leading}>
        {projectLibrary ? (
          <Button
            className={styles.mobileMenuButton}
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            title="Open navigation"
            onClick={onOpenNavigation}
          >
            <Menu aria-hidden="true" size={20} />
          </Button>
        ) : null}
        <a className={styles.brand} href="/projects">
          <OssieBrand />
        </a>
        {context ? <div className={styles.context}>{context}</div> : null}
      </div>
      <div className={styles.actions}>
        {projectLibrary && !account ? (
          <div
            className={styles.accountPlaceholder}
            role="status"
            aria-label="Loading account"
          />
        ) : projectLibrary && account ? (
          <div className={styles.account} ref={accountMenuRef}>
            <button
              className={styles.accountTrigger}
              type="button"
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              aria-label={`Open account menu for ${account.user.display_name}`}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              <span className={styles.avatar} aria-hidden="true">
                {accountInitials(account)}
              </span>
              <ChevronDown aria-hidden="true" size={16} />
            </button>
            {accountMenuOpen ? (
              <div className={styles.accountMenu} role="menu">
                <div className={styles.accountIdentity}>
                  <strong>{account.user.display_name}</strong>
                  <span>{account.user.email}</span>
                </div>
                <div className={styles.organization}>
                  <span>{account.organization.name}</span>
                  <small>{organizationRoleLabel(account)}</small>
                </div>
                <a
                  className={styles.accountMenuItem}
                  href="/organization/members"
                  role="menuitem"
                >
                  <Users aria-hidden="true" size={17} />
                  Organization members
                </a>
                <button
                  className={styles.accountMenuItem}
                  type="button"
                  role="menuitem"
                  disabled={signingOut}
                  onClick={handleSignOut}
                >
                  <LogOut aria-hidden="true" size={17} />
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
                {error ? <div className={styles.error}>{error}</div> : null}
              </div>
            ) : null}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </header>
  );
};
