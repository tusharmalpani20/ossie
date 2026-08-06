import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicVersionSelector } from "./PublicVersionSelector";
describe("PublicVersionSelector", () => {
  it("shows a compact Project Version label for one included entry", () => {
    render(
      <PublicVersionSelector
        response={
          {
            publish_link: {
              entries: [
                {
                  project_version_name: "Current",
                  project_version_slug: "current",
                },
              ],
            } as never,
            selected_entry: { project_version_slug: "current" } as never,
          } as never
        }
      />,
    );
    expect(screen.getByText("Project Version: Current")).toBeTruthy();
  });

  it("names a multi-entry selector for assistive technology", () => {
    render(
      <PublicVersionSelector
        response={
          {
            publish_link: {
              entries: [
                {
                  project_version_name: "Current",
                  project_version_slug: "current",
                },
                {
                  project_version_name: "Archive",
                  project_version_slug: "archive",
                },
              ],
            } as never,
            selected_entry: { project_version_slug: "current" } as never,
          } as never
        }
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Public Project Version" }),
    ).toBeInTheDocument();
  });
});
