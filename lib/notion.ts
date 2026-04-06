import { getNotionDatabaseId, getNotionToken } from "./config";

const NOTION_API_BASE_URL = "https://api.notion.com/v1";
const NOTION_API_VERSION = "2026-03-11";
const NOTION_MAX_RICH_TEXT_LENGTH = 2000;
const NOTION_MAX_APPEND_BLOCKS = 100;
const NOTION_TITLE_PROPERTY = "\uFEFFName";
const NOTION_TAGS_PROPERTY = "Tags";
const NOTION_DATE_PROPERTY = "Date";
const NOTION_THOUGHTS_TAG = "Thoughts";

type NotionPageResponse = {
  id: string;
  url: string;
};

type NotionBlock = {
  object: "block";
  type: "paragraph";
  paragraph: {
    rich_text: Array<{
      type: "text";
      text: {
        content: string;
      };
    }>;
  };
};

const chunkText = (value: string, size: number) => {
  const chunks: string[] = [];

  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }

  return chunks;
};

const buildParagraphBlocks = (body: string): NotionBlock[] => {
  const lines = body.split(/\r?\n/);

  return lines.flatMap((line) => {
    if (!line) {
      return [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [],
          },
        },
      ] satisfies NotionBlock[];
    }

    return chunkText(line, NOTION_MAX_RICH_TEXT_LENGTH).map(
      (chunk) =>
        ({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [
              {
                type: "text",
                text: {
                  content: chunk,
                },
              },
            ],
          },
        }) satisfies NotionBlock,
    );
  });
};

const notionFetch = async <T>(path: string, init: RequestInit) => {
  const response = await fetch(`${NOTION_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getNotionToken()}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error ${response.status}: ${errorText}`);
  }

  return (await response.json()) as T;
};

const createPage = async (title: string, date: string, children: NotionBlock[] = []) =>
  notionFetch<NotionPageResponse>("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: {
        type: "data_source_id",
        data_source_id: getNotionDatabaseId(),
      },
      properties: {
        [NOTION_TITLE_PROPERTY]: {
          title: [
            {
              type: "text",
              text: {
                content: title,
              },
            },
          ],
        },
        [NOTION_TAGS_PROPERTY]: {
          multi_select: [{ name: NOTION_THOUGHTS_TAG }],
        },
        [NOTION_DATE_PROPERTY]: {
          date: {
            start: date,
          },
        },
      },
      children,
    }),
  });

const appendBlocks = async (pageId: string, blocks: NotionBlock[]) => {
  for (let index = 0; index < blocks.length; index += NOTION_MAX_APPEND_BLOCKS) {
    const batch = blocks.slice(index, index + NOTION_MAX_APPEND_BLOCKS);
    await notionFetch(`/blocks/${pageId}/children`, {
      method: "PATCH",
      body: JSON.stringify({
        children: batch,
      }),
    });
  }
};

const toNotionDate = (date: Date) => date.toISOString().slice(0, 10);

const pad = (value: number) => String(value).padStart(2, "0");

export const buildThoughtTitle = (date: Date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `Thought ${year}-${month}-${day} ${hours}:${minutes}`;
};

export const createThoughtPage = async (body: string, now = new Date()) => {
  const blocks = buildParagraphBlocks(body);
  const initialBlocks = blocks.slice(0, NOTION_MAX_APPEND_BLOCKS);
  const remainingBlocks = blocks.slice(NOTION_MAX_APPEND_BLOCKS);
  const page = await createPage(
    buildThoughtTitle(now),
    toNotionDate(now),
    initialBlocks,
  );

  if (remainingBlocks.length) {
    await appendBlocks(page.id, remainingBlocks);
  }

  return page;
};
