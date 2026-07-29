import type { ReactNode } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { ArtifactPublishingPanel } from "../publish/ArtifactPublishingPanel";
import type { DemoDraft } from "./interactiveDemoEditorHelpers";
import type { InteractiveDemo } from "./types";
import styles from "./InteractiveDemoWorkbench.module.css";

export const InteractiveDemoWorkbench = ({
  projectId,
  interactiveDemoId,
  demo,
  demoDraft,
  workingDraftVersion,
  pendingAction,
  conflict,
  hasUnsavedMetadata,
  message,
  versionSlug,
  children,
  onUpdateDemoDraft,
  onSaveDemo,
  onCreateScene,
  onChangeLifecycle,
  runAggregateMutation,
}: {
  projectId: string;
  interactiveDemoId: string;
  demo: InteractiveDemo;
  demoDraft: DemoDraft;
  workingDraftVersion: number;
  pendingAction: string | null;
  conflict: boolean;
  hasUnsavedMetadata: boolean;
  message: string | null;
  versionSlug?: string;
  children: ReactNode;
  onUpdateDemoDraft: (field: keyof DemoDraft, value: string) => void;
  onSaveDemo: () => Promise<void>;
  onCreateScene: () => Promise<void>;
  onChangeLifecycle: () => Promise<void>;
  runAggregateMutation: <Result>(
    command: "publication",
    operation: () => Promise<Result>,
  ) => Promise<Result>;
}) => (
  <>
    <section className={styles.header}>
      <div>
        <div className={styles.eyebrow}>Interactive demo</div>
        <h1>{demo.title}</h1>
        {demo.description ? <p>{demo.description}</p> : null}
      </div>
      <div className={styles.headerActions}>
        <Badge variant={demo.status === "draft" ? "warning" : "success"}>
          {demo.status}
        </Badge>
        <a
          href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug ?? demo.project_version_id)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/preview`}
        >
          Preview Working Draft
        </a>
        {versionSlug ? (
          <a
            href={`/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionSlug)}/interactive-demos/${encodeURIComponent(interactiveDemoId)}/revisions`}
          >
            Revision history
          </a>
        ) : null}
        <Button
          variant="destructive"
          disabled={pendingAction !== null}
          onClick={() => void onChangeLifecycle()}
        >
          Archive demo
        </Button>
      </div>
    </section>

    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <section
          className={styles.panel}
          aria-labelledby="demo-metadata-heading"
        >
          <h2 id="demo-metadata-heading">Demo metadata</h2>
          <Label>
            Demo title
            <Input
              value={demoDraft.title}
              onChange={(event) =>
                onUpdateDemoDraft("title", event.target.value)
              }
            />
          </Label>
          <Label>
            Demo description
            <Textarea
              value={demoDraft.description}
              onChange={(event) =>
                onUpdateDemoDraft("description", event.target.value)
              }
            />
          </Label>
          <div className={styles.commandRow}>
            <Button
              disabled={pendingAction === "demo"}
              onClick={() => void onSaveDemo()}
            >
              {pendingAction === "demo" ? "Saving demo..." : "Save demo"}
            </Button>
            <span role="status">
              {conflict ? "Conflict" : hasUnsavedMetadata ? "Unsaved" : "Saved"}
            </span>
          </div>
          {message ? <p role="alert">{message}</p> : null}
        </section>

        <ArtifactPublishingPanel
          projectId={projectId}
          projectVersionId={demo.project_version_id}
          artifactType="interactive_demo"
          artifactId={interactiveDemoId}
          editionVersion={demo.version}
          workingDraftVersion={workingDraftVersion}
          publicationReadOnly={demo.status === "archived"}
          aggregateMutationPending={pendingAction !== null}
          runAggregateMutation={runAggregateMutation}
        />
      </aside>

      <section aria-labelledby="demo-scenes-heading" className={styles.stage}>
        <div className={styles.stageHeader}>
          <div>
            <span className={styles.eyebrow}>Authoring workbench</span>
            <h2 id="demo-scenes-heading">Scenes</h2>
          </div>
          <Button
            disabled={pendingAction !== null || conflict}
            onClick={() => void onCreateScene()}
          >
            Add Scene
          </Button>
        </div>
        {children}
      </section>
    </div>
  </>
);
