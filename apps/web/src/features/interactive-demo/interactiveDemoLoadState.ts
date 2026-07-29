import { ApiClientError } from "../../lib/api";
import type { InteractiveDemoEditorLoadState } from "./interactiveDemoEditorContracts";

export const interactiveDemoLoadStateFromError = (
  error: unknown,
): InteractiveDemoEditorLoadState => {
  if (error instanceof ApiClientError) {
    if (error.kind === "unauthenticated") {
      return { status: "unauthenticated" };
    }
    if (error.kind === "not_found") {
      return { status: "not_found" };
    }
  }
  return { status: "error" };
};
