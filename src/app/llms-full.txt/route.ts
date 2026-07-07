import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";

export const revalidate = false;

export const GET = async (): Promise<Response> => {
  const scan = await Promise.all(source.getPages().map(getLLMText));

  return new Response(scan.join("\n\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
