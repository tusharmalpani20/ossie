import { screen } from "@testing-library/react";
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
    expect(screen.getByLabelText("Project")).toBeInTheDocument();
    expect(screen.getByLabelText("Project Version")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Capture actions" }),
    ).toBeInTheDocument();
    expect(document.querySelector("[tabindex]:not([tabindex='0'])")).toBeNull();
  });
});
