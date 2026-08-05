import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";

const LazyPanel = lazy(() =>
  import("./DocumentationAdapterProofPanel").then((module) => ({
    default: module.DocumentationAdapterProofPanel,
  })),
);

export const LazyDocumentationAdapterProofPanel = (
  props: ComponentProps<typeof LazyPanel>,
) => (
  <Suspense fallback={<p role="status">Loading adapter proof…</p>}>
    <LazyPanel {...props} />
  </Suspense>
);
