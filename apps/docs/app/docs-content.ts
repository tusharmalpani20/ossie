const repositoryBaseUrl = "https://github.com/tusharmalpani20/ossie/blob/main";
const alphaAssetBaseUrl =
  "https://raw.githubusercontent.com/tusharmalpani20/ossie/main/docs/assets/alpha";

export const siteSummary = {
  name: "Ossie",
  status: "alpha-stage, self-hosted open-source software",
  positioning:
    "Self-hosted teams can turn browser workflows into Scribe-style guides and Storylane-style interactive demos from screenshot-first capture sessions.",
  readmeHref: `${repositoryBaseUrl}/README.md`,
  selfHostingHref: `${repositoryBaseUrl}/docs/self-hosting.md`,
};

export const productCapabilities = [
  "Screenshot-first capture sessions with ordered events and uploaded assets.",
  "Scribe-style guides with editable blocks, screenshots, annotations, publishing, Markdown export, and HTML ZIP export.",
  "Storylane-style interactive demos with scenes, hotspots, publishing, password access, and embeds.",
  "Self-hosted setup with PostgreSQL, local file storage, health checks, readiness checks, and production env validation.",
  "Project Membership, Audit and Access Evidence, and explicit Project Version release contexts beginning with Main.",
  "Version-scoped Guide and Interactive Demo Editions, relational Working Drafts, immutable Revisions, Carry-Forward, and protected shared assets.",
  "Revision-backed Publications and independent multi-version Publish Links with exact-version public routes.",
  "Product Documentation V1 with Sites, Pages, constrained content, snippets, assets, OpenAPI, comments and review, portability, Carry-Forward, immutable publishing, reader search, and governed browser-direct Try It.",
];

export const nextPlatformDirection = {
  status:
    "Master Plans 005 and 006 are complete; Product Documentation V1 is shipped and Master Plan 007 is a planning-only next experience sequence.",
  items: [
    "Product Documentation V1 ships the accepted content, source-of-truth, publication, access, URL, search, comments, review, portability, lifecycle, security, and API experience boundaries.",
    "The next activity is to expand and recheck child 141, an isolated Tiptap/Fumadocs adapter proof and adoption gate, before any dependency or runtime change.",
    "Later selected children modernize authoring and reading, add deterministic multi-language API request examples, harden the combined experience, and perform final closeout.",
    "Loom-style Video later; its recording, storage, playback, and collaboration model remains deliberately unplanned.",
  ],
  docsAppBoundary:
    "This Docs App is repository documentation for contributors and operators. It is not the customer-authored Product Documentation experience.",
};

export const docsLinks = [
  {
    label: "Self-hosting quickstart",
    href: `${repositoryBaseUrl}/docs/self-hosting.md`,
    description:
      "Local and production-oriented setup notes for self-hosted evaluators.",
  },
  {
    label: "Operations guide",
    href: `${repositoryBaseUrl}/docs/operations.md`,
    description:
      "Health checks, backups, restore expectations, storage, proxy, and env-report guidance.",
  },
  {
    label: "Production readiness checklist",
    href: `${repositoryBaseUrl}/docs/production-readiness-checklist.md`,
    description:
      "Preflight checklist before exposing a self-hosted instance beyond local development.",
  },
  {
    label: "Roadmap",
    href: `${repositoryBaseUrl}/docs/roadmap.md`,
    description:
      "Current alpha, the accepted platform foundation, Documentation next, and intentionally deferred areas.",
  },
  {
    label: "Contributor guide",
    href: `${repositoryBaseUrl}/docs/contributor-guide.md`,
    description:
      "Repo layout, planning flow, quality bar, and good first contribution areas.",
  },
  {
    label: "V1 dogfood smoke suite",
    href: `${repositoryBaseUrl}/docs/v1-dogfood-smoke-suite.md`,
    description:
      "Recorded alpha smoke evidence and known manual dogfood limitations.",
  },
];

export const evidenceItems = [
  {
    title: "Project workspace",
    src: `${alphaAssetBaseUrl}/alpha-project-workspace.png`,
    alt: "Project workspace showing capture, guide, and interactive demo entry points.",
  },
  {
    title: "Guide editor",
    src: `${alphaAssetBaseUrl}/alpha-guide-editor.png`,
    alt: "Guide editor showing a generated guide with screenshot annotation and publishing controls.",
  },
  {
    title: "Interactive demo editor",
    src: `${alphaAssetBaseUrl}/alpha-demo-editor.png`,
    alt: "Interactive demo editor with scenes, hotspot controls, and publishing controls.",
  },
];

export const knownLimitations = [
  "Chrome Web Store distribution remains future work; the verified extension path uses an unpacked Manifest V3 build.",
  "Storage inventory and cleanup tooling are still future self-host operations work.",
  "Backup/restore rehearsal, one-command packaging, shared rate limiting, and object storage remain deferred.",
  "HTML capture/replay, required AI authoring, analytics, lead capture, and custom branding remain deferred.",
  "Markdown docs remain the source of truth; this site is a compact navigation surface for the alpha.",
];
