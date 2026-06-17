/**
 * Forensic Device Fingerprinting Service
 * Gathers a wide array of browser and hardware data points to create a unique
 * and stable device fingerprint, crucial for preventing multi-voting.
 */

/**
 * Fetches the public IP address via external services (Bypasses Adblockers)
 */
async function getPublicIP(): Promise<string> {
  const services = [
    'https://api.ipify.org',
    'https://ifconfig.me/ip',
    'https://icanhazip.com',
    'https://api.seeip.org',
    'https://ident.me',
    'https://api.myip.com',
    'https://checkip.amazonaws.com',
    'https://wtfismyip.com/text',
    'https://l2.io/ip'
  ];
  
  for (const url of services) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500); // 1.5s timeout
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) return (await res.text()).trim();
    } catch (e) {
      // Blocked by adblocker, instantly try the next service in the array
    }
  }
  return 'unknown';
}

/**
 * Extracts the Local IP Address using WebRTC (often works without permissions)
 */
async function getLocalIP(): Promise<string> {
  return new Promise((resolve) => {
    const RTCPeerConnection = window.RTCPeerConnection || (window as any).webkitRTCPeerConnection || (window as any).mozRTCPeerConnection;
    if (!RTCPeerConnection) return resolve('unsupported');
    const rtc = new RTCPeerConnection({ iceServers: [] });
    rtc.createDataChannel('');
    rtc.createOffer().then(offer => rtc.setLocalDescription(offer)).catch(() => resolve('error'));
    rtc.onicecandidate = (evt) => {
      if (evt.candidate) {
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/i;
        const match = ipRegex.exec(evt.candidate.candidate);
        if (match) {
          rtc.close();
          resolve(match[1]);
        }
      }
    };
    setTimeout(() => { rtc.close(); resolve('unknown'); }, 1000);
  });
}

/**
 * Heuristic to detect Incognito / Private Browsing mode by checking storage quota constraints.
 */
async function detectIncognito(): Promise<boolean> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      // Incognito mode heavily restricts storage quotas (often < 120MB)
      if (estimate.quota && estimate.quota < 120000000) return true;
    }
  } catch (e) {}
  return false;
}

/**
 * Hashes a string using the SHA-256 algorithm.
 * @param str The string to hash.
 * @returns A promise that resolves to the hex-encoded hash.
 */
async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a fingerprint based on the browser's Canvas API.
 * @returns A string representing the canvas fingerprint.
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas-context';

    const txt = 'TEC-Voting-System-v2.0';
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText(txt, 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText(txt, 4, 17);

    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-error';
  }
}

function getWebGLData() {
  let vendor = 'unknown';
  let renderer = 'unknown';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return { vendor, renderer };

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) ?? 'unknown';
      renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? 'unknown';
    }
  } catch (e) {
    // Ignore errors, return defaults
  }
  return { vendor, renderer };
}

/**
 * Generates a math fingerprint based on CPU floating point inconsistencies.
 */
function getMathFingerprint(): string {
  return String(
    Math.sin(11.5) + Math.cos(22.3) + Math.tan(33.1) + 
    Math.log(44.9) + Math.sqrt(55.2) + Math.pow(66.8, 1.1) + 
    Math.PI + Math.E
  );
}

/**
 * Generates an audio fingerprint using OfflineAudioContext.
 * Measures the exact mathematical processing signature of the sound card.
 */
async function getAudioFingerprint(): Promise<string> {
  try {
    const AudioContext = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    if (!AudioContext) return 'no-audio-api';
    
    const context = new AudioContext(1, 44100, 44100);
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);
    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);
    
    const buffer = await context.startRendering();
    let hash = 0;
    for (let i = 0; i < buffer.length; i++) {
        hash += Math.abs(buffer.getChannelData(0)[i]);
    }
    return hash.toString();
  } catch (e) {
    return 'audio-error';
  }
}

/**
 * Passively detects if an ad blocker is running.
 */
async function detectAdBlocker(): Promise<boolean> {
  // Test 1: Network Request Block (Array of notorious trackers)
  try {
    const trackers = [
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
      'https://www.google-analytics.com/analytics.js',
      'https://connect.facebook.net/en_US/fbevents.js',
      'https://www.googletagmanager.com/gtag/js',
      'https://api.ipify.org'
    ];

    // If ANY of these requests are blocked by an extension, Promise.all will instantly reject!
    await Promise.all(trackers.map(async (url) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      try {
        await fetch(url, { mode: 'no-cors', cache: 'no-store', signal: controller.signal });
      } catch (e: any) {
        if (e.name !== 'AbortError') throw e; // True block (net::ERR_BLOCKED_BY_CLIENT)
      } finally {
        clearTimeout(id);
      }
    }));
  } catch (e) {
    return true;
  }

  // Test 2: Script Tag Injection (Catches adblockers that only monitor <script> elements)
  const scriptBlocked = await new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.async = true;
    script.onerror = () => { script.remove(); resolve(true); };
    script.onload = () => { script.remove(); resolve(false); };
    document.head.appendChild(script);
    setTimeout(() => { script.remove(); resolve(false); }, 1500);
  });

  if (scriptBlocked) return true;

  // Test 3: DOM Injection (Fallback for cosmetic-only blockers)
  let isBlocked = false;
  try {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox ad-placement doubleclick ad-placeholder adsbygoogle';
    testAd.style.position = 'absolute';
    testAd.style.top = '-9999px';
    document.body.appendChild(testAd);
    await new Promise(resolve => setTimeout(resolve, 100)); // Give MutationObserver more time to react
    isBlocked = testAd.offsetHeight === 0 || testAd.offsetWidth === 0 || window.getComputedStyle(testAd).display === 'none' || testAd.offsetParent === null;
    testAd.remove();
  } catch (e) {
    isBlocked = false;
  }
  return isBlocked;
}

/**
 * Retrieves battery level and charging status.
 */
async function getBatteryInfo() {
  try {
    if ('getBattery' in navigator) {
      const battery: any = await (navigator as any).getBattery();
      return { 
        level: battery.level !== undefined ? battery.level : null, 
        charging: battery.charging !== undefined ? battery.charging : null 
      };
    }
  } catch (e) {}
  return { level: null, charging: null };
}

/**
 * Retrieves installed fonts by measuring invisible text bounding boxes.
 */
function getFonts(): string[] {
  const fontList = [
    'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math', 'Comic Sans MS', 'Courier',
    'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif',
    'MS Gothic', 'MS PGothic', 'MS Sans Serif', 'MS Serif', 'Palatino Linotype', 'Segoe Print', 'Segoe Script',
    'Segoe UI', 'Segoe UI Light', 'Segoe UI Semibold', 'Segoe UI Symbol', 'Tahoma', 'Times', 'Times New Roman',
    'Trebuchet MS', 'Verdana', 'Wingdings',
    'Apple Chancery', 'Apple Color Emoji', 'Apple SD Gothic Neo', 'Baskerville', 'Big Caslon', 'Chalkboard',
    'Chalkboard SE', 'Chalkduster', 'Cochin', 'Didot', 'Futura', 'Geneva', 'Gill Sans', 'Helvetica Neue',
    'Hoefler Text', 'Lucida Grande', 'Marker Felt', 'Menlo', 'Monaco', 'Optima', 'Papyrus', 'Thonburi',
    'Ubuntu', 'Ubuntu Condensed', 'Ubuntu Mono',
    'Roboto', 'Roboto Condensed', 'Roboto Slab',
    'Droid Sans', 'Droid Serif', 'Droid Sans Mono'
  ];
  
  const testString = 'mmmmmmmmmmlli';
  const s = document.createElement('span');
  s.style.position = 'absolute';
  s.style.left = '-9999px';
  s.style.fontSize = '72px';
  s.innerHTML = testString;
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const defaultWidth: Record<string, number> = {};
  
  document.body.appendChild(s);
  for (const base of baseFonts) {
    s.style.fontFamily = base;
    defaultWidth[base] = s.offsetWidth;
  }
  
  const detected: string[] = [];
  for (const font of fontList) {
    let installed = false;
    for (const base of baseFonts) {
      s.style.fontFamily = `"${font}",${base}`;
      if (s.offsetWidth !== defaultWidth[base]) {
        installed = true;
        break;
      }
    }
    if (installed) detected.push(font);
  }
  document.body.removeChild(s);
  return detected;
}

/**
 * Gets available speech synthesis voices.
 */
async function getSpeechVoices(): Promise<string[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve([]);
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) return resolve(voices.map(v => v.name));
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices().map(v => v.name));
    setTimeout(() => resolve([]), 100);
  });
}

let cachedDeviceData: any = null;

/**
 * Gathers various device and browser properties.
 * @returns An object containing device information.
 */
async function getDeviceData() {
  // If we already have a fingerprint, intelligently retry any fields that failed the first time
  if (cachedDeviceData) {
    const retries: Promise<void>[] = [];

    if (cachedDeviceData.publicIp === 'unknown') {
      retries.push(getPublicIP().then(ip => { cachedDeviceData.publicIp = ip ?? 'unknown'; }));
    }
    
    if (['unknown', 'unsupported', 'error'].includes(cachedDeviceData.localIp)) {
      retries.push(getLocalIP().then(ip => { cachedDeviceData.localIp = ip ?? 'unknown'; }));
    }

    if (cachedDeviceData.batteryLevel === null) {
      retries.push(getBatteryInfo().then(b => {
        cachedDeviceData.batteryLevel = b.level ?? null;
        cachedDeviceData.isCharging = b.charging ?? null;
      }));
    }

    if (['audio-error', 'no-audio-api', 'unknown'].includes(cachedDeviceData.audioHash)) {
      retries.push(getAudioFingerprint().then(hash => { cachedDeviceData.audioHash = hash ?? 'unknown'; }));
    }

    if (!cachedDeviceData.speechVoices || cachedDeviceData.speechVoices.length === 0) {
      retries.push(getSpeechVoices().then(voices => { cachedDeviceData.speechVoices = voices || []; }));
    }
    
    // Execute all needed retries concurrently for maximum performance
    if (retries.length > 0) {
      await Promise.all(retries);
    }

    return cachedDeviceData;
  }

  const webgl = getWebGLData();
  const battery = await getBatteryInfo();
  const adBlocker = await detectAdBlocker();
  const audioHash = await getAudioFingerprint();
  const speechVoices = await getSpeechVoices();
  const localIp = await getLocalIP();
  const incognito = await detectIncognito();
  const publicIp = await getPublicIP();
  const fonts = getFonts();
  
  const uaData = (navigator as any).userAgentData;
  const clientHintsBrands = uaData?.brands?.map((b: any) => `${b.brand} ${b.version}`).join(', ') || 'unknown';
  const clientHintsMobile = uaData?.mobile || false;
  
  const data = {
    userAgent: navigator.userAgent || 'unknown',
    platform: navigator.platform || (navigator as any).userAgentData?.platform || 'unknown',
    language: navigator.language || 'en',
    languages: Array.from(navigator.languages || ['en']),
    screenResolution: `${window.screen.width || 0}x${window.screen.height || 0}`,
    colorDepth: window.screen.colorDepth || 24,
    devicePixelRatio: window.devicePixelRatio || 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    timezoneOffset: new Date().getTimezoneOffset() ?? 0,
    hardwareConcurrency: navigator.hardwareConcurrency || 2,
    deviceMemory: (navigator as any).deviceMemory ?? null,
    orientation: (window.screen.orientation || {}).type || 'unknown',
    batteryLevel: battery.level ?? null,
    isCharging: battery.charging ?? null,
    adBlockerActive: adBlocker ?? false,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    webglRenderer: webgl.renderer ?? 'unknown',
    webglVendor: webgl.vendor ?? 'unknown',
    localIp: localIp ?? 'unknown',
    publicIp: publicIp ?? 'unknown',
    incognito: incognito ?? false,
    referrer: document.referrer || 'direct',
    hostname: window.location.hostname || 'unknown',
    clientHintsBrands: clientHintsBrands ?? 'unknown',
    clientHintsMobile: clientHintsMobile ?? false,
    canvasHash: getCanvasFingerprint() ?? 'unknown',
    audioHash: audioHash ?? 'unknown',
    mathHash: getMathFingerprint() ?? 'unknown',
    cookieEnabled: navigator.cookieEnabled ?? false,
    doNotTrack: navigator.doNotTrack ?? null,
    webdriver: navigator.webdriver ?? false,
    pdfViewerEnabled: (navigator as any).pdfViewerEnabled ?? false,
    connectionType: (navigator as any).connection?.effectiveType ?? null,
    connectionDownlink: (navigator as any).connection?.downlink ?? null,
    saveData: (navigator as any).connection?.saveData ?? false,
    viewportWidth: window.innerWidth || 0,
    viewportHeight: window.innerHeight || 0,
    prefersDark: (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) || false,
    prefersReducedMotion: (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || false,
    fonts: fonts || [],
    plugins: Array.from(navigator.plugins || []).map(p => p.name),
    speechVoices: speechVoices || []
  };
  
  cachedDeviceData = data;
  return data;
}

/**
 * The main function to generate a comprehensive and stable device fingerprint.
 * It collects multiple data points and combines them into a single SHA-256 hash.
 * @returns A promise that resolves to the final 64-character fingerprint hash.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const components = await getDeviceData();
  const values = Object.values(components).map(value => {
    if (Array.isArray(value)) {
      return value.join(',');
    }
    return String(value);
  });
  const combinedString = values.join('~~~');
  return sha256(combinedString);
}

/**
 * Gathers all raw device data for telemetry purposes.
 * This is sent to the backend to be stored with the vote record for forensic analysis.
 * @returns A promise that resolves to the full device data object.
 */
export async function getFullDeviceData() {
  return await getDeviceData();
}