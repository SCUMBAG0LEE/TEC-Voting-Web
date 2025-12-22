/**
 * File Upload Routes
 * TEC Voting System - Backend
 * 
 * Handles file uploads for candidate photos
 */

import { Elysia, t } from 'elysia';
import { jwtPlugin } from '../middleware/auth';
import { getAdminFromRequest, requireAdmin } from '../utils';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Upload directory
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'candidate_photos');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Generate unique filename
function generateFilename(originalName: string, nim: string): string {
  const ext = originalName.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  return `${nim}_${timestamp}.${ext}`;
}

export const uploadRoutes = new Elysia({ prefix: '/upload' })
  .use(jwtPlugin)
  
  // Upload candidate photo
  .post('/candidate-photo', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    try {
      await ensureUploadDir();
      
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
      
      // Generate filename and save
      const filename = generateFilename(file.name, nim);
      const filepath = join(UPLOAD_DIR, filename);
      
      const buffer = await file.arrayBuffer();
      await writeFile(filepath, Buffer.from(buffer));
      
      // Return relative path for storage in database
      const relativePath = `candidate_photos/${filename}`;
      
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
      
      const filepath = join(UPLOAD_DIR, params.filename);
      
      if (!existsSync(filepath)) {
        set.status = 404;
        return {
          success: false,
          error: 'File not found',
        };
      }
      
      await unlink(filepath);
      
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
