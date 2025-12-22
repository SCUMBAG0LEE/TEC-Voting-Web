// =====================================================
// API Response Types
// =====================================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================
// Voter Types
// =====================================================
export interface Voter {
  no: number;
  nim: string;
  vote: 0 | 1;
}

export interface VoterLoginResponse {
  token: string;
  nim: string;
  hasVoted: boolean;
}

export interface VoterInfo {
  nim: string;
  hasVoted: boolean;
  votingStatus?: VotingStatus;
}

// =====================================================
// Candidate Types
// =====================================================
export interface Candidate {
  id: number;
  name: string;
  nim: string;
  major: string;
  batch: number;
  photo?: string;
  votes?: number;
  percentage?: number;
}

// =====================================================
// Admin Types
// =====================================================
export interface Admin {
  id: number;
  email: string;
  name: string;
}

export interface AdminLoginResponse {
  token: string;
  admin: Admin;
}

// =====================================================
// Voting Types
// =====================================================
export interface VotingStatus {
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hasStarted: boolean;
  hasEnded: boolean;
}

export interface VotingConfig {
  id: number;
  voting_title: string;
  vot_start_date: string;
  vot_end_date: string;
  last_reset?: string;
}

// =====================================================
// Dashboard Types
// =====================================================
export interface DashboardStats {
  totalVoters: number;
  totalCandidates: number;
  votersVoted: number;
  participationRate: number;
}

export interface DashboardData {
  stats: DashboardStats;
  votingStatus: VotingStatus;
  tally: Candidate[];
}

// =====================================================
// Voters List Response
// =====================================================
export interface VotersListResponse {
  voters: Voter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    voted: number;
    notVoted: number;
  };
}

// =====================================================
// Candidates List Response
// =====================================================
export interface CandidatesResponse {
  candidates: Candidate[];
  votingStatus: VotingStatus;
}

// =====================================================
// Election History Types
// =====================================================
export interface ElectionHistory {
  id: number;
  election_title: string;
  winner_name: string;
  winner_nim: string;
  winner_major?: string;
  winner_batch?: number;
  winner_votes: number;
  winner_photo?: string;
  total_votes: number;
  total_voters: number;
  voters_participated: number;
  start_date?: string;
  end_date?: string;
  candidates_data: Candidate[];
  saved_at: string;
  participation_rate: number;
}

// =====================================================
// Auth Types
// =====================================================
export type UserType = 'voter' | 'admin';

export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType | null;
  token: string | null;
  currentUser?: any;
}
