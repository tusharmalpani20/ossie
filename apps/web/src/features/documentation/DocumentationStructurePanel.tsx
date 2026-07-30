import { useState } from "react";
import { Button } from "@repo/ui/button";
import { ulid } from "ulid";
import {
  createDocumentationPage,
  replaceDocumentationNavigation,
  replaceDocumentationRouting,
  type DocumentationDraftPreview,
} from "../../lib/documentationApi";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canWrite: boolean;
  preview: DocumentationDraftPreview;
  createPage?: typeof createDocumentationPage;
  replaceNavigation?: typeof replaceDocumentationNavigation;
  replaceRouting?: typeof replaceDocumentationRouting;
};

export const DocumentationStructurePanel = ({
  projectId,
  versionSlug,
  siteId,
  canWrite,
  preview,
  createPage = createDocumentationPage,
  replaceNavigation = replaceDocumentationNavigation,
  replaceRouting = replaceDocumentationRouting,
}: Props) => {
  const [pages, setPages] = useState(preview.pages);
  const [navigationVersion, setNavigationVersion] = useState(
    preview.navigation.version,
  );
  const [routingVersion, setRoutingVersion] = useState(preview.routing.version);
  const [routingRules, setRoutingRules] = useState(preview.routing.rules);
  const [nodes, setNodes] = useState(preview.navigation.nodes);
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [groupLabel, setGroupLabel] = useState("");
  const [retiredPath, setRetiredPath] = useState("");
  const [redirectPath, setRedirectPath] = useState("");
  const [redirectTarget, setRedirectTarget] = useState("");
  const [status, setStatus] = useState("");

  if (!canWrite)
    return (
      <section aria-labelledby="structure-heading">
        <h2 id="structure-heading">Structure</h2>
        <p>Structure is read-only.</p>
      </section>
    );

  const onCreatePage = async () => {
    setStatus("Creating Page…");
    try {
      const { page } = await createPage(projectId, versionSlug, siteId, {
        title,
        description: null,
        canonical_path: path,
      });
      setPages((current) => [...current, page]);
      setNodes((current) => [
        ...current,
        {
          id: ulid(),
          parent_id: null,
          kind: "page",
          label: null,
          page_id: page.id,
          position: current.filter((node) => node.parent_id === null).length + 1,
          version: 0,
        },
      ]);
      setTitle("");
      setPath("");
      setStatus("Page created. Save navigation to expose it in the reader.");
    } catch {
      setStatus("Page could not be created.");
    }
  };

  const onSaveNavigation = async () => {
    setStatus("Saving navigation…");
    try {
      const { navigation } = await replaceNavigation(
        projectId,
        versionSlug,
        siteId,
        {
          expected_version: navigationVersion,
          nodes: nodes.map((node) => ({
            id: node.id,
            parent_id: node.parent_id,
            kind: node.kind,
            label: node.label,
            page_id: node.page_id,
            position: node.position,
            expected_version: node.version || null,
          })),
        },
      );
      setNavigationVersion(navigation.version);
      setStatus("Navigation saved.");
    } catch {
      setStatus("Navigation changed elsewhere. Reload and retry.");
    }
  };

  const normalizeNodePositions = (nextNodes: typeof nodes) => {
    const positions = new Map<string, number>();
    return nextNodes.map((node) => {
      const parent = node.parent_id ?? "root";
      const position = (positions.get(parent) ?? 0) + 1;
      positions.set(parent, position);
      return { ...node, position };
    });
  };

  const moveNode = (id: string, offset: -1 | 1) => {
    const index = nodes.findIndex((node) => node.id === id);
    if (index < 0) return;
    const siblingIndexes = nodes
      .map((node, nodeIndex) => ({ node, nodeIndex }))
      .filter(({ node }) => node.parent_id === nodes[index]!.parent_id);
    const siblingPosition = siblingIndexes.findIndex(
      ({ node }) => node.id === id,
    );
    const target = siblingIndexes[siblingPosition + offset];
    if (!target) return;
    const next = [...nodes];
    [next[index], next[target.nodeIndex]] = [next[target.nodeIndex]!, next[index]!];
    setNodes(normalizeNodePositions(next));
  };

  const addGroup = () => {
    if (!groupLabel.trim()) return;
    setNodes((current) =>
      normalizeNodePositions([
        ...current,
        {
          id: ulid(),
          parent_id: null,
          kind: "group",
          label: groupLabel.trim(),
          page_id: null,
          position: 1,
          version: 0,
        },
      ]),
    );
    setGroupLabel("");
    setStatus("Navigation group added. Save navigation to retain it.");
  };

  const onMarkGone = async () => {
    setStatus("Saving retired path…");
    try {
      const rules = [
        ...routingRules.map((rule) => ({
          id: rule.id,
          source_path: rule.source_path,
          outcome: rule.outcome,
          target_page_id: rule.target_page_id,
          expected_version: rule.version,
        })),
        {
          id: ulid(),
          source_path: retiredPath,
          outcome: "gone" as const,
          target_page_id: null,
          expected_version: null,
        },
      ];
      const { routing } = await replaceRouting(
        projectId,
        versionSlug,
        siteId,
        { expected_version: routingVersion, rules },
      );
      setRoutingVersion(routing.version);
      setRoutingRules(
        rules.map((rule) => ({
          id: rule.id,
          source_path: rule.source_path,
          outcome: rule.outcome,
          target_page_id: rule.target_page_id,
          version: rule.expected_version === null ? 1 : rule.expected_version + 1,
        })),
      );
      setRetiredPath("");
      setStatus("Retired path now returns gone.");
    } catch {
      setStatus("Routing changed elsewhere. Reload and retry.");
    }
  };

  const onAddRedirect = async () => {
    if (!redirectPath.trim() || !redirectTarget) return;
    setStatus("Saving redirect…");
    try {
      const rules = [
        ...routingRules.map((rule) => ({
          id: rule.id,
          source_path: rule.source_path,
          outcome: rule.outcome,
          target_page_id: rule.target_page_id,
          expected_version: rule.version,
        })),
        {
          id: ulid(),
          source_path: redirectPath,
          outcome: "redirect" as const,
          target_page_id: redirectTarget,
          expected_version: null,
        },
      ];
      const { routing } = await replaceRouting(
        projectId,
        versionSlug,
        siteId,
        { expected_version: routingVersion, rules },
      );
      setRoutingVersion(routing.version);
      setRoutingRules(
        rules.map((rule) => ({
          id: rule.id,
          source_path: rule.source_path,
          outcome: rule.outcome,
          target_page_id: rule.target_page_id,
          version: rule.expected_version === null ? 1 : rule.expected_version + 1,
        })),
      );
      setRedirectPath("");
      setRedirectTarget("");
      setStatus("Permanent redirect saved.");
    } catch {
      setStatus("Routing changed elsewhere. Reload and retry.");
    }
  };

  return (
    <section aria-labelledby="structure-heading">
      <h2 id="structure-heading">Structure</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onCreatePage();
        }}
      >
        <label>
          Page title
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label>
          Page path
          <input
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)*"
            value={path}
            onChange={(event) => setPath(event.target.value)}
          />
        </label>
        <Button type="submit">Create Page</Button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          addGroup();
        }}
      >
        <label>
          Navigation group label
          <input
            required
            value={groupLabel}
            onChange={(event) => setGroupLabel(event.target.value)}
          />
        </label>
        <Button type="submit">Add navigation group</Button>
      </form>
      <ol>
        {nodes.map((node) => (
          <li key={node.id}>
            {node.kind === "group"
              ? node.label
              : pages.find((page) => page.id === node.page_id)?.title ??
                "Unknown Page"}
            {node.kind === "page" ? (
              <label>
                Parent group
                <select
                  value={node.parent_id ?? ""}
                  onChange={(event) =>
                    setNodes((current) =>
                      normalizeNodePositions(
                        current.map((candidate) =>
                          candidate.id === node.id
                            ? {
                                ...candidate,
                                parent_id: event.target.value || null,
                              }
                            : candidate,
                        ),
                      ),
                    )
                  }
                >
                  <option value="">Top level</option>
                  {nodes
                    .filter((candidate) => candidate.kind === "group")
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}
            <Button onClick={() => moveNode(node.id, -1)}>Move up</Button>
            <Button onClick={() => moveNode(node.id, 1)}>Move down</Button>
          </li>
        ))}
      </ol>
      <Button onClick={() => void onSaveNavigation()}>
        Save navigation
      </Button>
      {preview.routing.aliases.length ? (
        <ul aria-label="Permanent aliases">
          {preview.routing.aliases.map((alias) => (
            <li key={alias.id}>{alias.former_path}</li>
          ))}
        </ul>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onAddRedirect();
        }}
      >
        <label>
          Redirect source path
          <input
            required
            value={redirectPath}
            onChange={(event) => setRedirectPath(event.target.value)}
          />
        </label>
        <label>
          Redirect target Page
          <select
            required
            value={redirectTarget}
            onChange={(event) => setRedirectTarget(event.target.value)}
          >
            <option value="">Select a Page</option>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.title}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit">Add permanent redirect</Button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onMarkGone();
        }}
      >
        <label>
          Retired path
          <input
            required
            value={retiredPath}
            onChange={(event) => setRetiredPath(event.target.value)}
          />
        </label>
        <Button type="submit">Mark path gone</Button>
      </form>
      <p role="status">{status}</p>
    </section>
  );
};
