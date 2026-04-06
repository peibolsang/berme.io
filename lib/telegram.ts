import { getTelegramBotToken } from "./config";

const TELEGRAM_API_BASE_URL = "https://api.telegram.org";

type TelegramSendMessageResponse = {
  ok: boolean;
};

export const sendTelegramMessage = async (chatId: number, text: string) => {
  const response = await fetch(
    `${TELEGRAM_API_BASE_URL}/bot${getTelegramBotToken()}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API error ${response.status}: ${errorText}`);
  }

  const payload = (await response.json()) as TelegramSendMessageResponse;
  if (!payload.ok) {
    throw new Error("Telegram API returned an unsuccessful response");
  }
};
