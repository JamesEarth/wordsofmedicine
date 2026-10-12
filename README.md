# Words of Medicine

A Next.js site with published medical articles and an authenticated admin area
for creating drafts and publishing articles with sources.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run db:setup
npm run admin:create
npm run dev
```

Open http://localhost:3000 for published articles or
http://localhost:3000/admin/login to sign in. `admin:create` prompts for an email
and password; it can also read `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment.

The app uses Prisma 7 and PostgreSQL. Set `DATABASE_URL` in `.env` to your existing
PostgreSQL connection string (see `.env.example`) before running the commands above.
The existing website content is in the `cms` PostgreSQL schema, so its connection
URL must include `?schema=cms`. Choosing `public` connects to different tables.
`db:setup` generates the client, checks the connection, applies migrations, and
seeds a new installation without replacing existing content.

For an existing database that already contains your content and administrator,
skip `db:setup` and `admin:create`; set `DATABASE_URL` and run `npm run dev`.

## Production

```bash
npm run build
npm start
```

Development and builds generate the CMS client automatically. Database setup is
explicit: run `npm run db:setup` before serving a new installation. Production
requires HTTPS for admin sessions and access to the PostgreSQL database.

`prisma/schema.prisma` defines both `User` and the CMS models. `prisma.config.ts`
uses the PostgreSQL migrations in `prisma/migrations`; `prisma7.config.ts` is a
compatibility alias for that same configuration. The old SQLite schema,
migrations, and local files under `prisma/cms` are retained but are not used by
the app or database commands.

## Checks

```bash
npm run lint
npm run typecheck
npm run test:cms
npm run build
```

`test:cms` requires an initialized CMS database. It verifies passwords, login
throttling, persistence, and draft visibility, and removes its temporary records.
