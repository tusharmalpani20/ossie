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
      await screen.findByRole("region", { name: "Current access" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Add member" }),
    ).not.toBeInTheDocument();
    const addMemberButton = screen.getByRole("button", { name: "Add member" });
    expect(addMemberButton).toHaveAttribute("title", "Add member");
    expect(addMemberButton).not.toHaveTextContent("Add member");
    fireEvent.click(addMemberButton);
    const addMemberDialog = screen.getByRole("dialog", { name: "Add member" });
    expect(
      within(addMemberDialog).getByRole("heading", { name: "Add member" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Organization owner")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remove owner/i }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(addMemberDialog).getByRole("button", {
        name: "Organization member: Choose a member",
      }),
    );
    const memberList = within(addMemberDialog).getByRole("listbox", {
      name: "Organization members",
    });
    expect(within(memberList).getByText("Organization members")).toBeVisible();
    expect(
      within(memberList).queryByRole("option", { name: "Choose a member" }),
    ).not.toBeInTheDocument();
    fireEvent.click(within(memberList).getByRole("option", { name: "Member" }));
    expect(
      within(addMemberDialog).getByRole("button", {
        name: "Organization member: Member",
      }),
    ).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(
      within(addMemberDialog).getByRole("button", {
        name: "Project role: Viewer",
      }),
    );
    const roleList = within(addMemberDialog).getByRole("listbox", {
      name: "Project roles",
    });
    expect(within(roleList).getByText("Project roles")).toBeVisible();
    fireEvent.click(within(roleList).getByRole("option", { name: "Editor" }));
    expect(
      within(addMemberDialog).getByRole("button", {
        name: "Project role: Editor",
      }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(
      within(addMemberDialog).getByRole("button", { name: "Assign" }),
    );
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

  it("explains the empty member state without showing unusable controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof globalThis.fetch>()
        .mockResolvedValueOnce(json({ members: [owner] })),
    );
    render(<ProjectMembershipSection projectId="project-1" />);

    fireEvent.click(await screen.findByRole("button", { name: "Add member" }));
    const dialog = screen.getByRole("dialog", { name: "Add member" });

    expect(
      within(dialog).getByRole("heading", { name: "No members to add" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Every active Organization member already has access to this Project.",
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Assign" }),
    ).not.toBeInTheDocument();
  });
});
