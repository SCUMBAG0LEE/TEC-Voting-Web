import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  VoterLoginResponse,
  Voter,
  Candidate,
  AdminLoginResponse,
  VotingStatus,
  DashboardData,
  ElectionHistory,
  VotersListResponse,
  CandidatesResponse,
  VotingConfig,
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // =====================================================
  // VOTER AUTH ENDPOINTS
  // =====================================================
  
  loginVoter(nim: string): Observable<ApiResponse<VoterLoginResponse>> {
    return this.http.post<ApiResponse<VoterLoginResponse>>(`${this.apiUrl}/voter/login`, { nim });
  }

  getVotingStatus(): Observable<ApiResponse<VotingStatus>> {
    return this.http.get<ApiResponse<VotingStatus>>(`${this.apiUrl}/voter/status`);
  }

  getVoterMe(): Observable<ApiResponse<{ nim: string; hasVoted: boolean; votingStatus: VotingStatus }>> {
    return this.http.get<ApiResponse<{ nim: string; hasVoted: boolean; votingStatus: VotingStatus }>>(`${this.apiUrl}/voter/me`);
  }

  getCandidates(): Observable<ApiResponse<CandidatesResponse>> {
    return this.http.get<ApiResponse<CandidatesResponse>>(`${this.apiUrl}/voter/candidates`);
  }

  castVote(candidateId: number): Observable<ApiResponse<{ token: string; message: string }>> {
    return this.http.post<ApiResponse<{ token: string; message: string }>>(`${this.apiUrl}/voter/vote`, { candidateId });
  }

  // =====================================================
  // ADMIN AUTH ENDPOINTS
  // =====================================================
  
  loginAdmin(email: string, password: string): Observable<ApiResponse<AdminLoginResponse>> {
    return this.http.post<ApiResponse<AdminLoginResponse>>(`${this.apiUrl}/admin/login`, { email, password });
  }

  getDashboard(): Observable<ApiResponse<DashboardData>> {
    return this.http.get<ApiResponse<DashboardData>>(`${this.apiUrl}/admin/dashboard`);
  }

  getAdminMe(): Observable<ApiResponse<{ id: number; email: string; name: string }>> {
    return this.http.get<ApiResponse<{ id: number; email: string; name: string }>>(`${this.apiUrl}/admin/me`);
  }

  // =====================================================
  // VOTERS MANAGEMENT
  // =====================================================
  
  getVoters(page = 1, limit = 20, search?: string): Observable<ApiResponse<VotersListResponse>> {
    let url = `${this.apiUrl}/admin/voters?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.http.get<ApiResponse<VotersListResponse>>(url);
  }

  createVoter(nim: string): Observable<ApiResponse<{ id: number; message: string }>> {
    return this.http.post<ApiResponse<{ id: number; message: string }>>(`${this.apiUrl}/admin/voters`, { nim });
  }

  createVotersBulk(nims: string[]): Observable<ApiResponse<{ added: number; skipped: number; message: string }>> {
    return this.http.post<ApiResponse<{ added: number; skipped: number; message: string }>>(`${this.apiUrl}/admin/voters/bulk`, { nims });
  }

  deleteVoter(nim: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/admin/voters/${nim}`);
  }

  // =====================================================
  // CANDIDATES MANAGEMENT
  // =====================================================
  
  getAdminCandidates(): Observable<ApiResponse<Candidate[]>> {
    return this.http.get<ApiResponse<Candidate[]>>(`${this.apiUrl}/candidates/admin/all`);
  }

  getPublicCandidates(): Observable<ApiResponse<Candidate[]>> {
    return this.http.get<ApiResponse<Candidate[]>>(`${this.apiUrl}/candidates`);
  }

  createCandidate(data: { name: string; nim: string; major: string; batch: number }): Observable<ApiResponse<{ id: number; message: string }>> {
    return this.http.post<ApiResponse<{ id: number; message: string }>>(`${this.apiUrl}/candidates`, data);
  }

  updateCandidate(id: number, data: { name?: string; nim?: string; major?: string; batch?: number }): Observable<ApiResponse<{ message: string }>> {
    return this.http.put<ApiResponse<{ message: string }>>(`${this.apiUrl}/candidates/${id}`, data);
  }

  deleteCandidate(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/candidates/${id}`);
  }

  uploadCandidatePhoto(nim: string, file: File): Observable<ApiResponse<{ filename: string; path: string; url: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nim', nim);
    return this.http.post<ApiResponse<{ filename: string; path: string; url: string }>>(`${this.apiUrl}/upload/candidate-photo`, formData);
  }

  updateCandidatePhoto(id: number, photoPath: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.put<ApiResponse<{ message: string }>>(`${this.apiUrl}/candidates/${id}`, { photo: photoPath });
  }

  // =====================================================
  // VOTING CONFIGURATION
  // =====================================================

  getVotingConfig(): Observable<ApiResponse<{ config: VotingConfig; status: VotingStatus }>> {
    return this.http.get<ApiResponse<{ config: VotingConfig; status: VotingStatus }>>(`${this.apiUrl}/admin/voting/config`);
  }
  
  updateVotingTitle(title: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.put<ApiResponse<{ message: string }>>(`${this.apiUrl}/admin/voting/title`, { voting_title: title });
  }

  updateVotingSchedule(votingTitle: string, startDate: string, endDate: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.put<ApiResponse<{ message: string }>>(`${this.apiUrl}/admin/voting/schedule`, { 
      voting_title: votingTitle,
      vot_start_date: startDate, 
      vot_end_date: endDate 
    });
  }

  // =====================================================
  // RESET OPERATIONS
  // =====================================================

  resetVotingSystem(saveHistory = true): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/admin/reset`, { saveHistory });
  }

  resetVoters(): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/admin/reset/voters`, {});
  }

  resetVotes(): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/admin/reset/votes`, {});
  }

  // =====================================================
  // RESULTS & HISTORY
  // =====================================================

  getTally(): Observable<ApiResponse<{ candidates: Candidate[]; totalVotes: number }>> {
    return this.http.get<ApiResponse<{ candidates: Candidate[]; totalVotes: number }>>(`${this.apiUrl}/admin/tally`);
  }
  
  getElectionHistory(): Observable<ApiResponse<ElectionHistory[]>> {
    return this.http.get<ApiResponse<ElectionHistory[]>>(`${this.apiUrl}/admin/history`);
  }

  saveElectionHistory(): Observable<ApiResponse<{ id: number; message: string }>> {
    return this.http.post<ApiResponse<{ id: number; message: string }>>(`${this.apiUrl}/admin/history/save`, {});
  }

  deleteElectionHistory(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.apiUrl}/admin/history/${id}`);
  }

  // =====================================================
  // LOGOUT
  // =====================================================
  
  adminLogout(): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/admin/logout`, {});
  }
}

