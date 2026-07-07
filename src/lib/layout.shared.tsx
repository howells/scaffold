import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const baseOptions = (): BaseLayoutProps => ({
  githubUrl: "https://github.com/howells/scaffold",
  nav: {
    title: "Scaffold",
    url: "/",
  },
  links: [
    {
      active: "nested-url",
      text: "Docs",
      url: "/docs/overview",
    },
  ],
});
