import { lazy, Suspense } from "react";
import type { ComponentProps } from "react";

const LazyPanel = lazy(() =>
  import("./DocumentationReaderAdapterProofPanel").then((module) => ({
    default: module.DocumentationReaderAdapterProofPanel,
  })),
);

export const LazyDocumentationReaderAdapterProofPanel = (
  props: ComponentProps<typeof LazyPanel>,
) => (
  <Suspense fallback={<p role="status">Loading reader adapter proof…</p>}>
    <LazyPanel {...props} />
  </Suspense>
);
