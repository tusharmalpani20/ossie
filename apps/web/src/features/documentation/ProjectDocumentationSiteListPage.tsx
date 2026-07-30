import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  createDocumentationSite,
  listDocumentationSites,
  type DocumentationSiteSummary,
} from "../../lib/documentationApi";
import styles from "./ProjectDocumentationSiteListPage.module.css";

type Props = {
  projectId: string;
  versionSlug: string;
  canManage: boolean;
  loadSites?: typeof listDocumentationSites;
  createSite?: typeof createDocumentationSite;
};

export const ProjectDocumentationSiteListPage = ({
  projectId,
  versionSlug,
  canManage,
  loadSites = listDocumentationSites,
  createSite = createDocumentationSite,
}: Props) => {
  const [sites, setSites] = useState<DocumentationSiteSummary[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    let active = true;
    loadSites(projectId, versionSlug)
      .then((result) => {
        if (active) {
          setSites(result.documentation_sites);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [loadSites, projectId, versionSlug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const created = await createSite(projectId, versionSlug, {
      name,
      description: null,
      primary_language: "en-US",
      initial_home_page: { title: "Home", path: "home" },
    });
    setSites((current) => [
      ...current,
      {
        id: created.site.id,
        name: created.site.name,
        description: created.site.description ?? null,
        edition_id: created.edition.id,
        primary_language: created.edition.primary_language,
        version: 1,
        edition_version: 1,
        updated_at: new Date().toISOString(),
      },
    ]);
    setCreating(false);
  };

  if (status === "loading")
    return <p role="status">Loading Documentation Sites…</p>;
  if (status === "error")
    return <p role="alert">Documentation Sites could not be loaded.</p>;

  return (
    <main className={styles.page} id="main-content">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Project Version Documentation</p>
          <h1>Documentation Sites</h1>
        </div>
        {canManage && !creating ? (
          <Button onClick={() => setCreating(true)}>Create Site</Button>
        ) : null}
      </header>
      {creating ? (
        <form className={styles.form} onSubmit={submit}>
          <Label htmlFor="documentation-site-name">Site name</Label>
          <Input
            id="documentation-site-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={200}
          />
          <Button type="submit">Create Documentation Site</Button>
        </form>
      ) : null}
      {sites.length === 0 ? (
        <section className={styles.empty}>
          <h2>No Documentation Sites yet</h2>
          <p>Create a version-aware Site for product and API knowledge.</p>
        </section>
      ) : (
        <ul className={styles.list}>
          {sites.map((site) => (
            <li key={site.id}>
              <a
                href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/documentation/${encodeURIComponent(site.id)}`}
              >
                <strong>{site.name}</strong>
                <span>{site.primary_language}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
};
