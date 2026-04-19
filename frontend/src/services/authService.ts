import { API_V1_URL } from "@/lib/api-url";

const AUTH_URL = `${API_V1_URL}/auth`;

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "user" | "umpire" | "admin" | "director";
  tournament_id?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (credentials: any): Promise<LoginResponse> => {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Login failed");
    }
    return res.json();
  },

  register: async (data: any): Promise<void> => {
    const res = await fetch(`${AUTH_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || "Registration failed");
    }
  },

  getProfile: async (token: string): Promise<User> => {
    const res = await fetch(`${API_V1_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Session expired");
    return res.json();
  },
};
