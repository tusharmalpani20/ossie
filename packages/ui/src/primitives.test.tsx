import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge } from "./badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Select } from "./select";
import { Separator } from "./separator";
import { Textarea } from "./textarea";

describe("shared UI primitives", () => {
  it("renders form primitives with accessible labels and caller classes", () => {
    render(
      <form>
        <Label htmlFor="name">Project name</Label>
        <Input className="name-input" id="name" defaultValue="Launch demo" />
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" defaultValue="Internal walkthrough" />
        <Label htmlFor="status">Status</Label>
        <Select id="status" defaultValue="draft">
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
      </form>
    );

    expect(screen.getByLabelText("Project name")).toHaveClass("name-input");
    expect(screen.getByLabelText("Notes")).toHaveValue("Internal walkthrough");
    expect(screen.getByLabelText("Status")).toHaveValue("draft");
  });

  it("renders content primitives without hiding semantic content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Capture session</CardTitle>
          <CardDescription>Ready to publish</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="success">Complete</Badge>
          <Alert>
            <AlertTitle>Review complete</AlertTitle>
            <AlertDescription>No blocking issues found.</AlertDescription>
          </Alert>
          <Separator />
        </CardContent>
      </Card>
    );

    expect(screen.getByText("Capture session")).toBeInTheDocument();
    expect(screen.getByText("Ready to publish")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Review complete")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("gives explicitly named cards a valid region role", () => {
    render(
      <Card aria-labelledby="capture-card-heading">
        <CardHeader>
          <CardTitle id="capture-card-heading">Capture session</CardTitle>
        </CardHeader>
      </Card>,
    );

    expect(
      screen.getByRole("region", { name: "Capture session" }),
    ).toBeInTheDocument();
  });

  it("keeps shared content and feedback primitives on semantic tokens", () => {
    render(
      <div>
        <Card data-testid="card" />
        <CardDescription>Readable description</CardDescription>
        <Label htmlFor="semantic-input">Semantic label</Label>
        <Input id="semantic-input" />
        <Badge variant="success">Complete</Badge>
        <Alert variant="destructive">Needs attention</Alert>
        <Alert variant="warning">Choose a tab to continue.</Alert>
        <Separator />
      </div>,
    );

    expect(screen.getByTestId("card").className).toContain(
      "bg-[var(--ossie-color-surface)]",
    );
    expect(screen.getByText("Readable description").className).toContain(
      "text-[var(--ossie-color-muted)]",
    );
    expect(screen.getByText("Semantic label").className).toContain(
      "text-[var(--ossie-color-text)]",
    );
    expect(screen.getAllByText("Complete")[1]).toHaveClass(
      "bg-[var(--ossie-color-success-subtle)]",
    );
    expect(screen.getByText("Needs attention").className).toContain(
      "bg-[var(--ossie-color-danger-subtle)]",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Needs attention");
    expect(screen.getByText("Choose a tab to continue.").className).toContain(
      "bg-[var(--ossie-color-warning-subtle)]",
    );
    expect(screen.getAllByRole("separator")[1]).toHaveClass(
      "bg-[var(--ossie-color-border)]",
    );
  });
});
