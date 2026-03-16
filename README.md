# telegram-profanity-filter

Telegram bot that filters profanity in group chats.

> **Project status: Archived.** This project is no longer maintained.

**[Documentation](https://vadimcpp.github.io/telegram-profanity-filter/)**

## Quick Start Locally

```bash
git clone https://github.com/VadimCpp/telegram-profanity-filter.git
cd telegram-profanity-filter
npm install
npm run test
echo "DEBUG=true" > .env
echo "TELEGRAM_BOT_TOKEN=.....your.bot.token....get.it.in.the.botfather....." >> .env
npm run dev
```

Or use the template: `cp .env.default .env` then edit `.env` (adds `HEROKU_URL` for production).

Expected output:

```bash
> telegram-profanity-filter@1.0.0 dev
> rm -rf ./dist && npx tsc && node dist/index.js

 🤖[telegram]: Initializing bot
 🤖[telegram]: Run in debug (use polling)
⚡️[app]: Initializing express web server
⚡️[app]: Server is running on port 3000
```

## Environment

| Variable | Description |
|----------|-------------|
| `DEBUG` | `true` = polling (local), `false` = webhook (production) |
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `HEROKU_URL` | App URL when using webhooks (e.g. `https://your-app.herokuapp.com/`) |

## Production setup

Before deploying, set these in `src/messenger/telegram.ts`:

| Constant | Description |
|----------|-------------|
| `CENSOR_CHAT_ID` | Telegram chat ID where censored message reports are sent (e.g. `-10xxxxxx27` for a group/supergroup). Get it by adding [@userinfobot](https://t.me/userinfobot) to the chat or from the group invite link. |
| `ADMIN_ID` | Your Telegram user ID (e.g. `74xxxxx0`). Get it from [@userinfobot](https://t.me/userinfobot) in a private chat. |

Replace the `0` placeholders with your actual IDs.

## Deploy

```bash
npm run deploy
```

Pushes to Heroku (`git push heroku main:master`). Set config vars in Heroku dashboard.
