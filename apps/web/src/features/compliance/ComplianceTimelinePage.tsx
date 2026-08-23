import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type {
  ComplianceAuditEventDetailResponse,
  ComplianceAuditState,
  ComplianceEventsResponse,
  ComplianceKind,
} from "@repo/types/compliance";
import { Button } from "@repo/ui/button";
import { Eye, X } from "lucide-react";
import {
  ApiClientError,
  getComplianceAuditEvent,
  getProjectComplianceAuditEvent,
  listComplianceEvents,
  listProjectComplianceEvents,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalAppShell } from "../portal/PortalAppShell";
import styles from "./ComplianceTimelinePage.module.css";

type ComplianceEvent = ComplianceEventsResponse["events"][number];
type ActivityScope = "important" | "all";
type PageState =
  | { status: "loading" }
  | { status: "loaded"; response: ComplianceEventsResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not_found" }
  | { status: "error" };
type DetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; response: ComplianceAuditEventDetailResponse };

type Props = {
  projectId?: string;
  loadEvents?: typeof listComplianceEvents;
  loadAuditDetail?: typeof getComplianceAuditEvent;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const actionLabels: Record<string, string> = {
  "authentication.session.activity_recorded": "Session activity updated",
  "authentication.session.created": "Session created",
  "authentication.session.revoked": "Session revoked",
  "authentication.session.viewed": "Session viewed",
  "compliance.audit_event_viewed": "Evidence details viewed",
  "compliance.timeline_viewed": "Compliance records viewed",
  "organization.invite.created": "Organization invitation created",
  "organization.invite.revoked": "Organization invitation revoked",
  "organization.invites_viewed": "Organization invitations viewed",
  "organization.members_viewed": "Organization members viewed",
  "project.list_viewed": "Projects viewed",
};

const pageStateFromError = (error: unknown): PageState => {
  if (error instanceof ApiClientError && error.kind === "unauthenticated")
    return { status: "unauthenticated" };
  if (error instanceof ApiClientError && error.kind === "forbidden")
    return { status: "forbidden" };
  if (error instanceof ApiClientError && error.kind === "not_found")
    return { status: "not_found" };
  return { status: "error" };
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatDateOnly = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "No evidence yet";

const humanizeAction = (action: string) => {
  const known = actionLabels[action];
  if (known) return known;
  const words = action.replaceAll(".", " ").replaceAll("_", " ").trim();
  return words
    ? `${words[0]?.toUpperCase()}${words.slice(1)}`
    : "Activity recorded";
};

const eventTypeLabel = (event: ComplianceEvent) =>
  event.evidence_kind === "audit" ? "Change" : "Access";

const outcomeLabel = (outcome: ComplianceEvent["outcome"]) => {
  if (outcome === "committed") return "Completed";
  if (outcome === "succeeded") return "Successful";
  if (outcome === "not_found") return "Not found";
  if (outcome === "denied") return "Denied";
  return "Failed";
};

const outcomeTone = (outcome: ComplianceEvent["outcome"]) =>
  outcome === "committed" || outcome === "succeeded"
    ? styles.statusSuccess
    : outcome === "denied" || outcome === "failed"
      ? styles.statusDanger
      : styles.statusWarning;

const displayState = (state: ComplianceAuditState) => {
  if (state.state === "absent") return "—";
  if (state.state === "present") return "Created";
  if (state.state !== "value") return state.state;
  if (state.value_type === "boolean") return state.value ? "True" : "False";
  if (state.value_type === "timestamp") return formatDate(String(state.value));
  return String(state.value);
};

export const ComplianceTimelinePage = ({
  projectId,
  loadEvents,
  loadAuditDetail,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: Props) => {
  const resolvedLoadEvents = useMemo(
    () =>
      loadEvents ??
      (projectId
        ? (input: Parameters<typeof listComplianceEvents>[0]) =>
            listProjectComplianceEvents(projectId, input)
        : listComplianceEvents),
    [loadEvents, projectId],
  );
  const resolvedLoadDetail = useMemo(
    () =>
      loadAuditDetail ??
      (projectId
        ? (auditEventId: string) =>
            getProjectComplianceAuditEvent(projectId, auditEventId)
        : getComplianceAuditEvent),
    [loadAuditDetail, projectId],
  );
  const [kind, setKind] = useState<ComplianceKind>("all");
  const [activity, setActivity] = useState<ActivityScope>("important");
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [details, setDetails] = useState<Record<string, DetailState>>({});
  const [selectedEvent, setSelectedEvent] = useState<ComplianceEvent | null>(
    null,
  );
  const detailDialogRef = useRef<HTMLDialogElement | null>(null);
  const detailTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let activeRequest = true;
    setState({ status: "loading" });
    setDetails({});
    resolvedLoadEvents({ kind, activity })
      .then(
        (response) => activeRequest && setState({ status: "loaded", response }),
      )
      .catch(
        (error: unknown) =>
          activeRequest && setState(pageStateFromError(error)),
      );
    return () => {
      activeRequest = false;
    };
  }, [activity, kind, reloadKey, resolvedLoadEvents]);

  useEffect(() => {
    if (!selectedEvent) return;
    const dialog = detailDialogRef.current;
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
  }, [selectedEvent]);

  const loadDetail = async (id: string, retry = false) => {
    if (!retry && details[id]) return;
    setDetails((current) => ({ ...current, [id]: { status: "loading" } }));
    try {
      const response = await resolvedLoadDetail(id);
      setDetails((current) => ({
        ...current,
        [id]: { status: "loaded", response },
      }));
    } catch {
      setDetails((current) => ({ ...current, [id]: { status: "error" } }));
    }
  };

  const openDetail = (event: ComplianceEvent, trigger: HTMLButtonElement) => {
    detailTriggerRef.current = trigger;
    setSelectedEvent(event);
    if (event.evidence_kind === "audit") void loadDetail(event.id);
  };

  const closeDetail = () => {
    const dialog = detailDialogRef.current;
    if (dialog?.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
    setSelectedEvent(null);
    detailTriggerRef.current?.focus();
  };

  const loadMore = async () => {
    if (state.status !== "loaded" || !state.response.page.next_cursor) return;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const next = await resolvedLoadEvents({
        kind,
        activity,
        cursor: state.response.page.next_cursor,
      });
      setState({
        status: "loaded",
        response: {
          ...next,
          events: [...state.response.events, ...next.events],
        },
      });
    } catch {
      setLoadMoreError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <Shell
      projectId={projectId}
      performLogout={performLogout}
      navigate={navigate}
    >
      <section className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {projectId ? "Project compliance" : "Compliance"}
          </h1>
          <p className={styles.subtitle}>
            {projectId
              ? "Review important changes and access for this Project."
              : "Review important changes and access across your Organization."}
          </p>
        </div>
      </section>

      {state.status === "unauthenticated" ? (
        <StateMessage>
          Sign in to view compliance evidence.{" "}
          <a href={signInUrl(currentPath)}>Sign in</a>
        </StateMessage>
      ) : state.status === "forbidden" ? (
        <StateMessage>
          {projectId
            ? "Only Project admins can view Project compliance evidence."
            : "Only organization owners can view compliance evidence."}
        </StateMessage>
      ) : state.status === "not_found" ? (
        <StateMessage>Project was not found.</StateMessage>
      ) : state.status === "error" ? (
        <StateMessage>
          Could not load compliance evidence.{" "}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Retry
          </Button>
        </StateMessage>
      ) : state.status === "loading" ? (
        <StateMessage>Loading compliance activity…</StateMessage>
      ) : (
        <>
          <ComplianceSummary response={state.response} />
          <div className={styles.toolbar}>
            <div className={styles.filters} aria-label="Evidence type">
              {(
                [
                  ["all", "All activity"],
                  ["audit", "Changes"],
                  ["access", "Access"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  className={
                    kind === value ? styles.filterActive : styles.filter
                  }
                  type="button"
                  aria-pressed={kind === value}
                  onClick={() => setKind(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className={styles.systemToggle}>
              <input
                type="checkbox"
                checked={activity === "all"}
                onChange={(event) =>
                  setActivity(event.target.checked ? "all" : "important")
                }
              />
              Include system activity
            </label>
          </div>

          {state.response.events.length === 0 ? (
            <StateMessage>No evidence matches these filters.</StateMessage>
          ) : (
            <EvidenceTable events={state.response.events} onOpen={openDetail} />
          )}

          {state.response.page.has_more ? (
            <div className={styles.pagination}>
              {loadMoreError ? (
                <span>Could not load more evidence.</span>
              ) : null}
              <Button
                variant="secondary"
                disabled={loadingMore}
                onClick={() => void loadMore()}
              >
                {loadingMore
                  ? "Loading…"
                  : loadMoreError
                    ? "Retry"
                    : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}

      {selectedEvent ? (
        <EvidenceDialog
          dialogRef={detailDialogRef}
          event={selectedEvent}
          detail={details[selectedEvent.id]}
          onClose={closeDetail}
          onRetry={() => void loadDetail(selectedEvent.id, true)}
        />
      ) : null}
    </Shell>
  );
};

const ComplianceSummary = ({
  response,
}: {
  response: ComplianceEventsResponse;
}) => (
  <section className={styles.summary} aria-label="Evidence summary">
    <SummaryItem
      label="Changes recorded"
      value={response.totals.audit_events}
    />
    <SummaryItem label="Access records" value={response.totals.access_events} />
    <SummaryItem
      label="Evidence since"
      value={formatDateOnly(response.totals.oldest_occurred_at)}
    />
  </section>
);

const SummaryItem = ({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) => (
  <div className={styles.summaryItem}>
    <span>{label}</span>
    <strong>
      {typeof value === "number"
        ? new Intl.NumberFormat().format(value)
        : value}
    </strong>
  </div>
);

const EvidenceTable = ({
  events,
  onOpen,
}: {
  events: ComplianceEvent[];
  onOpen: (event: ComplianceEvent, trigger: HTMLButtonElement) => void;
}) => (
  <div className={styles.tableSurface}>
    <table className={styles.table} aria-label="Compliance activity">
      <thead>
        <tr>
          <th scope="col">Activity</th>
          <th scope="col">Performed by</th>
          <th scope="col">Evidence</th>
          <th scope="col">Date</th>
          <th scope="col">
            <span className={styles.srOnly}>Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => {
          const action = humanizeAction(event.action);
          return (
            <tr key={`${event.evidence_kind}-${event.id}`}>
              <td className={styles.activityCell} data-label="Activity">
                {action}
              </td>
              <td data-label="Performed by">{event.actor_label}</td>
              <td className={styles.evidenceCell} data-label="Evidence">
                <span className={styles.typeBadge}>
                  {eventTypeLabel(event)}
                </span>
                <span
                  className={`${styles.statusBadge} ${outcomeTone(event.outcome)}`}
                >
                  {outcomeLabel(event.outcome)}
                </span>
              </td>
              <td data-label="Date">
                <time dateTime={event.occurred_at}>
                  {formatDate(event.occurred_at)}
                </time>
              </td>
              <td className={styles.actionCell}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  aria-label={`View details for ${action}`}
                  onClick={(clickEvent) =>
                    onOpen(event, clickEvent.currentTarget)
                  }
                >
                  <Eye aria-hidden="true" size={16} />
                  <span className={styles.actionLabel}>View details</span>
                </Button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const EvidenceDialog = ({
  dialogRef,
  event,
  detail,
  onClose,
  onRetry,
}: {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  event: ComplianceEvent;
  detail?: DetailState;
  onClose: () => void;
  onRetry: () => void;
}) => {
  const title = humanizeAction(event.action);
  return (
    <dialog
      ref={dialogRef}
      className={styles.detailDialog}
      aria-labelledby="evidence-detail-heading"
      aria-modal="true"
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault();
        onClose();
      }}
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) onClose();
      }}
    >
      <div className={styles.detailModal}>
        <header className={styles.detailHeader}>
          <div>
            <h2 id="evidence-detail-heading">{title}</h2>
            <p>
              {event.actor_label} · {formatDate(event.occurred_at)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            aria-label="Close evidence details"
            onClick={onClose}
          >
            <X aria-hidden="true" size={19} />
          </Button>
        </header>

        <section
          className={styles.detailSection}
          aria-labelledby="summary-heading"
        >
          <h3 id="summary-heading">Summary</h3>
          <dl className={styles.detailGrid}>
            <Meta label="Type" value={eventTypeLabel(event)} />
            <Meta label="Outcome" value={outcomeLabel(event.outcome)} />
            <Meta label="Source" value={event.source_type} />
            <Meta label="Resource" value={event.root_resource_type} />
          </dl>
        </section>

        {event.evidence_kind === "audit" ? (
          <AuditChanges state={detail} retry={onRetry} />
        ) : null}

        <details className={styles.technicalDetails}>
          <summary>Technical details</summary>
          <dl className={styles.detailGrid}>
            <Meta label="Action" value={event.action} />
            <Meta label="Actor type" value={event.actor_type} />
            <Meta
              label="Resource ID"
              value={event.root_resource_id ?? "Not recorded"}
            />
            <Meta
              label="Request ID"
              value={event.request_id ?? "Not recorded"}
            />
            {event.evidence_kind === "access" ? (
              <>
                <Meta
                  label="Route"
                  value={`${event.http_method ?? ""} ${event.route_template ?? "Not recorded"}`.trim()}
                />
                <Meta label="Surface" value={event.access_surface} />
                <Meta
                  label="Authorization"
                  value={`${event.authorization_type}${event.authorization_role ? ` · ${event.authorization_role}` : ""}`}
                />
              </>
            ) : detail?.status === "loaded" ? (
              <>
                <Meta
                  label="Record version"
                  value={`${detail.response.event.before_row_version ?? "—"} → ${detail.response.event.after_row_version ?? "—"}`}
                />
                {detail.response.event.correlation_id ? (
                  <Meta
                    label="Correlation ID"
                    value={detail.response.event.correlation_id}
                  />
                ) : null}
              </>
            ) : null}
          </dl>
        </details>
      </div>
    </dialog>
  );
};

const AuditChanges = ({
  state,
  retry,
}: {
  state?: DetailState;
  retry: () => void;
}) => {
  if (!state || state.status === "loading")
    return <div className={styles.detailState}>Loading changed fields…</div>;
  if (state.status === "error")
    return (
      <div className={styles.detailState}>
        Could not load changed fields.
        <Button size="sm" variant="secondary" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  return (
    <section className={styles.detailSection} aria-labelledby="changes-heading">
      <h3 id="changes-heading">Changed fields</h3>
      <div className={styles.changeTableSurface}>
        <table className={styles.changeTable}>
          <thead>
            <tr>
              <th>Field</th>
              <th>Previous</th>
              <th>New</th>
            </tr>
          </thead>
          <tbody>
            {state.response.event.change_items.map((item) => (
              <tr key={item.id}>
                <td>{item.field_name ?? item.entity_type}</td>
                <td>{displayState(item.before)}</td>
                <td>{displayState(item.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
);

const StateMessage = ({ children }: { children: ReactNode }) => (
  <div className={styles.state}>{children}</div>
);

const Shell = ({
  children,
  projectId,
  performLogout,
  navigate,
}: {
  children: ReactNode;
  projectId?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
}) => (
  <PortalAppShell
    activeSection={projectId ? "project_compliance" : "organization_compliance"}
    currentLabel={projectId ? "Project compliance" : "Compliance"}
    project={projectId ? { id: projectId } : undefined}
    performLogout={performLogout}
    navigate={navigate}
  >
    {children}
  </PortalAppShell>
);
