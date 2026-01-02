import { unstable_cache } from "next/cache";
import { fetchIssueComments } from "./github";

export const getIssueComments = (issueNumber: number) =>
  unstable_cache(
    async () => fetchIssueComments(issueNumber),
    ["comments", String(issueNumber)],
    {
      revalidate: 300,
      tags: [`comments:${issueNumber}`],
    },
  )();
