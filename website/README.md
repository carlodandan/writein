# WriteIn — Brand Website & Showcase

The official brand showcase, feature walkthrough, and documentation portal for **WriteIn**, the offline-first Windows desktop writing studio for novelists and long-form fiction writers.

---

## Deploying to Cloudflare Pages

This website is pre-configured for seamless deployment to **Cloudflare Pages**.

### Method 1: Git Integration (Recommended for CI/CD)

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select the `writein` repository.
3. Configure the build settings based on your preferred project root:

#### If Project Root is repository root (`/`):
- **Framework preset**: `Vite`
- **Build command**: `pnpm run build:web`
- **Build output directory**: `website/dist`

#### If Root directory is set to `/website`:
- **Framework preset**: `Vite`
- **Build command**: `pnpm run build`
- **Build output directory**: `dist`

4. Click **Save and Deploy**. Cloudflare Pages will build and deploy your site to `https://<your-project>.pages.dev` with global edge caching and automatic SSL.

---

### Method 2: Direct Deployment via Wrangler CLI

You can also deploy directly from your local terminal using Wrangler:

```bash
# 1. Build the website
pnpm run build:web

# 2. Deploy to Cloudflare Pages
npx wrangler pages deploy website/dist --project-name writein-website
```

---

## Included Cloudflare Configuration Files

- [`public/_headers`](./public/_headers): Sets security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) and 1-year immutable caching for static assets in `/assets/*`.
- [`public/_routes.json`](./public/_routes.json): Routing rules for Cloudflare Pages.
- [`wrangler.toml`](./wrangler.toml): Configuration for project name, compatibility date, and build output directory.

---

## Local Development & Testing

```bash
# Run local development server
pnpm run dev:web

# Build for production
pnpm run build:web

# Preview local production build
pnpm run preview:web
```

---

## Desktop Deep Link Integration (`writein://`)

WriteIn integrates the `@tauri-apps/plugin-deep-link` / `tauri-plugin-deep-link` plugin to register the custom URI scheme `writein://`.

Supported actions:
- `writein://open`: Launches WriteIn.
- `writein://new`: Triggers the project creation modal.
- `writein://tab?to=manuscript`: Opens directly to the manuscript binder & editor.
- `writein://tab?to=characters`: Opens directly to the character relationship web.
- `writein://tab?to=timeline`: Opens directly to the narrative timeline.
