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
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [retiredPath, setRetiredPath] = useState("");
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
          nodes: pages.map((page, index) => ({
            id:
              preview.navigation.nodes.find((node) => node.page_id === page.id)
                ?.id ?? ulid(),
            parent_id: null,
            kind: "page",
            label: null,
            page_id: page.id,
            position: index + 1,
            expected_version:
              preview.navigation.nodes.find((node) => node.page_id === page.id)
                ?.version ?? null,
          })),
        },
      );
      setNavigationVersion(navigation.version);
      setStatus("Navigation saved.");
    } catch {
      setStatus("Navigation changed elsewhere. Reload and retry.");
    }
  };

  const onMarkGone = async () => {
    setStatus("Saving retired path…");
    try {
      const rules = [
        ...preview.routing.rules.map((rule) => ({
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
      setRetiredPath("");
      setStatus("Retired path now returns gone.");
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
      <Button onClick={() => void onSaveNavigation()}>
        Save Page navigation
      </Button>
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
