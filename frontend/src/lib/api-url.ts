const envApiUrl = import.meta.env.VITE_API_URL?.trim() || "";
const fallbackApiUrl = import.meta.env.PROD
  ? "/api/proxy"
  : "http://localhost:8080";

if (!envApiUrl) {
  console.warn(
    `[API] VITE_API_URL is not set. Falling back to ${fallbackApiUrl}`,
  );
}

export const API_URL = (envApiUrl || fallbackApiUrl).replace(/\/$/, "");
export const API_V1_URL = `${API_URL}/api/v1`;
export const WS_URL = API_URL.replace(/^http/i, "ws");
