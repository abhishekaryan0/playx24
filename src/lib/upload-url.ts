/**
 * Map stored paths like `/uploads/foo.jpeg` to the route that reads from disk.
 * Direct `/uploads/...` can 404 on some deployments because uploads are runtime-only
 * and not part of the static build output.
 */
export function resolvePublicUploadUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (u.startsWith("/api/uploads/file/")) return u;
  if (u.startsWith("/uploads/")) {
    const rest = u.slice("/uploads/".length);
    if (!rest || rest.includes("..")) return u;
    const safe = rest
      .split("/")
      .filter((seg) => seg.length > 0)
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    return `/api/uploads/file/${safe}`;
  }
  return u;
}
