import { Component, lazy, Suspense, type ReactNode } from "react";
import { Button } from "@repo/ui/button";
import type { DocumentationApiOperationExperienceProps } from "./DocumentationApiOperationExperience";

const LazyExperience = lazy(() =>
  import("./DocumentationApiOperationExperience").then((module) => ({
    default: module.DocumentationApiOperationExperience,
  })),
);

class ChunkBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; retry: number }
> {
  state = { failed: false, retry: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // The retryable, content-free state is the user-visible boundary. The
    // global runtime may report the chunk failure without request credentials.
  }

  render() {
    if (this.state.failed)
      return (
        <div role="alert">
          <p>The Try It experience could not be loaded.</p>
          <Button
            type="button"
            onClick={() =>
              this.setState((state) => ({
                failed: false,
                retry: state.retry + 1,
              }))
            }
          >
            Retry Try It
          </Button>
        </div>
      );
    return <div key={this.state.retry}>{this.props.children}</div>;
  }
}

export const LazyDocumentationApiOperationExperience = (
  props: DocumentationApiOperationExperienceProps,
) => (
  <ChunkBoundary>
    <Suspense
      fallback={
        <div aria-busy="true" aria-live="polite">
          Loading Try It…
        </div>
      }
    >
      <LazyExperience {...props} />
    </Suspense>
  </ChunkBoundary>
);
