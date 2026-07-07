import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";

import { docPathToSlug } from "@/lib/doc-slug";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  slugs(file) {
    return docPathToSlug(file.path);
  },
});
