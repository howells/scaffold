import { DocsBody, DocsPage } from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getMDXComponents } from "@/components/mdx";
import { source } from "@/lib/source";

interface DocPageProps {
  readonly params: Promise<{
    readonly slug?: string[];
  }>;
}

export const generateStaticParams = () => source.generateParams();

export const generateMetadata = async ({
  params,
}: DocPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return {};
  }

  return {
    description: page.data.description,
    openGraph: {
      description: page.data.description,
      title: page.data.title,
      type: "article",
    },
    title: page.data.title,
    twitter: {
      card: "summary_large_image",
      description: page.data.description,
      title: page.data.title,
    },
  };
};

const DocPage = async ({ params }: DocPageProps) => {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    notFound();
  }

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc}>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
};

export default DocPage;
