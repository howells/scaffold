import Link from "next/link";

const NotFound = () => (
  <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6">
    <p className="text-fd-muted-foreground text-sm font-semibold tracking-[0.14em] uppercase">
      Not Found
    </p>
    <h1 className="mt-4 text-4xl font-semibold">
      That page is not in Scaffold.
    </h1>
    <Link
      className="text-fd-primary mt-8 text-sm font-semibold"
      href="/docs/overview"
    >
      Back to docs
    </Link>
  </main>
);

export default NotFound;
