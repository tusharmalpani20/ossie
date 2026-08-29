import type { ReactNode } from "react";

export const PopupShell = ({ children }: { children: ReactNode }) => (
  <main className="popup">
    <div className="brand">
      <img
        src="/icons/ossie-32.png"
        alt=""
        aria-hidden="true"
        width="32"
        height="32"
      />
      <span>Ossie</span>
    </div>
    {children}
  </main>
);
