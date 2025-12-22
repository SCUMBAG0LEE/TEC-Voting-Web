/**
 * Voter Routes
 * TEC Voting System - Backend
 * 
 * Handles voter authentication and voting
 */

import { Elysia } from 'elysia';
import { jwtPlugin, generateVoterToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rate-limit';
import { voterLoginSchema, voteSchema } from '../types/schemas';
import { getVoterFromRequest, requireVoter } from '../utils';
import {
  findVoterByNim,
  castVote,
  hasVoterVoted,
} from '../services/voter.service';
import { 
  getVotingStatus, 
  isVotingActive 
} from '../services/voting.service';
import { getAllCandidatesPublic } from '../services/candidate.service';

export const voterRoutes = new Elysia({ prefix: '/voter' })
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
  .use(authRateLimiter)
  .post('/login', async ({ body, jwt, set }) => {
    const { nim } = body;
    
    // Find voter
    const voter = await findVoterByNim(nim);
    if (!voter) {
      set.status = 401;
      return {
        success: false,
        error: 'NIM not registered. Please contact admin.',
      };
    }
    
    // Generate token
    const token = await generateVoterToken(jwt, {
      nim: voter.nim,
      hasVoted: voter.vote === 1,
    });
    
    return {
      success: true,
      data: {
        token,
        nim: voter.nim,
        hasVoted: voter.vote === 1,
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
        hasVoted: voterData?.vote === 1,
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
  
  // Protected: Cast vote
  .post('/vote', async ({ body, jwt, request, set }) => {
    const voter = await getVoterFromRequest(jwt, request);
    if (!voter) {
      set.status = 401;
      return { success: false, error: 'Unauthorized: Voter authentication required' };
    }
    
    const { candidateId } = body;
    
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
    
    // Cast vote
    const result = await castVote(voter.nim, candidateId);
    
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
  
  // Protected: Logout (client-side should discard token)
  .post('/logout', async () => {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  });
