import { Component, lazy, Suspense } from "react";
import type { ComponentProps, ReactNode } from "react";

const LazyField = lazy(() =>
  import("./DocumentationTiptapProseField").then((module) => ({
    default: module.DocumentationTiptapProseField,
  })),
);

class ProseFieldErrorBoundary extends Component<
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

export const LazyDocumentationTiptapProseField = ({
  fallback,
  ...props
}: ComponentProps<typeof LazyField> & { fallback: ReactNode }) => (
  <ProseFieldErrorBoundary fallback={fallback}>
    <Suspense fallback={fallback}>
      <LazyField {...props} />
    </Suspense>
  </ProseFieldErrorBoundary>
);
