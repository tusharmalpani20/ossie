export type DocumentationAssetSourceInput = {
  kind: "documentation_asset" | "capture_asset" | "derived_asset";
  id: string;
};

export type DocumentationBlockInput =
  | { id: string; kind: "paragraph"; text: string }
  | { id: string; kind: "heading"; level: 2 | 3 | 4; text: string }
  | {
      id: string;
      kind: "ordered_list" | "unordered_list";
      items: Array<{ id: string; text: string }>;
    }
  | { id: string; kind: "code"; code: string; language?: string | null }
  | {
      id: string;
      kind: "link";
      label: string;
      url?: string;
      page_id?: string;
      target_block_id?: string | null;
    }
  | {
      id: string;
      kind: "image";
      asset_id?: string;
      source?: DocumentationAssetSourceInput;
      alt_text: string;
      caption?: string | null;
    }
  | { id: string; kind: "divider" }
  | {
      id: string;
      kind: "api_reference";
      openapi_source_id: string;
      operation_key?: string | null;
    }
  | {
      id: string;
      kind: "quote";
      text: string;
      attribution?: string | null;
    }
  | {
      id: string;
      kind: "table";
      caption?: string | null;
      rows: Array<{
        id: string;
        cells: Array<{ id: string; text: string; is_header: boolean }>;
      }>;
    }
  | {
      id: string;
      kind: "code_example";
      code: string;
      language?: string | null;
      title?: string | null;
    }
  | {
      id: string;
      kind: "callout";
      tone: "info" | "success" | "warning" | "danger";
      title?: string | null;
      text: string;
    }
  | {
      id: string;
      kind: "tabs";
      items: Array<{ id: string; label: string; body: string }>;
    }
  | { id: string; kind: "snippet_reference"; snippet_id: string }
  | {
      id: string;
      kind: "guide_publication" | "interactive_demo_publication";
      published_artifact_id: string;
    };

export type DocumentationNavigationNode = {
  id: string;
  kind: "group" | "page";
  parent_id: string | null;
  page_id: string | null;
};

export type DocumentationRoute = {
  source_path: string;
  outcome: "redirect" | "gone";
  target_path?: string | null;
};
