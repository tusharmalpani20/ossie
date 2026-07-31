type RevisionSnapshot = Record<string, unknown>;

const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, selected]) => [key, canonical(selected)]),
    );
  return value;
};

const digest = (value: unknown) => JSON.stringify(canonical(value));

const compare_entities = (
  target: Array<Record<string, unknown>>,
  baseline: Array<Record<string, unknown>>,
) => {
  const targetById = new Map(target.map((item) => [String(item.id), item]));
  const baselineById = new Map(baseline.map((item) => [String(item.id), item]));
  let changed = 0;
  for (const [id, item] of targetById) {
    const previous = baselineById.get(id);
    if (previous && digest(item) !== digest(previous)) changed += 1;
  }
  return {
    added: [...targetById.keys()].filter((id) => !baselineById.has(id)).length,
    removed: [...baselineById.keys()].filter((id) => !targetById.has(id))
      .length,
    changed,
  };
};

const artifact_references = (snapshot: RevisionSnapshot) => {
  const references: unknown[] = [];
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (key === "artifact_reference" && child) references.push(child);
      else visit(child);
    }
  };
  visit(snapshot.pages ?? []);
  visit(snapshot.snippets ?? []);
  return references;
};

export const summarize_documentation_revision_snapshots = (
  target: RevisionSnapshot,
  baseline: RevisionSnapshot | null,
) => {
  const targetDraft =
    (target.working_draft as Record<string, unknown> | undefined) ?? {};
  const baselineDraft =
    (baseline?.working_draft as Record<string, unknown> | undefined) ?? {};
  const baselineRevision =
    (baseline?.revision as Record<string, unknown> | undefined) ?? {};
  const targetPages =
    (target.pages as Array<Record<string, unknown>> | undefined) ?? [];
  const targetSnippets =
    (target.snippets as Array<Record<string, unknown>> | undefined) ?? [];
  const targetAssets =
    (target.assets as Array<Record<string, unknown>> | undefined) ?? [];
  const baselinePages =
    (baseline?.pages as Array<Record<string, unknown>> | undefined) ?? [];
  const baselineSnippets =
    (baseline?.snippets as Array<Record<string, unknown>> | undefined) ?? [];
  const baselineAssets =
    (baseline?.assets as Array<Record<string, unknown>> | undefined) ?? [];

  return {
    baseline_revision_id: baselineRevision.id ?? null,
    baseline_revision_number: baselineRevision.revision_number ?? null,
    metadata_changed:
      baseline === null ||
      digest({
        site: target.site,
        edition: target.edition,
      }) !==
        digest({
          site: baseline.site,
          edition: baseline.edition,
        }),
    home_page_changed:
      baseline === null ||
      targetDraft.home_page_id !== baselineDraft.home_page_id,
    pages: compare_entities(targetPages, baselinePages),
    navigation_changed:
      baseline === null ||
      digest(target.navigation ?? { nodes: [] }) !==
        digest(baseline.navigation ?? { nodes: [] }),
    routing_changed:
      baseline === null ||
      digest(target.routing ?? { aliases: [], rules: [] }) !==
        digest(baseline.routing ?? { aliases: [], rules: [] }),
    snippets: compare_entities(targetSnippets, baselineSnippets),
    assets: compare_entities(targetAssets, baselineAssets),
    openapi_changed:
      baseline === null ||
      digest({
        source: target.openapi_source ?? null,
        operations: target.openapi_operations ?? [],
      }) !==
        digest({
          source: baseline.openapi_source ?? null,
          operations: baseline.openapi_operations ?? [],
        }),
    artifact_references_changed:
      baseline === null ||
      digest(artifact_references(target)) !==
        digest(artifact_references(baseline)),
  };
};
