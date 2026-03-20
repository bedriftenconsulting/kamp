import { API_V1_URL } from "@/lib/api-url";

export const getMatches = async () => {
  const res = await fetch(`${API_V1_URL}/matches`);
  return res.json();
};