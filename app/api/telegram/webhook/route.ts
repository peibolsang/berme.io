import {
  getTelegramAllowedUserIds,
  getTelegramWebhookSecret,
} from "../../../../lib/config";
import { createThoughtPage } from "../../../../lib/notion";
import { sendTelegramMessage } from "../../../../lib/telegram";

export const runtime = "nodejs";

type TelegramUser = {
  id: number;
};

type TelegramChat = {
  id: number;
  type: string;
};

type TelegramMessage = {
  chat: TelegramChat;
  from?: TelegramUser | null;
  text?: string | null;
};

type TelegramUpdate = {
  message?: TelegramMessage | null;
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const buildJsonResponse = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });

const hasValidWebhookSecret = (request: Request) => {
  const expectedSecret = getTelegramWebhookSecret();
  const providedSecret = request.headers.get("x-telegram-bot-api-secret-token");
  return Boolean(expectedSecret) && providedSecret === expectedSecret;
};

const isAllowedSender = (message: TelegramMessage) => {
  const senderId = String(message.from?.id ?? "");
  return getTelegramAllowedUserIds().includes(senderId);
};

const extractThoughtBody = (text: string) => {
  const match = text.match(/^\/new(?:@[\w_]+)?(?:\s+|$)/i);
  if (!match) {
    return null;
  }

  const body = text.slice(match[0].length);
  if (!body.trim()) {
    return "";
  }

  return body;
};

const sendReply = async (message: TelegramMessage, text: string) => {
  try {
    await sendTelegramMessage(message.chat.id, text);
  } catch (error) {
    console.error("Failed to send Telegram reply", error);
  }
};

export async function POST(request: Request) {
  if (!hasValidWebhookSecret(request)) {
    return buildJsonResponse({ ok: false }, 401);
  }

  let payload: TelegramUpdate;
  try {
    payload = (await request.json()) as TelegramUpdate;
  } catch {
    return buildJsonResponse({ ok: false, error: "Invalid JSON payload" }, 400);
  }

  const message = payload.message;
  if (!message?.text) {
    return buildJsonResponse({ ok: true });
  }

  const thoughtBody = extractThoughtBody(message.text);
  if (thoughtBody === null) {
    return buildJsonResponse({ ok: true });
  }

  if (message.chat.type !== "private" || !isAllowedSender(message)) {
    return buildJsonResponse({ ok: true });
  }

  if (!thoughtBody.trim()) {
    await sendReply(message, "Usage: /new <text>");
    return buildJsonResponse({ ok: true });
  }

  try {
    await createThoughtPage(thoughtBody);
    await sendReply(message, "Saved to Notion.");
  } catch (error) {
    console.error("Failed to save Telegram thought to Notion", error);
    await sendReply(message, "I couldn't save that to Notion.");
  }

  return buildJsonResponse({ ok: true });
}
