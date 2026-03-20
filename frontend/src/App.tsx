import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import LiveScores from "./pages/LiveScores";
import Schedule from "./pages/Schedule";
import Players from "./pages/Players";
import Results from "./pages/Results";
import UmpireScoring from "./pages/UmpireScoring";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import PublicLayout from "./components/layout/PublicLayout";
import { ScoreBoard } from "./components/ScoreBoard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/umpire" element={<UmpireScoring />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/live" element={<LiveScores />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/players" element={<Players />} />
            <Route path="/results" element={<Results />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);


export default App;
