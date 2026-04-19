/** Admin username from env (default `admin`). Safe to expose to the login form. */
export function getAdminUsernameFromEnv(): string {
  return process.env.ADMIN_USERNAME?.trim() || "admin";
}

/**
 * Admin password from env — server-only; never send to the client.
 * Temporary default `12345678` when unset; set `ADMIN_PASSWORD` in production.
 */
export function getAdminPasswordFromEnv(): string {
  const p = process.env.ADMIN_PASSWORD?.trim();
  return p || "12345678";
}
