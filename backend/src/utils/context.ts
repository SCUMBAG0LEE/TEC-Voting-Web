import { AsyncLocalStorage } from 'node:async_hooks';

// AsyncLocalStorage to hold Cloudflare raw environment bindings
export const cloudflareEnvContext = new AsyncLocalStorage<any>();
