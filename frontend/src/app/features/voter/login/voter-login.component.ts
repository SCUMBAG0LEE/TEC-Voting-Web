import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, AuthService } from '../../../core';
import { ToastService, FooterComponent } from '../../../shared';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-voter-login',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent],
  template: `
    <div class="login-page" [class.admin-mode]="isSignupMode()">
      <div class="wrapper"></div>
      
      <div class="main-content">
        <div class="cont" [class.s--signup]="isSignupMode()"> 
          
          <!-- Native Mobile Tabs (Hidden on Desktop) -->
          <div class="mobile-tab-toggle" [class.admin-active]="isSignupMode()">
            <div class="tab-indicator"></div>
            <button type="button" class="tab-btn" [class.active]="!isSignupMode()" (click)="setMode(false)">Voter</button>
            <button type="button" class="tab-btn" [class.active]="isSignupMode()" (click)="setMode(true)">Admin</button>
          </div>

          <!-- Shared Mobile Title (static, never fades) -->
          <h2 class="mobile-title">{{ isSignupMode() ? 'Admin Login' : 'Voter Login' }}</h2>

          <form (ngSubmit)="onSubmitVoter()" class="form sign-in">
            <h2>Voter Login</h2>
            <label>
              <span>NIM (Student ID)</span>
              <input type="text" name="nim" [(ngModel)]="voterNim" [disabled]="isLoadingVoter()" required pattern="[0-9]{9}">
            </label>
            
            <div class="captcha-container">
              <ng-container *ngIf="showVoterCaptcha()">
                <div id="voter-recaptcha" class="g-recaptcha" [attr.data-sitekey]="recaptchaSiteKey"></div>
                <div id="voter-hcaptcha" class="h-captcha" [attr.data-sitekey]="hcaptchaSiteKey" style="display: none;"></div>
              </ng-container>
            </div>

            <button type="submit" class="submit" [disabled]="isLoadingVoter()">
              {{ isLoadingVoter() ? 'Logging In...' : 'Log In' }}
            </button>
          </form>

          <div class="sub-cont">
            <div class="img">
              <div class="img-bg-admin"></div>
              <div class="img__text m--up">
                <h2>Admin Area</h2>
                <p>Switch to administrator login</p>
              </div>
              <div class="img__text m--in">
                <h2>Voter Area</h2>
                <p>Switch to voter login</p>
              </div>
              <div class="img__btn" (click)="toggleMode()">
                <span class="m--up">Admin</span>
                <span class="m--in">Voter</span>
              </div>
            </div>

            <form (ngSubmit)="onSubmitAdmin()" class="form sign-up">
              <h2>Admin Login</h2>
              <label>
                <span>Email</span>
                <input type="email" name="adminEmail" [(ngModel)]="adminEmail" [disabled]="isLoadingAdmin()" required>
              </label>
              <label>
                <span>Password</span>
                <input type="password" name="adminPassword" [(ngModel)]="adminPassword" [disabled]="isLoadingAdmin()" required>
              </label>
              
              <div class="captcha-container">
                <ng-container *ngIf="showAdminCaptcha()">
                  <div id="admin-recaptcha" class="g-recaptcha" [attr.data-sitekey]="recaptchaSiteKey"></div>
                  <div id="admin-hcaptcha" class="h-captcha" [attr.data-sitekey]="hcaptchaSiteKey" style="display: none;"></div>
                </ng-container>
              </div>

              <button type="submit" class="submit" [disabled]="isLoadingAdmin()">
                {{ isLoadingAdmin() ? 'Logging In...' : 'Log In' }}
              </button>
            </form>
          </div>

          <!-- Shared Mobile Login Button (static, never fades) -->
          <div class="mobile-login-footer">
            <button type="button" class="submit"
              (click)="isSignupMode() ? onSubmitAdmin() : onSubmitVoter()"
              [disabled]="isSignupMode() ? isLoadingAdmin() : isLoadingVoter()">
              {{ (isSignupMode() ? isLoadingAdmin() : isLoadingVoter()) ? 'Logging In...' : 'Log In' }}
            </button>
          </div>
        </div>
      </div>
      
      <app-footer class="dark-bg copyright-footer"></app-footer>
    </div>
  `,
  styleUrls: ['./voter-login.component.scss']
})
export class VoterLoginComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // Captcha Keys
  recaptchaSiteKey = environment.recaptchaSiteKey;
  hcaptchaSiteKey = environment.hcaptchaSiteKey;

  isSignupMode = signal(false); // false = Voter, true = Admin

  // Voter state
  voterNim = '';
  isLoadingVoter = signal(false);

  showVoterCaptcha = signal(false);

  // Admin state
  adminEmail = '';
  adminPassword = '';
  isLoadingAdmin = signal(false);
  showAdminCaptcha = signal(false);

  // Script injection states
  private recaptchaLoaded = false;
  private hcaptchaLoaded = false;
  
  // Widget IDs for targeted resetting
  private recaptchaWidgetIds: Record<string, number> = {};
  private hcaptchaWidgetIds: Record<string, string> = {};

  ngOnInit() {
    // Load recaptcha script dynamically to prevent it from loading unnecessarily on other pages
    this.loadRecaptchaScript();
  }

  toggleMode() {
    this.isSignupMode.set(!this.isSignupMode());
  }

  setMode(isAdmin: boolean) {
    this.isSignupMode.set(isAdmin);
  }

  // --- Auth Logic ---

  async onSubmitVoter() {
    if (!this.voterNim.trim() || this.isLoadingVoter()) return;
    this.isLoadingVoter.set(true);
    
    let token = '';
    let provider = '';
    
    if (this.showVoterCaptcha()) {
      token = this.getCaptchaToken('voter');
      provider = this.getActiveCaptchaProvider('voter');
      if (!token) {
        this.toastService.error('Please complete the Captcha');
        this.isLoadingVoter.set(false);
        return;
      }
    }

    this.apiService.loginVoter(this.voterNim.trim(), token, provider).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.authService.loginVoter(response.data.token, {
            nim: response.data.nim,
            hasVoted: response.data.hasVoted
          });
          this.toastService.success('Login successful!');
          if (response.data.hasVoted) this.router.navigate(['/voted']);
          else this.router.navigate(['/vote']);
        }
        this.isLoadingVoter.set(false);
      },
      error: (error) => {
        this.handleLoginError('voter', error);
        this.isLoadingVoter.set(false);
      }
    });
  }

  async onSubmitAdmin() {
    if (!this.adminEmail.trim() || !this.adminPassword || this.isLoadingAdmin()) return;
    this.isLoadingAdmin.set(true);

    let token = '';
    let provider = '';
    
    if (this.showAdminCaptcha()) {
      token = this.getCaptchaToken('admin');
      provider = this.getActiveCaptchaProvider('admin');
      if (!token) {
        this.toastService.error('Please complete the Captcha');
        this.isLoadingAdmin.set(false);
        return;
      }
    }

    this.apiService.loginAdmin(this.adminEmail.trim(), this.adminPassword, token, provider).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.authService.loginAdmin(response.data.token, response.data.admin);
          this.toastService.success('Login successful!');
          this.router.navigate(['/admin/dashboard']);
        }
        this.isLoadingAdmin.set(false);
      },
      error: (error) => {
        this.handleLoginError('admin', error);
        this.isLoadingAdmin.set(false);
      }
    });
  }

  private handleLoginError(type: 'voter' | 'admin', error: any) {
    const errObj = error.error;
    if (errObj?.error === 'REQUIRE_CAPTCHA') {
      this.toastService.warning(errObj.message || 'Too many failed attempts. Please complete the captcha.');
      if (type === 'voter') this.showVoterCaptcha.set(true);
      else this.showAdminCaptcha.set(true);
      
      // Delay to allow Angular to render the div before rendering widget
      setTimeout(() => this.renderCaptchas(type), 100);
    } else {
      this.toastService.error(errObj?.error || 'Login failed. Please try again.');
      this.resetCaptchas(type);
    }
  }

  // --- Captcha Integrations ---
  
  private loadRecaptchaScript() {
    if (document.getElementById('recaptcha-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.warn('reCAPTCHA failed to load. Switching to hCaptcha fallback.');
      this.loadHcaptchaScript();
    };
    script.onload = () => this.recaptchaLoaded = true;
    document.head.appendChild(script);
  }

  private loadHcaptchaScript() {
    if (document.getElementById('hcaptcha-script')) return;
    const script = document.createElement('script');
    script.id = 'hcaptcha-script';
    script.src = 'https://hcaptcha.com/1/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => this.hcaptchaLoaded = true;
    document.head.appendChild(script);
  }

  private renderCaptchas(type: 'voter' | 'admin') {
    const w = window as any;
    try {
      if (w.grecaptcha && this.recaptchaLoaded) {
        this.recaptchaWidgetIds[type] = w.grecaptcha.render(`${type}-recaptcha`, { sitekey: this.recaptchaSiteKey });
      } else {
        throw new Error("reCAPTCHA not available");
      }
    } catch (e) {
      console.warn('reCAPTCHA render failed. Falling back to hCaptcha.', e);
      document.getElementById(`${type}-recaptcha`)!.style.display = 'none';
      document.getElementById(`${type}-hcaptcha`)!.style.display = 'block';
      this.loadHcaptchaScript();
      
      // Render hCaptcha when loaded
      const checkAndRenderHcaptcha = setInterval(() => {
        if (w.hcaptcha && this.hcaptchaLoaded) {
          this.hcaptchaWidgetIds[type] = w.hcaptcha.render(`${type}-hcaptcha`, { sitekey: this.hcaptchaSiteKey });
          clearInterval(checkAndRenderHcaptcha);
        }
      }, 500);
    }
  }

  private getCaptchaToken(type: 'voter' | 'admin'): string {
    const w = window as any;
    if (document.getElementById(`${type}-recaptcha`)!.style.display !== 'none' && w.grecaptcha) {
      return w.grecaptcha.getResponse();
    } else if (w.hcaptcha) {
      return w.hcaptcha.getResponse();
    }
    return '';
  }

  private getActiveCaptchaProvider(type: 'voter' | 'admin'): string {
    return document.getElementById(`${type}-recaptcha`)!.style.display !== 'none' ? 'recaptcha' : 'hcaptcha';
  }

  private resetCaptchas(type: 'voter' | 'admin') {
    const w = window as any;
    try {
      if (document.getElementById(`${type}-recaptcha`)!.style.display !== 'none' && w.grecaptcha) {
        if (this.recaptchaWidgetIds[type] !== undefined) {
          w.grecaptcha.reset(this.recaptchaWidgetIds[type]);
        } else {
          w.grecaptcha.reset();
        }
      } else if (w.hcaptcha) {
        if (this.hcaptchaWidgetIds[type] !== undefined) {
          w.hcaptcha.reset(this.hcaptchaWidgetIds[type]);
        } else {
          w.hcaptcha.reset();
        }
      }
    } catch(e) {}
  }


}
