# TEC Online Voting System

A modern, full-stack electronic voting system for the Tarumanagara English Club, rebuilt from PHP to a modern JavaScript/TypeScript stack.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Frontend](https://img.shields.io/badge/frontend-Angular%2021-red.svg)
![Backend](https://img.shields.io/badge/backend-Bun%20%2B%20ElysiaJS-orange.svg)
![Database](https://img.shields.io/badge/database-MariaDB-blue.svg)

## ✨ Features

- 🗳️ **Secure Voting** - One vote per voter with atomic transactions
- 🔐 **JWT Authentication** - Separate auth flows for voters and admins
- 🔒 **Password Security** - Bcrypt hashing with auto-upgrade from legacy
- 🚦 **Rate Limiting** - Protection against brute force attacks
- 📊 **Live Results** - Real-time vote tallying with percentages
- 📅 **Scheduled Voting** - Configurable start/end times with auto-activation
- 📜 **Election History** - Automatic archival of past elections
- 📱 **PWA Support** - Installable on mobile/desktop with offline support
- 🎨 **Modern UI** - Clean, responsive design with dark gradient theme

## 🏗️ Architecture

```
┌─────────────────┐     HTTP/REST      ┌─────────────────┐
│                 │ ◄────────────────► │                 │
│  Angular 21     │                    │  Bun + Elysia   │
│  (Frontend)     │     JWT Auth       │  (Backend API)  │
│                 │ ◄────────────────► │                 │
└─────────────────┘                    └────────┬────────┘
     Port 4200                                  │
                                                │ mysql2
                                                ▼
                                    ┌─────────────────────┐
                                    │      MariaDB        │
                                    │     (Database)      │
                                    └─────────────────────┘
                                         Port 3306
```

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ (for Angular CLI)
- [Bun](https://bun.sh/) v1.0+ (for backend)
- MariaDB or MySQL database

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/tec-voting-system.git
cd tec-voting-system
```

### 2. Set up the database

```sql
-- Create database
CREATE DATABASE voting;

-- Import schema (from OldTECVotingWeb or use the SQL in backend README)
```

### 3. Start the Backend

```bash
cd backend

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
bun run dev
```

Backend will be available at `http://localhost:3000`
API documentation at `http://localhost:3000/docs`

### 4. Start the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at `http://localhost:4200`

## 📁 Project Structure

```
NewTECVotingWeb/
├── backend/                 # Bun + ElysiaJS API server
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── db/             # Database connection
│   │   ├── middleware/     # Auth & rate limiting
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript definitions
│   │   └── index.ts        # Entry point
│   ├── uploads/            # Uploaded files
│   ├── .env.example        # Environment template
│   └── README.md           # Backend documentation
│
├── frontend/               # Angular 21 PWA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Services, guards, interceptors
│   │   │   ├── features/   # Page components
│   │   │   └── shared/     # Reusable components
│   │   ├── environments/   # Environment configs
│   │   └── styles.scss     # Global styles
│   └── README.md           # Frontend documentation
│
└── README.md               # This file
```

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=voting

# JWT
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development

# CORS (supports multiple origins)
CORS_ORIGIN=http://localhost:4200
# Or: CORS_ORIGIN=http://localhost:4200,https://voting.example.com
```

### Frontend Environment

Edit `frontend/src/environments/environment.ts` for development:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  staticUrl: 'http://localhost:3000/static',
  appName: 'TEC Online Voting',
};
```

## 👥 User Roles

### Voters
- Login with NIM (9-digit student ID)
- View candidates
- Cast one vote during active voting period
- See confirmation after voting

### Administrators
- Login with email/password
- Manage voters (add, delete, bulk import)
- Manage candidates (CRUD with photo upload)
- Configure voting schedule and title
- View live vote tally
- View election history
- Reset voting system

## 📚 API Documentation

Interactive API documentation is available at `http://localhost:3000/docs` when the backend is running.

Key endpoints:

| Endpoint | Description |
|----------|-------------|
| `POST /api/voter/login` | Voter authentication |
| `POST /api/admin/login` | Admin authentication |
| `GET /api/candidates` | Get all candidates |
| `POST /api/voter/vote` | Cast a vote |
| `GET /api/admin/dashboard` | Admin dashboard stats |
| `GET /api/admin/tally` | Live vote count |

See [Backend README](./backend/README.md) for complete API documentation.

## 🚀 Production Deployment

### Backend

```bash
cd backend

# Build
bun run build

# Set production environment
export NODE_ENV=production
export JWT_SECRET=your-very-secure-production-secret
export CORS_ORIGIN=https://your-frontend-domain.com

# Run
bun run dist/index.js
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# Output in dist/frontend/browser/
# Serve with nginx, Apache, or any static file server
```

### Nginx Example

```nginx
server {
    listen 80;
    server_name voting.example.com;

    # Frontend
    location / {
        root /var/www/frontend/dist/frontend/browser;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files proxy
    location /static {
        proxy_pass http://localhost:3000;
    }
}
```

## 🔒 Security Features

- **JWT Authentication** with configurable expiration
- **Bcrypt Password Hashing** (cost factor 10)
- **Rate Limiting** on auth endpoints (5 req/min)
- **CORS Protection** with configurable origins
- **Path Traversal Prevention** on file uploads
- **SQL Injection Prevention** via parameterized queries

## 📖 Additional Documentation

- [Backend README](./backend/README.md) - API endpoints, database schema, deployment
- [Frontend README](./frontend/README.md) - Components, routing, environment config

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 21, TypeScript, SCSS |
| Backend | Bun, ElysiaJS, TypeScript |
| Database | MariaDB / MySQL |
| Auth | JWT (jsonwebtoken) |
| Password | bcrypt |
| API Docs | Swagger / OpenAPI |

## 📄 License

MIT License - feel free to use this project for your own voting systems.

---

**Migrated from**: Legacy PHP voting system  
**Original Purpose**: Tarumanagara English Club elections
