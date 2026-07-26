/**
 * @fileoverview CLI for seeding the Capture portal browser fixture.
 */

import { seed_capture_portal_browser_fixture } from "./capture-portal-browser-fixture";

const run = async () => {
  const result = await seed_capture_portal_browser_fixture();
  const { fixture, file } = result;

  console.log(
    JSON.stringify(
      {
        seeded: true,
        warning:
          "Local disposable testing database fixture only. Do not use these synthetic session tokens outside local browser validation.",
        organization_id: fixture.organization_id,
        project_id: fixture.project_id,
        password: fixture.password,
        users: fixture.users.map((user) => ({
          email: user.email,
          project_role: user.project_role,
          session_token: user.session_token,
        })),
        routes: fixture.routes,
        storage: file,
      },
      null,
      2,
    ),
  );
};

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
