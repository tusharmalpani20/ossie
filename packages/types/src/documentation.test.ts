import { describe, expect, it } from "vitest";
import {
  DocumentationBlockSchema,
  DocumentationCommentThreadCreateRequestSchema,
  DocumentationCreateSiteRequestSchema,
  DocumentationNavigationUpdateRequestSchema,
  DocumentationPageContentRequestSchema,
  DocumentationCreatePageRequestSchema,
  DocumentationPageUpdateRequestSchema,
  DocumentationPublicSearchResponseSchema,
  DocumentationRoutingUpdateRequestSchema,
  DocumentationCreateRevisionRequestSchema,
  DocumentationCreatePublicationRequestSchema,
  DocumentationRollbackPublicationRequestSchema,
  DocumentationApplyOpenApiRequestSchema,
  DocumentationSnippetBlockSchema,
  DocumentationSnippetContentRequestSchema,
  DocumentationCreateSnippetRequestSchema,
  DocumentationAssetSourceSchema,
  DocumentationAssetLifecycleRequestSchema,
  DocumentationPackageManifestV1Schema,
  DocumentationPortableSiteV1Schema,
  DocumentationPortablePageV1Schema,
  DocumentationPortableSnippetV1Schema,
  DocumentationImportInspectionResponseSchema,
  DocumentationImportApplyRequestSchema,
  DocumentationCarryForwardRequestSchema,
  DocumentationCarryForwardResponseSchema,
  DocumentationCarryForwardOptionsResponseSchema,
  DocumentationEditionLifecycleRequestSchema,
  DocumentationEditionUpdateRequestSchema,
  DocumentationPageLifecycleRequestSchema,
  DocumentationOpenApiLifecycleRequestSchema,
  DocumentationReviewPolicyUpdateRequestSchema,
  DocumentationReviewRequestCreateRequestSchema,
  DocumentationReviewDecisionRequestSchema,
  DocumentationReviewCancelRequestSchema,
  DocumentationPublicationReviewOverrideSchema,
  DocumentationReviewRequestDetailResponseSchema,
  DocumentationUpsertTryItPolicyRequestSchema,
  DocumentationTryItAttemptReportRequestSchema,
  DocumentationTryItConfigurationSchema,
  PublicDocumentationOperationSchema,
} from "./documentation";

describe("Documentation shared contracts", () => {
  const manifest = {
    format: "ossie.documentation-site",
    format_version: 1,
    profile: "roundtrip",
    source: {
      kind: "working_draft",
      project_version_label: "v1",
      revision_number: null,
      publication_sequence: null,
    },
    content_fingerprint: "a".repeat(64),
    site_path: "site.json",
    readme_path: "README.md",
    entries: [
      {
        path: "README.md",
        role: "readme",
        mime_type: "text/markdown",
        size_bytes: 12,
        sha256: "b".repeat(64),
      },
    ],
  } as const;

  it("strictly validates disabled and enabled Try-It policy writes", () => {
    expect(
      DocumentationUpsertTryItPolicyRequestSchema.parse({
        expected_policy_version: null,
        status: "disabled",
        approved_origin: null,
        base_path: null,
        allow_bearer: false,
        api_key_header_name: null,
        operation_destination_keys: [],
      }),
    ).toMatchObject({ status: "disabled" });

    expect(
      DocumentationUpsertTryItPolicyRequestSchema.safeParse({
        expected_policy_version: null,
        status: "enabled",
        approved_origin: "https://api.example.com",
        base_path: "/v1",
        allow_bearer: true,
        api_key_header_name: "X-Api-Key",
        operation_destination_keys: ["get-pets-listpets"],
        leaked_secret: "no",
      }).success,
    ).toBe(false);
    expect(
      DocumentationUpsertTryItPolicyRequestSchema.safeParse({
        expected_policy_version: null,
        status: "enabled",
        approved_origin: null,
        base_path: null,
        allow_bearer: false,
        api_key_header_name: null,
        operation_destination_keys: [],
      }).success,
    ).toBe(false);
  });

  it("accepts only content-free Try-It attempt reports", () => {
    expect(
      DocumentationTryItAttemptReportRequestSchema.parse({
        attempt_token: "opaque-token",
        outcome: "completed",
      }),
    ).toEqual({ attempt_token: "opaque-token", outcome: "completed" });
    expect(
      DocumentationTryItAttemptReportRequestSchema.safeParse({
        attempt_token: "opaque-token",
        outcome: "completed",
        status_code: 200,
      }).success,
    ).toBe(false);
  });

  it("keeps effective Try-It configurations secret-free and strict", () => {
    const configuration = {
      configuration_id: "01J00000000000000000000001",
      policy_identity: "p".repeat(43),
      configuration_expires_at: "2026-07-31T12:01:00.000Z",
      attempt_token_expires_at: "2026-07-31T12:05:00.000Z",
      surface: "public",
      operation: {
        descriptor_version: 1,
        destination_key: "get-pets-listpets",
        method: "GET",
        path: "/pets",
        summary: "List pets",
        parameters: [],
        request_body: null,
        security: { bearer: true, api_key_header_names: [] },
        unsupported_reasons: [],
      },
      approved_origin: "https://api.example.com",
      base_path: "/v1",
      allowed_credential_modes: ["none", "bearer"],
      api_key_header_name: null,
      request_limits: {
        url_bytes: 8192,
        body_bytes: 262144,
        timeout_ms: 15000,
      },
      response_limits: { body_bytes: 1048576, headers: 100 },
      operator_origin_set_digest: "a".repeat(64),
      attempt_token: "opaque-token",
    } as const;
    expect(DocumentationTryItConfigurationSchema.parse(configuration)).toEqual(
      configuration,
    );
    expect(
      DocumentationTryItConfigurationSchema.safeParse({
        ...configuration,
        bearer_token: "secret",
      }).success,
    ).toBe(false);
  });

  it("preserves the read-only public operation contract while adding a safe descriptor", () => {
    expect(
      PublicDocumentationOperationSchema.parse({
        destination_key: "get-pets",
        method: "get",
        path: "/pets",
        summary: "List pets",
        descriptor_version: 1,
        request_descriptor: {
          descriptor_version: 1,
          destination_key: "get-pets",
          method: "GET",
          path: "/pets",
          summary: "List pets",
          parameters: [],
          request_body: null,
          security: { bearer: false, api_key_header_names: [] },
          unsupported_reasons: [],
        },
      }),
    ).toMatchObject({ method: "get", descriptor_version: 1 });
    expect(
      PublicDocumentationOperationSchema.safeParse({
        destination_key: "get-pets",
        method: "get",
        path: "/pets",
        summary: null,
        descriptor_version: 0,
        file_id: "private",
      }).success,
    ).toBe(false);
  });

  it("strictly freezes the version-one package manifest", () => {
    expect(DocumentationPackageManifestV1Schema.parse(manifest)).toEqual(
      manifest,
    );
    expect(
      DocumentationPackageManifestV1Schema.safeParse({
        ...manifest,
        format_version: 2,
      }).success,
    ).toBe(false);
    expect(
      DocumentationPackageManifestV1Schema.safeParse({
        ...manifest,
        storage_key: "private/path",
      }).success,
    ).toBe(false);
  });

  it("uses package-local handles for the complete portable Site graph", () => {
    const page = {
      schema_version: 1,
      handle: "page-0001",
      title: "Start",
      description: null,
      canonical_path: "start",
      keywords: ["intro"],
      blocks: [
        {
          handle: "block-0001",
          kind: "paragraph",
          position: 1,
          text: "Welcome",
        },
        {
          handle: "block-0002",
          kind: "image",
          position: 2,
          asset_handle: "asset-0001",
          alt_text: "Dashboard",
          caption: null,
        },
      ],
    } as const;
    expect(DocumentationPortablePageV1Schema.parse(page)).toEqual(page);
    expect(
      DocumentationPortableSnippetV1Schema.safeParse({
        schema_version: 1,
        handle: "snippet-0001",
        name: "Shared note",
        status: "active",
        blocks: [
          {
            handle: "block-0001",
            kind: "snippet_reference",
            position: 1,
            snippet_handle: "snippet-0002",
          },
        ],
      }).success,
    ).toBe(false);

    const site = {
      schema_version: 1,
      site: {
        name: "Docs",
        description: null,
        primary_language: "en-US",
      },
      home_page_handle: "page-0001",
      pages: [
        {
          handle: "page-0001",
          title: "Start",
          description: null,
          canonical_path: "start",
          keywords: ["intro"],
          typed_path: "pages/page-0001.json",
          markdown_path: "pages/page-0001.md",
        },
      ],
      snippets: [],
      assets: [
        {
          handle: "asset-0001",
          path: "assets/asset-0001.png",
          name: "Dashboard",
          status: "active",
          mime_type: "image/png",
          size_bytes: 100,
          width: 10,
          height: 10,
          sha256: "c".repeat(64),
        },
      ],
      navigation: [
        {
          handle: "nav-0001",
          parent_handle: null,
          kind: "page",
          label: null,
          page_handle: "page-0001",
          position: 1,
        },
      ],
      aliases: [],
      routes: [],
      openapi: null,
      external_bindings: [],
    } as const;
    expect(DocumentationPortableSiteV1Schema.parse(site)).toEqual(site);
  });

  it("keeps inspection reports bounded and Apply targets explicit", () => {
    const response = {
      inspection: {
        id: "01J00000000000000000000001",
        kind: "page_markdown",
        status: "ready",
        format_version: null,
        source_digest: "d".repeat(64),
        content_fingerprint: "e".repeat(64),
        expires_at: "2026-07-30T18:00:00.000Z",
        summary: {
          pages: 1,
          snippets: 0,
          assets: 0,
          openapi_sources: 0,
          external_bindings: 0,
          expanded_bytes: 42,
        },
        proposal: {
          package_profile: null,
          claimed_source_kind: null,
          title: "Start",
          canonical_path: "start",
          site_name: null,
          site_description: null,
          primary_language: null,
          home_page_handle: null,
          pages: [],
          required_bindings: [],
        },
        issues: [],
        issue_counts: { blocking: 0, warnings: 0 },
        has_blocking_issues: false,
        issues_truncated: false,
      },
    } as const;
    expect(DocumentationImportInspectionResponseSchema.parse(response)).toEqual(
      response,
    );
    expect(
      DocumentationImportApplyRequestSchema.safeParse({
        content_fingerprint: "e".repeat(64),
        target: {
          mode: "page",
          site_id: "01J00000000000000000000002",
          expected_draft_version: 1,
          title: "Imported",
          canonical_path: "imported",
          set_as_home: false,
        },
        external_bindings: [],
        confirm: true,
      }).success,
    ).toBe(true);
    expect(
      DocumentationImportApplyRequestSchema.safeParse({
        content_fingerprint: "e".repeat(64),
        target: {
          mode: "empty_site",
          site_id: "01J00000000000000000000002",
          expected_site_version: 1,
          expected_draft_version: 1,
          apply_primary_language: false,
        },
        external_bindings: [],
        confirm: false,
      }).success,
    ).toBe(false);
  });

  it("requires explicit row versions on mutable Documentation aggregates", () => {
    expect(
      DocumentationPageUpdateRequestSchema.safeParse({
        expected_version: 2,
        canonical_path: "getting-started/install",
        keywords: ["install", "setup"],
      }).success,
    ).toBe(true);
    expect(
      DocumentationNavigationUpdateRequestSchema.safeParse({
        expected_version: 1,
        nodes: [
          {
            id: "01J00000000000000000000001",
            parent_id: null,
            kind: "page",
            label: null,
            page_id: "01J00000000000000000000002",
            position: 1,
            expected_version: null,
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      DocumentationRoutingUpdateRequestSchema.safeParse({
        expected_version: 1,
        rules: [
          {
            id: "01J00000000000000000000003",
            source_path: "old-install",
            outcome: "gone",
            target_page_id: null,
            expected_version: null,
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("keeps comment bodies plain and mentions membership-scoped", () => {
    expect(
      DocumentationCommentThreadCreateRequestSchema.safeParse({
        body: "Please clarify this step.",
        block_anchor_id: "01J00000000000000000000001",
        mentioned_project_membership_ids: [],
      }).success,
    ).toBe(true);
    expect(
      DocumentationCommentThreadCreateRequestSchema.safeParse({
        body: "<script>alert(1)</script>",
        block_anchor_id: null,
        mentioned_project_membership_ids: [],
      }).success,
    ).toBe(false);
  });

  it("separates checkpoint, publication, and rollback commands", () => {
    expect(
      DocumentationCreateRevisionRequestSchema.safeParse({
        expected_edition_version: 3,
        expected_draft_version: 8,
      }).success,
    ).toBe(true);
    expect(
      DocumentationCreatePublicationRequestSchema.safeParse({
        revision_id: "01J00000000000000000000001",
        link: {
          mode: "create",
          name: "Product docs",
          slug: "product-docs",
          visibility: "public",
          expires_at: "2026-08-30T00:00:00.000Z",
          password: "safe local password",
        },
      }).success,
    ).toBe(true);
    expect(
      DocumentationRollbackPublicationRequestSchema.safeParse({
        site_publication_id: "01J00000000000000000000002",
        expected_entry_version: 2,
      }).success,
    ).toBe(true);
  });

  it("applies only a previously inspected OpenAPI File", () => {
    expect(
      DocumentationApplyOpenApiRequestSchema.safeParse({
        inspection_id: "01J00000000000000000000001",
        expected_source_version: null,
      }).success,
    ).toBe(true);
  });

  it("strictly parses Site creation", () => {
    expect(
      DocumentationCreateSiteRequestSchema.parse({
        name: "API docs",
        description: null,
        primary_language: "en-US",
        initial_home_page: { title: "Home", path: "home" },
      }),
    ).toMatchObject({ name: "API docs", primary_language: "en-US" });
    expect(() =>
      DocumentationCreateSiteRequestSchema.parse({
        name: "API docs",
        primary_language: "en",
        unexpected: true,
      }),
    ).toThrow();
  });

  it("uses a strict discriminated block command", () => {
    expect(
      DocumentationBlockSchema.parse({
        id: "01J00000000000000000000001",
        kind: "heading",
        level: 2,
        text: "Start",
        position: 1,
        expected_version: null,
      }),
    ).toMatchObject({ kind: "heading" });
    expect(() =>
      DocumentationBlockSchema.parse({
        id: "01J00000000000000000000001",
        kind: "divider",
        position: 1,
        expected_version: null,
        text: "<script>",
      }),
    ).toThrow();
  });

  it("requires aggregate and child Row Versions for replacement", () => {
    expect(() =>
      DocumentationPageContentRequestSchema.parse({
        expected_page_version: 2,
        blocks: [
          {
            id: "01J00000000000000000000001",
            kind: "paragraph",
            text: "Changed",
            position: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("enforces the accepted saved-text ceiling per Page", () => {
    expect(
      DocumentationPageContentRequestSchema.safeParse({
        expected_page_version: 1,
        blocks: [
          {
            id: "01J00000000000000000000001",
            kind: "paragraph",
            text: "x".repeat(4 * 1024 * 1024 + 1),
            position: 1,
            expected_version: null,
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("strictly validates Page identity inputs and canonical paths", () => {
    expect(
      DocumentationCreatePageRequestSchema.parse({
        title: "Install",
        description: null,
        canonical_path: "getting-started/install",
      }),
    ).toMatchObject({ title: "Install" });
    expect(() =>
      DocumentationCreatePageRequestSchema.parse({
        title: "Bad",
        description: null,
        canonical_path: "../secret",
      }),
    ).toThrow();
    expect(() =>
      DocumentationCreatePageRequestSchema.parse({
        title: "Too deep",
        description: null,
        canonical_path: Array.from({ length: 9 }, () => "segment").join("/"),
      }),
    ).toThrow();
    expect(() =>
      DocumentationCreatePageRequestSchema.parse({
        title: "Long segment",
        description: null,
        canonical_path: "a".repeat(81),
      }),
    ).toThrow();
  });

  it("enforces the accepted Page keyword ceiling", () => {
    expect(
      DocumentationPageUpdateRequestSchema.safeParse({
        expected_version: 1,
        keywords: Array.from({ length: 20 }, (_, index) => `keyword-${index}`),
      }).success,
    ).toBe(true);
    expect(
      DocumentationPageUpdateRequestSchema.safeParse({
        expected_version: 1,
        keywords: Array.from({ length: 21 }, (_, index) => `keyword-${index}`),
      }).success,
    ).toBe(false);
    expect(
      DocumentationPageUpdateRequestSchema.safeParse({
        expected_version: 1,
        keywords: ["k".repeat(81)],
      }).success,
    ).toBe(false);
  });

  it("does not permit comments in public search responses", () => {
    expect(() =>
      DocumentationPublicSearchResponseSchema.parse({
        results: [
          {
            page_id: "page",
            title: "Home",
            excerpt: "Public",
            canonical_path: "home",
            comments: ["private"],
          },
        ],
      }),
    ).toThrow();
  });

  it("parses every remaining typed V1 content family strictly", () => {
    const blocks = [
      {
        id: "01J00000000000000000000001",
        kind: "quote",
        text: "**Important**",
        attribution: "Ossie",
        position: 1,
        expected_version: null,
      },
      {
        id: "01J00000000000000000000002",
        kind: "callout",
        tone: "warning",
        title: "Before you continue",
        text: "Save your work.",
        position: 2,
        expected_version: null,
      },
      {
        id: "01J00000000000000000000003",
        kind: "snippet_reference",
        snippet_id: "01J00000000000000000000004",
        position: 3,
        expected_version: null,
      },
      {
        id: "01J00000000000000000000005",
        kind: "image",
        source: {
          kind: "capture_asset",
          id: "01J00000000000000000000006",
        },
        alt_text: "Settings page",
        caption: null,
        position: 4,
        expected_version: null,
      },
    ];
    for (const block of blocks)
      expect(DocumentationBlockSchema.safeParse(block).success).toBe(true);
    expect(
      DocumentationBlockSchema.safeParse({ ...blocks[1], unexpected: true })
        .success,
    ).toBe(false);
  });

  it("forbids snippet nesting in the shared Snippet block union", () => {
    expect(
      DocumentationSnippetBlockSchema.safeParse({
        id: "01J00000000000000000000001",
        kind: "snippet_reference",
        snippet_id: "01J00000000000000000000002",
        position: 1,
        expected_version: null,
      }).success,
    ).toBe(false);
    expect(
      DocumentationSnippetContentRequestSchema.safeParse({
        expected_snippet_version: 2,
        blocks: [
          {
            id: "01J00000000000000000000003",
            kind: "paragraph",
            text: "Shared warning",
            position: 1,
            expected_version: null,
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("uses strict versioned Snippet and Asset commands", () => {
    expect(
      DocumentationCreateSnippetRequestSchema.safeParse({
        name: "Authentication warning",
      }).success,
    ).toBe(true);
    expect(
      DocumentationAssetLifecycleRequestSchema.safeParse({
        expected_version: 2,
        transition: "archive",
      }).success,
    ).toBe(true);
    expect(
      DocumentationAssetLifecycleRequestSchema.safeParse({
        expected_version: 2,
        transition: "delete",
      }).success,
    ).toBe(false);
  });

  it("rejects the unimplemented derived asset source", () => {
    expect(
      DocumentationAssetSourceSchema.safeParse({
        kind: "documentation_asset",
        id: "01J00000000000000000000001",
      }).success,
    ).toBe(true);
    expect(
      DocumentationAssetSourceSchema.safeParse({
        kind: "derived_asset",
        id: "01J00000000000000000000001",
      }).success,
    ).toBe(false);
  });
});

describe("Documentation review contracts", () => {
  const id = "01J00000000000000000000001";

  it("validates policy thresholds and unique maintainers", () => {
    expect(
      DocumentationReviewPolicyUpdateRequestSchema.safeParse({
        expected_policy_version: 1,
        mode: "approval_required",
        required_approvals: 2,
        require_maintainer_approval: true,
        maintainer_org_user_ids: [id],
      }).success,
    ).toBe(false);
    expect(
      DocumentationReviewPolicyUpdateRequestSchema.safeParse({
        expected_policy_version: 1,
        mode: "approval_required",
        required_approvals: 1,
        require_maintainer_approval: true,
        maintainer_org_user_ids: [id],
      }).success,
    ).toBe(true);
  });

  it("normalizes and bounds review reasons", () => {
    expect(
      DocumentationReviewDecisionRequestSchema.parse({
        expected_review_request_version: 1,
        decision: "approve",
        reason: "  cafe\u0301\r\nok  ",
      }).reason,
    ).toBe("café\nok");
    expect(
      DocumentationReviewDecisionRequestSchema.safeParse({
        expected_review_request_version: 1,
        decision: "reject",
        reason: " ",
      }).success,
    ).toBe(false);
    expect(
      DocumentationReviewCancelRequestSchema.safeParse({
        expected_review_request_version: 1,
        reason: "bad\u0000reason",
      }).success,
    ).toBe(false);
    expect(
      DocumentationPublicationReviewOverrideSchema.safeParse({
        expected_policy_version: 1,
        reason: "too short",
      }).success,
    ).toBe(false);
  });

  it("requires explicit exact revisions and defaults legacy overrides to null", () => {
    expect(
      DocumentationReviewRequestCreateRequestSchema.safeParse({
        site_revision_id: id,
        expected_policy_version: 1,
        reviewer_org_user_ids: [id],
      }).success,
    ).toBe(true);
    expect(
      DocumentationCreatePublicationRequestSchema.parse({
        revision_id: id,
        link: {
          mode: "existing",
          link_id: id,
          entry_id: id,
          expected_entry_version: 1,
        },
      }).review_override,
    ).toBeNull();
  });

  it("requires the complete safe structural review detail contract", () => {
    const detail = {
      review_request: {
        id,
        site_id: id,
        site_edition_id: id,
        site_revision_id: id,
        revision_number: 2,
        request_number: 1,
        status: "open",
        effective_status: "open",
        required_approvals: 1,
        require_maintainer_approval: false,
        valid_approval_count: 0,
        valid_maintainer_approval_count: 0,
        created_by_id: id,
        created_by_display_name: "Reviewer",
        version: 1,
        created_at: "2026-07-31T00:00:00.000Z",
        closed_at: null,
        superseded_by_revision_id: null,
        superseded_at: null,
      },
      assignments: [],
      actor_can_decide: false,
      actor_can_cancel: true,
      change_summary: {
        baseline_revision_id: id,
        baseline_revision_number: 1,
        metadata_changed: false,
        home_page_changed: false,
        pages: { added: 0, removed: 0, changed: 1 },
        navigation_changed: false,
        routing_changed: false,
        snippets: { added: 0, removed: 0, changed: 0 },
        assets: { added: 0, removed: 0, changed: 0 },
        openapi_changed: false,
        artifact_references_changed: false,
      },
      publication_gate: {
        site_revision_id: id,
        policy_mode: "optional",
        policy_version: 1,
        outcome: "not_required",
        governing_review_request_id: id,
        required_approvals: 1,
        valid_approval_count: 0,
        require_maintainer_approval: false,
        valid_maintainer_approval_count: 0,
        override_available_to_actor: true,
      },
      cancellation: null,
    };

    expect(
      DocumentationReviewRequestDetailResponseSchema.parse(detail),
    ).toEqual(detail);
    expect(
      DocumentationReviewRequestDetailResponseSchema.safeParse({
        ...detail,
        change_summary: { pages_added: 0 },
      }).success,
    ).toBe(false);
  });
});

describe("Documentation carry-forward and lifecycle contracts", () => {
  const sourceVersionId = "01J00000000000000000000001";
  const targetVersionId = "01J00000000000000000000002";
  const siteId = "01J00000000000000000000003";

  it("requires explicit source and target versions plus optimistic source versions", () => {
    const request = {
      source_project_version_id: sourceVersionId,
      target_project_version_id: targetVersionId,
      selections: [
        {
          site_id: siteId,
          expected_source_edition_version: 3,
          expected_source_draft_version: 7,
        },
      ],
    };

    expect(DocumentationCarryForwardRequestSchema.parse(request)).toEqual(
      request,
    );
    expect(
      DocumentationCarryForwardRequestSchema.safeParse({
        ...request,
        target_project_version_id: sourceVersionId,
      }).success,
    ).toBe(false);
    expect(
      DocumentationCarryForwardRequestSchema.safeParse({
        ...request,
        selections: [...request.selections, request.selections[0]],
      }).success,
    ).toBe(false);
  });

  it("returns ordered provenance without exposing graph content", () => {
    const response = {
      carry_forward: {
        id: "01J00000000000000000000004",
        source_project_version_id: sourceVersionId,
        target_project_version_id: targetVersionId,
        created_by_id: "01J00000000000000000000009",
        created_at: "2026-07-30T00:00:00.000Z",
      },
      items: [
        {
          site_id: siteId,
          source_edition_id: "01J00000000000000000000005",
          source_revision_id: "01J00000000000000000000006",
          source_revision_number: 2,
          source_revision_reused: true,
          target_edition_id: "01J00000000000000000000007",
          target_working_draft_id: "01J00000000000000000000008",
        },
      ],
      replayed: false,
    };
    expect(DocumentationCarryForwardResponseSchema.parse(response)).toEqual(
      response,
    );
    expect(
      DocumentationCarryForwardResponseSchema.safeParse({
        ...response,
        carry_forward: { ...response.carry_forward, page_content: "secret" },
      }).success,
    ).toBe(false);
  });

  it("returns only safe, exact carry-forward selector metadata", () => {
    const response = {
      source_project_version: {
        id: sourceVersionId,
        slug: "v1",
        name: "Version 1",
        status: "archived",
      },
      target_project_version_id: targetVersionId,
      sites: [
        {
          site_id: siteId,
          source_edition_id: "01J00000000000000000000005",
          title: "Product docs",
          description: null,
          primary_language: "en-US",
          status: "active",
          effective_status: "read_only",
          read_only_reason: "The source Project Version is archived.",
          source_edition_version: 2,
          source_working_draft_id: "01J00000000000000000000008",
          source_draft_version: 4,
          latest_revision: {
            id: "01J00000000000000000000006",
            revision_number: 2,
            creation_trigger: "manual_checkpoint",
            created_at: "2026-07-30T00:00:00.000Z",
          },
          target_has_edition: false,
          blocker_code: null,
        },
      ],
    };
    expect(
      DocumentationCarryForwardOptionsResponseSchema.parse(response),
    ).toEqual(response);
  });

  it("keeps lifecycle concurrency fields resource-specific", () => {
    expect(
      DocumentationEditionUpdateRequestSchema.parse({
        expected_edition_version: 2,
        title: "API docs",
        description: null,
        primary_language: "en-US",
      }),
    ).toBeTruthy();
    expect(
      DocumentationEditionLifecycleRequestSchema.parse({
        expected_edition_version: 2,
        transition: "archive",
      }),
    ).toBeTruthy();
    expect(
      DocumentationPageLifecycleRequestSchema.parse({
        expected_page_version: 2,
        expected_draft_version: 4,
        expected_navigation_version: 3,
        expected_routing_version: 2,
        transition: "archive",
        retirement: { mode: "gone" },
        replacement_home_page_id: null,
      }),
    ).toBeTruthy();
    expect(
      DocumentationOpenApiLifecycleRequestSchema.parse({
        expected_source_version: 2,
        transition: "restore",
      }),
    ).toBeTruthy();
    expect(
      DocumentationEditionLifecycleRequestSchema.safeParse({
        expected_version: 2,
        transition: "archive",
      }).success,
    ).toBe(false);
  });
});
