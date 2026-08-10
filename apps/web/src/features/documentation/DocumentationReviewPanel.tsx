import { useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui/button";
import { StatusPanel } from "@repo/ui/status-panel";
import {
  createDocumentationReviewRequest,
  cancelDocumentationReview,
  decideDocumentationReview,
  getDocumentationPublicationReviewEvidence,
  getDocumentationReviewPolicy,
  getDocumentationReviewRequest,
  listDocumentationPublicationReviewEvidence,
  listDocumentationReviewCandidates,
  listDocumentationReviewRequests,
  updateDocumentationReviewPolicy,
  type DocumentationReviewCandidate,
  type DocumentationReviewPolicy,
  type DocumentationReviewRequest,
  type DocumentationReviewDetail,
} from "../../lib/documentationReviewApi";
import styles from "./DocumentationReview.module.css";

const announceGateChange = (siteId: string) =>
  window.dispatchEvent(
    new CustomEvent("documentation-review-gate-changed", {
      detail: { siteId, source: "review" },
    }),
  );

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  latestRevision: { id: string; revision_number: number } | null;
  canRequest: boolean;
  canManagePolicy: boolean;
  canDecide?: boolean;
  loadPolicy?: typeof getDocumentationReviewPolicy;
  loadCandidates?: typeof listDocumentationReviewCandidates;
  loadRequests?: typeof listDocumentationReviewRequests;
  createRequest?: typeof createDocumentationReviewRequest;
  updatePolicy?: typeof updateDocumentationReviewPolicy;
  loadDetail?: typeof getDocumentationReviewRequest;
  decideReview?: typeof decideDocumentationReview;
  cancelReview?: typeof cancelDocumentationReview;
  loadEvidence?: typeof listDocumentationPublicationReviewEvidence;
  loadEvidenceDetail?: typeof getDocumentationPublicationReviewEvidence;
};

export const DocumentationReviewPanel = ({
  projectId,
  versionSlug,
  siteId,
  latestRevision,
  canRequest,
  canManagePolicy,
  canDecide = false,
  loadPolicy = getDocumentationReviewPolicy,
  loadCandidates = listDocumentationReviewCandidates,
  loadRequests = listDocumentationReviewRequests,
  createRequest = createDocumentationReviewRequest,
  updatePolicy = updateDocumentationReviewPolicy,
  loadDetail = getDocumentationReviewRequest,
  decideReview = decideDocumentationReview,
  cancelReview = cancelDocumentationReview,
  loadEvidence = listDocumentationPublicationReviewEvidence,
  loadEvidenceDetail = getDocumentationPublicationReviewEvidence,
}: Props) => {
  const [policy, setPolicy] = useState<DocumentationReviewPolicy | null>(null);
  const [candidates, setCandidates] = useState<DocumentationReviewCandidate[]>(
    [],
  );
  const [requests, setRequests] = useState<DocumentationReviewRequest[]>([]);
  const [requestStatus, setRequestStatus] = useState("all");
  const [requestParticipation, setRequestParticipation] = useState("all");
  const [requestCursor, setRequestCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [detail, setDetail] = useState<DocumentationReviewDetail | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [requiredApprovals, setRequiredApprovals] = useState(1);
  const [requireMaintainer, setRequireMaintainer] = useState(false);
  const [maintainers, setMaintainers] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<
    Awaited<ReturnType<typeof loadEvidence>>["evidence"]
  >([]);
  const [evidenceDetail, setEvidenceDetail] = useState<{
    id: string;
    override_reason: string | null;
  } | null>(null);
  const [status, setStatus] = useState("Loading review workflow…");
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const refresh = async () => {
    const sequence = ++requestSequence.current;
    setLoadError(false);
    setLoadingMore(false);
    setLoadMoreError(null);
    setStatus("Loading review workflow…");
    const [loadedPolicy, loadedRequests, loadedEvidence] = await Promise.all([
      loadPolicy(projectId, versionSlug, siteId),
      loadRequests(
        projectId,
        versionSlug,
        siteId,
        requestStatus,
        requestParticipation,
      ),
      loadEvidence(projectId, versionSlug, siteId).catch(() => ({
        evidence: [],
        next_cursor: null,
      })),
    ]);
    if (sequence !== requestSequence.current) return;
    setPolicy(loadedPolicy);
    setRequests(loadedRequests.review_requests);
    setRequestCursor(loadedRequests.next_cursor);
    setEvidence(loadedEvidence.evidence);
    setRequiredApprovals(loadedPolicy.required_approvals);
    setRequireMaintainer(loadedPolicy.require_maintainer_approval);
    setMaintainers(loadedPolicy.maintainer_org_user_ids);
    if (canRequest) {
      const loadedCandidates = await loadCandidates(
        projectId,
        versionSlug,
        siteId,
      );
      if (sequence !== requestSequence.current) return;
      setCandidates(loadedCandidates.candidates);
    }
    setStatus("Review workflow loaded.");
  };

  useEffect(() => {
    const sequence = requestSequence.current + 1;
    void refresh().catch(() => {
      if (sequence === requestSequence.current) {
        setLoadError(true);
        setStatus("Review workflow could not be loaded.");
      }
    });
    // Inputs identify the complete route scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loadAttempt,
    projectId,
    versionSlug,
    siteId,
    requestStatus,
    requestParticipation,
  ]);

  useEffect(() => {
    const handleGateChange = (event: Event) => {
      const selected = event as CustomEvent<{
        siteId?: string;
        source?: string;
      }>;
      if (
        selected.detail?.siteId === siteId &&
        selected.detail.source === "publishing"
      )
        void refresh().catch(() =>
          setStatus("Review workflow could not be refreshed."),
        );
    };
    window.addEventListener(
      "documentation-review-gate-changed",
      handleGateChange,
    );
    return () =>
      window.removeEventListener(
        "documentation-review-gate-changed",
        handleGateChange,
      );
    // Refresh uses the same route-scope inputs as the primary effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const requestReview = async () => {
    if (!policy || !latestRevision || !selected.length) return;
    setStatus("Requesting review for the exact Revision…");
    try {
      await createRequest(projectId, versionSlug, siteId, {
        site_revision_id: latestRevision.id,
        expected_policy_version: policy.version,
        reviewer_org_user_ids: selected,
      });
      announceGateChange(siteId);
      setSelected([]);
      await refresh();
      setStatus(`Revision ${latestRevision.revision_number} is in review.`);
    } catch {
      setStatus("Review Request could not be created. Reload and retry.");
    }
  };

  const toggleRequired = async () => {
    if (!policy) return;
    setStatus("Updating review policy…");
    try {
      const updated = await updatePolicy(projectId, versionSlug, siteId, {
        expected_policy_version: policy.version,
        mode: policy.mode === "optional" ? "approval_required" : "optional",
        required_approvals: requiredApprovals,
        require_maintainer_approval: requireMaintainer,
        maintainer_org_user_ids: maintainers,
      });
      setPolicy(updated);
      announceGateChange(siteId);
      await refresh();
      setStatus("Review policy updated.");
    } catch {
      setStatus("Review policy changed. Reload and retry.");
    }
  };

  const openDetail = async (request: DocumentationReviewRequest) => {
    setStatus(`Loading Request ${request.request_number}…`);
    try {
      setDetail(await loadDetail(projectId, versionSlug, siteId, request.id));
      setStatus(`Request ${request.request_number} loaded.`);
    } catch {
      setStatus("Review detail could not be loaded.");
    }
  };

  const decide = async (decision: "approve" | "reject") => {
    if (!detail) return;
    if (decision === "reject" && !decisionReason.trim()) {
      setStatus("A rejection reason is required.");
      return;
    }
    try {
      await decideReview(
        projectId,
        versionSlug,
        siteId,
        detail.review_request.id,
        {
          expected_review_request_version: detail.review_request.version,
          decision,
          reason: decisionReason.trim() || null,
        },
      );
      announceGateChange(siteId);
      setDecisionReason("");
      setDetail(
        await loadDetail(
          projectId,
          versionSlug,
          siteId,
          detail.review_request.id,
        ),
      );
      await refresh();
      setStatus(`Review decision recorded: ${decision}.`);
    } catch {
      setStatus("Decision was not recorded. Reload the request and retry.");
    }
  };

  const cancel = async () => {
    if (!detail || !cancelReason.trim()) {
      setStatus("A cancellation reason is required.");
      return;
    }
    try {
      await cancelReview(
        projectId,
        versionSlug,
        siteId,
        detail.review_request.id,
        detail.review_request.version,
        cancelReason.trim(),
      );
      announceGateChange(siteId);
      setCancelReason("");
      setDetail(
        await loadDetail(
          projectId,
          versionSlug,
          siteId,
          detail.review_request.id,
        ),
      );
      await refresh();
      setStatus("Review Request canceled.");
    } catch {
      setStatus("Review Request was not canceled. Reload and retry.");
    }
  };

  return (
    <section
      className={styles.panel}
      aria-labelledby="documentation-review-heading"
    >
      <h2 id="documentation-review-heading">Review and approval</h2>
      {loadError ? (
        <StatusPanel
          tone="error"
          title="Could not load Documentation review."
          description="Review policy and request history are unavailable right now."
          action={
            <Button
              type="button"
              onClick={() => setLoadAttempt((value) => value + 1)}
            >
              Try again
            </Button>
          }
          titleAs="h3"
        />
      ) : null}
      {!loadError ? (
        <>
      <p>
        Policy:{" "}
        {policy?.mode === "approval_required"
          ? "Approval required"
          : "Optional"}
      </p>
      {canManagePolicy && policy ? (
        <fieldset>
          <legend>Approval policy</legend>
          <label>
            Required approvals
            <input
              type="number"
              min={1}
              max={10}
              value={requiredApprovals}
              onChange={(event) =>
                setRequiredApprovals(Number(event.target.value))
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={requireMaintainer}
              onChange={(event) => setRequireMaintainer(event.target.checked)}
            />
            Require a current maintainer approval
          </label>
          <fieldset>
            <legend>Maintainers</legend>
            {candidates.map((candidate) => (
              <label key={candidate.org_user_id} className={styles.candidate}>
                <input
                  type="checkbox"
                  checked={maintainers.includes(candidate.org_user_id)}
                  onChange={(event) =>
                    setMaintainers((current) =>
                      event.target.checked
                        ? [...current, candidate.org_user_id]
                        : current.filter((id) => id !== candidate.org_user_id),
                    )
                  }
                />
                {candidate.display_name}
              </label>
            ))}
          </fieldset>
          <Button onClick={() => void toggleRequired()}>
            Save policy as{" "}
            {policy.mode === "optional" ? "approval required" : "optional"}
          </Button>
        </fieldset>
      ) : null}
      {canRequest && latestRevision ? (
        <fieldset>
          <legend>
            Reviewers for Revision {latestRevision.revision_number}
          </legend>
          <ul className={styles.candidateList}>
            {candidates.map((candidate) => (
              <li key={candidate.org_user_id}>
                <label className={styles.candidate}>
                  <input
                    type="checkbox"
                    checked={selected.includes(candidate.org_user_id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, candidate.org_user_id]
                          : current.filter(
                              (id) => id !== candidate.org_user_id,
                            ),
                      )
                    }
                  />
                  {candidate.display_name} ({candidate.project_role})
                </label>
              </li>
            ))}
          </ul>
          <Button
            disabled={!selected.length}
            onClick={() => void requestReview()}
          >
            Request review
          </Button>
        </fieldset>
      ) : null}
      <ul className={styles.requestList} aria-label="Review Request history">
        <li>
          <label>
            Request status
            <select
              value={requestStatus}
              onChange={(event) => {
                requestSequence.current += 1;
                setRequestStatus(event.target.value);
              }}
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="canceled">Canceled</option>
              <option value="superseded">Superseded</option>
              <option value="invalidated">Invalidated</option>
            </select>
          </label>
          <label>
            Participation
            <select
              value={requestParticipation}
              onChange={(event) => {
                requestSequence.current += 1;
                setRequestParticipation(event.target.value);
              }}
            >
              <option value="all">All requests</option>
              <option value="assigned_to_me">Assigned to me</option>
              <option value="requested_by_me">Requested by me</option>
            </select>
          </label>
        </li>
        {requests.map((request) => (
          <li key={request.id}>
            Request {request.request_number}: Revision {request.revision_number}{" "}
            — {request.effective_status}
            <Button onClick={() => void openDetail(request)}>
              Open review detail
            </Button>
          </li>
        ))}
      </ul>
      {requestCursor ? (
        <>
        <Button
          disabled={loadingMore}
          onClick={() => {
            if (loadingMore) return;
            const sequence = ++requestSequence.current;
            const filterAtRequest = requestStatus;
            const participationAtRequest = requestParticipation;
            const cursorAtRequest = requestCursor;
            setLoadingMore(true);
            setLoadMoreError(null);
            setStatus("Loading more Review Requests…");
            void loadRequests(
              projectId,
              versionSlug,
              siteId,
              filterAtRequest,
              participationAtRequest,
              cursorAtRequest,
            )
              .then((loaded) => {
                if (
                  sequence !== requestSequence.current ||
                  filterAtRequest !== requestStatus ||
                  participationAtRequest !== requestParticipation
                )
                  return;
                setRequests((current) => [
                  ...current,
                  ...loaded.review_requests,
                ]);
                setRequestCursor(loaded.next_cursor);
                setStatus("More Review Requests loaded.");
              })
              .catch(() => {
                if (sequence !== requestSequence.current) return;
                const message = "More Review Requests could not be loaded.";
                setStatus(message);
                setLoadMoreError(message);
              })
              .finally(() => {
                if (sequence === requestSequence.current) setLoadingMore(false);
              });
          }}
        >
          {loadingMore ? "Loading more Review Requests…" : "Load more Review Requests"}
        </Button>
        {loadMoreError ? <p role="alert">{loadMoreError}</p> : null}
        </>
      ) : null}
      {detail ? (
        <section aria-labelledby="documentation-review-detail-heading">
          <h3 id="documentation-review-detail-heading">
            Request {detail.review_request.request_number} details
          </h3>
          <p>
            Review applies only to Revision{" "}
            {detail.review_request.revision_number}. Comments are separate and
            unresolved comments do not block approval.
          </p>
          <p>
            The Working Draft may contain changes created after this immutable
            Revision.
          </p>
          <p>
            <a
              href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/${encodeURIComponent(siteId)}/revisions/${detail.review_request.revision_number}`}
            >
              Open immutable Revision {detail.review_request.revision_number}
            </a>
          </p>
          <section aria-labelledby="documentation-review-change-summary-heading">
            <h4 id="documentation-review-change-summary-heading">
              Structural change summary
            </h4>
            <p>
              Baseline:{" "}
              {detail.change_summary.baseline_revision_number === null
                ? "First Revision"
                : `Revision ${detail.change_summary.baseline_revision_number}`}
            </p>
            <ul>
              <li>
                Pages: {detail.change_summary.pages.added} added,{" "}
                {detail.change_summary.pages.changed} changed,{" "}
                {detail.change_summary.pages.removed} removed
              </li>
              <li>
                Snippets: {detail.change_summary.snippets.added} added,{" "}
                {detail.change_summary.snippets.changed} changed,{" "}
                {detail.change_summary.snippets.removed} removed
              </li>
              <li>
                Assets: {detail.change_summary.assets.added} added,{" "}
                {detail.change_summary.assets.changed} changed,{" "}
                {detail.change_summary.assets.removed} removed
              </li>
              <li>
                Metadata:{" "}
                {detail.change_summary.metadata_changed
                  ? "changed"
                  : "unchanged"}
              </li>
              <li>
                Navigation:{" "}
                {detail.change_summary.navigation_changed
                  ? "changed"
                  : "unchanged"}
              </li>
              <li>
                Routing:{" "}
                {detail.change_summary.routing_changed
                  ? "changed"
                  : "unchanged"}
              </li>
              <li>
                OpenAPI:{" "}
                {detail.change_summary.openapi_changed
                  ? "changed"
                  : "unchanged"}
              </li>
              <li>
                Artifact references:{" "}
                {detail.change_summary.artifact_references_changed
                  ? "changed"
                  : "unchanged"}
              </li>
            </ul>
          </section>
          <ul aria-label="Review assignments">
            {detail.assignments.map((assignment) => (
              <li key={assignment.id}>
                {assignment.reviewer_display_name}:{" "}
                {assignment.decision?.decision ?? "pending"} (
                {assignment.current_access_status})
              </li>
            ))}
          </ul>
          {detail.review_request.status === "open" &&
          canDecide &&
          detail.actor_can_decide ? (
            <fieldset>
              <legend>Record decision</legend>
              <label htmlFor="documentation-review-decision-reason">
                Decision reason
              </label>
              <textarea
                id="documentation-review-decision-reason"
                value={decisionReason}
                onChange={(event) => setDecisionReason(event.target.value)}
              />
              <Button onClick={() => void decide("approve")}>Approve</Button>
              <Button onClick={() => void decide("reject")}>Reject</Button>
            </fieldset>
          ) : null}
          {detail.review_request.status === "open" &&
          detail.actor_can_cancel ? (
            <fieldset>
              <legend>Cancel request</legend>
              <label htmlFor="documentation-review-cancel-reason">
                Cancellation reason
              </label>
              <textarea
                id="documentation-review-cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
              <Button onClick={() => void cancel()}>Cancel request</Button>
            </fieldset>
          ) : null}
        </section>
      ) : null}
      <section aria-labelledby="documentation-review-evidence-heading">
        <h3 id="documentation-review-evidence-heading">
          Publication review evidence
        </h3>
        {evidence.length ? (
          <ul>
            {evidence.map((item) => (
              <li key={item.id}>
                {item.operation}: {item.outcome} —{" "}
                {new Date(item.created_at).toLocaleString()}
                {canManagePolicy ? (
                  <>
                    {" "}
                    <Button
                      onClick={() => {
                        setStatus("Loading publication review evidence…");
                        void loadEvidenceDetail(
                          projectId,
                          versionSlug,
                          siteId,
                          item.id,
                        )
                          .then((loaded) => {
                            setEvidenceDetail({
                              id: item.id,
                              override_reason: loaded.override_reason,
                            });
                            setStatus("Publication review evidence loaded.");
                          })
                          .catch(() =>
                            setStatus(
                              "Publication review evidence could not be loaded.",
                            ),
                          );
                      }}
                    >
                      View evidence details
                    </Button>
                    {evidenceDetail?.id === item.id ? (
                      <div>
                        <p>
                          Override reason:{" "}
                          {evidenceDetail.override_reason ?? "Not overridden"}
                        </p>
                        <Button onClick={() => setEvidenceDetail(null)}>
                          Close evidence details
                        </Button>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </li>
            ))}
          </ul>
      ) : (
          <p>Legacy publication — no review evidence recorded.</p>
        )}
      </section>
      </>
      ) : null}
      <p className={styles.status} role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
};
