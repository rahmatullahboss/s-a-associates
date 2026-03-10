/**
 * Facebook Pixel + Conversions API (CAPI) utility
 *
 * Usage:
 *   pixel.track('Lead', { content_name: 'Consultation' }, eventId?)
 *   pixel.trackWithCAPI('Lead', { content_name: 'Consultation' }, { email, phone, fbc, fbp })
 *
 * Fixes applied:
 * - Double PageView prevented: initPixelScript does NOT fire PageView; PageViewTracker owns that
 * - Pre-init queue: events queued before fbevents.js loads are flushed on script load
 * - XSS-safe Google Analytics injection via textContent, not innerHTML
 * - No arbitrary string interpolation into script bodies
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/** Generate a UUID for event deduplication */
export function generateEventId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Read a cookie value by name */
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[2]) : undefined;
}

/** Get _fbp and _fbc cookies that Meta sets automatically */
export function getMetaCookies() {
  return {
    fbp: getCookie('_fbp'),
    fbc: getCookie('_fbc'),
  };
}

export type PixelEventData = Record<string, string | number | boolean | undefined>;

export interface CAPIUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  fbc?: string;
  fbp?: string;
}

// ── Internal fbq stub initialiser ────────────────────────────────────────────
function installFbqStub() {
  if (typeof window === 'undefined') return;
  if (window._fbq) return; // already installed

  const n = function (...args: unknown[]) {
    const self = n as unknown as { q: unknown[]; callMethod?: (...a: unknown[]) => void };
    if (self.callMethod) {
      self.callMethod(...args);
    } else {
      self.q.push(args);
    }
  } as unknown as Window['fbq'];
  (n as unknown as { q: unknown[] }).q = [];
  window._fbq = n;
  window.fbq = n;
}

const pixel = {
  /** Fire a standard Pixel event (client-side only) */
  track(eventName: string, data?: PixelEventData, eventId?: string) {
    if (typeof window === 'undefined' || !window.fbq) return;
    const options = eventId ? { eventID: eventId } : {};
    window.fbq('track', eventName, data ?? {}, options);
  },

  /** Fire a custom Pixel event (client-side only) */
  trackCustom(eventName: string, data?: PixelEventData, eventId?: string) {
    if (typeof window === 'undefined' || !window.fbq) return;
    const options = eventId ? { eventID: eventId } : {};
    window.fbq('trackCustom', eventName, data ?? {}, options);
  },

  /**
   * Fire event on BOTH client-side Pixel AND server-side CAPI.
   * Deduplication via shared event_id.
   * Returns a result object so callers can optionally handle errors.
   */
  async trackWithCAPI(
    eventName: string,
    eventData?: PixelEventData,
    userData?: CAPIUserData
  ): Promise<{ capiSuccess: boolean; capiSkipped?: boolean }> {
    const eventId = generateEventId();
    const { fbp, fbc } = getMetaCookies();

    // 1. Fire client-side Pixel
    pixel.track(eventName, eventData, eventId);

    // 2. Fire server-side CAPI
    try {
      // Send user_data fields flat (track.ts schema expects flat fields, not nested)
      // Also include event_source_url for better match quality
      const res = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          event_name: eventName,
          event_id: eventId,
          event_source_url: typeof window !== 'undefined' ? window.location.href : undefined,
          event_data: eventData ?? {},
          email: userData?.email,
          phone: userData?.phone,
          first_name: userData?.firstName,
          last_name: userData?.lastName,
          fbc: userData?.fbc ?? fbc,
          fbp: userData?.fbp ?? fbp,
        }),
      });

      const result = await res.json() as Record<string, unknown>;

      if (!res.ok) {
        console.error('[CAPI] Server returned error:', result);
        return { capiSuccess: false };
      }

      if (result['skipped']) return { capiSuccess: true, capiSkipped: true };
      return { capiSuccess: true };
    } catch (err) {
      // CAPI failure must never break user experience — log and continue
      console.warn('[CAPI] Failed to send server-side event:', err);
      return { capiSuccess: false };
    }
  },
};

export default pixel;

/**
 * Inject the Facebook Pixel <script> tag into <head> and initialise the stub.
 * Does NOT fire PageView — PageViewTracker in App.tsx owns that responsibility.
 * This prevents the double-PageView race condition on initial load.
 */
export function initPixelScript(pixelId: string) {
  if (typeof document === 'undefined') return;
  if (document.getElementById('fb-pixel-script')) return; // already injected

  // Install the fbq stub first so any queued calls work before script loads
  installFbqStub();

  // fbq('init') — registers the Pixel ID
  if (window.fbq) {
    window.fbq('init', pixelId);
  }

  // Load fbevents.js asynchronously
  const script = document.createElement('script');
  script.id = 'fb-pixel-script';
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  // noscript fallback
  const noscript = document.createElement('noscript');
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.head.appendChild(noscript);
}

/**
 * Inject Google Analytics (gtag.js) into <head>.
 * XSS-safe: uses DOM API instead of innerHTML string interpolation.
 */
/** Initialise Microsoft Clarity session recording.
 *  Uses the official snippet pattern from learn.microsoft.com/clarity
 */
export function initClarity(projectId: string): void {
  if (typeof window === 'undefined') return;
  if (document.getElementById('ms-clarity-script')) return; // already loaded
  if (!/^[a-zA-Z0-9]{8,20}$/.test(projectId)) {
    console.warn('[Clarity] Invalid project ID format — skipping init');
    return;
  }

  // Official Microsoft Clarity snippet — DOM API version (XSS-safe, no innerHTML)
  // Equivalent to: (function(c,l,a,r,i,t,y){...})(window,document,"clarity","script",projectId)
  type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };
  const w = window as unknown as Record<string, unknown>;

  // Install stub — queues calls until clarity.js loads
  if (!w['clarity']) {
    const stub: ClarityFn = function (...args: unknown[]) {
      (stub.q = stub.q || []).push(args as unknown[]);
    };
    stub.q = [];
    w['clarity'] = stub;
  }

  // Inject script using insertBefore (official pattern) instead of appendChild
  const script = document.createElement('script');
  script.id = 'ms-clarity-script';
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }
}

/**
 * Initialise Google Analytics 4 (gtag.js).
 * Per GA4 SPA docs (developers.google.com/analytics/devguides/collection/ga4/single-page-applications):
 * - send_page_view: false — disables automatic pageview on init
 * - PageViewTracker in App.tsx fires manual page_view on every route change
 * This prevents double-counting the initial page load.
 */
export function initGoogleAnalytics(gaId: string) {
  if (typeof document === 'undefined') return;
  if (document.getElementById('ga-script')) return;

  // Validate GA ID format (G-XXXXXXXXXX) before injecting
  if (!/^G-[A-Z0-9]+$/.test(gaId)) {
    console.warn('[GA] Invalid GA Measurement ID format:', gaId);
    return;
  }

  // Load gtag.js async
  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(script);

  // Initialise dataLayer + gtag stub (XSS-safe, no innerHTML)
  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());

  // ✅ SPA fix: disable automatic pageview — PageViewTracker handles this manually
  window.gtag('config', gaId, { send_page_view: false });
}

/**
 * Fire a manual GA4 page_view event — call on every React Router navigation.
 * Required for SPAs per GA4 docs.
 */
export function trackGAPageView(gaId: string, path: string) {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_location: window.location.origin + path,
    page_title: document.title,
    send_to: gaId,
  });
}
