import { BUILD_INFO } from "@/lib/build-info.generated";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const getVersion = (): Response =>
  Response.json(
    {
      builtAt: BUILD_INFO.sha === null ? null : BUILD_INFO.builtAt,
      sha: BUILD_INFO.sha,
      shortSha: BUILD_INFO.sha?.slice(0, 8) ?? null,
      source: BUILD_INFO.sha === null ? "unstamped" : "stamped-build",
    },
    { headers: { "Cache-Control": "no-store" } }
  );

export { getVersion as GET };
