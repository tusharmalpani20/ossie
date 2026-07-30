import {
  documentation_browser_fixture_cli_summary,
  seed_documentation_browser_fixture,
} from "./documentation-browser-fixture";

const fixture = await seed_documentation_browser_fixture();
console.log(
  JSON.stringify(documentation_browser_fixture_cli_summary(fixture), null, 2),
);
