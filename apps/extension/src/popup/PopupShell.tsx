import type { ReactNode } from "react";

export const PopupShell = ({ children }: { children: ReactNode }) => (
  <main className="popup">
    <div className="brand">
      <img
        src="/icons/ossie-32.png"
        alt=""
        aria-hidden="true"
        width="28"
        height="28"
      />
      <span>Ossie</span>
    </div>
    {children}
  </main>
);
