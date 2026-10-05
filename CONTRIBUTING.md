# Contributing

## Local development

1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` to a PostgreSQL database.
4. Generate a strong `AUTH_SECRET`.
5. Run `npm install`.
6. Run `npm run db:generate`.
7. Run `npm run db:migrate`.
8. Start the app with `npm run dev`.

Never commit `.env.local` or production secrets.
