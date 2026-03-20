export interface Player {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  ranking: number;
  seed?: number;
  wins: number;
  losses: number;
  image?: string;
}

export interface MatchScore {
  sets: [number, number][];
  currentGame: [number, number];
  servingPlayer: 0 | 1;
  tiebreak?: boolean;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: string;
  court: string;
  scheduledTime: string;
  status: "upcoming" | "live" | "completed";
  player1: Player;
  player2: Player;
  score?: MatchScore;
  winner?: string;
  umpireId?: string;
  category: string;
}

export interface Tournament {
  id: string;
  name: string;
  location: string;
  venue: string;
  startDate: string;
  endDate: string;
  categories: string[];
  surface: string;
  description: string;
  status: "upcoming" | "active" | "completed";
}

export const players: Player[] = [
  { id: "p1", name: "Carlos Alcaraz", country: "Spain", countryCode: "ES", ranking: 1, seed: 1, wins: 14, losses: 2 },
  { id: "p2", name: "Jannik Sinner", country: "Italy", countryCode: "IT", ranking: 2, seed: 2, wins: 12, losses: 3 },
  { id: "p3", name: "Novak Djokovic", country: "Serbia", countryCode: "RS", ranking: 3, seed: 3, wins: 15, losses: 1 },
  { id: "p4", name: "Alexander Zverev", country: "Germany", countryCode: "DE", ranking: 4, seed: 4, wins: 11, losses: 4 },
  { id: "p5", name: "Daniil Medvedev", country: "Russia", countryCode: "RU", ranking: 5, seed: 5, wins: 10, losses: 5 },
  { id: "p6", name: "Andrey Rublev", country: "Russia", countryCode: "RU", ranking: 6, seed: 6, wins: 9, losses: 4 },
  { id: "p7", name: "Hubert Hurkacz", country: "Poland", countryCode: "PL", ranking: 7, seed: 7, wins: 8, losses: 5 },
  { id: "p8", name: "Casper Ruud", country: "Norway", countryCode: "NO", ranking: 8, seed: 8, wins: 7, losses: 6 },
];

export const tournament: Tournament = {
  id: "t1",
  name: "Grand Slam Open 2026",
  location: "Melbourne, Australia",
  venue: "Rod Laver Arena",
  startDate: "2026-03-20",
  endDate: "2026-04-02",
  categories: ["Men's Singles", "Women's Singles", "Men's Doubles", "Women's Doubles", "Mixed Doubles"],
  surface: "Hard Court",
  description: "The premier international tennis tournament featuring the world's top-ranked players competing across five categories. Experience two weeks of world-class tennis at the iconic Rod Laver Arena.",
  status: "active",
};

export const matches: Match[] = [
  {
    id: "m1", tournamentId: "t1", round: "Quarter-Final", court: "Centre Court",
    scheduledTime: "2026-03-17T14:00:00Z", status: "live",
    player1: players[0], player2: players[3],
    score: { sets: [[6, 4], [3, 6], [4, 3]], currentGame: [30, 15], servingPlayer: 0 },
    category: "Men's Singles",
  },
  {
    id: "m2", tournamentId: "t1", round: "Quarter-Final", court: "Court 1",
    scheduledTime: "2026-03-17T15:00:00Z", status: "live",
    player1: players[1], player2: players[4],
    score: { sets: [[7, 6], [5, 4]], currentGame: [40, 30], servingPlayer: 1 },
    category: "Men's Singles",
  },
  {
    id: "m3", tournamentId: "t1", round: "Quarter-Final", court: "Court 2",
    scheduledTime: "2026-03-17T16:00:00Z", status: "upcoming",
    player1: players[2], player2: players[5],
    category: "Men's Singles",
  },
  {
    id: "m4", tournamentId: "t1", round: "Round of 16", court: "Centre Court",
    scheduledTime: "2026-03-16T14:00:00Z", status: "completed",
    player1: players[0], player2: players[7],
    score: { sets: [[6, 3], [6, 4]], currentGame: [0, 0], servingPlayer: 0 },
    winner: "p1",
    category: "Men's Singles",
  },
  {
    id: "m5", tournamentId: "t1", round: "Round of 16", court: "Court 1",
    scheduledTime: "2026-03-16T15:00:00Z", status: "completed",
    player1: players[1], player2: players[6],
    score: { sets: [[6, 7], [7, 5], [6, 2]], currentGame: [0, 0], servingPlayer: 0 },
    winner: "p2",
    category: "Men's Singles",
  },
  {
    id: "m6", tournamentId: "t1", round: "Quarter-Final", court: "Court 3",
    scheduledTime: "2026-03-17T18:00:00Z", status: "upcoming",
    player1: players[6], player2: players[7],
    category: "Men's Singles",
  },
];

export const getCountryFlag = (countryCode: string) =>
  `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;

export const formatGameScore = (score: [number, number]): [string, string] => {
  const map: Record<number, string> = { 0: "0", 15: "15", 30: "30", 40: "40" };
  return [map[score[0]] ?? String(score[0]), map[score[1]] ?? String(score[1])];
};
