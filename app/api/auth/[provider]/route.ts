import { buildOAuthLoginUrl } from "@/lib/oauth";
import { NextRequest, NextResponse } from "next/server";

/** Legacy entrypoint — redirect browser to identity (do not proxy server-side). */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const url = buildOAuthLoginUrl(provider, request.nextUrl.origin);
  return NextResponse.redirect(url);
}
