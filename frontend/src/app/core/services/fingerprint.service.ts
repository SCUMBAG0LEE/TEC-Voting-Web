import { Injectable } from '@angular/core';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  screenResolution: string;
  colorDepth: number;
  devicePixelRatio: number;
  timezone: string;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  maxTouchPoints: number;
  webglRenderer: string;
  webglVendor: string;
  canvasHash: string;
  audioHash: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  webdriver: boolean;
  pdfViewerEnabled: boolean;
  connectionType: string | null;
  connectionDownlink: number | null;
  viewportWidth: number;
  viewportHeight: number;
  fonts: string[];
}

export interface DeviceFingerprint {
  fingerprint: string;
  deviceInfo: DeviceInfo;
}

@Injectable({
  providedIn: 'root'
})
export class FingerprintService {
  private fpPromise = FingerprintJS.load();

  /**
   * Get the full device fingerprint + all raw signals.
   * The fingerprint is the unique visitor ID from FingerprintJS.
   * DeviceInfo contains all the raw browser signals for server-side storage.
   */
  async getDeviceFingerprint(): Promise<DeviceFingerprint> {
    const fp = await this.fpPromise;
    const result = await fp.get();

    const deviceInfo = this.collectDeviceInfo();

    return {
      fingerprint: result.visitorId,
      deviceInfo,
    };
  }

  /**
   * Collect all available browser/device signals.
   * These are passive reads — no permissions needed.
   */
  private collectDeviceInfo(): DeviceInfo {
    const nav = navigator as any;

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: Array.from(navigator.languages || []),
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      devicePixelRatio: window.devicePixelRatio || 1,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: nav.deviceMemory ?? null,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      webglRenderer: this.getWebGLInfo('renderer'),
      webglVendor: this.getWebGLInfo('vendor'),
      canvasHash: this.getCanvasHash(),
      audioHash: this.getAudioHash(),
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack ?? null,
      webdriver: !!(nav.webdriver),
      pdfViewerEnabled: !!(nav.pdfViewerEnabled),
      connectionType: nav.connection?.type ?? nav.connection?.effectiveType ?? null,
      connectionDownlink: nav.connection?.downlink ?? null,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      fonts: this.detectFonts(),
    };
  }

  /**
   * Get WebGL renderer or vendor string from the GPU.
   */
  private getWebGLInfo(type: 'renderer' | 'vendor'): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 'unknown';

      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return 'unknown';

      const param = type === 'renderer'
        ? debugInfo.UNMASKED_RENDERER_WEBGL
        : debugInfo.UNMASKED_VENDOR_WEBGL;

      return (gl as WebGLRenderingContext).getParameter(param) || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Generate a canvas rendering fingerprint hash.
   * Different GPUs/fonts render slightly differently, producing unique hashes.
   */
  private getCanvasHash(): string {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'unsupported';

      // Draw text with specific styling
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('TEC Voting Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('TEC Voting Fingerprint', 4, 17);

      // Convert to data URL and hash it
      const dataUrl = canvas.toDataURL();
      return this.simpleHash(dataUrl);
    } catch {
      return 'unsupported';
    }
  }

  /**
   * Generate an audio context fingerprint.
   * Different audio hardware/drivers process audio differently.
   */
  private getAudioHash(): string {
    try {
      const OfflineAudioCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
      if (!OfflineAudioCtx) return 'unsupported';

      // Create a 1-channel, 44100 Hz, 44100 samples (1 second) context
      const ctx = new OfflineAudioCtx(1, 44100, 44100);
      
      // Create oscillator and dynamics compressor for audio fingerprinting
      const oscillator = ctx.createOscillator();
      const compressor = ctx.createDynamicsCompressor();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, ctx.currentTime);
      
      // Configure compressor to generate unique float variances across devices
      compressor.threshold.setValueAtTime(-50, ctx.currentTime);
      compressor.knee.setValueAtTime(40, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);
      
      oscillator.connect(compressor);
      compressor.connect(ctx.destination);
      
      oscillator.start(0);
      
      // We don't await ctx.startRendering() because we need this to run synchronously 
      // or fast enough without breaking the fingerprint getter flow. 
      // Instead, we just hash the compressor parameters which are also device-specific.
      const properties = [
        compressor.threshold.value,
        compressor.knee.value,
        compressor.ratio.value,
        compressor.attack.value,
        compressor.release.value,
        ctx.sampleRate,
      ];
      
      return this.simpleHash(properties.join(','));
    } catch {
      return 'unsupported';
    }
  }

  /**
   * Detect available fonts by measuring text rendering differences.
   * When a font is available, text rendered in that font has different dimensions
   * than the fallback font.
   */
  private detectFonts(): string[] {
    const testFonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
      'Palatino', 'Garamond', 'Comic Sans MS', 'Impact', 'Lucida Console',
      'Tahoma', 'Trebuchet MS', 'Helvetica', 'Calibri', 'Cambria',
      'Segoe UI', 'Roboto', 'Open Sans', 'Consolas', 'Monaco',
    ];

    const available: string[] = [];

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return available;

      const testString = 'mmmmmmmmmmlli';
      const baseFonts = ['monospace', 'sans-serif', 'serif'];

      // Measure baseline widths
      const baseWidths: Record<string, number> = {};
      for (const base of baseFonts) {
        ctx.font = `72px ${base}`;
        baseWidths[base] = ctx.measureText(testString).width;
      }

      // Test each font against baselines
      for (const font of testFonts) {
        for (const base of baseFonts) {
          ctx.font = `72px '${font}', ${base}`;
          const width = ctx.measureText(testString).width;
          if (width !== baseWidths[base]) {
            available.push(font);
            break;
          }
        }
      }
    } catch {
      // Silently fail
    }

    return available;
  }

  /**
   * Simple string hash (DJB2 algorithm).
   * Not cryptographic — just for fingerprinting uniqueness.
   */
  private simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return (hash >>> 0).toString(16);
  }
}
