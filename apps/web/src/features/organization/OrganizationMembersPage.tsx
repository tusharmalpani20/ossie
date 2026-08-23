/**
 * @fileoverview Organization member and invite management page.
 */

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { ShieldCheck, UserPlus, UserRound, X } from "lucide-react";
import {
  ApiClientError,
  createOrganizationInvite,
  listOrganizationInvites,
  listOrganizationMembers,
  revokeOrganizationInvite,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
import type {
  OrganizationInvite,
  OrganizationInviteCreateResponse,
  OrganizationInviteListResponse,
  OrganizationInviteUpdateResponse,
  OrganizationMember,
  OrganizationMemberListResponse,
  OrganizationRole,
} from "./types";
import styles from "./OrganizationMembersPage.module.css";

type LoadState =
  | { status: "loading" }
  | {
      status: "loaded";
      members: OrganizationMember[];
      invites: OrganizationInvite[];
    }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error" };

type OrganizationMembersPageProps = {
  loadMembers?: () => Promise<OrganizationMemberListResponse>;
  loadInvites?: () => Promise<OrganizationInviteListResponse>;
  createInvite?: (input: {
    email: string;
    role?: OrganizationRole;
  }) => Promise<OrganizationInviteCreateResponse>;
  revokeInvite?: (
    inviteId: string,
  ) => Promise<OrganizationInviteUpdateResponse>;
  copyText?: (text: string) => Promise<void>;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const inviteRoleOptions: Array<{
  value: OrganizationRole;
  label: string;
  description: string;
}> = [
  {
    value: "member",
    label: "Member",
    description: "Access only Projects they are added to.",
  },
  {
    value: "owner",
    label: "Owner",
    description: "Manage all Organization settings and members.",
  },
];

const memberInitials = (member: OrganizationMember) => {
  const label = member.display_name || member.email;
  const words = label.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const defaultCopyText = async (text: string) => {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable");
  }

  await navigator.clipboard.writeText(text);
};

const stateFromError = (error: unknown): LoadState => {
  if (error instanceof ApiClientError && error.kind === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (error instanceof ApiClientError && error.kind === "forbidden") {
    return { status: "forbidden" };
  }

  return { status: "error" };
};

const inviteErrorMessage = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return "Sign in to invite organization members.";
    }

    if (
      error.type === "duplicate_active_invite" ||
      error.type === "active_invite_exists"
    ) {
      return "An active invite already exists for this email.";
    }

    if (error.kind === "validation") {
      return error.message;
    }
  }

  return "Could not create invite.";
};

const reloadOrganization = async (
  loadMembers: () => Promise<OrganizationMemberListResponse>,
  loadInvites: () => Promise<OrganizationInviteListResponse>,
): Promise<LoadState> => {
  const [memberResponse, inviteResponse] = await Promise.all([
    loadMembers(),
    loadInvites(),
  ]);

  return {
    status: "loaded",
    members: memberResponse.members,
    invites: inviteResponse.invites,
  };
};

/** Renders Owner-managed Organization members and invite workflows. */
export const OrganizationMembersPage = ({
  loadMembers = listOrganizationMembers,
  loadInvites = listOrganizationInvites,
  createInvite: createInviteAction = createOrganizationInvite,
  revokeInvite = revokeOrganizationInvite,
  copyText = defaultCopyText,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: OrganizationMembersPageProps) => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationRole>("member");
  const [formError, setFormError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "invites">(
    "members",
  );
  const [showInviteForm, setShowInviteForm] = useState(false);
  const inviteDialogRef = useRef<HTMLDialogElement | null>(null);
  const inviteEmailRef = useRef<HTMLInputElement | null>(null);
  const inviteTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let active = true;
    setState((current) =>
      current.status === "loaded" ? current : { status: "loading" },
    );

    reloadOrganization(loadMembers, loadInvites)
      .then((nextState) => {
        if (active) {
          setState(nextState);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState(stateFromError(error));
        }
      });

    return () => {
      active = false;
    };
  }, [loadMembers, loadInvites, reloadKey]);

  useEffect(() => {
    if (!showInviteForm) return;

    const dialog = inviteDialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }
    inviteEmailRef.current?.focus();
  }, [showInviteForm]);

  const openInviteForm = (trigger: HTMLButtonElement) => {
    inviteTriggerRef.current = trigger;
    setEmail("");
    setRole("member");
    setFormError(null);
    setMessage(null);
    setInviteUrl(null);
    setShowInviteForm(true);
  };

  const closeInviteForm = () => {
    const dialog = inviteDialogRef.current;
    if (dialog?.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
    setShowInviteForm(false);
    setEmail("");
    setRole("member");
    setFormError(null);
    setMessage(null);
    setInviteUrl(null);
    inviteTriggerRef.current?.focus();
  };

  const requestCloseInviteForm = () => {
    if (isSubmitting) return;

    if (
      email.trim() &&
      !inviteUrl &&
      !window.confirm("Discard the invitation details you entered?")
    ) {
      return;
    }

    closeInviteForm();
  };

  const submitInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setFormError("Invite email is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setMessage(null);
    setInviteUrl(null);

    try {
      const response = await createInviteAction({
        email: normalizedEmail,
        role,
      });
      setEmail("");
      setRole("member");
      setInviteUrl(response.invite_url);
      setMessage(
        "Invite link created. Copy it now; the token is only shown once.",
      );
      setReloadKey((key) => key + 1);
    } catch (error: unknown) {
      setFormError(inviteErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteUrl = async () => {
    if (!inviteUrl) return;

    try {
      await copyText(inviteUrl);
      setMessage("Invite link copied.");
    } catch {
      setMessage("Could not copy invite link.");
    }
  };

  const revokePendingInvite = async (invite: OrganizationInvite) => {
    setBusyInviteId(invite.id);
    setMessage(null);

    try {
      await revokeInvite(invite.id);
      setInviteUrl(null);
      setReloadKey((key) => key + 1);
    } catch {
      setMessage("Could not revoke invite.");
    } finally {
      setBusyInviteId(null);
    }
  };

  if (state.status === "loading") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>Loading organization members...</div>
      </PortalShell>
    );
  }

  if (state.status === "unauthenticated") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Sign in to manage organization members.</div>
          <a className={styles.stateLink} href={signInUrl(currentPath)}>
            Sign in
          </a>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "forbidden") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Only organization owners can manage members and invites.</div>
        </div>
      </PortalShell>
    );
  }

  if (state.status === "error") {
    return (
      <PortalShell performLogout={performLogout} navigate={navigate}>
        <div className={styles.state}>
          <div>Could not load organization members.</div>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </Button>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell performLogout={performLogout} navigate={navigate}>
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>Organization members</h1>
          <p className={styles.subtitle}>
            Manage Organization access, roles, and pending invitations.
          </p>
        </div>
        <Button
          className={styles.inviteButton}
          size="icon"
          type="button"
          aria-label="Invite member"
          title="Invite member"
          onClick={(event) => openInviteForm(event.currentTarget)}
        >
          <UserPlus aria-hidden="true" size={19} />
        </Button>
      </section>

      {showInviteForm ? (
        <dialog
          ref={inviteDialogRef}
          className={styles.inviteDialog}
          aria-labelledby="invite-member-heading"
          aria-modal="true"
          onCancel={(event) => {
            event.preventDefault();
            requestCloseInviteForm();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) requestCloseInviteForm();
          }}
        >
          <div className={styles.inviteModal}>
            <header className={styles.inviteModalHeader}>
              <h2 className={styles.formTitle} id="invite-member-heading">
                Invite member
              </h2>
              <Button
                className={styles.closeButton}
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Close invite member"
                title="Close"
                disabled={isSubmitting}
                onClick={requestCloseInviteForm}
              >
                <X aria-hidden="true" size={19} />
              </Button>
            </header>

            {inviteUrl ? (
              <div className={styles.inviteSuccess}>
                {message ? (
                  <Alert
                    variant={
                      message.startsWith("Could not")
                        ? "destructive"
                        : "success"
                    }
                  >
                    {message}
                  </Alert>
                ) : null}
                <p className={styles.successHelp}>
                  This token is only shown once. Copy the link before closing.
                </p>
                <div className={styles.inviteLink}>
                  <span>{inviteUrl}</span>
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={closeInviteForm}
                  >
                    Done
                  </Button>
                  <Button type="button" onClick={() => void copyInviteUrl()}>
                    Copy invite link
                  </Button>
                </div>
              </div>
            ) : (
              <form className={styles.form} noValidate onSubmit={submitInvite}>
                <div className={styles.field}>
                  <Label htmlFor="invite-member-email">
                    Email address <span aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="invite-member-email"
                    ref={inviteEmailRef}
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    aria-invalid={Boolean(formError)}
                    aria-describedby={
                      formError ? "invite-member-email-error" : undefined
                    }
                    value={email}
                    placeholder="daisy@ossie.team"
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (formError) setFormError(null);
                    }}
                  />
                  {formError ? (
                    <span
                      className={styles.fieldError}
                      id="invite-member-email-error"
                    >
                      {formError}
                    </span>
                  ) : null}
                </div>
                <fieldset
                  className={styles.roleFieldset}
                  role="radiogroup"
                >
                  <legend className={styles.roleLegend}>
                    Organization role
                  </legend>
                  <div className={styles.roleOptions}>
                    {inviteRoleOptions.map((organizationRole) => (
                      <label
                        className={
                          role === organizationRole.value
                            ? styles.roleOptionSelected
                            : styles.roleOption
                        }
                        key={organizationRole.value}
                      >
                        <input
                          className={styles.roleOptionInput}
                          type="radio"
                          name="organization-role"
                          value={organizationRole.value}
                          aria-label={organizationRole.label}
                          checked={role === organizationRole.value}
                          onChange={() => setRole(organizationRole.value)}
                        />
                        <span className={styles.roleOptionCopy}>
                          <strong>{organizationRole.label}</strong>
                          <span>{organizationRole.description}</span>
                        </span>
                        <span
                          className={styles.roleOptionMarker}
                          aria-hidden="true"
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className={styles.formActions}>
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={isSubmitting}
                    onClick={requestCloseInviteForm}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating invite..." : "Create invite"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </dialog>
      ) : null}

      <section className={styles.content} aria-label="Organization access">
        {message && !showInviteForm ? (
          <Alert
            variant={message.startsWith("Could not") ? "destructive" : "success"}
          >
            {message}
          </Alert>
        ) : null}
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Organization access"
        >
          <button
            className={activeTab === "members" ? styles.tabActive : styles.tab}
            type="button"
            role="tab"
            aria-label={`Members ${state.members.length}`}
            aria-selected={activeTab === "members"}
            aria-controls="organization-members-panel"
            onClick={() => setActiveTab("members")}
          >
            Members
            <span className={styles.tabCount}>{state.members.length}</span>
          </button>
          <button
            className={activeTab === "invites" ? styles.tabActive : styles.tab}
            type="button"
            role="tab"
            aria-label={`Pending invites ${state.invites.length}`}
            aria-selected={activeTab === "invites"}
            aria-controls="organization-invites-panel"
            onClick={() => setActiveTab("invites")}
          >
            Pending invites{" "}
            <span className={styles.tabCount}>{state.invites.length}</span>
          </button>
        </div>

        {activeTab === "members" ? (
          <div
            className={styles.listSurface}
            id="organization-members-panel"
            role="tabpanel"
          >
            <div className={styles.rows}>
              {state.members.map((member) => (
                <article
                  className={styles.row}
                  data-testid="organization-member-row"
                  key={member.id}
                >
                  <span className={styles.memberAvatar} aria-hidden="true">
                    {memberInitials(member)}
                  </span>
                  <div className={styles.rowIdentity}>
                    <h3 className={styles.rowTitle}>
                      {member.display_name || member.email}
                    </h3>
                    <div className={styles.rowMeta}>{member.email}</div>
                  </div>
                  <span
                    className={`${styles.memberRole} ${
                      member.role === "owner" ? styles.ownerRole : ""
                    }`}
                    aria-label={`Organization role: ${
                      member.role === "owner" ? "Owner" : "Member"
                    }`}
                  >
                    {member.role === "owner" ? (
                      <ShieldCheck aria-hidden="true" size={14} />
                    ) : (
                      <UserRound aria-hidden="true" size={14} />
                    )}
                    {member.role === "owner" ? "Owner" : "Member"}
                  </span>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div
            className={styles.listSurface}
            id="organization-invites-panel"
            role="tabpanel"
          >
            {state.invites.length === 0 ? (
              <div className={styles.empty}>
                <img
                  className={styles.emptyIllustration}
                  src="/illustrations/ossie-invites-empty.png"
                  alt="Ossie is ready to send an invitation"
                  width="260"
                  height="260"
                />
                <h3 className={styles.emptyTitle}>No pending invites</h3>
                <p className={styles.emptyDescription}>
                  Invitations waiting to be accepted will appear here.
                </p>
              </div>
            ) : (
              <div className={styles.rows}>
                {state.invites.map((invite) => (
                  <article
                    className={`${styles.row} ${styles.inviteRow}`}
                    data-testid="organization-invite-row"
                    key={invite.id}
                  >
                    <div className={styles.rowIdentity}>
                      <h3 className={styles.rowTitle}>{invite.email}</h3>
                      <div className={styles.rowMeta}>
                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.rowActions}>
                      <Badge variant="warning">{invite.status}</Badge>
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        disabled={busyInviteId === invite.id}
                        onClick={() => void revokePendingInvite(invite)}
                      >
                        {busyInviteId === invite.id
                          ? "Revoking..."
                          : `Revoke invite for ${invite.email}`}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </PortalShell>
  );
};

const PortalShell = ({
  children,
  performLogout,
  navigate,
}: {
  children: ReactNode;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <PortalAppShell
    activeSection="organization_members"
    currentLabel="Organization members"
    performLogout={performLogout}
    navigate={navigate}
  >
    {children}
  </PortalAppShell>
);
