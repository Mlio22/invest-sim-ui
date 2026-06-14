import { authLog } from "@/lib/auth-debug";
import { NextRequest, NextResponse } from "next/server";

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8888";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  const origin = request.nextUrl.origin;
  const callbackUrl = `${origin}/auth/callback`;
  const redirectUri = encodeURIComponent(callbackUrl);
  const authInitUrl = `${AUTH_BASE}/v1/auth/${provider}/login?service=kapita&redirect_uri=${redirectUri}`;

  authLog("OAuthAPI", "init", {
    provider,
    origin,
    callbackUrl,
    AUTH_BASE,
    authInitUrl,
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    host: request.headers.get("host"),
  });

  // Fetch the auth URL from Porto Identity server-side (no CORS issues)
  let res: Response;
  try {
    res = await fetch(authInitUrl);
  } catch (err) {
    authLog("OAuthAPI", "fetch failed", {
      provider,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(
      new URL(`/login?error=network_error`, request.url)
    );
  }

  if (!res.ok) {
    authLog("OAuthAPI", "auth server error", {
      provider,
      status: res.status,
      statusText: res.statusText,
    });
    return NextResponse.redirect(
      new URL(`/login?error=oauth_init_failed`, request.url)
    );
  }

  const data = await res.json();
  const authorizationUrl: string | undefined = data?.authorization_url;

  authLog("OAuthAPI", "auth server response", {
    provider,
    hasAuthorizationUrl: !!authorizationUrl,
    responseKeys: Object.keys(data ?? {}),
  });

  if (!authorizationUrl) {
    return NextResponse.redirect(
      new URL(`/login?error=no_auth_url`, request.url)
    );
  }

  // Redirect the browser to Google (or whichever provider).
  // Forward the Set-Cookie header from Porto Identity so the state cookie
  // is stored in the browser's localhost jar — shared between :3000 and :8888
  // since browser cookies are domain-scoped (not port-scoped) for localhost.
  const setCookie = res.headers.get("set-cookie");
  authLog("OAuthAPI", "redirecting to provider", {
    provider,
    authorizationUrlHost: new URL(authorizationUrl).host,
    hasSetCookie: !!setCookie,
  });
  const response = NextResponse.redirect(authorizationUrl);
  if (setCookie) {
    response.headers.set("set-cookie", setCookie);
  }

  return response;
}
