export interface Player {
  id: string;
  name: string;
  country: string;
  ranking: number;
  seed?: number;
  wins?: number;
  losses?: number;
}