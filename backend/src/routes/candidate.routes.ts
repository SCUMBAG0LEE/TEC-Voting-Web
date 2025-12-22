/**
 * Candidate Routes
 * TEC Voting System - Backend
 * 
 * Handles candidate CRUD operations
 */

import { Elysia } from 'elysia';
import { jwtPlugin } from '../middleware/auth';
import { getAdminFromRequest, requireAdmin } from '../utils';
import { 
  candidateCreateSchema, 
  candidateUpdateSchema, 
  idParamSchema 
} from '../types/schemas';
import {
  getAllCandidates,
  getAllCandidatesPublic,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../services/candidate.service';

export const candidateRoutes = new Elysia({ prefix: '/candidates' })
  .use(jwtPlugin)
  
  // Public: Get all candidates (without vote counts)
  .get('/', async () => {
    const candidates = await getAllCandidatesPublic();
    return {
      success: true,
      data: candidates,
    };
  })
  
  // Public: Get single candidate
  .get('/:id', async ({ params, set }) => {
    const candidate = await getCandidateById(Number(params.id));
    
    if (!candidate) {
      set.status = 404;
      return {
        success: false,
        error: 'Candidate not found',
      };
    }
    
    // Return without votes for public
    const { votes, ...publicData } = candidate;
    return {
      success: true,
      data: publicData,
    };
  }, {
    params: idParamSchema,
  })
  
  // Admin: Get all candidates (with vote counts)
  .get('/admin/all', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const candidates = await getAllCandidates();
    return {
      success: true,
      data: candidates,
    };
  })
  
  // Admin: Create candidate
  .post('/', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const result = await createCandidate(body);
    
    if (!result.success) {
      set.status = 400;
      return {
        success: false,
        error: result.message,
      };
    }
    
    set.status = 201;
    return {
      success: true,
      message: result.message,
      data: { id: result.id },
    };
  }, {
    body: candidateCreateSchema,
  })
  
  // Admin: Update candidate
  .put('/:id', async ({ params, body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const result = await updateCandidate(Number(params.id), body);
    
    if (!result.success) {
      set.status = 400;
      return {
        success: false,
        error: result.message,
      };
    }
    
    return {
      success: true,
      message: result.message,
    };
  }, {
    params: idParamSchema,
    body: candidateUpdateSchema,
  })
  
  // Admin: Delete candidate
  .delete('/:id', async ({ params, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const deleted = await deleteCandidate(Number(params.id));
    
    if (!deleted) {
      set.status = 404;
      return {
        success: false,
        error: 'Candidate not found',
      };
    }
    
    return {
      success: true,
      message: 'Candidate deleted successfully',
    };
  }, {
    params: idParamSchema,
  });
