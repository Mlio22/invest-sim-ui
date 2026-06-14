const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8888";
const SERVICE_SLUG = "kapita";

/** Start OAuth on the identity host so the state cookie is set on the correct domain. */
export function buildOAuthLoginUrl(provider: string, origin: string): string {
  const callbackUrl = `${origin}/auth/callback`;
  const url = new URL(`${AUTH_BASE}/v1/auth/${provider}/login`);
  url.searchParams.set("service", SERVICE_SLUG);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("redirect", "1");
  return url.toString();
}

export { AUTH_BASE, SERVICE_SLUG };
