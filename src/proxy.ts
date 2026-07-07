import { isMarkdownPreferred, rewritePath } from "fumadocs-core/negotiation";
import { type NextRequest, NextResponse } from "next/server";

const { rewrite } = rewritePath("/docs{/*path}", "/llms.mdx/docs{/*path}");

export const proxy = (request: NextRequest): NextResponse => {
  if (isMarkdownPreferred(request)) {
    const result = rewrite(request.nextUrl.pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.url));
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: "/docs/:path*",
};
