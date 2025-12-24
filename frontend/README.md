# TEC Voting System - Frontend

A modern Progressive Web Application (PWA) for electronic voting, built with **Angular 21**. This frontend provides interfaces for both voters and administrators.

## 🚀 Tech Stack

- **Framework**: Angular 21 (Standalone Components)
- **Styling**: SCSS with CSS Variables
- **PWA**: Service Worker enabled for offline support
- **HTTP Client**: Angular HttpClient with JWT interceptor
- **State Management**: Angular Signals (reactive primitives)
- **Build Tool**: esbuild (via Angular CLI)

## ✨ Features

### Voter Features
- 🔐 **Simple Login** - Login with NIM (Student ID) only
- 👀 **View Candidates** - Browse all candidates with photos and details
- 🗳️ **Cast Vote** - Select and confirm vote with validation
- ✅ **Vote Status** - Check if already voted

### Admin Features
- 📊 **Dashboard** - Overview with statistics, voting status, and live tally
- 👥 **Voter Management** - Pagination, search, add/bulk add/delete voters
- 👤 **Candidate Management** - CRUD with photo upload
- ⚙️ **Voting Configuration** - Set title, start/end dates
- 📜 **Election History** - View past election results
- 🔄 **System Reset** - Reset voting with history preservation

## 📋 Prerequisites

- **Node.js**: v20+ (recommended: v22+)
- **npm**: v10+
- **Backend API**: Running on `http://localhost:3000`

## 🛠️ Installation

```bash
cd frontend
npm install
```

## 🚀 Development

```bash
# Start development server
npm start

# Navigate to http://localhost:4200
# App auto-reloads on file changes
```

## 📦 Production Build

### Deploy at Root Path

If deploying at the root of your domain (e.g., `https://example.com/`):

```bash
npm run build:prod
```

### Deploy at Subpath

If deploying to a subpath (e.g., `https://example.com/voting/`):

```bash
npm run build:subpath
```

This builds with `baseHref="/voting/"` configured. Update `/voting/` in `angular.json` under `production:subpath` configuration if your path differs.

### Custom Subpath

For a custom subpath:

```bash
ng build --configuration production --base-href /your-path/
```

Build artifacts are stored in `dist/frontend/browser/`.

## ⚙️ Configuration

### Changing the API URL

The API URL is configured in environment files:

| Environment | File | Default API URL |
|-------------|------|-----------------|
| Development | `src/environments/environment.ts` | `http://localhost:3000/api` |
| Production | `src/environments/environment.prod.ts` | `/api` (relative) |

#### For Development

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',  // Change this
  staticUrl: 'http://localhost:3000/static',
  appName: 'TEC Online Voting',
};
```

#### For Production

Update `src/environments/environment.prod.ts` with your backend URL:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com/api',  // Your backend API URL
  staticUrl: 'https://api.example.com/static',
  appName: 'TEC Online Voting',
};
```

### Nginx Deployment

#### Option 1: Deploy at Root Domain

```nginx
server {
    listen 80;
    server_name voting.example.com;

    # Serve Angular app
    location / {
        root /var/www/TEC-Voting-Web/dist/frontend/browser;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
}
```

Build command: `npm run build:prod`

#### Option 2: Deploy at Subpath

```nginx
server {
    listen 80;
    server_name example.com;

    # Serve Angular app at /voting
    location /voting {
        alias /var/www/TEC-Voting-Web/dist/frontend/browser;
        try_files $uri $uri/ /voting/index.html;
        index index.html;
    }
}
```

Build command: `npm run build:subpath`

#### Option 3: Frontend and Backend on Same Server

```nginx
server {
    listen 80;
    server_name voting.example.com;

    # Serve Angular app
    location / {
        root /var/www/TEC-Voting-Web/dist/frontend/browser;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy static files to backend
    location /static {
        proxy_pass http://localhost:3000;
    }
}
```

#### For Different Backend Server

If your backend is on a different server in production, edit `environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.voting.example.com/api',  // Full URL
  staticUrl: 'https://api.voting.example.com/static',
  appName: 'TEC Online Voting',
};
```

Then rebuild: `npm run build`

### Why Not .env Files?

Angular doesn't natively support `.env` files like Node.js does. The `environment.ts` approach is the standard Angular pattern because:

1. **Build-time optimization** - Unused environment code is tree-shaken
2. **Type safety** - TypeScript checks environment properties
3. **No runtime overhead** - Values are inlined during build

If you need runtime configuration (change URL without rebuild), you'd need to:
1. Fetch config from a JSON file on app init
2. Or use a custom webpack configuration with environment variable injection

For most use cases, the current approach is simpler and recommended.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── core/                    # Core module
│   │   ├── constants/           # App constants
│   │   ├── guards/              # Route guards (auth, admin, voter)
│   │   ├── interceptors/        # HTTP interceptors (auth token)
│   │   ├── models/              # TypeScript interfaces
│   │   └── services/            # API and Auth services
│   ├── features/                # Feature modules
│   │   ├── admin/               # Admin pages
│   │   │   ├── candidates/      # Candidate management
│   │   │   ├── config/          # Voting configuration
│   │   │   ├── dashboard/       # Admin dashboard
│   │   │   ├── history/         # Election history
│   │   │   ├── layout/          # Admin layout wrapper
│   │   │   ├── login/           # Admin login
│   │   │   └── voters/          # Voter management
│   │   ├── home/                # Landing page
│   │   └── voter/               # Voter pages
│   │       ├── layout/          # Voter layout wrapper
│   │       ├── login/           # Voter login
│   │       ├── voted/           # Vote confirmation
│   │       └── voting/          # Voting interface
│   └── shared/                  # Shared module
│       ├── components/          # Reusable UI components
│       └── services/            # Shared utilities
├── environments/                # Environment configs
└── styles.scss                  # Global styles
```

## 🔐 Authentication

### Voter Flow
1. Enter NIM (9-digit student ID)
2. Backend validates NIM exists
3. JWT token stored in localStorage
4. Redirected to voting page

### Admin Flow
1. Enter email and password
2. Backend validates credentials (bcrypt)
3. JWT token stored in localStorage
4. Redirected to admin dashboard

## 🎨 Theming

CSS custom properties in `styles.scss`:

```scss
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #48bb78;
  --danger-color: #f56565;
  --warning-color: #ed8936;
}
```

## 📱 PWA Support

The app is a Progressive Web App:
- **Installable** on desktop/mobile
- **Offline support** via Service Worker (production only)
- **Custom icons** and theme colors

Test PWA locally:
```bash
npm run build
npx http-server dist/frontend/browser -p 8080
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Ensure backend has CORS enabled for `http://localhost:4200` |
| Login fails | Voters: NIM must be 9 digits and exist in DB |
| API connection failed | Check backend is running: `curl http://localhost:3000/health` |
| PWA not working | Service worker only works in production build |

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server at port 4200 |
| `npm run build` | Production build |
| `npm run watch` | Build in watch mode |
| `npm test` | Run unit tests |

## 📄 License

MIT

---

**See also**: [Backend README](../backend/README.md) for API documentation.
