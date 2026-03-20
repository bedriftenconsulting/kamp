import { matches, formatGameScore } from "@/data/mockData";
import { Link } from "react-router-dom";

export default function LiveTicker() {
  const liveMatches = matches.filter((m) => m.status === "live");
  if (liveMatches.length === 0) return null;

  const tickerContent = liveMatches.map((match) => {
    const gameScore = match.score ? formatGameScore(match.score.currentGame) : ["0", "0"];
    return (
      <div key={match.id} className="inline-flex items-center gap-4 px-6 whitespace-nowrap">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-live animate-pulse-live" />
          <span className="text-xs font-semibold uppercase text-live">LIVE</span>
        </span>
        <span className="font-semibold text-sm text-primary-foreground">{match.player1.name}</span>
        <span className="score-font text-sm font-bold text-secondary">
          {match.score?.sets.map((s) => s[0]).join(" ")} <span className="text-primary-foreground/40">·</span> {gameScore[0]}
        </span>
        <span className="text-primary-foreground/40 text-xs">vs</span>
        <span className="score-font text-sm font-bold text-secondary">
          {gameScore[1]} <span className="text-primary-foreground/40">·</span> {match.score?.sets.map((s) => s[1]).join(" ")}
        </span>
        <span className="font-semibold text-sm text-primary-foreground">{match.player2.name}</span>
        <span className="text-xs text-primary-foreground/50">{match.round}</span>
        <span className="w-px h-4 bg-primary-foreground/20 mx-2" />
      </div>
    );
  });

  return (
    <Link to="/live" className="block bg-primary/95 backdrop-blur border-b border-primary-foreground/5 overflow-hidden">
      <div className="flex animate-ticker-scroll">
        {tickerContent}
        {tickerContent}
      </div>
    </Link>
  );
}
