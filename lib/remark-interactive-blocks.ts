type MarkdownNode = {
  children?: MarkdownNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, string>;
  };
  lang?: string | null;
  type: string;
  value?: string;
};

const transformInteractiveFences = (node: MarkdownNode) => {
  if (!node.children) {
    return;
  }

  node.children = node.children.map((child) => {
    if (child.type === "code" && child.lang === "berme") {
      return {
        data: {
          hName: "div",
          hProperties: {
            dataBermeInteractive: "true",
            dataBermeSpec: child.value ?? "",
          },
        },
        type: "bermeInteractiveBlock",
      };
    }

    transformInteractiveFences(child);
    return child;
  });
};

export const remarkInteractiveBlocks = () => (tree: MarkdownNode) => {
  transformInteractiveFences(tree);
};
