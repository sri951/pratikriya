# Deployment Guide

## Quick Start: Already Deployed ✅

Pratikriya is live at **[pratikriya.lovable.app](https://pratikriya.lovable.app)** via Lovable.dev.

---

## Self-Hosted Deployment

### Prerequisites

- Node.js 20+
- npm or bun
- Supabase account
- Lovable API key

### Local Development

```bash
# Clone
git clone https://github.com/sri951/pratikriya.git
cd pratikriya

# Install
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and Lovable API keys

# Run dev server
npm run dev
```

Server runs on `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
```

---

## Deploy to Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel auto-detects TanStack Start and configures correctly.

---

## Deploy to Other Platforms

### Docker

A production-ready multi-stage `Dockerfile` and `docker-compose.yml` are
included at the repository root.

```bash
# One-shot build + run via Compose (reads env from your shell / .env).
docker compose up --build

# Or manually:
docker build \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  --build-arg VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID \
  -t pratikriya:local .

docker run --rm -p 3000:3000 \
  -e LOVABLE_API_KEY=$LOVABLE_API_KEY \
  pratikriya:local
```

The image runs the Nitro production server on port 3000 as a non-root user.
`VITE_*` values must be provided as **build args** (Vite inlines them at
build time); `LOVABLE_API_KEY` is a runtime env var.

> Docker is a self-hosting convenience. The canonical production deployment
> is Vercel / Lovable + hosted Supabase — see the sections above.

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Traditional VPS (DigitalOcean, Linode, AWS EC2)

```bash
# SSH into server
ssh user@your-server

# Clone repo
git clone https://github.com/sri951/pratikriya.git
cd pratikriya

# Install & build
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start "npm run preview" --name pratikriya
pm2 startup
pm2 save
```

Setup Nginx reverse proxy and SSL with Let's Encrypt.

---

## Environment Variables

Required for deployment:

```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
LOVABLE_API_KEY=your-api-key
```

### Get These Values

**Supabase:**

1. Create project at [supabase.com](https://supabase.com)
2. Go to **Settings → API**
3. Copy `Project URL` and `Anon Key`

**Lovable API Key:**

1. Get from Lovable dashboard
2. Set as environment variable

---

## Database Setup

Migrations run automatically on first boot. If needed, manually:

```bash
# Using Supabase CLI
supabase db push
```

---

## Health Checks

After deployment, verify:

```bash
# Frontend loads
curl https://your-domain.com

# API responds
curl https://your-domain.com/api/health
```

---

## Monitoring & Logs

### Vercel

- Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- Logs: Real-time in dashboard

### Docker

```bash
docker logs -f pratikriya
```

### PM2

```bash
pm2 logs pratikriya
pm2 monit
```

---

## Support

- **Issues:** [GitHub Issues](https://github.com/sri951/pratikriya/issues)
- **Docs:** [Architecture](./ARCHITECTURE.md)
- **Contributing:** [Guide](./CONTRIBUTING.md)
