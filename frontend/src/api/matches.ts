export const getMatches = async () => {
  const res = await fetch("http://localhost:8080/api/matches");
  return res.json();
};