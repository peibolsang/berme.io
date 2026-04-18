import { getIssueComments } from "../../../../lib/comments";
import type { GitHubComment } from "../../../../lib/github";
import {
  buildNowMarkdownDocument,
  createMarkdownResponse,
} from "../../../../lib/markdown-exports";
import { getCurrentlyWritingIssues, getNowPost } from "../../../../lib/now";

const notFoundResponse = () =>
  new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      Vary: "Accept",
    },
  });

export const revalidate = 3600;

export async function GET() {
  const [post, currentlyWriting] = await Promise.all([
    getNowPost(),
    getCurrentlyWritingIssues(),
  ]);

  if (!post) {
    return notFoundResponse();
  }

  let comments: GitHubComment[] = [];
  try {
    comments = await getIssueComments(post.number);
  } catch {
    comments = [];
  }

  return createMarkdownResponse(
    buildNowMarkdownDocument({
      post,
      currentlyWriting,
      comments,
    }),
  );
}
