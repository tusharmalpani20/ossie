import type { ReactNode } from "react";

export const CaptureContextPanel = ({ children }: { children: ReactNode }) => (
  <div className="captureState">{children}</div>
);
