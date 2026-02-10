# VladsBot Web Chat

Secure web chat interface for VladsBot with Authentik OAuth and GridSharks theme.

## Features

- 🔐 **Authentik OAuth** - Secure SSO authentication
- 💬 **Real-time Chat** - SSE streaming for instant responses
- 🎨 **GridSharks Theme** - Dark glassmorphism design
- 📱 **PWA Support** - Installable, works offline
- ⌨️ **Command Support** - All VladsBot commands (`/status`, `/tts`, etc.)

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS 4 with custom theme
- **Auth:** NextAuth.js v5 (Auth.js)
- **Icons:** Lucide React

## Development

```bash
# Install dependencies
npm install

# Create .env.local from example
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AUTHENTIK_ISSUER` | Authentik OpenID Connect issuer URL |
| `AUTHENTIK_CLIENT_ID` | OAuth client ID |
| `AUTHENTIK_CLIENT_SECRET` | OAuth client secret |
| `AUTH_SECRET` | NextAuth.js secret (32+ chars) |
| `AUTH_URL` | Production URL for callbacks |
| `OPENCLAW_GATEWAY_URL` | OpenClaw Gateway endpoint |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway auth token |

## Deployment

Auto-deploys via Coolify:
- **Dev:** Push to `dev` branch → https://vladsbot-web-dev.app.taylorelley.com
- **Prod:** Push to `main` branch → https://vladsbot-web.app.taylorelley.com

## PWA Installation

1. Open the site in Chrome/Safari
2. Click "Add to Home Screen" or the install prompt
3. Launch from your home screen

## License

Private - Taylor Elley
