import { useEffect, useMemo, useState } from "react";
import type { ProjectRole } from "@repo/constants";
import type { ProjectAccessMember } from "@repo/types/project-membership";
import { Alert } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader } from "@repo/ui/card";
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

export const ProjectMembershipSection = ({ projectId, onAccessChanged }: Props) => {
  const [members, setMembers] = useState<ProjectAccessMember[] | null>(null);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState("");
  const [candidateRole, setCandidateRole] = useState<ProjectRole>("viewer");

  useEffect(() => {
    let active = true;
    setMembers(null);
    setError(null);
    listProjectMemberships(projectId).then((response) => active && setMembers(response.members)).catch((loadError: unknown) => {
      if (!active) return;
      setMembers([]);
      setError(loadError instanceof ApiClientError && loadError.kind === "forbidden"
        ? "You no longer have permission to manage Project access."
        : "Could not load Project access. Retry to continue.");
    });
    return () => { active = false; };
  }, [projectId, reload]);

  const candidates = useMemo(() => (members ?? []).filter((member) => (
    member.organization_role !== "owner"
    && member.organization_status === "active"
    && member.membership?.status !== "active"
  )), [members]);

  const complete = (text: string) => {
    setMessage(text); setError(null); setBusyId(null); setReload((value) => value + 1); onAccessChanged?.();
  };
  const fail = (mutationError: unknown) => {
    setBusyId(null); setMessage(null);
    setError(mutationError instanceof ApiClientError && mutationError.type === "project_membership_conflict"
      ? "Project access changed elsewhere. Reload the roster and try again."
      : mutationError instanceof ApiClientError && (mutationError.kind === "forbidden" || mutationError.kind === "not_found")
        ? "Your Project access changed. Return to the workspace or reload."
        : "Could not update Project access.");
  };

  const assign = async () => {
    if (!candidateId || busyId) return;
    setBusyId("assign");
    try { await assignProjectMembership(projectId, { org_user_id: candidateId, role: candidateRole }); complete("Project access assigned."); }
    catch (mutationError) { fail(mutationError); }
  };

  const changeRole = async (member: ProjectAccessMember, role: ProjectRole) => {
    if (!member.membership || busyId) return;
    setBusyId(member.org_user_id);
    try { await changeProjectMembershipRole(projectId, member.membership.id, { role, expected_version: member.membership.version }); complete("Project role updated."); }
    catch (mutationError) { fail(mutationError); }
  };

  const remove = async (member: ProjectAccessMember) => {
    if (!member.membership || busyId || !window.confirm(`Remove ${member.display_name} from this Project?`)) return;
    setBusyId(member.org_user_id);
    try { await removeProjectMembership(projectId, member.membership.id, member.membership.version); complete(`${member.display_name} no longer has Project access.`); }
    catch (mutationError) { fail(mutationError); }
  };

  return <Card className={styles.panel} aria-busy={members === null} aria-labelledby="project-membership-heading">
    <CardHeader><h2 id="project-membership-heading" className={styles.title}>Membership</h2></CardHeader>
    <CardContent>
      <p>Control who can discover and work in this Project. Organization owners always have Project admin access.</p>
      <div aria-live="polite">{message ? <Alert variant="success">{message}</Alert> : null}{error ? <Alert variant="destructive">{error}</Alert> : null}</div>
      {members === null ? <p role="status">Loading Project access…</p> : <>
        {error ? <Button size="sm" variant="secondary" onClick={() => setReload((value) => value + 1)}>Retry</Button> : null}
        <ul className={styles.roster}>
          {members.filter((member) => member.organization_role === "owner" || member.membership).map((member) => {
            const immutable = member.organization_role === "owner";
            const disabled = member.organization_status !== "active";
            return <li key={member.org_user_id} className={styles.member}>
              <div><strong>{member.display_name}</strong><span>{member.email}</span>
                <div className={styles.badges}><Badge>{immutable ? "Organization owner" : member.membership?.status ?? "unassigned"}</Badge>{disabled ? <Badge>Organization disabled</Badge> : null}</div>
              </div>
              {immutable ? <span>Project admin</span> : member.membership?.status === "active" ? <div className={styles.actions}>
                <label>Project role<select aria-label={`Project role for ${member.display_name}`} value={member.membership.role} disabled={disabled || busyId !== null} onChange={(event) => void changeRole(member, event.target.value as ProjectRole)}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
                <Button size="sm" variant="secondary" disabled={busyId !== null} onClick={() => void remove(member)}>Remove {member.display_name}</Button>
              </div> : null}
            </li>;
          })}
        </ul>
        <div className={styles.assign}>
          <label>Organization member<select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}><option value="">Choose a member</option>{candidates.map((member) => <option key={member.org_user_id} value={member.org_user_id}>{member.display_name}</option>)}</select></label>
          <label>Project role<select value={candidateRole} onChange={(event) => setCandidateRole(event.target.value as ProjectRole)}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
          <Button disabled={!candidateId || busyId !== null} onClick={() => void assign()}>Assign access</Button>
          {candidates.length === 0 ? <span>No unassigned active Organization Members.</span> : null}
        </div>
      </>}
    </CardContent>
  </Card>;
};
