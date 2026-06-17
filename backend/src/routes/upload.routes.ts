/**
 * File Upload Routes
 * TEC Voting System - Backend
 * 
 * Handles file uploads for candidate photos
 */

import { Elysia, t } from 'elysia';
import { jwtPlugin } from '../middleware/auth';
import { getAdminFromRequest, requireAdmin } from '../utils';
import { uploadToR2, deleteFromR2, type Env } from '../services/storage.service';
import { cloudflareEnvContext } from '../utils/context';

// Generate unique filename
function generateFilename(originalName: string, nim: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  return `${nim}_${timestamp}.${ext}`;
}

export const uploadRoutes = new Elysia({ aot: false, prefix: '/upload' })
  .use(jwtPlugin)
  
  // Upload candidate photo
  .post('/candidate-photo', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    try {
      
      const file = body.file;
      const nim = body.nim;
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        set.status = 400;
        return {
          success: false,
          error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP',
        };
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        set.status = 400;
        return {
          success: false,
          error: 'File too large. Maximum size: 5MB',
        };
      }
      
      // Generate filename
      const filename = generateFilename(file.name, nim);
      const relativePath = `candidate_photos/${filename}`;
      const buffer = await file.arrayBuffer();

      // Cloudflare Edge Native implementation (No local FS)
      const workerEnv = cloudflareEnvContext.getStore() as Env;
      if (!workerEnv || !workerEnv.STORAGE_BUCKET) {
        throw new Error('R2 STORAGE_BUCKET is not configured or bound');
      }
      
      const uploaded = await uploadToR2(workerEnv, relativePath, buffer, file.type);
      if (!uploaded) throw new Error('R2 upload failed');
      
      return {
        success: true,
        message: 'File uploaded successfully',
        data: {
          filename,
          path: relativePath,
          url: `/static/${relativePath}`,
        },
      };
    } catch (error) {
      console.error('Upload error:', error);
      set.status = 500;
      return {
        success: false,
        error: 'Failed to upload file',
      };
    }
  }, {
    body: t.Object({
      file: t.File(),
      nim: t.String({ minLength: 9, maxLength: 9 }),
    }),
  })
  
  // Delete uploaded file
  .delete('/candidate-photo/:filename', async ({ params, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    try {
      // Security: Block path traversal attempts
      if (params.filename.includes('/') || params.filename.includes('\\') || params.filename.includes('..')) {
        set.status = 400;
        return {
          success: false,
          error: 'Invalid filename',
        };
      }
      
      const workerEnv = cloudflareEnvContext.getStore() as Env;
      if (!workerEnv || !workerEnv.STORAGE_BUCKET) {
        throw new Error('R2 STORAGE_BUCKET is not configured or bound');
      }
      
      const deleted = await deleteFromR2(workerEnv, `candidate_photos/${params.filename}`);
      if (!deleted) {
        set.status = 500;
        return {
          success: false,
          error: 'Failed to delete file from storage',
        };
      }
      
      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('Delete error:', error);
      set.status = 500;
      return {
        success: false,
        error: 'Failed to delete file',
      };
    }
  }, {
    params: t.Object({
      filename: t.String(),
    }),
  });
