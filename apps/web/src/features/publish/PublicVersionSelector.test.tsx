import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicVersionSelector } from "./PublicVersionSelector";
describe("PublicVersionSelector", () => {
  it("shows a compact label for one included Project Version", () => {
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
    expect(screen.getByText("Version: Current")).toBeTruthy();
  });
});
