import type { AuthContext, AuthResponse } from "@repo/types/auth";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

type PortalAccountContextValue = {
  account: AuthContext | null;
  ensureAccount: (loadAuth: () => Promise<AuthResponse>) => void;
  rememberAccount: (account: AuthContext) => void;
  clearAccount: () => void;
};

const PortalAccountContext = createContext<PortalAccountContextValue | null>(
  null,
);

export const PortalAccountProvider = ({ children }: { children: ReactNode }) => {
  const [account, setAccount] = useState<AuthContext | null>(null);
  const accountRef = useRef<AuthContext | null>(null);
  const requestRef = useRef<Promise<void> | null>(null);

  const rememberAccount = useCallback((nextAccount: AuthContext) => {
    accountRef.current = nextAccount;
    setAccount(nextAccount);
  }, []);

  const clearAccount = useCallback(() => {
    accountRef.current = null;
    requestRef.current = null;
    setAccount(null);
  }, []);

  const ensureAccount = useCallback(
    (loadAuth: () => Promise<AuthResponse>) => {
      if (accountRef.current || requestRef.current) return;

      requestRef.current = loadAuth()
        .then((response) => rememberAccount(response.auth))
        .catch(() => undefined)
        .finally(() => {
          requestRef.current = null;
        });
    },
    [rememberAccount],
  );

  const value = useMemo(
    () => ({ account, ensureAccount, rememberAccount, clearAccount }),
    [account, clearAccount, ensureAccount, rememberAccount],
  );

  return (
    <PortalAccountContext.Provider value={value}>
      {children}
    </PortalAccountContext.Provider>
  );
};

export const usePortalAccount = () => useContext(PortalAccountContext);
