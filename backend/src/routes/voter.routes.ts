/**
 * Voter Routes
 * TEC Voting System - Backend
 * 
 * Handles voter authentication and voting
 */

import { Elysia, t } from 'elysia';
import { jwtPlugin, generateVoterToken } from '../middleware/auth';

import { db } from '../db';
import { device_votes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { voterLoginSchema, voteSchema } from '../types/schemas';
import { getVoterFromRequest } from '../utils';
import {
  findVoterByNim,
  castVote,
  hasVoterVoted,
} from '../services/voter.service';
import { 
  getVotingStatus, 
  isVotingActive 
} from '../services/voting.service';
import { getAllCandidatesPublic, getVoteTally } from '../services/candidate.service';
import { 
  getFailedAttempts, 
  incrementFailedAttempts, 
  resetFailedAttempts, 
  verifyCaptcha 
} from '../services/auth.service';

export const voterRoutes = new Elysia({ aot: false, prefix: '/voter' })
  .use(jwtPlugin)
  
  // Public: Get voting status
  .get('/status', async () => {
    const status = await getVotingStatus();
    return {
      success: true,
      data: status,
    };
  })
  
  // Public: Voter login (rate limited)

  .post('/login', async ({ body, jwt, set, request }) => {
    const { nim, captchaToken, captchaProvider } = body;
    
    // Extract IP address from request
    const cfIp = request.headers.get('cf-connecting-ip');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = cfIp || forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1';

    // Check failed attempts
    const failedAttempts = await getFailedAttempts(ipAddress);
    
    // Voter threshold is 5 attempts before requiring Captcha
    if (failedAttempts >= 5) {
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
    
    // Find voter
    const voter = await findVoterByNim(nim);
    if (!voter) {
      await incrementFailedAttempts(ipAddress);
      set.status = 401;
      return {
        success: false,
        error: 'NIM not registered. Please contact admin.',
      };
    }
    
    // Login successful
    await resetFailedAttempts(ipAddress);
    
    // Generate token
    const token = await generateVoterToken(jwt, {
      nim: voter.nim,
      hasVoted: Boolean(voter.vote),
    });
    
    return {
      success: true,
      data: {
        token,
        nim: voter.nim,
        hasVoted: Boolean(voter.vote),
      },
    };
  }, {
    body: voterLoginSchema,
  })
  
  // Protected: Get current voter info
  .get('/me', async ({ jwt, request, set }) => {
    const voter = await getVoterFromRequest(jwt, request);
    if (!voter) {
      set.status = 401;
      return { success: false, error: 'Unauthorized: Voter authentication required' };
    }
    
    const voterData = await findVoterByNim(voter.nim);
    const status = await getVotingStatus();
    
    return {
      success: true,
      data: {
        nim: voter.nim,
        hasVoted: Boolean(voterData?.vote),
        votingStatus: status,
      },
    };
  })
  
  // Protected: Get candidates for voting
  .get('/candidates', async ({ jwt, request, set }) => {
    const voter = await getVoterFromRequest(jwt, request);
    if (!voter) {
      set.status = 401;
      return { success: false, error: 'Unauthorized: Voter authentication required' };
    }
    
    // Check if voting is active
    const status = await getVotingStatus();
    if (!status.isActive) {
      set.status = 400;
      return {
        success: false,
        error: status.hasEnded 
          ? 'Voting has ended' 
          : 'Voting has not started yet',
        data: { votingStatus: status },
      };
    }
    
    // Check if already voted
    const hasVoted = await hasVoterVoted(voter.nim);
    if (hasVoted) {
      set.status = 400;
      return {
        success: false,
        error: 'You have already voted',
      };
    }
    
    const candidates = await getAllCandidatesPublic();
    return {
      success: true,
      data: {
        candidates,
        votingStatus: status,
      },
    };
  })
  
  // Protected: Verify device before entering booth
  .post('/verify-device', async ({ body, jwt, request, set }) => {
    const voter = await getVoterFromRequest(jwt, request);
    if (!voter) {
      set.status = 401;
      return { success: false, error: 'Unauthorized: Voter authentication required' };
    }
    
    const { fingerprint } = body;
    
    // Check if device already voted
    const existingDevice = await db.select().from(device_votes).where(eq(device_votes.fingerprint, fingerprint)).limit(1);
    
    if (existingDevice.length > 0) {
      set.status = 403;
      return {
        success: false,
        error: 'This device has already been used to cast a vote.',
      };
    }
    
    return { success: true };
  }, {
    body: t.Object({
      fingerprint: t.String({ minLength: 1, maxLength: 64 })
    })
  })

  // Protected: Cast vote
  .post('/vote', async ({ body, jwt, request, set }) => {
    const voter = await getVoterFromRequest(jwt, request);
    if (!voter) {
      set.status = 401;
      return { success: false, error: 'Unauthorized: Voter authentication required' };
    }
    
    const { candidateId, fingerprint, deviceInfo } = body;
    
    // Check if voting is active
    const active = await isVotingActive();
    if (!active) {
      set.status = 400;
      return {
        success: false,
        error: 'Voting is not active',
      };
    }
    
    // Check if already voted
    const hasVoted = await hasVoterVoted(voter.nim);
    if (hasVoted) {
      set.status = 400;
      return {
        success: false,
        error: 'You have already voted',
      };
    }

    // Extract IP address from request
    const cfIp = request.headers.get('cf-connecting-ip');
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = cfIp || forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1';
    
    // Cast vote with device fingerprint and extreme telemetry
    const result = await castVote(
      voter.nim, 
      candidateId, 
      fingerprint, 
      ipAddress, 
      (request as any).cf || {}, // Fixed 500 error: Safely fallback if Cloudflare features are missing locally
      deviceInfo
    );
    
    if (!result.success) {
      set.status = 400;
      return {
        success: false,
        error: result.message,
      };
    }
    
    // Generate new token with updated hasVoted status
    const newToken = await generateVoterToken(jwt, {
      nim: voter.nim,
      hasVoted: true,
    });
    
    return {
      success: true,
      message: result.message,
      data: {
        token: newToken,
      },
    };
  }, {
    body: voteSchema,
  })
  
  // Protected: Get results (only after voting ends)
  .get('/results', async ({ jwt, request, set }) => {
    const voter = await getVoterFromRequest(jwt, request);
    if (!voter) {
      set.status = 401;
      return { success: false, error: 'Unauthorized: Voter authentication required' };
    }
    
    // Check if voting has ended OR live score is explicitly enabled
    const status = await getVotingStatus();
    if (!status.hasEnded && !status.is_live_score_enabled) {
      set.status = 403;
      return {
        success: false,
        error: 'Results are currently hidden by the administrator.',
      };
    }
    
    // Check if voter has voted
    const hasVoted = await hasVoterVoted(voter.nim);
    if (!hasVoted) {
      set.status = 403;
      return {
        success: false,
        error: 'Only voters who participated can view the results.',
      };
    }
    
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
  
  // Protected: Logout (client-side should discard token)
  .post('/logout', async () => {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  });
