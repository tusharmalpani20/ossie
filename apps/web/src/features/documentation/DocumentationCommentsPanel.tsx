import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import {
  createDocumentationComment,
  createDocumentationCommentReply,
  listDocumentationComments,
  transitionDocumentationComment,
  type DocumentationCommentThread,
} from "../../lib/documentationApi";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  pageId: string;
  canComment: boolean;
  loadComments?: typeof listDocumentationComments;
  createThread?: typeof createDocumentationComment;
  createReply?: typeof createDocumentationCommentReply;
  transitionThread?: typeof transitionDocumentationComment;
};

export const DocumentationCommentsPanel = ({
  projectId,
  versionSlug,
  siteId,
  pageId,
  canComment,
  loadComments = listDocumentationComments,
  createThread = createDocumentationComment,
  createReply = createDocumentationCommentReply,
  transitionThread = transitionDocumentationComment,
}: Props) => {
  const [threads, setThreads] = useState<DocumentationCommentThread[]>([]);
  const [body, setBody] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Loading private comments…");

  useEffect(() => {
    let active = true;
    loadComments(projectId, versionSlug, siteId, pageId)
      .then(({ comments }) => {
        if (!active) return;
        setThreads(comments);
        setStatus(`${comments.length} private ${comments.length === 1 ? "thread" : "threads"}`);
      })
      .catch(() => {
        if (active) setStatus("Private comments could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [loadComments, pageId, projectId, siteId, versionSlug]);

  const addThread = async () => {
    const value = body.trim();
    if (!value) return;
    const { thread } = await createThread(
      projectId,
      versionSlug,
      siteId,
      pageId,
      value,
    );
    setThreads((current) => [...current, { ...thread, replies: [] }]);
    setBody("");
    setStatus("Private comment added.");
  };

  const addReply = async (thread: DocumentationCommentThread) => {
    const value = replies[thread.id]?.trim();
    if (!value) return;
    const { reply } = await createReply(
      projectId,
      versionSlug,
      siteId,
      thread.id,
      value,
    );
    setThreads((current) =>
      current.map((candidate) =>
        candidate.id === thread.id
          ? { ...candidate, replies: [...candidate.replies, reply] }
          : candidate,
      ),
    );
    setReplies((current) => ({ ...current, [thread.id]: "" }));
    setStatus("Reply added.");
  };

  const transition = async (thread: DocumentationCommentThread) => {
    const next = thread.state === "open" ? "resolve" : "reopen";
    const { thread: updated } = await transitionThread(
      projectId,
      versionSlug,
      siteId,
      thread.id,
      thread.version,
      next,
    );
    setThreads((current) =>
      current.map((candidate) =>
        candidate.id === thread.id
          ? { ...candidate, ...updated, replies: candidate.replies }
          : candidate,
      ),
    );
    setStatus(next === "resolve" ? "Comment resolved." : "Comment reopened.");
  };

  return (
    <section aria-labelledby="documentation-comments-heading">
      <h2 id="documentation-comments-heading">Private comments</h2>
      <p>Comments are excluded from previews, Revisions, Publications, and search.</p>
      {canComment ? (
        <div>
          <Label htmlFor="documentation-new-comment">New comment</Label>
          <Textarea
            id="documentation-new-comment"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <Button onClick={() => void addThread()}>Add comment</Button>
        </div>
      ) : null}
      {threads.length ? (
        <ul>
          {threads.map((thread) => (
            <li key={thread.id}>
              <p>{thread.body}</p>
              <p>{thread.state === "open" ? "Open" : "Resolved"}</p>
              {thread.replies.map((reply) => <p key={reply.id}>{reply.body}</p>)}
              {canComment ? (
                <>
                  <Label htmlFor={`documentation-reply-${thread.id}`}>
                    Reply to {thread.body}
                  </Label>
                  <Textarea
                    id={`documentation-reply-${thread.id}`}
                    value={replies[thread.id] ?? ""}
                    onChange={(event) =>
                      setReplies((current) => ({
                        ...current,
                        [thread.id]: event.target.value,
                      }))
                    }
                  />
                  <Button onClick={() => void addReply(thread)}>Reply</Button>
                  <Button onClick={() => void transition(thread)}>
                    {thread.state === "open" ? "Resolve" : "Reopen"}
                  </Button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p>No private comments.</p>
      )}
      <p role="status">{status}</p>
    </section>
  );
};
