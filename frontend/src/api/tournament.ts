export const getTournament = async () => {
  const res = await fetch("http://localhost:8080/api/tournament");
  return res.json();
};