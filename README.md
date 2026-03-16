# telegram-profanity-filter

Telegram bot that filters profanity in group chats.

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

## Deploy

```bash
npm run deploy
```

Pushes to Heroku (`git push heroku main:master`). Set config vars in Heroku dashboard.
