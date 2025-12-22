import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthState, UserType, Admin } from '../models';

const VOTER_TOKEN_KEY = 'voter_token';
const ADMIN_TOKEN_KEY = 'admin_token';
const USER_DATA_KEY = 'user_data';
const USER_TYPE_KEY = 'user_type';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = signal<AuthState>({
    isAuthenticated: false,
    userType: null,
    token: null,
  });

  // Computed signals for easy access
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly userType = computed(() => this.authState().userType);
  readonly token = computed(() => this.authState().token);
  readonly currentUser = computed(() => this.authState().currentUser);
  readonly isVoter = computed(() => this.authState().userType === 'voter');
  readonly isAdmin = computed(() => this.authState().userType === 'admin');

  constructor(private router: Router) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const storedUserType = localStorage.getItem(USER_TYPE_KEY) as UserType | null;
    const userData = localStorage.getItem(USER_DATA_KEY);
    
    if (storedUserType === 'voter') {
      const voterToken = localStorage.getItem(VOTER_TOKEN_KEY);
      if (voterToken && userData) {
        try {
          const user = JSON.parse(userData);
          this.authState.set({
            isAuthenticated: true,
            userType: 'voter',
            token: voterToken,
            currentUser: user,
          });
          return;
        } catch (e) {
          this.clearAuth();
        }
      }
    }

    if (storedUserType === 'admin') {
      const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (adminToken && userData) {
        try {
          const user = JSON.parse(userData);
          this.authState.set({
            isAuthenticated: true,
            userType: 'admin',
            token: adminToken,
            currentUser: user,
          });
          return;
        } catch (e) {
          this.clearAuth();
        }
      }
    }
  }

  loginVoter(token: string, voter: { nim: string; hasVoted: boolean }): void {
    localStorage.setItem(VOTER_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(voter));
    localStorage.setItem(USER_TYPE_KEY, 'voter');
    
    this.authState.set({
      isAuthenticated: true,
      userType: 'voter',
      token,
      currentUser: voter,
    });
  }

  loginAdmin(token: string, admin: Admin): void {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(admin));
    localStorage.setItem(USER_TYPE_KEY, 'admin');
    
    this.authState.set({
      isAuthenticated: true,
      userType: 'admin',
      token,
      currentUser: admin,
    });
  }

  updateVoterToken(token: string): void {
    const currentUser = this.authState().currentUser;
    if (currentUser) {
      const updatedUser = { ...currentUser, hasVoted: true };
      localStorage.setItem(VOTER_TOKEN_KEY, token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      
      this.authState.update(state => ({
        ...state,
        token,
        currentUser: updatedUser,
      }));
    }
  }

  logout(): void {
    const userType = this.authState().userType;
    this.clearAuth();
    
    this.authState.set({
      isAuthenticated: false,
      userType: null,
      token: null,
    });
    
    if (userType === 'voter') {
      this.router.navigate(['/login']);
    } else if (userType === 'admin') {
      this.router.navigate(['/admin/login']);
    }
  }

  private clearAuth(): void {
    localStorage.removeItem(VOTER_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(USER_TYPE_KEY);
  }

  getToken(): string | null {
    return this.authState().token;
  }

  getUserType(): UserType | null {
    return this.authState().userType;
  }
}
