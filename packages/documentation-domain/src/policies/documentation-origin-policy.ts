export const is_forbidden_documentation_public_hostname = (
  hostname: string,
): boolean => {
  const host = hostname.toLowerCase().replace(/\.$/u, "");
  if (
    host === "localhost" ||
    host.includes("*") ||
    !host.includes(".") ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".test") ||
    host.endsWith(".invalid") ||
    host.endsWith(".example")
  )
    return true;
  if (host === "::1" || host === "[::1]" || host === "0:0:0:0:0:0:0:1")
    return true;
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(host);
  if (!match) return host.includes(":");
  const octets = match.slice(1).map(Number);
  if (octets.some((part) => part > 255)) return true;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && (b ?? 0) >= 64 && (b ?? 0) <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && (b ?? 0) >= 16 && (b ?? 0) <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    a === 198 ||
    (a ?? 0) >= 224
  );
};
