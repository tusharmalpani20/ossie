/**
 * @fileoverview Project Version management settings section.
 */

import { type FormEvent, useEffect, useState } from "react";
import { Alert } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import type { Project } from "@repo/types/project";
import type {
  ProjectVersion,
  ProjectVersionDetail,
} from "@repo/types/project-version";
import {
  ApiClientError,
  archiveProjectVersion,
  createProjectVersion,
  getProjectVersion,
  listProjectVersions,
  reorderProjectVersions,
  restoreProjectVersion,
  setDefaultProjectVersion,
  updateProjectVersion,
} from "../../lib/api";
import styles from "./ProjectVersionManagementSection.module.css";

const messageFor = (error: unknown) => {
  if (error instanceof ApiClientError) {
    if (error.type === "project_version_slug_conflict")
      return "That slug or a permanent former slug is already reserved.";
    if (error.type === "project_version_conflict")
      return "This Project Version changed. Reload and try again.";
    if (error.type === "default_project_version_archive_forbidden")
      return "Choose another Default before archiving this Version.";
    if (error.type === "project_version_legacy_content_blocks_default_change")
      return "The Default cannot change until existing Project content has Version ownership.";
    if (error.kind === "validation")
      return "Check the Project Version fields and try again.";
  }
  return "Could not update Project Versions.";
};

/** Renders Project Version lifecycle and metadata controls. */
export const ProjectVersionManagementSection = ({
  project,
  onProjectChange,
}: {
  project: Project;
  onProjectChange?: (project: Project) => void;
}) => {
  const [versions, setVersions] = useState<ProjectVersionDetail[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    slug: "",
    release_date: "",
  });
  const load = () => {
    setStatus("loading");
    listProjectVersions(project.id)
      .then(async ({ project_versions }) => {
        const details = await Promise.all(
          project_versions.map(({ id }) =>
            getProjectVersion(project.id, id).then(
              ({ project_version }) => project_version,
            ),
          ),
        );
        setVersions(details);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  };
  useEffect(load, [project.id]);
  const mutate = async (
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    if (busy) return;
    setBusy(key);
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      load();
    } catch (caught) {
      setError(messageFor(caught));
    } finally {
      setBusy(null);
    }
  };
  const create = (event: FormEvent) => {
    event.preventDefault();
    void mutate(
      "create",
      async () => {
        await createProjectVersion(project.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
          release_date: form.release_date || null,
        });
        setForm({ name: "", description: "", slug: "", release_date: "" });
      },
      "Project Version created.",
    );
  };
  const active = versions.filter(
    ({ status: lifecycle }) => lifecycle === "active",
  );
  const archived = versions.filter(
    ({ status: lifecycle }) => lifecycle === "archived",
  );
  const move = (version: ProjectVersion, offset: number) => {
    const ordered = [...active].sort((a, b) => a.position - b.position);
    const current = ordered.findIndex(({ id }) => id === version.id);
    const target = current + offset;
    if (target < 0 || target >= ordered.length) return;
    [ordered[current], ordered[target]] = [ordered[target]!, ordered[current]!];
    void mutate(
      version.id,
      () =>
        reorderProjectVersions(project.id, {
          project_versions: ordered.map(({ id, version: row }) => ({
            id,
            expected_version: row,
          })),
        }),
      "Project Version order saved.",
    );
  };
  if (status === "loading")
    return (
      <Card id="project-versions" className={styles.panel}>
        Loading Project Versions...
      </Card>
    );
  if (status === "error")
    return (
      <Card id="project-versions" className={styles.panel}>
        <Alert variant="destructive">Could not load Project Versions.</Alert>
        <Button onClick={load}>Retry</Button>
      </Card>
    );
  return (
    <Card
      id="project-versions"
      className={styles.panel}
      aria-labelledby="project-versions-heading"
    >
      <CardHeader>
        <h2 id="project-versions-heading">Project Versions</h2>
        <CardDescription>
          Organize release contexts without moving existing content.
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.content}>
        {message ? <Alert variant="success">{message}</Alert> : null}
        {error ? <Alert variant="destructive">{error}</Alert> : null}
        {project.status === "active" ? (
          <section
            className={styles.createSection}
            aria-labelledby="create-project-version-heading"
          >
            <div>
              <h3 id="create-project-version-heading">
                Create a Project Version
              </h3>
              <p>Add a release context with its own content and settings.</p>
            </div>
            <form className={styles.form} onSubmit={create}>
              <Label>
                Name
                <Input
                  required
                  value={form.name}
                  disabled={busy !== null}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </Label>
              <Label>
                Description
                <Input
                  value={form.description}
                  disabled={busy !== null}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </Label>
              <Label>
                Reviewed slug (optional)
                <Input
                  value={form.slug}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  disabled={busy !== null}
                  onChange={(event) =>
                    setForm({ ...form, slug: event.target.value })
                  }
                />
              </Label>
              <Label>
                Release date (optional)
                <Input
                  type="date"
                  value={form.release_date}
                  disabled={busy !== null}
                  onChange={(event) =>
                    setForm({ ...form, release_date: event.target.value })
                  }
                />
              </Label>
              <Button
                className={styles.createButton}
                type="submit"
                disabled={busy !== null}
              >
                {busy === "create" ? "Creating..." : "Create Project Version"}
              </Button>
            </form>
          </section>
        ) : (
          <Alert>Archived Projects cannot manage Project Versions.</Alert>
        )}
        <VersionList
          title="Active"
          versions={active}
          busy={busy}
          project={project}
          move={move}
          mutate={mutate}
          onProjectChange={onProjectChange}
        />
        <VersionList
          title="Archived"
          versions={archived}
          busy={busy}
          project={project}
          mutate={mutate}
          onProjectChange={onProjectChange}
        />
      </CardContent>
    </Card>
  );
};

const VersionList = ({
  title,
  versions,
  busy,
  project,
  move,
  mutate,
  onProjectChange,
}: {
  title: string;
  versions: ProjectVersionDetail[];
  busy: string | null;
  project: Project;
  move?: (version: ProjectVersion, offset: number) => void;
  mutate: (
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) => Promise<void>;
  onProjectChange?: (project: Project) => void;
}) => (
  <section>
    <h3>{title}</h3>
    {versions.length === 0 ? (
      <p>No {title.toLowerCase()} Project Versions.</p>
    ) : (
      <div className={styles.list}>
        {versions.map((version, index) => (
          <article className={styles.version} key={version.id}>
            <div className={styles.versionHeader}>
              <strong>{version.name}</strong>
              {version.is_default ? <Badge>Default</Badge> : null}
              {version.status === "archived" ? <Badge>Archived</Badge> : null}
            </div>
            <div className={styles.details}>
              <span>/{version.slug}</span>
              <span>{version.release_date ?? "No release date"}</span>
            </div>
            {version.aliases.length ? (
              <p className={styles.aliases}>
                Permanent former slugs:{" "}
                {version.aliases.map(({ slug }) => `/${slug}`).join(", ")}
              </p>
            ) : null}
            <VersionEdit
              project={project}
              version={version}
              busy={busy}
              mutate={mutate}
            />
            <div className={styles.actions}>
              {move ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy !== null || index === 0}
                    onClick={() => move(version, -1)}
                  >
                    Move up
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy !== null || index === versions.length - 1}
                    onClick={() => move(version, 1)}
                  >
                    Move down
                  </Button>
                </>
              ) : null}
              {version.status === "active" && !version.is_default ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Set ${version.name} as the Default Project Version? Existing content will not move.`,
                      )
                    )
                      return;
                    void mutate(
                      version.id,
                      async () => {
                        const response = await setDefaultProjectVersion(
                          project.id,
                          version.id,
                          {
                            expected_version: version.version,
                            expected_project_row_version: project.version,
                          },
                        );
                        onProjectChange?.(response.project);
                      },
                      "Default Project Version changed.",
                    );
                  }}
                >
                  Set Default
                </Button>
              ) : null}
              {version.status === "active" && version.is_default ? (
                <span className={styles.actionNote}>
                  Default Project Version cannot be archived.
                </span>
              ) : null}
              {version.status === "active" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy !== null || version.is_default}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Archive ${version.name}? It will become read-only.`,
                      )
                    )
                      void mutate(
                        version.id,
                        () =>
                          archiveProjectVersion(
                            project.id,
                            version.id,
                            version.version,
                          ),
                        "Project Version archived.",
                      );
                  }}
                >
                  Archive
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() =>
                    void mutate(
                      version.id,
                      () =>
                        restoreProjectVersion(
                          project.id,
                          version.id,
                          version.version,
                        ),
                      "Project Version restored.",
                    )
                  }
                >
                  Restore
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    )}
  </section>
);

const VersionEdit = ({
  project,
  version,
  busy,
  mutate,
}: {
  project: Project;
  version: ProjectVersion;
  busy: string | null;
  mutate: (
    key: string,
    action: () => Promise<unknown>,
    success: string,
  ) => Promise<void>;
}) => {
  const [name, setName] = useState(version.name);
  const [description, setDescription] = useState(version.description ?? "");
  const [releaseDate, setReleaseDate] = useState(version.release_date ?? "");
  const [slug, setSlug] = useState(version.slug);
  if (version.status === "archived" || project.status === "archived")
    return null;
  return (
    <div className={styles.edit}>
      <Label>
        Name
        <Input
          value={name}
          disabled={busy !== null}
          onChange={(event) => setName(event.target.value)}
        />
      </Label>
      <Label>
        Description
        <Input
          value={description}
          disabled={busy !== null}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Label>
      <Label>
        Release date
        <Input
          type="date"
          value={releaseDate}
          disabled={busy !== null}
          onChange={(event) => setReleaseDate(event.target.value)}
        />
      </Label>
      <Button
        size="sm"
        variant="secondary"
        disabled={
          busy !== null ||
          (name.trim() === version.name &&
            description === (version.description ?? "") &&
            releaseDate === (version.release_date ?? ""))
        }
        onClick={() =>
          void mutate(
            version.id,
            () =>
              updateProjectVersion(project.id, version.id, {
                expected_version: version.version,
                name: name.trim(),
                description: description.trim() || null,
                release_date: releaseDate || null,
              }),
            "Project Version details saved.",
          )
        }
      >
        Save details
      </Button>
      <Label>
        Canonical slug
        <Input
          value={slug}
          disabled={busy !== null}
          onChange={(event) => setSlug(event.target.value)}
        />
      </Label>
      <Button
        size="sm"
        variant="secondary"
        disabled={busy !== null || slug === version.slug}
        onClick={() => {
          if (
            window.confirm(
              `Change the slug? ${version.slug} becomes a permanent redirect and cannot be reused.`,
            )
          )
            void mutate(
              version.id,
              () =>
                updateProjectVersion(project.id, version.id, {
                  expected_version: version.version,
                  slug,
                }),
              "Canonical slug changed; the former slug is now permanent.",
            );
        }}
      >
        Change slug
      </Button>
    </div>
  );
};
