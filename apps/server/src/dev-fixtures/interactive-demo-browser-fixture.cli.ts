import {
  interactive_demo_browser_fixture_cli_summary,
  seed_interactive_demo_browser_fixture,
} from "./interactive-demo-browser-fixture";

const fixture = await seed_interactive_demo_browser_fixture();

console.log(
  JSON.stringify(
    interactive_demo_browser_fixture_cli_summary(fixture),
    null,
    2,
  ),
);
