import { API_V1_URL } from "@/lib/api-url";

const BASE_URL = API_V1_URL;

export const api = {
  getMatches: async () => {
    const res = await fetch(`${BASE_URL}/matches`);
    return res.json();
  },

  addPoint: async (matchId: string, player: number) => {
    await fetch(`${BASE_URL}/matches/${matchId}/point`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ player }),
    });
  },
};