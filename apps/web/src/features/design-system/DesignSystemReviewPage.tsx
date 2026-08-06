/**
 * @fileoverview Dev-only design system review surface with synthetic examples.
 */

import { Alert, AlertDescription } from "@repo/ui/alert";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { Separator } from "@repo/ui/separator";
import styles from "./DesignSystemReviewPage.module.css";

const artifactRows = [
  {
    title: "Configure single sign-on",
    type: "Guide",
    status: "Draft",
    projectVersion: "Main",
  },
  {
    title: "Long Project Version name that should wrap",
    type: "Interactive Demo",
    status: "Published",
    projectVersion: "2026 Q3 customer-admin-release-line",
  },
  {
    title: "Archive stale capture assets",
    type: "Guide",
    status: "Permission read-only",
    projectVersion: "Support",
  },
];

const stateRows = [
  {
    title: "Loading",
    status: "In progress",
    description: "Keep the task frame stable while a slow request resolves.",
    variant: "warning" as const,
  },
  {
    title: "Empty",
    status: "No records",
    description: "Explain what belongs here and keep the next useful action close.",
    variant: "default" as const,
  },
  {
    title: "Error / retry",
    status: "Action needed",
    description: "Name the failure without leaking request or tenant details.",
    variant: "destructive" as const,
  },
  {
    title: "Archived / read-only",
    status: "Read only",
    description: "Keep content available while removing write affordances.",
    variant: "default" as const,
  },
  {
    title: "Saving / validation",
    status: "Guarded",
    description: "Show progress and point to the field or rule that blocks save.",
    variant: "warning" as const,
  },
];

/** Renders synthetic representative UI directions for child 121 review. */
export function DesignSystemReviewPage() {
  return (
    <main
      aria-label="Design system review workspace"
      className={styles.page}
    >
      <header className={styles.hero}>
        <Badge>Child 121</Badge>
        <h1>Design system review</h1>
        <p>
          Synthetic examples for the Quiet Versioned Workbench. This page uses
          no authenticated state, no private API calls, and no customer data.
        </p>
      </header>

      <section
        aria-labelledby="state-matrix-heading"
        className={styles.section}
        role="region"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="state-matrix-heading">Shared state matrix</h2>
            <p>
              Reusable states keep loading, empty, error, read-only, and
              validation behavior legible across product families.
            </p>
          </div>
          <Button size="sm" variant="secondary" disabled>
            Save changes
          </Button>
        </div>
        <div className={styles.stateGrid}>
          {stateRows.map((state) => (
            <article className={styles.stateCard} key={state.title}>
              <div className={styles.stateCardHeader}>
                <h3>{state.title}</h3>
                <Badge variant={state.variant}>{state.status}</Badge>
              </div>
              <p>{state.description}</p>
              {state.title === "Error / retry" ? (
                <div className={styles.stateActions}>
                  <Alert variant="destructive">Request failed safely.</Alert>
                  <Button size="sm" variant="secondary">
                    Retry state
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section
        aria-labelledby="library-direction"
        className={styles.section}
        role="region"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="library-direction">Library operations direction</h2>
            <p>Dense version-aware lists with text-backed status.</p>
          </div>
          <Button size="sm">New capture</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Project knowledge</CardTitle>
          </CardHeader>
          <CardContent
            aria-label="Scrollable artifact table"
            className={styles.tableWrap}
            role="region"
            tabIndex={0}
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Artifact</th>
                  <th>Kind</th>
                  <th>Status</th>
                  <th>Project Version</th>
                </tr>
              </thead>
              <tbody>
                {artifactRows.map((row) => (
                  <tr key={row.title}>
                    <td>{row.title}</td>
                    <td>{row.type}</td>
                    <td>
                      <Badge
                        variant={
                          row.status === "Published" ? "success" : "default"
                        }
                      >
                        {row.status}
                      </Badge>
                    </td>
                    <td>{row.projectVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section
        aria-labelledby="workbench-direction"
        className={styles.section}
        role="region"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="workbench-direction">Authoring workbench direction</h2>
            <p>Stable navigator, canvas, inspector, and command bar.</p>
          </div>
          <div className={styles.actions}>
            <Button size="sm" variant="secondary">
              Save draft
            </Button>
            <Button size="sm">Checkpoint</Button>
          </div>
        </div>
        <div className={styles.workbench}>
          <aside aria-label="Navigator" className={styles.rail}>
            <strong>Navigator</strong>
            <span>1. Capture overview</span>
            <span>2. Add Project Version</span>
            <span>3. Publish link rollout</span>
          </aside>
          <article className={styles.canvas}>
            <Badge variant="warning">Loading media</Badge>
            <h3>Guide block canvas</h3>
            <p>
              Primary work stays centered while slow images, validation, and
              long labels keep stable dimensions.
            </p>
            <Alert>
              <h4 className="mb-1 font-semibold leading-none tracking-normal">
                Draft is read-only
              </h4>
              <AlertDescription>
                Archived Project Versions keep content readable and block
                authoring actions.
              </AlertDescription>
            </Alert>
          </article>
          <aside aria-label="Inspector" className={styles.rail}>
            <strong>Inspector</strong>
            <Label htmlFor="review-title">Title</Label>
            <Input id="review-title" defaultValue="Configure release notes" />
            <Label htmlFor="review-state">State</Label>
            <Select id="review-state" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
          </aside>
        </div>
      </section>

      <section
        aria-labelledby="reader-direction"
        className={styles.section}
        role="region"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="reader-direction">Reader viewer direction</h2>
            <p>
              Content-first public surfaces with clear link version context.
            </p>
          </div>
          <Badge variant="success">Published link</Badge>
        </div>
        <Card>
          <CardContent className={styles.reader}>
            <div>
              <span className={styles.kicker}>Project Version: Main</span>
              <h3>Set up a support workspace</h3>
              <p>
                Reader chrome stays minimal. Version selection appears only when
                the Publish Link includes multiple entries.
              </p>
            </div>
            <Separator />
            <p className={styles.stateNote}>
              Reduced motion: instant state changes
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
