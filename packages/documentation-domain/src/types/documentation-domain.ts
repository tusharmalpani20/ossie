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
    }
  | {
      id: string;
      kind: "image";
      asset_id: string;
      alt_text: string;
      caption?: string | null;
    }
  | { id: string; kind: "divider" }
  | {
      id: string;
      kind: "api_reference";
      openapi_source_id: string;
      operation_key?: string | null;
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
