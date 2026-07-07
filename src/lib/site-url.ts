/**
 * Resolve the site's absolute base URL with an exact, fail-fast rule:
 * production uses the fixed production domain, preview uses the deployment URL,
 * and everything else is local. No guessed-domain fallback.
 */
export const siteUrl = (): string => {
  if (process.env.VERCEL_ENV === "production") {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
};
