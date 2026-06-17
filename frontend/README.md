# TEC Voting System - Frontend

The frontend for the TEC Online Voting System. Built as a blazing-fast, edge-optimized Progressive Web App (PWA) using React, Vite, and Chakra UI.

## 🚀 Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [TanStack Router](https://tanstack.com/router/latest) (File-based, type-safe routing)
- **State Management**: [Jotai](https://jotai.org/) (Atomic, ghost-rendered state)
- **Styling**: [Chakra UI](https://chakra-ui.com/) (Accessible, customizable components)
- **Animations**: [Anime.js](https://animejs.com/) (Cinematic staggered loading)
- **API Client**: [Elysia Eden Treaty](https://elysiajs.com/eden/treaty.html) (100% End-to-End Type Safety)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/) via Iconify
- **PWA**: `vite-plugin-pwa` (Installable native app experience)

## ✨ Key Features

- **Type-Safe API Calls**: Eden Treaty directly imports the ElysiaJS backend types. If a backend route changes, the frontend TypeScript compiler will immediately flag errors. No more mismatched API routes!
- **Responsive Design**: Flawless layout adapting from massive desktop monitors down to standard mobile screens.
- **PWA Capabilities**: Fully installable on iOS and Android devices, complete with a Hatsune Miku Teal (`#39C5BB`) themed mobile status bar and custom splash screens.
- **Zero-Shift Animations**: Smooth fade and slide animations mapped strictly to CSS transforms to prevent expensive browser layout recalculations.
- **Smart Polling**: Intelligent, silent 20-second background polling keeps Live Scores perfectly synced without triggering Cloudflare rate limits.
- **Military-Grade Fingerprinting**: Features a custom-built, asynchronous fingerprinting engine that utilizes Audio wave hashing, WebGL extraction, WebRTC IP leakage, and a 9-service fallback array to map devices perfectly while bypassing uBlock Origin and other strict adblockers.

## 🛠️ Local Development

1. **Install Dependencies:**
   ```bash
   bun install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file at the frontend root:
   ```env
   VITE_API_URL=http://localhost:8787
   ```

3. **Start Development Server:**
   ```bash
   bun run dev
   ```

## 📦 Production Deployment (Cloudflare Pages)

To deploy directly to Cloudflare Pages:

```bash
# Generates optimized static assets into the /dist folder
bun run build

# Uploads to Cloudflare Edge
bun run deploy
```