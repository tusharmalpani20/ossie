import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
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

  const refresh = async () => {
    const [loadedPolicy, loadedRequests, loadedEvidence] = await Promise.all([
      loadPolicy(projectId, versionSlug, siteId),
      loadRequests(projectId, versionSlug, siteId, "all"),
      loadEvidence(projectId, versionSlug, siteId).catch(() => ({
        evidence: [],
        next_cursor: null,
      })),
    ]);
    setPolicy(loadedPolicy);
    setRequests(loadedRequests.review_requests);
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
      setCandidates(loadedCandidates.candidates);
    }
    setStatus("Review workflow loaded.");
  };

  useEffect(() => {
    void refresh().catch(() =>
      setStatus("Review workflow could not be loaded."),
    );
    // Inputs identify the complete route scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, versionSlug, siteId]);

  const requestReview = async () => {
    if (!policy || !latestRevision || !selected.length) return;
    setStatus("Requesting review for the exact Revision…");
    try {
      await createRequest(projectId, versionSlug, siteId, {
        site_revision_id: latestRevision.id,
        expected_policy_version: policy.version,
        reviewer_org_user_ids: selected,
      });
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
          {detail.review_request.status === "open" && canRequest ? (
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
                      <p>
                        Override reason:{" "}
                        {evidenceDetail.override_reason ?? "Not overridden"}
                      </p>
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
      <p className={styles.status} role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
};
