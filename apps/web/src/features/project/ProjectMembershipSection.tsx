import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ProjectRole } from "@repo/constants";
import type { ProjectAccessMember } from "@repo/types/project-membership";
import { Alert } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@repo/ui/card";
import { Check, ChevronDown, UserPlus, UsersRound, X } from "lucide-react";
import {
  ApiClientError,
  assignProjectMembership,
  changeProjectMembershipRole,
  listProjectMemberships,
  removeProjectMembership,
} from "../../lib/api";
import styles from "./ProjectMembershipSection.module.css";

type Props = { projectId: string; onAccessChanged?: () => void };
const roles: { value: ProjectRole; label: string }[] = [
  { value: "project_admin", label: "Project admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

type DropdownOption = { value: string; label: string };

const MembershipDropdown = ({
  label,
  menuLabel,
  options,
  placeholder,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  menuLabel: string;
  options: DropdownOption[];
  placeholder?: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const menuLabelId = useId();
  const selected = options.find((option) => option.value === value);
  const displayLabel = selected?.label ?? placeholder ?? "Select";

  useEffect(() => {
    if (!open) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnPointerDown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointerDown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={styles.selectField} ref={rootRef}>
      <span className={styles.selectLabel}>{label}</span>
      <button
        className={styles.selectTrigger}
        type="button"
        aria-label={`${label}: ${displayLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{displayLabel}</span>
        <ChevronDown aria-hidden="true" size={18} />
      </button>
      {open ? (
        <div
          className={styles.selectMenu}
          id={menuId}
          role="listbox"
          aria-label={menuLabel}
        >
          <div role="group" aria-labelledby={menuLabelId}>
            <span className={styles.selectGroupLabel} id={menuLabelId}>
              {menuLabel}
            </span>
            {options.map((option) => (
              <button
                className={`${styles.selectOption} ${
                  option.value === value ? styles.selectOptionSelected : ""
                }`}
                key={option.value || "empty"}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {option.value === value ? (
                  <Check aria-hidden="true" size={17} />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export const ProjectMembershipSection = ({
  projectId,
  onAccessChanged,
}: Props) => {
  const [members, setMembers] = useState<ProjectAccessMember[] | null>(null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState("");
  const [candidateRole, setCandidateRole] = useState<ProjectRole>("viewer");
  const [showAddMember, setShowAddMember] = useState(false);
  const addMemberDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!showAddMember) return;
    const dialog = addMemberDialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
  }, [showAddMember]);

  useEffect(() => {
    let active = true;
    setMembers(null);
    setError(null);
    listProjectMemberships(projectId)
      .then((response) => active && setMembers(response.members))
      .catch((loadError: unknown) => {
        if (!active) return;
        setMembers([]);
        setError(
          loadError instanceof ApiClientError && loadError.kind === "forbidden"
            ? "You no longer have permission to manage Project access."
            : "Could not load Project access. Retry to continue.",
        );
      });
    return () => {
      active = false;
    };
  }, [projectId, reload]);

  const candidates = useMemo(
    () =>
      (members ?? []).filter(
        (member) =>
          member.organization_role !== "owner" &&
          member.organization_status === "active" &&
          member.membership?.status !== "active",
      ),
    [members],
  );

  const complete = (text: string) => {
    setMessage(text);
    setError(null);
    setBusyId(null);
    setReload((value) => value + 1);
    onAccessChanged?.();
  };
  const fail = (mutationError: unknown) => {
    setBusyId(null);
    setMessage(null);
    setError(
      mutationError instanceof ApiClientError &&
        mutationError.type === "project_membership_conflict"
        ? "Project access changed elsewhere. Reload the roster and try again."
        : mutationError instanceof ApiClientError &&
            (mutationError.kind === "forbidden" ||
              mutationError.kind === "not_found")
          ? "Your Project access changed. Return to the workspace or reload."
          : "Could not update Project access.",
    );
  };

  const assign = async () => {
    if (!candidateId || busyId) return;
    setBusyId("assign");
    try {
      await assignProjectMembership(projectId, {
        org_user_id: candidateId,
        role: candidateRole,
      });
      setShowAddMember(false);
      setCandidateId("");
      complete("Project access assigned.");
    } catch (mutationError) {
      fail(mutationError);
    }
  };

  const changeRole = async (member: ProjectAccessMember, role: ProjectRole) => {
    if (!member.membership || busyId) return;
    setBusyId(member.org_user_id);
    try {
      await changeProjectMembershipRole(projectId, member.membership.id, {
        role,
        expected_version: member.membership.version,
      });
      complete("Project role updated.");
    } catch (mutationError) {
      fail(mutationError);
    }
  };

  const remove = async (member: ProjectAccessMember) => {
    if (
      !member.membership ||
      busyId ||
      !window.confirm(`Remove ${member.display_name} from this Project?`)
    )
      return;
    setBusyId(member.org_user_id);
    try {
      await removeProjectMembership(
        projectId,
        member.membership.id,
        member.membership.version,
      );
      complete(`${member.display_name} no longer has Project access.`);
    } catch (mutationError) {
      fail(mutationError);
    }
  };

  return (
    <section
      className={styles.section}
      aria-labelledby="project-membership-heading"
    >
      <header className={styles.sectionHeader}>
        <div>
          <h2 id="project-membership-heading" className={styles.title}>
            Membership
          </h2>
          <p>
            Control who can discover and work in this Project. Organization
            owners always have Project admin access.
          </p>
        </div>
        <Button
          aria-label="Add member"
          title="Add member"
          size="icon"
          type="button"
          disabled={members === null}
          onClick={() => setShowAddMember(true)}
        >
          <UserPlus aria-hidden="true" size={18} />
        </Button>
      </header>

      <div aria-live="polite">
        {message ? <Alert variant="success">{message}</Alert> : null}
        {error ? <Alert variant="destructive">{error}</Alert> : null}
      </div>

      <Card className={styles.panel} aria-labelledby="current-access-heading">
        <CardHeader>
          <h3 id="current-access-heading" className={styles.cardTitle}>
            Current access
          </h3>
          <CardDescription>
            Members who can currently discover and work in this Project.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.content}>
          {members === null ? <p>Loading Project access…</p> : null}
          {error ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setReload((value) => value + 1)}
            >
              Retry
            </Button>
          ) : null}
          {members ? (
            <ul className={styles.roster}>
              {members
                .filter(
                  (member) =>
                    member.organization_role === "owner" || member.membership,
                )
                .map((member) => {
                  const immutable = member.organization_role === "owner";
                  const disabled = member.organization_status !== "active";
                  return (
                    <li key={member.org_user_id} className={styles.member}>
                      <div>
                        <strong>{member.display_name}</strong>
                        <span>{member.email}</span>
                        <div className={styles.badges}>
                          <Badge>
                            {immutable
                              ? "Organization owner"
                              : (member.membership?.status ?? "unassigned")}
                          </Badge>
                          {disabled ? (
                            <Badge>Organization disabled</Badge>
                          ) : null}
                        </div>
                      </div>
                      {immutable ? (
                        <div className={styles.roleSummary}>
                          <Badge variant="success">Project admin</Badge>
                          <span>Inherited access</span>
                        </div>
                      ) : member.membership?.status === "active" ? (
                        <div className={styles.actions}>
                          <label>
                            Project role
                            <select
                              aria-label={`Project role for ${member.display_name}`}
                              value={member.membership.role}
                              disabled={disabled || busyId !== null}
                              onChange={(event) =>
                                void changeRole(
                                  member,
                                  event.target.value as ProjectRole,
                                )
                              }
                            >
                              {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId !== null}
                            onClick={() => void remove(member)}
                          >
                            Remove {member.display_name}
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      {!showAddMember ? null : (
        <dialog
          ref={addMemberDialogRef}
          className={styles.dialog}
          aria-labelledby="add-project-member-heading"
          aria-modal="true"
          onCancel={(event) => {
            event.preventDefault();
            setShowAddMember(false);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowAddMember(false);
          }}
        >
          <div className={styles.modal}>
            <header className={styles.modalHeader}>
              <div>
                <h3 id="add-project-member-heading">Add member</h3>
                <p>
                  Give an active Organization member access to this Project.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                aria-label="Close add member"
                onClick={() => setShowAddMember(false)}
              >
                <X aria-hidden="true" size={19} />
              </Button>
            </header>
            <div className={styles.assign}>
              {candidates.length ? (
                <>
                  <MembershipDropdown
                    label="Organization member"
                    menuLabel="Organization members"
                    value={candidateId}
                    placeholder="Choose a member"
                    disabled={busyId !== null}
                    options={candidates.map((member) => ({
                      value: member.org_user_id,
                      label: member.display_name,
                    }))}
                    onChange={setCandidateId}
                  />
                  <MembershipDropdown
                    label="Project role"
                    menuLabel="Project roles"
                    value={candidateRole}
                    options={roles}
                    onChange={(role) => setCandidateRole(role as ProjectRole)}
                  />
                  <div className={styles.modalActions}>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowAddMember(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!candidateId || busyId !== null}
                      onClick={() => void assign()}
                    >
                      Assign
                    </Button>
                  </div>
                </>
              ) : (
                <div className={styles.emptyMemberState}>
                  <span className={styles.emptyMemberIcon}>
                    <UsersRound aria-hidden="true" size={22} />
                  </span>
                  <div>
                    <h4>No members to add</h4>
                    <p>
                      Every active Organization member already has access to
                      this Project.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
};
