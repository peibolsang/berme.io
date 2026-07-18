import { config } from "./config";

type IssueLabel = { name?: string | null } | null;

const hasLabel = (
  labels: IssueLabel[] | null | undefined,
  expectedName: string,
) =>
  (labels ?? []).some(
    (label) =>
      String(label?.name ?? "").trim().toLowerCase() ===
      expectedName.toLowerCase(),
  );

export const isDraftIssue = (labels: IssueLabel[] | null | undefined) =>
  !hasLabel(labels, "published") && !hasLabel(labels, "ready");

export const shouldShowIssueAsContent = (
  labels: IssueLabel[] | null | undefined,
) =>
  hasLabel(labels, "published") ||
  (config.showDrafts && isDraftIssue(labels));
