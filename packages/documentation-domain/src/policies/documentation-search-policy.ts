export const build_documentation_search_document = (input: {
  title: string;
  description: string | null;
  headings: string[];
  body_text: string;
  comments?: string[];
}) => {
  const safeParts = [
    input.title,
    input.description,
    ...input.headings,
    input.body_text,
  ].filter((value): value is string => Boolean(value));
  return {
    title: input.title,
    description: input.description,
    text: safeParts.join(" "),
  };
};
