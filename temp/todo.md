# Telegram -> Notion Bot: Exact Next Steps

This checklist is only about making the feature you already have in code actually work in production.

The implementation is already in:

- `app/api/telegram/webhook/route.ts`
- `lib/notion.ts`
- `lib/telegram.ts`
- `lib/config.ts`

The webhook endpoint is:

- `https://berme.io/api/telegram/webhook`

If production is hosted somewhere else, replace `https://berme.io` with the real deployed base URL.

## 1. Confirm the exact behavior you now have

Before you configure anything, know what the code currently does:

- It only processes Telegram messages that start with `/new`.
- It only accepts those messages in a private 1:1 chat with the bot.
- It only accepts them from Telegram user IDs listed in `TELEGRAM_ALLOWED_USER_IDS`.
- It requires Telegram to send the webhook secret header `X-Telegram-Bot-Api-Secret-Token`.
- It creates a new page in your Notion database.
- It stores the raw text after `/new` in the Notion page body.
- It generates the page title automatically.
- It sets the Notion tag `Thoughts`.
- It sets the Notion `Date` property to the current server date.
- All other messages and commands are ignored.

## 2. Prepare the Telegram bot

### 2.1 Create the bot in Telegram

If you already have a bot, you can skip this subsection.

1. Open Telegram.
2. Search for `@BotFather`.
3. Start a chat with `@BotFather`.
4. Run `/newbot`.
5. Follow the prompts:
   - choose a display name
   - choose a username ending in `bot`
6. Copy the bot token that BotFather gives you.

That token will be the value for `TELEGRAM_BOT_TOKEN`.

### 2.2 Start a chat with your bot

1. Open your bot in Telegram.
2. Press `Start`.
3. Send any message such as `hello`.

Do this before trying to detect your user ID via `getUpdates`.

## 3. Get your Telegram user ID

You need your numeric Telegram user ID because the backend only accepts allowed senders.

### Option A: use Telegram Bot API directly

1. Make sure the webhook is not set yet.
2. Send a message to your bot from your own Telegram account.
3. Run this command locally in a terminal:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates"
```

4. Look for:

```json
"from": {
  "id": 123456789,
  ...
}
```

5. Copy that numeric `id`.

That number is the value you must allow in `TELEGRAM_ALLOWED_USER_IDS`.

### Important note

Once a webhook is configured, `getUpdates` will usually stop being the right tool, because Telegram will start delivering updates to your webhook instead.

If you already configured a webhook and want to use `getUpdates`, temporarily remove the webhook first:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook?drop_pending_updates=false"
```

Then send a message again and re-run `getUpdates`.

## 4. Prepare the Notion integration

Your code writes into this existing Notion data source:

- `📔 Personal Notebook`
- data source ID: `d7d86599-3901-4dbd-8997-98f4487e3182`

The code expects:

- title property: `﻿Name`
- tags property: `Tags`
- date property: `Date`
- tag option: `Thoughts`

### 4.1 Confirm the integration still has access

In Notion:

1. Open the `📔 Personal Notebook` database.
2. Open the sharing/integration settings for that database.
3. Confirm your Notion integration is connected to this database.
4. Confirm the integration has permission to insert content.

If the integration is not shared with that database, page creation will fail even if the token is valid.

### 4.2 Use the correct env var name

Important: the new code expects `NOTION_API_TOKEN`.

If your existing local or Vercel config still uses `NOTION_API_KEY`, that old variable name is not used by this implementation.

You must set:

- `NOTION_API_TOKEN=<your notion integration token>`

If you already have a valid token stored under `NOTION_API_KEY`, reuse the same token value under `NOTION_API_TOKEN`.

## 5. Update local environment variables

Edit `.env.local`.

Add these variables if they are missing:

```bash
NOTION_API_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=d7d86599-3901-4dbd-8997-98f4487e3182
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_SECRET=choose_a_long_random_secret
TELEGRAM_ALLOWED_USER_IDS=your_numeric_telegram_user_id
```

### Notes

- `NOTION_DATABASE_ID` can stay exactly as shown unless you want a different database.
- `TELEGRAM_WEBHOOK_SECRET` should be a strong random string.
- `TELEGRAM_ALLOWED_USER_IDS` can be a comma-separated list, but for now you only need your own user ID.
- Do not commit `.env.local`.

### Recommended secret generation

Generate a strong webhook secret locally:

```bash
openssl rand -hex 32
```

Use the output as `TELEGRAM_WEBHOOK_SECRET`.

If you want a URL-safe secret instead of hex:

```bash
openssl rand -base64 32 | tr -d '\n' | tr '/+' '_-'
```

For this project, the recommended default is still:

```bash
openssl rand -hex 32
```

## 6. Update Vercel environment variables

You need the same variables in Vercel production, because Telegram will call the deployed site, not your local machine.

In Vercel:

1. Open the Vercel dashboard.
2. Open the project for this site.
3. Go to `Settings`.
4. Go to `Environment Variables`.
5. Add or update these variables for `Production`:

- `NOTION_API_TOKEN`
- `NOTION_DATABASE_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TELEGRAM_ALLOWED_USER_IDS`

Also confirm these existing variables are still correct for the site in general:

- `NEXT_PUBLIC_SITE_URL`

### Important compatibility note

If Vercel currently has `NOTION_API_KEY` but not `NOTION_API_TOKEN`, the bot will not work until you add `NOTION_API_TOKEN`.

If you still need to generate `TELEGRAM_WEBHOOK_SECRET` before entering it into Vercel, use:

```bash
openssl rand -hex 32
```

## 7. Redeploy after adding env vars

After changing Vercel env vars:

1. Trigger a new deployment in Vercel.
2. Wait until the deployment finishes successfully.
3. Confirm the production URL is live.

The webhook should point to a deployed version that already has the correct environment variables.

## 8. Register the Telegram webhook

After the production deployment is live, tell Telegram where to send updates.

Run:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://berme.io/api/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>",
    "drop_pending_updates": false
  }'
```

Replace:

- `<TELEGRAM_BOT_TOKEN>`
- `<TELEGRAM_WEBHOOK_SECRET>`

If your production hostname is not `berme.io`, use the real deployed HTTPS URL instead.

### Expected result

Telegram should return a success payload similar to:

```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

## 9. Verify the webhook configuration

After setting the webhook, verify it:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

Check all of these:

- `url` is your production webhook URL
- `has_custom_certificate` is fine either way
- `pending_update_count` is not growing unexpectedly
- `last_error_date` is absent or old
- `last_error_message` is absent

If `last_error_message` appears, fix that before testing further.

## 10. Test the full production flow

### 10.1 Happy path

From your own Telegram account, in a private chat with the bot, send:

```text
/new This is a test thought from Telegram
```

Expected result:

- The bot replies: `Saved to Notion.`
- A new page appears in Notion
- The page title is generated automatically
- The `Tags` property includes `Thoughts`
- The `Date` property is set
- The body contains exactly:

```text
This is a test thought from Telegram
```

### 10.2 Multiline test

Send:

```text
/new first line
second line
third line
```

Expected result:

- One new Notion page is created
- The body preserves line separation as separate paragraph blocks

### 10.3 Empty command test

Send:

```text
/new
```

Expected result:

- No Notion page is created
- The bot replies: `Usage: /new <text>`

### 10.4 Non-command test

Send:

```text
hello
```

Expected result:

- No Notion page is created
- No bot reply is sent

## 11. Test security expectations

These are the protections currently implemented. Validate them deliberately.

### 11.1 Wrong sender

If another Telegram account sends `/new ...` to the bot:

- no Notion page should be created
- no success reply should be sent

### 11.2 Non-private chat

If you add the bot to a group and send `/new ...` there:

- no Notion page should be created
- the command should be ignored

### 11.3 Wrong webhook secret

If Telegram is configured with a different `secret_token` than your backend expects:

- the backend will return `401`
- Telegram delivery will fail
- `getWebhookInfo` will start showing delivery errors

## 12. Check Vercel logs if something fails

If the bot does not behave as expected:

1. Open the Vercel project.
2. Open the latest production deployment.
3. Open logs/functions logs.
4. Look for errors from:
   - `Failed to save Telegram thought to Notion`
   - `Failed to send Telegram reply`

Typical causes:

- `NOTION_API_TOKEN` missing
- `TELEGRAM_BOT_TOKEN` missing
- `TELEGRAM_WEBHOOK_SECRET` mismatch
- `TELEGRAM_ALLOWED_USER_IDS` missing or wrong
- Notion integration not shared with the database

## 13. Keep or clean up old env vars

Because this implementation uses `NOTION_API_TOKEN`, decide explicitly what to do with the old env var name if it exists:

- safest option: keep `NOTION_API_KEY` if other code still uses it, but also add `NOTION_API_TOKEN`
- if nothing else depends on `NOTION_API_KEY`, you can remove it later

Do not assume `NOTION_API_KEY` is enough for this feature. It is not.

## 14. Final minimal production checklist

You are done when all of these are true:

- `TELEGRAM_BOT_TOKEN` is set locally and in Vercel
- `TELEGRAM_WEBHOOK_SECRET` is set locally and in Vercel
- `TELEGRAM_ALLOWED_USER_IDS` includes your Telegram numeric user ID
- `NOTION_API_TOKEN` is set locally and in Vercel
- `NOTION_DATABASE_ID` is set correctly
- Vercel has been redeployed after env changes
- Telegram webhook is registered to `https://berme.io/api/telegram/webhook`
- `getWebhookInfo` shows no active delivery errors
- sending `/new some text` from your private chat creates a tagged Notion page

## 15. Optional improvements later

These are not required to make it work, but they are logical follow-ups:

- add a script to register the Telegram webhook automatically
- add a health-check or smoke-test route for webhook readiness
- support `/new` replies with the created Notion URL
- support a second command like `/ping`
- add structured logging around sender ID, webhook validation, and Notion page creation
