import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";

export const revalidate = false;

export const generateStaticParams = () => source.generateParams();

interface RouteParams {
  readonly params: Promise<{
    readonly slug?: string[];
  }>;
}

export const GET = async (
  _request: Request,
  { params }: RouteParams
): Promise<Response> => {
  const { slug } = await params;
  const page = source.getPage(slug);

  if (!page) {
    return new Response(null, { status: 404 });
  }

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
};
