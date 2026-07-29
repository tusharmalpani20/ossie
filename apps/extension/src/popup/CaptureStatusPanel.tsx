import type { ReactNode } from "react";

export const CaptureStatusPanel = ({ children }: { children: ReactNode }) => (
  <div className="captureStatus">{children}</div>
);
