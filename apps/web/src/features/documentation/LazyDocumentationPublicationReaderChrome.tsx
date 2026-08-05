import { Component, lazy, Suspense } from "react";
import type { ComponentProps, ReactNode } from "react";

const LazyChrome = lazy(() =>
  import("./DocumentationPublicationReaderChrome").then((module) => ({
    default: module.DocumentationPublicationReaderChrome,
  })),
);

class ReaderChromeErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export const LazyDocumentationPublicationReaderChrome = ({
  fallback,
  ...props
}: ComponentProps<typeof LazyChrome> & { fallback: ReactNode }) => (
  <ReaderChromeErrorBoundary fallback={fallback}>
    <Suspense fallback={fallback}>
      <LazyChrome {...props} />
    </Suspense>
  </ReaderChromeErrorBoundary>
);
