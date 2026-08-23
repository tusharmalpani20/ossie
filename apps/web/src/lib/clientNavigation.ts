import { useEffect, useState } from "react";

export const currentClientPath = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

export const navigateWithinApp = (path: string) => {
  const destination = new URL(path, window.location.origin);

  if (destination.origin !== window.location.origin) {
    window.location.assign(destination.href);
    return;
  }

  const nextPath = `${destination.pathname}${destination.search}${destination.hash}`;
  if (nextPath === currentClientPath()) return;

  window.history.pushState({}, "", nextPath);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export const useClientPath = () => {
  const [path, setPath] = useState(currentClientPath);

  useEffect(() => {
    const updatePath = () => setPath(currentClientPath());
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  return path;
};
