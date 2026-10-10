# Words of Medicine

A public medical education website and administrator content studio built with Next.js 16, React 19, Prisma 7, and SQLite.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

The development command generates the Prisma client, applies the CMS migrations, and adds 15 sourced starter guides on the first run. Existing content and edits are preserved on later runs.

Open http://localhost:3000 for the website.

## Create your administrator

With the database initialized, run this in an interactive terminal:

```bash
npm run admin:create
```

Enter your email and a password of at least 12 characters. Password entry is hidden. Then open http://localhost:3000/admin/login and sign in.

There is no default administrator or public registration. Run the same command with an existing administrator email to reset that password and revoke the account's sessions. Automation can supply `ADMIN_EMAIL` and `ADMIN_PASSWORD` through a secure environment; never commit credentials.

## Manage content

- `/admin`: search and filter the content library.
- `/admin/content/new`: add a medicine, condition, instrument, wellness, or first-aid guide.
- `/admin/content/[id]`: edit, preview, publish, unpublish, or delete a guide.
- `/admin/settings`: update the site name, homepage sections and image, about text, contact email, footer, and educational disclaimer.

Article text supports paragraphs separated by a blank line, `## Heading` blocks, and `- List item` blocks. HTML is displayed as text. Images accept local paths such as `/images/nutrition.jpg` or HTTPS image URLs. Uploads are not included; place local images in `public/images` or use your image hosting service.

Publishing requires a source name and HTTPS source link. Drafts are never returned by public queries. Set Featured to include an article among the homepage's first three featured guides. Updates persist in the database and refresh the public pages.

## Public pages

- `/`: responsive homepage, search, topic cards, featured guides, and A–Z index.
- `/library`: search, category filters, and alphabetical browsing.
- `/library/[slug]`: educational guide, reference link, and related reading.
- `/about`: project information and editorial approach.
- `/privacy`: application data practices.

The starter medical content links to NHS or MedlinePlus resources. It is general educational material and has not been independently reviewed by a clinician.

## Database

CMS data is stored separately in `prisma/cms.db`. The existing PostgreSQL `DATABASE_URL`, original schema, and migration history are left untouched. Set `CMS_DATABASE_URL` to another SQLite file path if needed; see `.env.example`.

Always pass the explicit CMS config for Prisma commands because the repository retains an older `prisma7.config.ts`:

```bash
npm run db:generate
npm run db:setup
```

Back up the CMS database using a SQLite-aware backup process. Do not commit database files; they contain administrator credentials and session records. Deleting all content through the admin does not restore starter guides on restart.

## Verification

```bash
npx tsc --noEmit
npm run test:cms
npm run build
```

`test:cms` checks independently salted password hashes, login throttling, persistence, and public/draft visibility. Temporary test records are removed afterward.

## Production

```bash
npm run build
npm start
```

Use a Node.js host with **persistent writable disk** for SQLite and HTTPS for secure administrator cookies. Set `CMS_DATABASE_URL` to the persistent database file. Initialize the database and create your administrator on the production host. Multiple application instances need a shared database architecture; ephemeral/serverless filesystems are unsuitable for this SQLite setup. No hosted deployment is configured by this project.

## Images

Starter photographs are downloaded from Unsplash and served locally. Remote image URLs added through the administrator are loaded directly by the browser.
