import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  createDocumentationSnippet,
  getDocumentationSnippet,
  listDocumentationSnippets,
  saveDocumentationSnippet,
  transitionDocumentationSnippet,
  updateDocumentationSnippet,
  type DocumentationSnippet,
} from "../../lib/documentationApi";
import { DocumentationBlockEditor } from "./DocumentationBlockEditor";

type Props = {
  projectId: string;
  versionSlug: string;
  siteId: string;
  canWrite: boolean;
  listSnippets?: typeof listDocumentationSnippets;
  getSnippet?: typeof getDocumentationSnippet;
  createSnippet?: typeof createDocumentationSnippet;
  saveSnippet?: typeof saveDocumentationSnippet;
  transitionSnippet?: typeof transitionDocumentationSnippet;
  updateSnippet?: typeof updateDocumentationSnippet;
};

export const DocumentationSnippetPanel = ({
  projectId,
  versionSlug,
  siteId,
  canWrite,
  listSnippets = listDocumentationSnippets,
  getSnippet = getDocumentationSnippet,
  createSnippet = createDocumentationSnippet,
  saveSnippet = saveDocumentationSnippet,
  transitionSnippet = transitionDocumentationSnippet,
  updateSnippet = updateDocumentationSnippet,
}: Props) => {
  const [snippets, setSnippets] = useState<DocumentationSnippet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [status, setStatus] = useState("Loading Snippets…");
  const selected = snippets.find((snippet) => snippet.id === selectedId);

  useEffect(() => {
    let active = true;
    listSnippets(projectId, versionSlug, siteId, "all")
      .then(({ snippets: loaded }) => {
        if (!active) return;
        setSnippets(loaded.map((snippet) => ({ ...snippet, blocks: [] })));
        setSelectedId(loaded[0]?.id ?? null);
        setStatus(loaded.length ? "Snippets loaded." : "No Snippets yet.");
      })
      .catch(() => {
        if (active) setStatus("Snippets could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [listSnippets, projectId, siteId, versionSlug]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    getSnippet(projectId, versionSlug, siteId, selectedId)
      .then(({ snippet }) => {
        if (active) replace(snippet);
      })
      .catch(() => {
        if (active) setStatus("Snippet content could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [getSnippet, projectId, selectedId, siteId, versionSlug]);

  const replace = (snippet: DocumentationSnippet) => {
    setSnippets((current) => [
      ...current.filter((candidate) => candidate.id !== snippet.id),
      snippet,
    ]);
    setSelectedId(snippet.id);
    setSelectedName(snippet.name);
  };

  const create = async () => {
    if (!name.trim()) return;
    setStatus("Creating Snippet…");
    try {
      const response = await createSnippet(
        projectId,
        versionSlug,
        siteId,
        name.trim(),
      );
      replace(response.snippet);
      setName("");
      setStatus("Snippet created.");
    } catch {
      setStatus("Snippet could not be created.");
    }
  };

  const save = async () => {
    if (!selected) return;
    setStatus("Saving Snippet…");
    try {
      const response = await saveSnippet(
        projectId,
        versionSlug,
        siteId,
        selected.id,
        selected.version,
        selected.blocks,
      );
      replace(response.snippet);
      setStatus("Snippet saved.");
    } catch {
      setStatus(
        "Snippet changed on the server. Local edits are preserved; reload before retrying.",
      );
    }
  };

  const rename = async () => {
    if (!selected || !selectedName.trim()) return;
    setStatus("Renaming Snippet…");
    try {
      const response = await updateSnippet(
        projectId,
        versionSlug,
        siteId,
        selected.id,
        selected.version,
        selectedName.trim(),
      );
      replace({ ...selected, ...response.snippet });
      setStatus("Snippet renamed.");
    } catch {
      setStatus("Snippet rename conflicted or the name is unavailable.");
    }
  };

  const transition = async () => {
    if (!selected) return;
    const command = selected.status === "active" ? "archive" : "restore";
    setStatus(`${command === "archive" ? "Archiving" : "Restoring"} Snippet…`);
    try {
      const response = await transitionSnippet(
        projectId,
        versionSlug,
        siteId,
        selected.id,
        selected.version,
        command,
      );
      replace({ ...selected, ...response.snippet });
      setStatus(`Snippet ${command === "archive" ? "archived" : "restored"}.`);
    } catch {
      setStatus("Snippet lifecycle change failed.");
    }
  };

  return (
    <section aria-labelledby="documentation-snippets-heading">
      <h2 id="documentation-snippets-heading">Snippets</h2>
      {canWrite ? (
        <fieldset>
          <legend>Create reusable content</legend>
          <Label htmlFor="documentation-snippet-name">Snippet name</Label>
          <Input
            id="documentation-snippet-name"
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <Button onClick={() => void create()}>Create Snippet</Button>
        </fieldset>
      ) : null}
      {snippets.length ? (
        <>
          <Label htmlFor="documentation-snippet-selection">Snippet</Label>
          <select
            id="documentation-snippet-selection"
            onChange={(event) => setSelectedId(event.target.value)}
            value={selectedId ?? ""}
          >
            {snippets.map((snippet) => (
              <option key={snippet.id} value={snippet.id}>
                {snippet.name} ({snippet.status})
              </option>
            ))}
          </select>
        </>
      ) : null}
      {selected ? (
        <article>
          <h3>{selected.name}</h3>
          <p>{selected.status === "archived" ? "Archived" : "Active"}</p>
          {canWrite && selected.status === "active" ? (
            <>
              <Label htmlFor="selected-documentation-snippet-name">
                Selected Snippet name
              </Label>
              <Input
                id="selected-documentation-snippet-name"
                value={selectedName}
                onChange={(event) => setSelectedName(event.target.value)}
              />
              <Button onClick={() => void rename()}>Rename Snippet</Button>
              <DocumentationBlockEditor
                blocks={selected.blocks}
                onChange={(blocks) => replace({ ...selected, blocks })}
              />
              <Button onClick={() => void save()}>Save Snippet</Button>
              <Button onClick={() => void transition()}>
                Archive Snippet
              </Button>
            </>
          ) : canWrite ? (
            <>
              <p>Archived Snippets are read-only until restored.</p>
              <Button onClick={() => void transition()}>Restore Snippet</Button>
            </>
          ) : (
            <p>Read-only access</p>
          )}
        </article>
      ) : null}
      <p aria-live="polite" role="status">
        {status}
      </p>
    </section>
  );
};
