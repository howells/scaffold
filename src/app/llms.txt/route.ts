import { llms } from "fumadocs-core/source";

import { source } from "@/lib/source";

export const revalidate = false;

export const GET = (): Response =>
  new Response(llms(source).index(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
