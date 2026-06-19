/**
 * TEC Online Voting System - Backend API
 * Built with Bun + ElysiaJS
 * 
 * Main entry point
 */

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { config } from './config';
import { getDb, dbContext } from './db/index';
import { testConnection } from './db/index';
import { cloudflareEnvContext } from './utils/context';
import { getFromR2 } from './services/storage.service';
import { voterRoutes, adminRoutes, candidateRoutes, uploadRoutes } from './routes';
import process from 'node:process';


// Create main Elysia app
const app = new Elysia({
  aot: false, // Strictly required for Cloudflare Workers (disables dynamic eval)
  serve: {
    hostname: config.server.host, // Can be 'localhost' or '0.0.0.0' for all interfaces
    port: config.server.port,
  },
})
  // CORS configuration
  .use(cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }))
  
  // Manual static file serving for uploaded photos
  .get('/static/*', async ({ params }) => {
    const requestedPath = (params as { '*': string })['*'];
    const decodedPath = decodeURIComponent(requestedPath);
    
    // Security: Block path traversal attempts
    if (decodedPath.includes('..') || decodedPath.includes('\\..')) {
      return new Response('Forbidden', { status: 403 });
    }
    
    // Auto-prefix with candidate_photos/ if it's just a filename
    const r2Key = decodedPath.includes('/') ? decodedPath : `candidate_photos/${decodedPath}`;
    
    const workerEnv = cloudflareEnvContext.getStore() as any;
    const object = await getFromR2(workerEnv, r2Key);
    if (!object) {
      return new Response('File not found', { status: 404 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, { headers });
  })
  
  // DEBUG ROUTE: List R2 bucket contents
  .get('/debug-r2', async () => {
    const workerEnv = cloudflareEnvContext.getStore() as any;
    if (!workerEnv || !workerEnv.STORAGE_BUCKET) {
      return { success: false, error: 'No R2 bucket bound' };
    }
    const list = await workerEnv.STORAGE_BUCKET.list();
    return { success: true, files: list.objects.map((o: any) => o.key) };
  })
  
  // Health check endpoint
  .get('/', () => ({
    name: 'TEC Online Voting API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  }))
  
  // Health check with DB status
  .get('/health', async () => {
    // In ALS context, we can just pass an empty string or the fallback URL because getDbProxy handles it
    const connectionString = process.env.NEON_DB_URL || process.env.DATABASE_URL || config.db.url || `postgres://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`;
    const dbConnected = await testConnection(connectionString);
    return {
      status: dbConnected ? 'healthy' : 'unhealthy',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  })
  
  // API routes
  .use(voterRoutes)
  .use(adminRoutes)
  .use(candidateRoutes)
  .use(uploadRoutes)
  
  // Global error handler
  .onError(({ code, error, set }) => {
    console.error(`Error [${code}]:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        success: false,
        error: 'Validation error',
        details: errorMessage,
      };
    }
    
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        success: false,
        error: 'Not found',
      };
    }
    
    set.status = 500;
    return {
      success: false,
      error: config.server.env === 'development' 
        ? errorMessage 
        : 'Internal server error',
    };
  });

// Only start Bun's HTTP server if running natively via Bun CLI
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    app.listen(config.server.port);
    const displayHost = config.server.host === '0.0.0.0' ? 'localhost' : config.server.host;
    console.log(`
🗳️  TEC Online Voting API

   Server:      http://${displayHost}:${config.server.port}
   Swagger:     http://${displayHost}:${config.server.port}/docs
   Host:        ${config.server.host} ${config.server.host === '0.0.0.0' ? '(all interfaces)' : '(local only)'}
   Environment: ${config.server.env}
`);
  } catch (e) {
    // Expected to fail in Cloudflare Worker environment
  }
}





export type App = typeof app;

// In Cloudflare Workers, bindings are passed to the fetch handler.
// We intercept the fetch call to inject bindings into process.env 
// so all our lazy getters and database proxies can read them.
// We also extract Hyperdrive connection string and inject it into AsyncLocalStorage.
export default {
  fetch(request: Request, env: any, _ctx: any) {
    if (env) {
      // Polyfill process.env for Node.js compatibility across the app
      Object.assign(process.env, env);
    }
    
    // Determine the connection string (Hyperdrive priority, then direct env vars)
    const connectionString = env?.HYPERDRIVE?.connectionString || env?.NEON_DB_URL || env?.DATABASE_URL || config.db.url || `postgres://${config.db.user}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`;
    
    // Get the per-request database connection
    const { sql, db: dbInstance } = getDb(connectionString);
    
    // Run the request inside the AsyncLocalStorage context
    return cloudflareEnvContext.run(env, () => {
      return dbContext.run(dbInstance, async () => {
        try {
          return await app.fetch(request);
        } finally {
          // Clean up connection after request ends to prevent memory/socket leaks
          await sql.end();
        }
      });
    });
  }
};
