import { useEffect, useMemo, useState } from "react";
import { API_V1_URL } from "@/lib/api-url";
import { useAuth } from "@/components/auth/AuthContext";
import Loader from "@/components/ui/loader";
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Calendar, 
  Blocks, 
  Zap, 
  Settings,
  ChevronRight,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminDashboard from "./AdminDashboard"; // We will reuse the internal parts if possible, but for now we create a focused view

export default function DirectorDashboard() {
  const { user, token } = useAuth();
  const [assignedTournaments, setAssignedTournaments] = useState<any[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssigned = async () => {
      try {
        const res = await fetch(`${API_V1_URL}/tournaments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        // Filter tournaments where the user is the director
        const filtered = data.filter((t: any) => t.director_id === user?.id);
        setAssignedTournaments(filtered);
        
        if (filtered.length === 1) {
          setSelectedTournamentId(filtered[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch assigned tournaments", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssigned();
  }, [user, token]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;
  }

  // If a tournament is selected, we show the management interface
  // We can actually use the AdminDashboard component but "lock" the tournament selection
  if (selectedTournamentId) {
    return (
      <div className="relative">
        <Button 
          variant="outline" 
          size="sm" 
          className="absolute top-4 left-4 z-50 gap-2"
          onClick={() => setSelectedTournamentId(null)}
        >
          <Trophy size={14} />
          Switch Tournament
        </Button>
        <AdminDashboard forcedTournamentId={selectedTournamentId} />
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black mb-2">Director Portal</h1>
          <p className="text-muted-foreground text-lg">
            Manage the tournaments assigned to you by the organization.
          </p>
        </div>
        <Link to="/">
          <Button variant="outline" className="gap-2">
            <Globe size={18} />
            Go to Website
          </Button>
        </Link>
      </div>

      {assignedTournaments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Trophy size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium">No tournaments assigned yet.</p>
            <p>Contact a Super Admin if you believe this is an error.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignedTournaments.map((t) => (
            <Card key={t.id} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setSelectedTournamentId(t.id)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-2xl font-black">{t.name}</CardTitle>
                  <CardDescription>{t.location} • {t.status}</CardDescription>
                </div>
                <ChevronRight className="text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
