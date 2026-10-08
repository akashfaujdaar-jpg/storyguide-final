# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Deploy to Vercel

This TanStack Start app is built with Nitro, which Vercel detects automatically. Connect this repository to a Vercel project or deploy it with the Vercel CLI; use the repository root as the project root and keep the detected build settings.

Set these values for Production, Preview, and Development in the Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose this key to the browser)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `STORYGUIDE_ADMIN_PASSWORD` (server-only admin login password)
- `ADMIN_SESSION_SECRET` (at least 32 random bytes; used to sign secure admin sessions)

Use the publishable key only for the two publishable-key variables. Never put a Supabase secret or service-role key in a `VITE_` variable.

## Catalogue publishing setup

The admin desk is available at `/admin`. It uses a server-verified password and an eight-hour, HTTP-only, secure, same-site session cookie. Set the password and a unique session secret in Vercel environment variables; neither belongs in source code or a `VITE_` variable. Use a long, unique password for production. Apply `supabase/migrations/20261008000000_storyguide_catalog_cms.sql` to the configured Supabase project before using book, category, page-copy, or PDF publishing. The migration creates the catalogue tables and public PDF bucket. The server uses the service-role key only after validating the admin session, and uploads use short-lived signed URLs.

The existing `/blog-editor` continues to manage journal articles; it is also linked from the admin desk. Public catalogue responses are small, fetched in parallel on the server, and reused by the client query cache for one minute.

