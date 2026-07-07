export const docPathToSlug = (path: string): string[] => {
  const segments = path.split("/");
  const last = segments.at(-1);

  if (last === "README.md") {
    segments.pop();
  } else if (last !== undefined) {
    segments[segments.length - 1] = last.replace(/\.md$/u, "");
  }

  if (segments.length === 0) {
    return ["overview"];
  }

  return segments;
};
