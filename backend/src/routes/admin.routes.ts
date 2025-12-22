/**
 * Admin Routes
 * TEC Voting System - Backend
 * 
 * Handles admin authentication and management
 */

import { Elysia, t } from 'elysia';
import { jwtPlugin, generateAdminToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limit';
import { getAdminFromRequest, requireAdmin } from '../utils';
import { 
  adminLoginSchema, 
  votingScheduleSchema, 
  votingTitleSchema,
  addVoterSchema,
  bulkAddVotersSchema,
  idParamSchema,
  nimParamSchema,
  paginationSchema,
} from '../types/schemas';
import { verifyAdminCredentials, getDashboardStats } from '../services/admin.service';
import { 
  getVotersPaginated, 
  addVoter, 
  addVotersBulk, 
  deleteVoter, 
  resetAllVoters,
  getTotalVoters,
  getVotedCount,
} from '../services/voter.service';
import { 
  getVotingConfig, 
  updateVotingSchedule, 
  updateVotingTitle,
  getVotingStatus,
} from '../services/voting.service';
import { getVoteTally, resetAllVotes } from '../services/candidate.service';
import { 
  saveElectionToHistory, 
  resetVotingSystem,
  getAllElectionHistory,
  deleteElectionHistory,
} from '../services/history.service';

export const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(jwtPlugin)
  
  // Public: Admin login (rate limited)
  .use(authRateLimiter)
  .post('/login', async ({ body, jwt, set }) => {
    const { email, password } = body;
    
    const admin = await verifyAdminCredentials(email, password);
    if (!admin) {
      set.status = 401;
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }
    
    const token = await generateAdminToken(jwt, {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });
    
    return {
      success: true,
      data: {
        token,
        admin,
      },
    };
  }, {
    body: adminLoginSchema,
  })
  
  // Get admin info
  .get('/me', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    return {
      success: true,
      data: admin,
    };
  })
  
  // Dashboard statistics
  .get('/dashboard', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const [stats, votingStatus, tally] = await Promise.all([
      getDashboardStats(),
      getVotingStatus(),
      getVoteTally(),
    ]);
    
    return {
      success: true,
      data: {
        stats,
        votingStatus,
        tally,
      },
    };
  })
  
  // =====================================================
  // VOTER MANAGEMENT
  // =====================================================
  
  // Get all voters (paginated)
  .get('/voters', async ({ query, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const search = query.search as string | undefined;
    
    const result = await getVotersPaginated(page, limit, search);
    const votedCount = await getVotedCount();
    
    return {
      success: true,
      data: {
        voters: result.voters,
        pagination: {
          page: result.page,
          limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        stats: {
          total: result.total,
          voted: votedCount,
          notVoted: result.total - votedCount,
        },
      },
    };
  }, {
    query: t.Object({
      page: t.Optional(t.String()),
      limit: t.Optional(t.String()),
      search: t.Optional(t.String()),
    }),
  })
  
  // Add single voter
  .post('/voters', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const result = await addVoter(body.nim);
    
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
    body: addVoterSchema,
  })
  
  // Add multiple voters
  .post('/voters/bulk', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const result = await addVotersBulk(body.nims);
    
    return {
      success: true,
      message: `Added ${result.added} voters, skipped ${result.skipped} duplicates`,
      data: result,
    };
  }, {
    body: bulkAddVotersSchema,
  })
  
  // Delete voter
  .delete('/voters/:nim', async ({ params, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const deleted = await deleteVoter(params.nim);
    
    if (!deleted) {
      set.status = 404;
      return {
        success: false,
        error: 'Voter not found',
      };
    }
    
    return {
      success: true,
      message: 'Voter deleted successfully',
    };
  }, {
    params: nimParamSchema,
  })
  
  // =====================================================
  // VOTING CONFIGURATION
  // =====================================================
  
  // Get voting configuration
  .get('/voting/config', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const config = await getVotingConfig();
    const status = await getVotingStatus();
    
    return {
      success: true,
      data: {
        config,
        status,
      },
    };
  })
  
  // Update voting schedule
  .put('/voting/schedule', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const startDate = new Date(body.vot_start_date);
    const endDate = new Date(body.vot_end_date);
    
    if (endDate <= startDate) {
      set.status = 400;
      return {
        success: false,
        error: 'End date must be after start date',
      };
    }
    
    const updated = await updateVotingSchedule(body.vot_start_date, body.vot_end_date);
    
    if (!updated) {
      set.status = 500;
      return {
        success: false,
        error: 'Failed to update schedule',
      };
    }
    
    // Update title if provided
    if (body.voting_title) {
      await updateVotingTitle(body.voting_title);
    }
    
    return {
      success: true,
      message: 'Voting schedule updated successfully',
    };
  }, {
    body: votingScheduleSchema,
  })
  
  // Update voting title only
  .put('/voting/title', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const updated = await updateVotingTitle(body.voting_title);
    
    if (!updated) {
      set.status = 500;
      return {
        success: false,
        error: 'Failed to update title',
      };
    }
    
    return {
      success: true,
      message: 'Voting title updated successfully',
    };
  }, {
    body: votingTitleSchema,
  })
  
  // =====================================================
  // ELECTION RESULTS
  // =====================================================
  
  // Get live vote tally
  .get('/tally', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const tally = await getVoteTally();
    const totalVotes = tally.reduce((sum, c) => sum + c.votes, 0);
    
    return {
      success: true,
      data: {
        candidates: tally,
        totalVotes,
      },
    };
  })
  
  // =====================================================
  // RESET OPERATIONS
  // =====================================================
  
  // Reset voting system (save history first)
  .post('/reset', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const saveHistory = body?.saveHistory !== false; // Default true
    const result = await resetVotingSystem(saveHistory);
    
    return {
      success: result.success,
      message: result.message,
    };
  }, {
    body: t.Optional(t.Object({
      saveHistory: t.Optional(t.Boolean()),
    })),
  })
  
  // Reset only voters (clear vote status)
  .post('/reset/voters', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const count = await resetAllVoters();
    
    return {
      success: true,
      message: `Reset vote status for ${count} voters`,
    };
  })
  
  // Reset only candidate votes
  .post('/reset/votes', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const count = await resetAllVotes();
    
    return {
      success: true,
      message: `Reset votes for ${count} candidates`,
    };
  })
  
  // =====================================================
  // ELECTION HISTORY
  // =====================================================
  
  // Get all election history
  .get('/history', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const history = await getAllElectionHistory();
    
    return {
      success: true,
      data: history,
    };
  })
  
  // Save current election to history manually
  .post('/history/save', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const result = await saveElectionToHistory();
    
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
      data: { id: result.id },
    };
  })
  
  // Delete election history record
  .delete('/history/:id', async ({ params, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const deleted = await deleteElectionHistory(Number(params.id));
    
    if (!deleted) {
      set.status = 404;
      return {
        success: false,
        error: 'History record not found',
      };
    }
    
    return {
      success: true,
      message: 'History record deleted successfully',
    };
  }, {
    params: idParamSchema,
  })
  
  // Logout
  .post('/logout', async () => {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  });
