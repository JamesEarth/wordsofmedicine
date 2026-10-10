import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hostname = request.nextUrl.hostname;
  const isBlogHost = hostname === "blog.localhost" || hostname === "blog.wordsofmedicine.com";
  // Keep the blog landing page on its subdomain while allowing shared library,
  // administrator, and image routes to work without an extra /blog prefix.
  if (isBlogHost && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/blog";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|icon.svg|images/).*)"],
};
