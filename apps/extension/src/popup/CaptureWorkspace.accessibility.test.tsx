import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderApp } from "./test-helpers";

describe("CaptureWorkspace accessibility", () => {
  it("has one heading and persistent labels for both context selectors", async () => {
    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        selectedProjectVersionId: "version_1",
        selectedProjectVersionSlug: "main",
        selectedProjectVersionName: "Main",
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
        activeCaptureEventIndex: null,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
    });

    expect(await screen.findAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("button", {
        name: "Project: Internal onboarding demos",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Project Version: Main" }),
    ).toBeInTheDocument();
    expect(document.querySelector("[tabindex]:not([tabindex='0'])")).toBeNull();
  });

  it("presents labeled Project and Project Version listboxes", async () => {
    renderApp({
      settings: {
        instanceUrl: "https://demo.example.com",
        sessionToken: "extension-session-token",
        selectedProjectId: "project_1",
        selectedProjectVersionId: "version_1",
        selectedProjectVersionSlug: "main",
        selectedProjectVersionName: "Main",
        activeCaptureSessionId: null,
        activeCaptureProjectId: null,
        activeCaptureEventIndex: null,
        activeCaptureMode: null,
        activeCapturePaused: false,
      },
    });

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Project: Internal onboarding demos",
      }),
    );
    const projects = screen.getByRole("listbox", { name: "Projects" });
    expect(within(projects).getByText("Projects")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(
      screen.getByRole("button", { name: "Project Version: Main" }),
    );
    const versions = screen.getByRole("listbox", {
      name: "Project Versions",
    });
    expect(within(versions).getByText("Active versions")).toBeInTheDocument();
  });
});
