import { type ReactNode, useEffect, useState } from "react";
import type {
  ComplianceAuditEventDetailResponse,
  ComplianceAuditState,
  ComplianceEventsResponse,
  ComplianceKind,
} from "@repo/types/compliance";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import {
  ApiClientError,
  getComplianceAuditEvent,
  listComplianceEvents,
} from "../../lib/api";
import { currentBrowserPath, signInUrl } from "../auth/navigation";
import { PortalTopbar } from "../portal/PortalTopbar";
import styles from "./ComplianceTimelinePage.module.css";

type PageState =
  | { status: "loading" }
  | { status: "loaded"; response: ComplianceEventsResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "error" };
type DetailState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "loaded"; response: ComplianceAuditEventDetailResponse };

type Props = {
  loadEvents?: typeof listComplianceEvents;
  loadAuditDetail?: typeof getComplianceAuditEvent;
  currentPath?: string;
  performLogout?: () => Promise<void>;
  navigate?: (path: string) => void;
};

const pageStateFromError = (error: unknown): PageState => {
  if (error instanceof ApiClientError && error.kind === "unauthenticated")
    return { status: "unauthenticated" };
  if (error instanceof ApiClientError && error.kind === "forbidden")
    return { status: "forbidden" };
  return { status: "error" };
};

const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

const displayState = (state: ComplianceAuditState) => {
  if (state.state !== "value") return state.state;
  if (state.value_type === "boolean") return state.value ? "true" : "false";
  return String(state.value);
};

export const ComplianceTimelinePage = ({
  loadEvents = listComplianceEvents,
  loadAuditDetail = getComplianceAuditEvent,
  currentPath = currentBrowserPath(),
  performLogout,
  navigate,
}: Props) => {
  const [kind, setKind] = useState<ComplianceKind>("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [details, setDetails] = useState<Record<string, DetailState>>({});

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    setDetails({});
    loadEvents({ kind })
      .then((response) => active && setState({ status: "loaded", response }))
      .catch((error: unknown) => active && setState(pageStateFromError(error)));
    return () => { active = false; };
  }, [kind, loadEvents, reloadKey]);

  const loadMore = async () => {
    if (state.status !== "loaded" || !state.response.page.next_cursor) return;
    setLoadingMore(true);
    setLoadMoreError(false);
    try {
      const next = await loadEvents({ kind, cursor: state.response.page.next_cursor });
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

  const loadDetail = async (id: string, retry = false) => {
    if (!retry && details[id]) return;
    setDetails((current) => ({ ...current, [id]: { status: "loading" } }));
    try {
      const response = await loadAuditDetail(id);
      setDetails((current) => ({ ...current, [id]: { status: "loaded", response } }));
    } catch {
      setDetails((current) => ({ ...current, [id]: { status: "error" } }));
    }
  };

  return (
    <Shell performLogout={performLogout} navigate={navigate}>
      <header className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Retained organization evidence</div>
          <h1 className={styles.title}>Compliance timeline</h1>
        </div>
        <a className={styles.backLink} href="/organization/members">Organization members</a>
      </header>

      {state.status === "unauthenticated" ? (
        <StateMessage>Sign in to view compliance evidence. <a href={signInUrl(currentPath)}>Sign in</a></StateMessage>
      ) : state.status === "forbidden" ? (
        <StateMessage>Only organization owners can view compliance evidence.</StateMessage>
      ) : state.status === "error" ? (
        <StateMessage>Could not load compliance evidence. <Button size="sm" variant="secondary" onClick={() => setReloadKey((value) => value + 1)}>Retry</Button></StateMessage>
      ) : state.status === "loading" ? (
        <StateMessage>Loading retained evidence…</StateMessage>
      ) : (
        <>
          <div className={styles.controls}>
            <label className={styles.filter}>Evidence kind
              <select value={kind} onChange={(event) => setKind(event.target.value as ComplianceKind)}>
                <option value="all">All evidence</option>
                <option value="audit">Audit</option>
                <option value="access">Access</option>
              </select>
            </label>
          </div>
          <section className={styles.totals} aria-label="Retained evidence counts">
            <Metric label="Audit events" value={state.response.totals.audit_events} />
            <Metric label="Audit change items" value={state.response.totals.audit_change_items} />
            <Metric label="Access events" value={state.response.totals.access_events} />
          </section>
          {state.response.events.length === 0 ? (
            <StateMessage>No retained evidence matches this filter.</StateMessage>
          ) : (
            <section className={styles.timeline} aria-label="Compliance evidence timeline">
              {state.response.events.map((event) => (
                <Card key={`${event.evidence_kind}-${event.id}`} className={styles.eventCard}>
                  <CardContent>
                    <div className={styles.eventHeader}>
                      <div className={styles.badges}><Badge>{event.evidence_kind}</Badge><Badge>{event.outcome}</Badge></div>
                      <time dateTime={event.occurred_at}>{formatDate(event.occurred_at)}</time>
                    </div>
                    <h2 className={styles.action}>{event.action}</h2>
                    <dl className={styles.meta}>
                      <Meta label="Actor" value={`${event.actor_label} (${event.actor_type})`} />
                      <Meta label="Source" value={event.source_type} />
                      <Meta label="Root" value={`${event.root_resource_type}${event.root_resource_id ? ` · ${event.root_resource_id}` : ""}`} />
                      {event.project_id ? <Meta label="Project ID" value={event.project_id} /> : null}
                      {event.request_id ? <Meta label="Request ID" value={event.request_id} /> : null}
                    </dl>
                    {event.evidence_kind === "access" ? (
                      <dl className={styles.accessContext}>
                        {event.route_template ? <Meta label="Route" value={`${event.http_method ?? ""} ${event.route_template}`.trim()} /> : null}
                        <Meta label="Surface" value={event.access_surface} />
                        <Meta label="Authorization" value={`${event.authorization_type}${event.authorization_role ? ` · ${event.authorization_role}` : ""}`} />
                        {event.reason_code ? <Meta label="Reason" value={event.reason_code} /> : null}
                        {event.response_bytes !== null ? <Meta label="Response size" value={`${new Intl.NumberFormat().format(event.response_bytes)} bytes`} /> : null}
                      </dl>
                    ) : (
                      <details className={styles.disclosure} onToggle={(toggle) => {
                        if (toggle.currentTarget.open) void loadDetail(event.id);
                      }}>
                        <summary>View {event.change_item_count} change {event.change_item_count === 1 ? "item" : "items"}</summary>
                        <AuditDetail state={details[event.id]} retry={() => void loadDetail(event.id, true)} />
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </section>
          )}
          {state.response.page.has_more ? (
            <div className={styles.pagination}>
              {loadMoreError ? <span>Could not load the next page.</span> : null}
              <Button variant="secondary" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Loading…" : loadMoreError ? "Retry Load More" : "Load More"}</Button>
            </div>
          ) : null}
        </>
      )}
    </Shell>
  );
};

const AuditDetail = ({ state, retry }: { state?: DetailState; retry: () => void }) => {
  if (!state || state.status === "loading") return <p className={styles.detailState}>Loading Audit changes…</p>;
  if (state.status === "error") return <p className={styles.detailState}>Could not load Audit changes. <Button size="sm" variant="secondary" onClick={retry}>Retry</Button></p>;
  const event = state.response.event;
  return <div className={styles.detail}>
    <dl className={styles.meta}>
      <Meta label="Row versions" value={`${event.before_row_version ?? "—"} → ${event.after_row_version ?? "—"}`} />
      {event.correlation_id ? <Meta label="Correlation ID" value={event.correlation_id} /> : null}
      {event.idempotency_key_hash ? <Meta label="Idempotency hash" value={event.idempotency_key_hash} /> : null}
    </dl>
    <ol className={styles.changes}>
      {event.change_items.map((item) => <li key={item.id}>
        <strong>{item.entity_type}{item.field_name ? ` · ${item.field_name}` : ""}</strong>
        <span>{displayState(item.before)} → {displayState(item.after)}</span>
      </li>)}
    </ol>
  </div>;
};

const Meta = ({ label, value }: { label: string; value: string }) => <div><dt>{label}</dt><dd>{value}</dd></div>;
const Metric = ({ label, value }: { label: string; value: number }) => <Card><CardContent><strong className={styles.metricValue}>{new Intl.NumberFormat().format(value)}</strong><span className={styles.metricLabel}>{label}</span></CardContent></Card>;
const StateMessage = ({ children }: { children: ReactNode }) => <div className={styles.state}>{children}</div>;
const Shell = ({ children, performLogout, navigate }: { children: ReactNode; performLogout?: () => Promise<void>; navigate?: (path: string) => void }) => <div className={styles.page}><PortalTopbar context="Organization" performLogout={performLogout} navigate={navigate} /><main className={styles.main}>{children}</main></div>;
