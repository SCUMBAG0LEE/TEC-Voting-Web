# TEC Voting System - Backend API

A modern backend API for the Tarumanagara English Club Online Voting System, built with **Bun** and **ElysiaJS**.

## 🚀 Tech Stack

- **Runtime**: [Bun](https://bun.sh/) v1.0+ - Fast all-in-one JavaScript runtime
- **Framework**: [ElysiaJS](https://elysiajs.com/) v1.4 - Fast, type-safe web framework
- **Database**: MariaDB/MySQL via mysql2
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Rate limiting on auth endpoints
- **Documentation**: Swagger/OpenAPI at `/docs`
- **Language**: TypeScript with strict mode

## ✨ Features

- 🔐 **JWT Authentication** - Separate tokens for voters and admins
- 🔒 **Bcrypt Passwords** - Secure password hashing with auto-upgrade from plain text
- 🚦 **Rate Limiting** - Protection against brute force attacks (5 req/min on login)
- 🗳️ **Secure Voting** - Atomic transactions, double-vote prevention
- 👥 **Voter Management** - Add, delete, bulk import, pagination, search
- 👤 **Candidate Management** - CRUD with photo upload support
- 📊 **Live Vote Tallying** - Real-time results with percentages
- 📅 **Voting Schedule** - Configurable start/end times with auto-activation
- 📜 **Election History** - Auto-save results before reset
- 🔄 **System Reset** - Reset votes while preserving history
- 📖 **API Documentation** - Swagger UI at `/docs`

## 📋 Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- MariaDB or MySQL database
- Database schema (see `database.sql` in the old PHP version)

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run development server:**
   ```bash
   bun run dev
   ```

4. **Build for production:**
   ```bash
   bun run build
   ```

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `3306` |
| `DB_USER` | Database user | `root` |
| `DB_PASSWORD` | Database password | (empty) |
| `DB_NAME` | Database name | `voting` |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT expiration | `24h` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `CORS_ORIGIN` | Allowed CORS origin(s) | `http://localhost:4200` |

### CORS Configuration

The `CORS_ORIGIN` variable supports multiple formats:

```env
# Single origin
CORS_ORIGIN=http://localhost:4200

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:4200,https://voting.example.com,https://admin.example.com

# Allow all origins (not recommended for production)
CORS_ORIGIN=*
```

### Production Configuration

For production, ensure you set:
```env
NODE_ENV=production
JWT_SECRET=your-very-long-secure-random-secret-key-here
CORS_ORIGIN=https://your-frontend-domain.com
# Or multiple domains:
# CORS_ORIGIN=https://voting.example.com,https://admin.example.com
```

## 📚 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API info |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger documentation |
| GET | `/api/voter/status` | Get voting status |
| POST | `/api/voter/login` | Voter login (rate limited) |
| GET | `/api/candidates` | Get all candidates (public info) |

### Voter Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voter/me` | Get current voter info |
| GET | `/api/voter/candidates` | Get candidates for voting |
| POST | `/api/voter/vote` | Cast vote |
| POST | `/api/voter/logout` | Logout |

### Admin Endpoints (Admin JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login (rate limited) |
| GET | `/api/admin/me` | Get admin info |
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/voters` | Get all voters (paginated) |
| POST | `/api/admin/voters` | Add voter |
| POST | `/api/admin/voters/bulk` | Bulk add voters |
| DELETE | `/api/admin/voters/:nim` | Delete voter |
| GET | `/api/admin/voting/config` | Get voting config |
| PUT | `/api/admin/voting/schedule` | Update schedule |
| PUT | `/api/admin/voting/title` | Update title |
| GET | `/api/admin/tally` | Get live tally |
| POST | `/api/admin/reset` | Reset voting system |
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

### Upload Endpoints (Admin JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/candidate-photo` | Upload photo |
| DELETE | `/api/upload/candidate-photo/:filename` | Delete photo |

### Static Files

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/static/*` | Serve uploaded files |

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration
│   │   └── index.ts         # Environment config loader
│   ├── db/                  # Database
│   │   └── index.ts         # Connection pool & query helpers
│   ├── middleware/          # Middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── rate-limit.ts    # Rate limiting
│   │   └── index.ts
│   ├── routes/              # API routes
│   │   ├── voter.routes.ts
│   │   ├── admin.routes.ts
│   │   ├── candidate.routes.ts
│   │   ├── upload.routes.ts
│   │   └── index.ts
│   ├── services/            # Business logic
│   │   ├── voter.service.ts
│   │   ├── candidate.service.ts
│   │   ├── admin.service.ts
│   │   ├── voting.service.ts
│   │   ├── history.service.ts
│   │   └── index.ts
│   ├── types/               # TypeScript types
│   │   ├── index.ts         # Database models
│   │   └── schemas.ts       # Request validation schemas
│   ├── utils/               # Utilities
│   │   ├── auth-helpers.ts  # Shared auth functions
│   │   └── index.ts
│   └── index.ts             # Entry point
├── uploads/                 # Uploaded files (gitignored)
│   └── candidate_photos/
├── dist/                    # Build output (gitignored)
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Authentication

### JWT Token Usage

Include the token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

### Voter Authentication
1. POST `/api/voter/login` with `{ "nim": "123456789" }`
2. Receive JWT token
3. Token includes: `{ nim, hasVoted, type: "voter" }`

### Admin Authentication
1. POST `/api/admin/login` with `{ "email": "admin@tec.com", "password": "..." }`
2. Passwords are verified with bcrypt
3. Token includes: `{ id, name, email, type: "admin" }`

### Password Security
- Passwords are hashed with bcrypt (cost factor 10)
- Legacy plain-text passwords are auto-upgraded on successful login
- Rate limiting prevents brute force attacks

## 🚦 Rate Limiting

Authentication endpoints are rate-limited:
- **Limit**: 5 requests per minute per IP
- **Applies to**: `/api/voter/login`, `/api/admin/login`
- **Response**: 429 Too Many Requests

## 🔧 Development

```bash
# Run with hot reload
bun run dev

# Run tests
bun test

# Type check
bunx tsc --noEmit

# Build for production
bun run build
```

## 🚀 Production Deployment

1. **Build the application:**
   ```bash
   bun run build
   ```

2. **Set environment variables:**
   ```bash
   export NODE_ENV=production
   export JWT_SECRET=your-secure-secret
   export CORS_ORIGIN=https://your-frontend.com
   # Or multiple origins: export CORS_ORIGIN=https://app.example.com,https://admin.example.com
   ```

3. **Run with process manager (optional):**
   ```bash
   # Using PM2
   pm2 start dist/index.js --interpreter ~/.bun/bin/bun
   
   # Or directly
   bun run dist/index.js
   ```

4. **Reverse proxy (nginx example):**
   ```nginx
   server {
       listen 80;
       server_name api.voting.example.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🗄️ Database Schema

The API expects the following tables (from the original PHP version):

```sql
-- Voters table
CREATE TABLE voters (
  no INT AUTO_INCREMENT PRIMARY KEY,
  nim VARCHAR(9) UNIQUE NOT NULL,
  vote TINYINT DEFAULT 0
);

-- Candidates table
CREATE TABLE candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  nim VARCHAR(9) NOT NULL,
  major VARCHAR(255) NOT NULL,
  batch INT NOT NULL,
  photo VARCHAR(255),
  votes INT DEFAULT 0
);

-- Admin table
CREATE TABLE admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Voting configuration
CREATE TABLE voting (
  id INT PRIMARY KEY DEFAULT 1,
  voting_title VARCHAR(255),
  vot_start_date DATETIME,
  vot_end_date DATETIME,
  last_reset DATETIME
);

-- Election history
CREATE TABLE election_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
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
  start_date DATETIME,
  end_date DATETIME,
  candidates_data JSON,
  saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 📄 License

MIT

---

**See also**: [Frontend README](../frontend/README.md) for the Angular application.
