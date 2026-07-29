import { seed_guide_browser_fixture } from "./guide-browser-fixture";

const fixture = await seed_guide_browser_fixture();

console.log(
  JSON.stringify(
    {
      seeded: true,
      warning: "Synthetic disposable testing fixture only.",
      organization_id: fixture.organization_id,
      project_id: fixture.project_id,
      password: fixture.password,
      users: fixture.users,
      routes: fixture.routes,
      public_links: fixture.public_links,
    },
    null,
    2,
  ),
);
