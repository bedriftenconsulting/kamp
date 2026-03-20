import { Link } from "react-router-dom";
import { ArrowRight, Calendar, MapPin, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import ScoreCard from "@/components/matches/ScoreCard";
import { motion } from "framer-motion";

export default function Index() {
  const [matches, setMatches] = useState<any[]>([]);
  const [tournament, setTournament] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesRes, tournamentRes] = await Promise.all([
          fetch("http://localhost:8080/api/v1/matches"),
          fetch("http://localhost:8080/api/v1/tournaments"),
        ]);

        const matchesData = await matchesRes.json();
        const tournamentData = await tournamentRes.json();

        // ✅ Ensure tournament exists
        if (!tournamentData || tournamentData.length === 0) {
          setTournament(null);
          return;
        }

        const t = tournamentData[0];

        // ✅ Transform tournament
        const formattedTournament = {
          name: t.name,
          location: t.location,
          startDate: t.start_date,
          endDate: t.end_date,
          status: t.status,
          surface: t.surface ?? "unknown",
        };


        // ✅ Transform matches (FIXED STRUCTURE)
        const formattedMatches = matchesData.map((m: any) => ({
          id: m.id,
          status: m.status,
          player1: {
            name: m.player1_name,
            country: "unknown",
          },
          player2: {
            name: m.player2_name,
            country: "unknown",
          },
          scheduledTime: m.scheduled_time,
        }));

        setTournament(formattedTournament);
        setMatches(formattedMatches);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Correct filtering
  const liveMatches = matches.filter((m) => m.status === "live");
  const upcomingMatches = matches.filter(
    (m) => m.status === "scheduled"
  );

  // ✅ Safe loading states
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  if (!tournament) {
    return <div className="p-10 text-center">No tournament found</div>;
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(73_100%_50%_/_0.08),_transparent_60%)]" />

        <div className="container relative py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="px-3 py-1 text-xs font-bold uppercase bg-secondary text-secondary-foreground rounded-sm tracking-wider">
                {tournament.status === "scheduled"
                  ? "Coming Soon"
                  : "Now Playing"}
              </span>

              <span className="px-3 py-1 text-xs font-medium uppercase bg-primary-foreground/10 text-primary-foreground rounded-sm">
                {tournament.surface}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-primary-foreground leading-[1.1] mb-4">
              {tournament.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-8 text-primary-foreground/70">
              <span className="flex items-center gap-1.5 text-sm">
                <Calendar size={16} />
                {new Date(tournament.startDate).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric" }
                )}
                {" – "}
                {new Date(tournament.endDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }
                )}
              </span>

              <span className="flex items-center gap-1.5 text-sm">
                <MapPin size={16} />
                {tournament.location}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/live">
                <Button className="gap-2 font-bold">
                  <Zap size={18} />
                  Live Scores
                </Button>
              </Link>

              <Link to="/schedule">
                <Button variant="outline" className="gap-2">
                  <Calendar size={18} />
                  View Schedule
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <section className="py-12 bg-background">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">Live Now</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMatches.map((match) => (
                <ScoreCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6">Coming Up</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map((match) => (
                <ScoreCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tournament Info */}
      <section className="py-12 bg-background">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-md">
            <Trophy className="mb-3" />
            <h3 className="font-bold">2 Categories</h3>
            <p className="text-sm text-muted-foreground">
              Men & Women Singles
            </p>
          </div>

          <div className="p-6 border rounded-md">
            <MapPin className="mb-3" />
            <h3 className="font-bold">{tournament.venue}</h3>
            <p className="text-sm text-muted-foreground">
              {tournament.location}
            </p>
          </div>

          <div className="p-6 border rounded-md">
            <Calendar className="mb-3" />
            <h3 className="font-bold">Tournament Duration</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(tournament.startDate).toLocaleDateString()} -{" "}
              {new Date(tournament.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}