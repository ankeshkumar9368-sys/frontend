import { auth } from './firebase';

export const getApiUrl = (path: string) => {
  if (typeof window !== "undefined") {
    const isCapacitor = (window as any).Capacitor;
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(window.location.hostname);
    const isStaticHost = window.location.hostname.includes("mule.page") || 
                         window.location.hostname === "localhost" || 
                         window.location.hostname === "127.0.0.1" ||
                         isIP;

    if (isCapacitor || isStaticHost) {
      const isProdBuild = process.env.NODE_ENV === "production";
      let baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://4ld2sp7a.mule.page";

      if (isProdBuild) {
        // Only override truly local/LAN addresses — never override tunnel or cloud URLs
        const isReallyLocal = baseUrl.includes("10.0.2.2") || 
                           baseUrl.includes("localhost") || 
                           baseUrl.includes("127.0.0.1") || 
                           /https?:\/\/192\.168\.\d{1,3}\.\d{1,3}/.test(baseUrl) ||
                           (/https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(baseUrl) && !baseUrl.includes("trycloudflare.com"));
        if (isReallyLocal) {
          baseUrl = "https://bring-squad-visited-residential.trycloudflare.com";
        }
      } else {
        // Swap 10.0.2.2 to localhost for desktop browsers during local dev
        if (!isCapacitor && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && baseUrl.includes("10.0.2.2")) {
          baseUrl = baseUrl.replace("10.0.2.2", "localhost");
        }
      }

      return `${baseUrl.replace(/\/$/, '')}${path}`;
    }
  }
  return path;
};

export async function pollJob(jobId: string, intervalMs = 2000, timeoutMs = 60000) {
  const start = Date.now();
  
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          return reject(new Error("Request timed out. Please try again."));
        }

        const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : "";
        const headers: any = {
          "Bypass-Tunnel-Reminder": "true"
        };
        if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

        const res = await fetch(getApiUrl(`/api/job-status/${jobId}`), { headers });
        const data = await res.json();

        if (data.status === 'completed') {
          clearInterval(interval);
          resolve(data.result);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          reject(new Error(data.error || "Job failed"));
        }
      } catch (e) {
        clearInterval(interval);
        reject(e);
      }
    };

    const interval = setInterval(poll, intervalMs);
    poll(); // Initial check
  });
}

export async function fetchAI(url: string, body: any) {
  const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : "";
  const headers: any = { 
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true"
  };
  if (idToken) headers["Authorization"] = `Bearer ${idToken}`;

  const res = await fetch(getApiUrl(url), {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const error = await res.json();
      errorMsg = error.error || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const data = await res.json();
  
  if (data.status === 'queued') {
    return await pollJob(data.jobId);
  }

  return data;
}
