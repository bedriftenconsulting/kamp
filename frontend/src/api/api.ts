import { API_V1_URL } from "@/lib/api-url";

const BASE_URL = API_V1_URL;

export const api = {
  getTournaments: async () => {
    const res = await fetch(`${BASE_URL}/tournaments`);
    return res.json();
  },

  getMatches: async () => {
    const res = await fetch(`${BASE_URL}/matches`);
    return res.json();
  },

  getMatchState: async (matchId: string) => {
    const res = await fetch(`${BASE_URL}/matches/${matchId}/state`);
    return res.json();
  },

  addPoint: async (matchId: string, player: number) => {
    const res = await fetch(`${BASE_URL}/matches/${matchId}/point`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ player }),
    });
    return res.json();
  },

  updateMatch: async (matchId: string, matchData: any) => {
    const res = await fetch(`${BASE_URL}/matches/${matchId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(matchData),
    });
    return res.json();
  },
};
