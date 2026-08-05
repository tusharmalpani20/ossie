import { Component, lazy, Suspense, type ReactNode } from "react";
import type { ComponentProps } from "react";
import { Button } from "@repo/ui/button";

const LazyExamples = lazy(() =>
  import("./DocumentationRequestExamples").then((module) => ({
    default: module.DocumentationRequestExamples,
  })),
);

class ExampleChunkBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; retry: number }
> {
  state = { failed: false, retry: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed)
      return (
        <div role="alert">
          <p>Request examples could not be loaded.</p>
          <Button
            type="button"
            onClick={() =>
              this.setState((state) => ({
                failed: false,
                retry: state.retry + 1,
              }))
            }
          >
            Retry request examples
          </Button>
        </div>
      );
    return <div key={this.state.retry}>{this.props.children}</div>;
  }
}

export const LazyDocumentationRequestExamples = (
  props: ComponentProps<typeof LazyExamples>,
) => (
  <ExampleChunkBoundary>
    <Suspense
      fallback={
        <div aria-busy="true" aria-live="polite">
          Loading request examples…
        </div>
      }
    >
      <LazyExamples {...props} />
    </Suspense>
  </ExampleChunkBoundary>
);
