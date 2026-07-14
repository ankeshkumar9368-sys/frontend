import { auth } from './firebase';

// ─── PRODUCTION BACKEND URL ────────────────────────────────────────────────
// Render dashboard URL: https://achivox-online.onrender.com
const PRODUCTION_BACKEND = 'https://achivox-online.onrender.com';

/**
 * Resolves an API path to a full backend URL.
 *
 * Rules:
 *  - In production (Vercel or Capacitor): always use the Render backend.
 *  - In local Next.js dev server (localhost, 127.0.0.1): use relative path
 *    so Next.js rewrites/API routes handle it, unless NEXT_PUBLIC_API_URL is set.
 */
export const getApiUrl = (path: string): string => {
  // Always strip trailing slash from path base and normalize
  const normalizedPath = '/' + path.replace(/^\//, '');

  // Server-side rendering: return relative path (SSR doesn't need full URL for internal calls)
  if (typeof window === 'undefined') {
    return normalizedPath;
  }

  const hostname = window.location.hostname;
  const isLocalDev =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname); // bare IP address

  // Check for Capacitor (native mobile app)
  const isCapacitor = !!(window as any).Capacitor?.isNativePlatform?.();

  // If NEXT_PUBLIC_API_URL is explicitly set, always honor it
  if (process.env.NEXT_PUBLIC_API_URL) {
    const base = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
    return `${base}${normalizedPath}`;
  }

  // Local development without env override: use relative path (Next.js dev server)
  if (isLocalDev && !isCapacitor) {
    return normalizedPath;
  }

  // Production (Vercel, Capacitor, or any other non-local host): use Render backend
  return `${PRODUCTION_BACKEND}${normalizedPath}`;
};

// ─── AUTH HELPER ───────────────────────────────────────────────────────────
/** Wait for Firebase Auth to initialize (avoids 401 on page-load race condition) */
function waitForAuth(timeoutMs = 5000): Promise<import('firebase/auth').User | null> {
  return new Promise((resolve) => {
    // Already initialized
    if (auth.currentUser !== undefined) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
    setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);
  });
}

// ─── FETCH WITH AUTH ───────────────────────────────────────────────────────
export async function fetchAI(url: string, body: any) {
  const user = await waitForAuth(5000);
  const idToken = user ? await user.getIdToken() : '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const res = await fetch(getApiUrl(url), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const error = await res.json();
      errorMsg = error.error || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const data = await res.json();

  // If backend queued the job, poll for result
  if (data.status === 'queued') {
    return await pollJob(data.jobId);
  }

  return data;
}

// ─── JOB POLLING ──────────────────────────────────────────────────────────
export async function pollJob(jobId: string, intervalMs = 2000, timeoutMs = 60000) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          return reject(new Error('Request timed out. Please try again.'));
        }

        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : '';
        const headers: Record<string, string> = {};
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

        const res = await fetch(getApiUrl(`/api/job-status/${jobId}`), { headers });
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          resolve(data.result);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          reject(new Error(data.error || 'Job failed'));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    };

    const interval = setInterval(poll, intervalMs);
    poll();
  });
}
