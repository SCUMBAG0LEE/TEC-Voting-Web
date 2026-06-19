# TEC Voting System - Backend

A bleeding-edge Cloudflare Serverless backend API for the Tarumanagara English Club Online Voting System, built with **Cloudflare Workers**, **ElysiaJS**, and **Drizzle ORM**.

## 🚀 The Architecture

- **Edge Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) - 0ms cold starts, globally distributed
- **Framework**: [ElysiaJS](https://elysiajs.com/) v1.4 - Fast, type-safe web framework built for the Edge
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/) powered by Cloudflare Hyperdrive
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - Type-safe, high-performance database toolkit
- **Validation**: [Valibot](https://valibot.dev/) - Highly tree-shakable schema validation (tiny edge bundle)
- **Cryptography**: Native Web Crypto API (`crypto.subtle`) - PBKDF2 for zero-dependency passwords
- **Fingerprinting**: 3-Layer Device tracking combining Cloudflare `request.cf` parameters, extreme frontend hardware hashing, and DB unique constraints.
- **Language**: TypeScript with strict mode

## ✨ Features

- ⚡ **Hyperdrive Edge Caching** - Neon Postgres queries are automatically pooled and cached globally at Cloudflare's edge
- 🔐 **JWT Authentication** - Separate tokens for voters and admins
- 🔒 **PBKDF2 Passwords** - Secure password hashing using native V8 Web Crypto API
- 🛡️ **Edge Security & Rate Limiting** - Cloudflare Native KV for 0ms DDoS and brute-force protection
- 🤖 **Captcha Fallback System** - Multi-provider Captcha (Google reCAPTCHA, hCaptcha, Cloudflare Turnstile) support
- 🗳️ **Secure Voting** - Atomic Drizzle transactions with double-vote prevention
- 💻 **Server-Side Fingerprinting** - Uses `cf-connecting-ip`, ASN, and TLS ciphers acting as the absolute source of truth to detect split-tunnel VPNs.
- 👥 **Voter Management** - Add, delete, bulk import, pagination, search
- 👤 **Candidate Management** - CRUD with photo upload support
- 📊 **Live Vote Tallying** - Real-time results with percentages
- 📅 **Voting Schedule** - Configurable start/end times with auto-activation
- 📜 **Election History** - Auto-save results before reset

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) >= 18 (Required by Cloudflare's Wrangler CLI tool)
- [Bun](https://bun.sh/) >= 1.0 (for local development and testing)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare Account with Hyperdrive enabled
- Neon.tech Serverless Postgres database

## 🧠 Bun vs Cloudflare Workers (How It Works)

You can absolutely use **Bun** for your local development! However, to understand how this works, we need to clear up a massive misconception about what Cloudflare actually uses in production.

### What Cloudflare uses in Production (Not Node, Not Bun)
When you deploy your app to Cloudflare, it **does not run on Node.js, and it does not run on Bun**. 

Cloudflare Workers run on a completely custom, open-source engine called **workerd**. This is a highly stripped-down, ultra-fast V8 engine (the exact same JavaScript engine that powers Google Chrome). It is specifically designed to spin up in milliseconds and strictly uses standard Web APIs (like `fetch`, `Request`, and `Response`).

This is precisely why your ElysiaJS backend is so easy to migrate! Elysia is built on those exact same standard Web APIs, meaning it feels completely at home inside Cloudflare's V8 engine.

### Using Bun for Development
Even though your code runs on `workerd` in production, you still need a tool on your local machine to install packages, compile the code, and push it to Cloudflare. You can use **Bun** for all of this!

Cloudflare's developer CLI is called **Wrangler**. Wrangler officially supports Bun as a package manager.

Here is exactly how your local development commands will look:

- **Install dependencies:** `bun install`
- **Run local test server:** `bun run dev` *(This triggers Wrangler to spin up a local emulator of the Cloudflare network!)*
- **Push to production:** `bun run deploy` *(This triggers Wrangler to push your code globally to Cloudflare's edge)*

## 🛠️ Installation & Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure Cloudflare Hyperdrive:**
   - Create a Hyperdrive config in your Cloudflare Dashboard pointing to your Neon connection string.
   - Edit `wrangler.toml` and paste your Hyperdrive ID.

3. **Configure local environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your local or remote DB connection strings
   ```

4. **Initialize Drizzle Schema:**
   ```bash
   bun run db:push
   ```

5. **Run development server:**
   ```bash
   bun run dev
   ```

6. **Deploy to Cloudflare:**
   ```bash
   bun run deploy
   ```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/         # Environment variables and configuration logic
│   ├── db/             # Drizzle ORM setup & schema definitions
│   ├── middleware/     # ElysiaJS auth guards
│   ├── routes/         # API endpoint definitions (admin, voter, etc.)
│   ├── services/       # Core business logic (voting, history, cache, etc.)
│   ├── types/          # Shared TypeScript interfaces & Valibot schemas
│   ├── utils/          # Helper functions
│   └── index.ts        # Cloudflare Worker & Bun entry point
├── drizzle.config.ts   # Drizzle configuration
├── wrangler.toml       # Cloudflare Workers config & Hyperdrive bindings
├── .env.example        # Environment variable template
└── package.json        # Dependencies and scripts
```

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Neon Postgres URL | (required) |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT expiration | `24h` |
| `HOST` | Server host/interface | `localhost` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed CORS origin(s) | `http://localhost:5173` |


### CORS Configuration

The `CORS_ORIGIN` variable supports multiple formats:

```env
# Single origin
CORS_ORIGIN=http://localhost:5173

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:5173,https://voting.example.com,https://admin.example.com

# Allow all origins (not recommended for production)
CORS_ORIGIN=*
```

### Production Configuration

For Cloudflare Workers production deployment, use `wrangler secret put`:
```bash
wrangler secret put JWT_SECRET
wrangler secret put CORS_ORIGIN

```

## 📚 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger documentation |
| GET | `/api/voter/status` | Get voting status |
| POST | `/api/voter/login` | Voter login |
| GET | `/api/candidates` | Get all candidates (public info) |

### Voter Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voter/me` | Get current voter info |
| GET | `/api/voter/candidates` | Get candidates for voting |
| POST | `/api/voter/vote` | Cast vote |
| GET | `/api/voter/results` | Get live/final results (if allowed) |
| POST | `/api/voter/logout` | Logout |

### Admin Endpoints (Admin JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/me` | Get admin info |
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/voters` | Get all voters (paginated) |
| POST | `/api/admin/voters` | Add voter |
| POST | `/api/admin/voters/bulk` | Bulk add voters |
| DELETE | `/api/admin/voters/:nim` | Delete voter |
| GET | `/api/admin/voting/config` | Get voting config |
| PUT | `/api/admin/voting/schedule` | Update schedule |
| PUT | `/api/admin/voting/title` | Update title |
| PUT | `/api/admin/voting/live-score` | Toggle live score visibility |
| GET | `/api/admin/tally` | Get live tally |
| POST | `/api/admin/reset` | Reset voting system |
| POST | `/api/admin/system/backup` | Download JSON system backup |
| POST | `/api/admin/system/restore` | Restore system from JSON |
| GET | `/api/admin/history` | Get election history |

### Candidate Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candidates` | Get all (public) |
| GET | `/api/candidates/:id` | Get one (public) |
| GET | `/api/candidates/admin/all` | Get all with votes (admin) |
| POST | `/api/candidates` | Create (admin) |
| PUT | `/api/candidates/:id` | Update (admin) |
| DELETE | `/api/candidates/:id` | Delete (admin) |

## 🚀 Production Deployment

1. **Verify Types & Build:**
   ```bash
   bun run build:local
   ```

2. **Deploy to Cloudflare:**
   ```bash
   bun run deploy
   ```

## 🗄️ Database Schema

The API expects the following Postgres tables:

```sql
-- Voters table
CREATE TABLE voters (
  no SERIAL PRIMARY KEY,
  nim VARCHAR(9) UNIQUE NOT NULL,
  vote BOOLEAN DEFAULT FALSE
);

-- Candidates table
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nim VARCHAR(9) NOT NULL,
  major VARCHAR(255) NOT NULL,
  batch INT NOT NULL,
  photo VARCHAR(255),
  votes INT DEFAULT 0
);

-- Admin table
CREATE TABLE admin (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Voting configuration
CREATE TABLE voting (
  id INT PRIMARY KEY DEFAULT 1,
  voting_title VARCHAR(255),
  vot_start_date TIMESTAMP,
  vot_end_date TIMESTAMP,
  last_reset TIMESTAMP
);

-- Election history
CREATE TABLE election_history (
  id SERIAL PRIMARY KEY,
  election_title VARCHAR(255),
  winner_name VARCHAR(255),
  winner_nim VARCHAR(9),
  winner_major VARCHAR(255),
  winner_batch INT,
  winner_votes INT,
  winner_photo VARCHAR(255),
  total_votes INT,
  total_voters INT,
  voters_participated INT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  candidates_data JSON,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device Fingerprints table (prevents multi-voting)
CREATE TABLE device_votes (
  id SERIAL PRIMARY KEY,
  fingerprint VARCHAR(64) NOT NULL UNIQUE,
  user_agent TEXT,
  platform VARCHAR(64),
  language VARCHAR(16),
  languages VARCHAR(255),
  screen_resolution VARCHAR(20),
  color_depth INT,
  device_pixel_ratio FLOAT,
  timezone VARCHAR(64),
  hardware_concurrency INT,
  device_memory FLOAT,
  max_touch_points INT,
  webgl_renderer VARCHAR(255),
  webgl_vendor VARCHAR(255),
  ip_address VARCHAR(45),
  device_data JSON,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_fingerprint ON device_votes(fingerprint);
```

## 📄 License

MIT

---

**See also**: [Frontend README](../frontend/README.md) for the React application.
