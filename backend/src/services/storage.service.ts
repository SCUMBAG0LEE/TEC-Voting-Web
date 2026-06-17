/**
 * Storage Service
 * Utilizes Cloudflare Native R2 Bucket Bindings
 */

export interface Env {
  STORAGE_BUCKET: any; // R2Bucket type from @cloudflare/workers-types
}

/**
 * Uploads a file buffer directly to Cloudflare R2
 */
export async function uploadToR2(env: Env, key: string, buffer: ArrayBuffer, contentType: string): Promise<boolean> {
  if (!env || !env.STORAGE_BUCKET) {
    console.error('R2 Binding (STORAGE_BUCKET) is not available. Ensure wrangler.toml is configured.');
    return false;
  }

  try {
    await env.STORAGE_BUCKET.put(key, buffer, {
      httpMetadata: {
        contentType,
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to upload to R2:', error);
    return false;
  }
}

/**
 * Gets a file from Cloudflare R2
 */
export async function getFromR2(env: Env, key: string) {
  if (!env || !env.STORAGE_BUCKET) return null;
  
  try {
    const object = await env.STORAGE_BUCKET.get(key);
    return object;
  } catch (error) {
    console.error('Failed to get from R2:', error);
    return null;
  }
}

/**
 * Deletes a file from Cloudflare R2
 */
export async function deleteFromR2(env: Env, key: string): Promise<boolean> {
  if (!env || !env.STORAGE_BUCKET) return false;
  
  try {
    await env.STORAGE_BUCKET.delete(key);
    return true;
  } catch (error) {
    console.error('Failed to delete from R2:', error);
    return false;
  }
}
