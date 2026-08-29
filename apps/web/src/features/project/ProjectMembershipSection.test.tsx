import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectMembershipSection } from "./ProjectMembershipSection";

const json = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
const owner = {
  org_user_id: "owner-1",
  email: "owner@example.test",
  display_name: "Owner",
  organization_role: "owner",
  organization_status: "active",
  access_source: "organization_owner",
  membership: null,
  effective_project_role: "project_admin",
};
const candidate = {
  org_user_id: "member-1",
  email: "member@example.test",
  display_name: "Member",
  organization_role: "member",
  organization_status: "active",
  access_source: null,
  membership: null,
  effective_project_role: null,
};

afterEach(() => vi.unstubAllGlobals());
describe("ProjectMembershipSection", () => {
  it("shows immutable owners and assigns an active unassigned member", async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(json({ members: [owner, candidate] }))
      .mockResolvedValueOnce(json({ membership: { id: "membership-1" } }, 201))
      .mockResolvedValueOnce(json({ members: [owner] }));
    vi.stubGlobal("fetch", fetch);
    render(<ProjectMembershipSection projectId="project-1" />);
    expect(
      await screen.findByRole("heading", { name: "Add member" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Organization owner")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove owner/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Organization member: Choose a member",
      }),
    );
    const memberList = screen.getByRole("listbox", {
      name: "Organization members",
    });
    expect(within(memberList).getByText("Organization members")).toBeVisible();
    expect(
      within(memberList).queryByRole("option", { name: "Choose a member" }),
    ).not.toBeInTheDocument();
    fireEvent.click(within(memberList).getByRole("option", { name: "Member" }));
    expect(
      screen.getByRole("button", { name: "Organization member: Member" }),
    ).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(
      screen.getByRole("button", { name: "Project role: Viewer" }),
    );
    const roleList = screen.getByRole("listbox", { name: "Project roles" });
    expect(within(roleList).getByText("Project roles")).toBeVisible();
    fireEvent.click(within(roleList).getByRole("option", { name: "Editor" }));
    expect(
      screen.getByRole("button", { name: "Project role: Editor" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByRole("button", { name: "Assign access" }));
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/v1/projects/project-1/memberships",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    expect(
      await screen.findByText("Project access assigned."),
    ).toBeInTheDocument();
  });
});
