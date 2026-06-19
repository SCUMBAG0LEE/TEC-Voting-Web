/**
 * Admin Routes
 * TEC Voting System - Backend
 * 
 * Handles admin authentication and management
 */

import { Elysia, t } from 'elysia';
import { jwtPlugin, generateAdminToken } from '../middleware/auth';

import { getAdminFromRequest, requireAdmin } from '../utils';
import { 
  adminLoginSchema, 
  votingScheduleSchema, 
  votingTitleSchema,
  addVoterSchema,
  bulkAddVotersSchema,
  idParamSchema,
  nimParamSchema,
} from '../types/schemas';
import { verifyAdminCredentials, getDashboardStats } from '../services/admin.service';
import { 
  getVotersPaginated, 
  addVoter, 
  addVotersBulk, 
  deleteVoter, 
  resetAllVoters,
  getVotedCount,
} from '../services/voter.service';
import { 
  getVotingConfig, 
  updateVotingSchedule, 
  updateVotingTitle,
  getVotingStatus,
  updateLiveScoreVisibility,
} from '../services/voting.service';
import { getVoteTally, resetAllVotes } from '../services/candidate.service';
import { 
  saveElectionToHistory, 
  resetVotingSystem,
  getAllElectionHistory,
  deleteElectionHistory,
  restoreSystemFromJson,
  generateJsonBackup,
} from '../services/history.service';
import { resetDeviceVotes } from '../services/device.service';
import { 
  getFailedAttempts, 
  incrementFailedAttempts, 
  resetFailedAttempts, 
  verifyCaptcha 
} from '../services/auth.service';
import { uploadToR2, type Env } from '../services/storage.service';
import { cloudflareEnvContext } from '../utils/context';

export const adminRoutes = new Elysia({ aot: false, prefix: '/admin' })
  .use(jwtPlugin)
  
  // Public: Admin login (rate limited)

  .post('/login', async ({ body, jwt, set, request }) => {
    const { email, password, captchaToken, captchaProvider } = body;
    
    // Extract IP address from request
    const cfIp = request.headers.get('cf-connecting-ip');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = cfIp || forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1';

    // Check failed attempts
    const failedAttempts = await getFailedAttempts(ipAddress);
    
    // Admin threshold is 3 attempts before requiring Captcha
    if (failedAttempts >= 3) {
      if (!captchaToken) {
        set.status = 403;
        return {
          success: false,
          error: 'REQUIRE_CAPTCHA',
          message: 'Too many failed attempts. Please complete the captcha.',
        };
      }

      const isCaptchaValid = await verifyCaptcha(captchaToken, ipAddress, captchaProvider || 'recaptcha');
      if (!isCaptchaValid) {
        set.status = 400;
        return {
          success: false,
          error: 'Invalid Captcha. Please try again.',
        };
      }
    }
    
    const admin = await verifyAdminCredentials(email, password);
    if (!admin) {
      await incrementFailedAttempts(ipAddress);
      set.status = 401;
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }
    
    // Login successful
    await resetFailedAttempts(ipAddress);
    
    const token = await generateAdminToken(jwt, {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
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
    
    const [stats, votingStatus, votingConfig, tally] = await Promise.all([
      getDashboardStats(),
      getVotingStatus(),
      getVotingConfig(),
      getVoteTally(),
    ]);
    
    return {
      success: true,
      data: {
        stats,
        votingStatus: {
          ...votingStatus,
          config: votingConfig
        },
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
    const sortBy = (query.sortBy as string) || 'no';
    const sortOrder = (query.sortOrder as string) || 'asc';
    
    const result = await getVotersPaginated(page, limit, search, sortBy, sortOrder);
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
  
  // Update live score visibility
  .put('/voting/live-score', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    await updateLiveScoreVisibility(body.is_live_score_enabled);
    
    return {
      success: true,
      message: 'Live score visibility updated successfully',
    };
  }, {
    body: t.Object({ is_live_score_enabled: t.Boolean() }),
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
    const deleteVoters = body?.deleteVoters !== false;
    const deleteCandidates = body?.deleteCandidates !== false;
    const result = await resetVotingSystem(saveHistory, deleteVoters, deleteCandidates);
    
    return {
      success: result.success,
      message: result.message,
    };
  }, {
    body: t.Optional(t.Object({
      saveHistory: t.Optional(t.Boolean()),
      deleteVoters: t.Optional(t.Boolean()),
      deleteCandidates: t.Optional(t.Boolean()),
    })),
  })
  
  // Reset only voters (clear vote status + device fingerprints)
  .post('/reset/voters', async ({ jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const count = await resetAllVoters();
    await resetDeviceVotes();
    
    return {
      success: true,
      message: `Reset vote status for ${count} voters and cleared device records`,
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
  
  // Backup system to JSON
  .post('/system/backup', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    const saveToR2 = body?.saveToR2 === true;
    if (!saveToR2 && admin!.role !== 'owner') {
      set.status = 403;
      return { success: false, error: 'Unauthorized: Only system owners can download backups directly.' };
    }

    const backupData = await generateJsonBackup();
    const backupJson = JSON.stringify(backupData, null, 2);

    // Option to save to R2
    if (body?.saveToR2) {
      const workerEnv = cloudflareEnvContext.getStore() as Env;
      if (!workerEnv || !workerEnv.STORAGE_BUCKET) {
        return { success: false, error: 'R2 STORAGE_BUCKET is not configured or bound' };
      }
      const filename = `backups/tec-voting-backup-${Date.now()}.json`;
      const buffer = new TextEncoder().encode(backupJson);
      await uploadToR2(workerEnv, filename, buffer.buffer as ArrayBuffer, 'application/json');
      return { success: true, message: `Backup successfully saved to R2 as ${filename}` };
    }

    // Default: return as downloadable file
    set.headers['Content-Type'] = 'application/json';
    set.headers['Content-Disposition'] = `attachment; filename="tec-voting-backup-${Date.now()}.json"`;
    return backupJson;
  }, {
    body: t.Optional(t.Object({
      saveToR2: t.Optional(t.Boolean())
    }))
  })

  // Restore system from JSON
  .post('/system/restore', async ({ body, jwt, request, set }) => {
    const admin = await getAdminFromRequest(jwt, request);
    const authError = requireAdmin(admin, set);
    if (authError) return authError;
    
    if (admin!.role !== 'owner') {
      set.status = 403;
      return { success: false, error: 'Unauthorized: Only system owners can perform this action.' };
    }
    
    // We expect the entire JSON backup payload in the body
    const result = await restoreSystemFromJson(body);
    
    if (!result.success) {
      set.status = 500;
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
    body: t.Any(),
  })
  
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
