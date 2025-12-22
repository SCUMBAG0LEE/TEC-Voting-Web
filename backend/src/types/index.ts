/**
 * Database Models / Types
 * TEC Voting System - Backend
 * 
 * Type definitions matching the MariaDB schema
 */

// =====================================================
// VOTER TYPES
// =====================================================
export interface Voter {
  no: number;
  nim: string;
  vote: 0 | 1;
}

export interface VoterLoginRequest {
  nim: string;
}

export interface VoterResponse {
  nim: string;
  hasVoted: boolean;
}

// =====================================================
// CANDIDATE TYPES
// =====================================================
export interface Candidate {
  id: number;
  name: string;
  nim: string;
  major: string;
  batch: number;
  photo: string | null;
  votes: number;
}

export interface CandidateCreateRequest {
  name: string;
  nim: string;
  major: string;
  batch: number;
  photo?: string;
}

export interface CandidateUpdateRequest {
  name?: string;
  nim?: string;
  major?: string;
  batch?: number;
  photo?: string;
}

export interface CandidatePublic {
  id: number;
  name: string;
  nim: string;
  major: string;
  batch: number;
  photo: string | null;
}

// =====================================================
// ADMIN TYPES
// =====================================================
export interface Admin {
  id: number;
  name: string;
  email: string;
  password: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminResponse {
  id: number;
  name: string;
  email: string;
}

// =====================================================
// VOTING (Election Configuration) TYPES
// =====================================================
export interface VotingConfig {
  id: number;
  voting_title: string;
  vot_start_date: string;
  vot_end_date: string;
  last_reset: string | null;
}

export interface VotingScheduleRequest {
  voting_title?: string;
  vot_start_date: string;
  vot_end_date: string;
}

export interface VotingStatus {
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
}

// =====================================================
// ELECTION HISTORY TYPES
// =====================================================
export interface ElectionHistory {
  id: number;
  election_title: string;
  winner_name: string;
  winner_nim: string;
  winner_major: string | null;
  winner_batch: number | null;
  winner_votes: number;
  winner_photo: string | null;
  total_votes: number;
  total_voters: number;
  voters_participated: number;
  start_date: string;
  end_date: string;
  candidates_data: string; // JSON string
  saved_at: string;
}

export interface ElectionHistoryParsed extends Omit<ElectionHistory, 'candidates_data'> {
  candidates_data: CandidateResult[];
  participation_rate: number;
}

export interface CandidateResult {
  id: number;
  name: string;
  nim: string;
  major: string;
  batch: number;
  photo: string | null;
  votes: number;
  percentage: number;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// =====================================================
// JWT PAYLOAD TYPES
// =====================================================
export interface VoterJwtPayload {
  type: 'voter';
  nim: string;
  hasVoted: boolean;
}

export interface AdminJwtPayload {
  type: 'admin';
  id: number;
  email: string;
  name: string;
}

export type JwtPayload = VoterJwtPayload | AdminJwtPayload;

// =====================================================
// DASHBOARD STATS TYPES
// =====================================================
export interface DashboardStats {
  totalVoters: number;
  totalCandidates: number;
  votersVoted: number;
  participationRate: number;
}

export interface VoteTally {
  candidates: CandidateResult[];
  totalVotes: number;
}
