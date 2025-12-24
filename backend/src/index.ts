/**
 * TEC Online Voting System - Backend API
 * Built with Bun + ElysiaJS
 * 
 * Main entry point
 */

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { join } from 'path';
import { existsSync } from 'fs';

import { config } from './config';
import { testConnection } from './db';
import { voterRoutes, adminRoutes, candidateRoutes, uploadRoutes } from './routes';

// Create main Elysia app
const app = new Elysia({
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
  
  // Swagger documentation
  .use(swagger({
    documentation: {
      info: {
        title: 'TEC Online Voting API',
        version: '1.0.0',
        description: 'API documentation for Tarumanagara English Club Online Voting System',
      },
      tags: [
        { name: 'Voter', description: 'Voter authentication and voting endpoints' },
        { name: 'Admin', description: 'Admin authentication and management endpoints' },
        { name: 'Candidates', description: 'Candidate management endpoints' },
        { name: 'Upload', description: 'File upload endpoints' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    path: '/docs',
    exclude: ['/docs', '/docs/json'],
  }))
  
  // Manual static file serving for uploaded photos
  .get('/static/*', async ({ params }) => {
    const requestedPath = (params as { '*': string })['*'];
    // Decode URL-encoded path (spaces, special chars)
    const decodedPath = decodeURIComponent(requestedPath);
    
    // Security: Block path traversal attempts
    if (decodedPath.includes('..') || decodedPath.includes('\\..')) {
      return new Response('Forbidden', { status: 403 });
    }
    
    // Use import.meta.dir for reliable path resolution in Bun
    const uploadsDir = join(import.meta.dir, '..', 'uploads');
    const filePath = join(uploadsDir, decodedPath);
    
    // Security: Verify resolved path is within uploads directory
    const normalizedUploadsDir = uploadsDir.replace(/\\/g, '/');
    const normalizedFilePath = filePath.replace(/\\/g, '/');
    if (!normalizedFilePath.startsWith(normalizedUploadsDir)) {
      return new Response('Forbidden', { status: 403 });
    }
    
    if (!existsSync(filePath)) {
      return new Response('File not found', { status: 404 });
    }
    
    const file = Bun.file(filePath);
    return new Response(file);
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
    const dbConnected = await testConnection();
    return {
      status: dbConnected ? 'healthy' : 'unhealthy',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  })
  
  // API routes
  .group('/api', (app) => 
    app
      .use(voterRoutes)
      .use(adminRoutes)
      .use(candidateRoutes)
      .use(uploadRoutes)
  )
  
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

const displayHost = config.server.host === '0.0.0.0' ? 'localhost' : config.server.host;
console.log(`
🗳️  TEC Online Voting API

   Server:      http://${displayHost}:${config.server.port}
   Swagger:     http://${displayHost}:${config.server.port}/docs
   Host:        ${config.server.host} ${config.server.host === '0.0.0.0' ? '(all interfaces)' : '(local only)'}
   Environment: ${config.server.env}
`);

// Test database connection on startup (non-blocking)
(async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.log('⚠️  Server running without database connection - API calls requiring DB will fail');
    }
  } catch (e) {
    console.log('⚠️  Server running without database connection - API calls requiring DB will fail');
  }
})();

export type App = typeof app;
export default app;
