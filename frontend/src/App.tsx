import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import LiveScores from "./pages/LiveScores";
import Schedule from "./pages/Schedule";
import Players from "./pages/Players";
import Standings from "./pages/Standings";
import Results from "./pages/Results";
import UmpireScoring from "./pages/UmpireScoring";
import AdminDashboard from "./pages/AdminDashboard";
import DirectorDashboard from "./pages/DirectorDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";
import PublicLayout from "./components/layout/PublicLayout";
import { AuthProvider } from "./components/auth/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { TournamentProvider } from "./components/tournament/TournamentContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <TournamentProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Management Routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
            
            <Route
              path="/director"
              element={
                <ProtectedRoute allowedRoles={["admin", "director"]}>
                  <DirectorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/umpire"
              element={
                <ProtectedRoute allowedRoles={["admin", "umpire", "director"]}>
                  <UmpireScoring />
                </ProtectedRoute>
              }
            />

            {/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/live" element={<LiveScores />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/players" element={<Players />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/results" element={<Results />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </TournamentProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
