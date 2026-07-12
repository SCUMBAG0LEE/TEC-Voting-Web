# TEC Online Voting System

A modern, ultra-fast, highly-scalable, edge-native electronic voting system for the Tarumanagara English Club. This project has been entirely rewritten into a modern edge architecture for zero-latency performance on Cloudflare infrastructure.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-blue.svg)
![Backend](https://img.shields.io/badge/backend-Bun%20%2B%20ElysiaJS-orange.svg)
![Database](https://img.shields.io/badge/database-Neon%20Serverless%20Postgres-green.svg)

## ✨ Features

- 🗳️ **Secure Voting** - One vote per voter with atomic Drizzle ORM transactions.
- 💻 **Forensic Telemetry** - Passive, zero-permission "Smart Logger" capable of Canvas/WebGL hashing, Audio math processing, WebRTC Local IPs, Font arrays, and VPN detection to absolutely prevent multi-voting.
- 🔐 **JWT Authentication** - Separate auth flows for voters and admins.
- 🔒 **Zero-Dependency Security** - Native Web Crypto API (PBKDF2) password hashing.
- 🚀 **Edge Caching** - Cloudflare Hyperdrive global connection pooling.
- 🛡️ **Edge Rate Limiting** - Cloudflare WAF integration blocking abuse before it hits the backend.
- 📊 **Live Results** - Real-time vote tallying with percentages.
- 📅 **Scheduled Voting** - Configurable start/end times with auto-activation.
- 📜 **Election History** - Automatic archival of past elections.
- 📱 **PWA Support** - Installable directly on mobile/desktop with offline asset caching.
- 🎨 **Modern UI** - Clean, responsive design with Chakra UI dark mode, Anime.js micro-animations, and a highly optimized custom dynamic glowing Aura background.

## 🏗️ Architecture

```
┌─────────────────┐     HTTPS/REST     ┌─────────────────┐
│                 │ ◄────────────────► │                 │
│  React (Vite)   │                    │  Bun + Elysia   │
│  Cloudflare     │   Eden Treaty      │  Cloudflare     │
│  Pages (PWA)    │   Type Safety      │  Workers (Edge) │
│                 │ ◄────────────────► │                 │
└─────────────────┘                    └────────┬────────┘
     Globally Hosted                            │
                                                │ Hyperdrive
                                                ▼
                                    ┌─────────────────────┐
                                    │ Neon Serverless DB  │
                                    │    (PostgreSQL)     │
                                    └─────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+ (used for both frontend and backend)
- Cloudflare Account with Hyperdrive enabled
- Neon.tech Serverless Postgres database

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/tec-voting-system.git
cd tec-voting-system
```

### 2. Start the Backend

```bash
cd backend

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your Neon Database URL and Hyperdrive configurations

# Initialize Database Schema
bun run db:push

# Start development server
bun run dev
```

Backend will be available at `http://localhost:3000`
API documentation at `http://localhost:3000/docs`

### 3. Start the Frontend

```bash
cd frontend

# Install dependencies
bun install

# Start development server
bun run dev
```

Frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
TECVotingWeb/
├── backend/                 # Bun + ElysiaJS Edge Server
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── db/             # Drizzle ORM schema
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business & validation logic
│   │   ├── types/          # Valibot schemas
│   │   ├── utils/          # Helper functions
│   │   └── index.ts        # Cloudflare Worker entry point
│   ├── wrangler.toml       # Cloudflare Workers configuration
│   ├── .env.example        # Environment template
│   └── README.md           # Backend documentation
│
├── frontend/               # React + Vite PWA
│   ├── src/
│   │   ├── pages/          # React page components
│   │   ├── utils/          # Passive fingerprinting telemetry
│   │   ├── api.ts          # Eden Treaty API Client
│   │   └── store.ts        # Jotai Atomic State
│   ├── public/             # PWA manifest and icons
│   └── README.md           # Frontend documentation
│
└── README.md               # This file
```

## 👥 User Roles

### Voters
- Login with NIM (9-digit student ID)
- View candidates
- Cast one vote during active voting period
- Invisible device fingerprinting ensures strict one-vote-per-device compliance

### Administrators
- Login with email/password
- Manage voters (add, delete, bulk import)
- Manage candidates (CRUD with photo upload)
- Configure voting schedule and title
- View live vote tally
- View election history
- Reset voting system

## 🚀 Production Deployment

### Backend (Cloudflare Workers)

1. Make sure to bind your database (Hyperdrive), KV, R2, and routes configurations.
2. Run deployment:
   ```bash
   cd backend
   bun run deploy
   ```
   *Note: If Wrangler warns that your local file differs from the dashboard configuration, check your local file to ensure you aren't accidentally replacing active production resource IDs with placeholders.*

### Frontend (Cloudflare Pages)

To compile the React bundle with your production backend API URL without committing it to git, pass the env variable inline to the build command:

* **Windows Command Prompt (CMD):**
  ```cmd
  cd frontend
  set VITE_API_URL=https://api.voting.yourdomain.com&& bun run build
  ```
* **macOS / Linux / Bash:**
  ```bash
  cd frontend
  VITE_API_URL="https://api.voting.yourdomain.com" bun run build
  ```

Then deploy the generated `dist` folder:
```bash
bunx wrangler pages deploy dist
```

## 🔒 Security Features

- **Advanced "Smart Logger" Telemetry**: Gathers 35+ extreme data points (Audio Hash, WebRTC, Font Arrays, AdBlock detection) without triggering a single browser permission prompt.
- **Progressive Captcha Verification**: Multi-tiered protection against automated login attacks.
- **Zero-Dependency Cryptography**: Passwords natively hashed using Web Crypto PBKDF2.
- **Cloudflare Rate Limiting**: Edge-level firewall drops abusive IPs globally.
- **CORS Protection**: Edge middleware strictly enforcing whitelisted origins.
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM.
- **Input Validation**: Tree-shakable Valibot schemas dropping malformed requests at the edge.

For detailed security documentation, see [SECURITY.md](./SECURITY.md)

## 📖 Additional Documentation

- [Backend README](./backend/README.md) - API endpoints, database schema, deployment
- [Frontend README](./frontend/README.md) - React state, PWA structure, telemetry logic
- [SECURITY.md](./SECURITY.md) - Core security architecture and threat models

## 📄 License

MIT License - feel free to use this project for your own voting systems.

---

**Migrated from**: Legacy Angular/PHP voting system
**Original Purpose**: Tarumanagara English Club elections
