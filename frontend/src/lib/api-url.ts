const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const API_URL = rawApiUrl.replace(/\/$/, "");
export const API_V1_URL = `${API_URL}/api/v1`;
export const WS_URL = API_URL.replace(/^http/i, "ws");
