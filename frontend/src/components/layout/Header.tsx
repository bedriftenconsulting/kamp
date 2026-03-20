import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Live Scores", path: "/live" },
  { label: "Schedule", path: "/schedule" },
  { label: "Players", path: "/players" },
  { label: "Results", path: "/results" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-primary/80">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-sm bg-secondary flex items-center justify-center font-display font-black text-secondary-foreground text-sm">
            K
          </div>
          <span className="font-display font-bold text-primary-foreground text-lg tracking-tight hidden sm:block">
            Kamp
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 text-sm font-medium rounded-sm transition-colors ${
                location.pathname === item.path
                  ? "bg-secondary text-secondary-foreground"
                  : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/admin">
            <Button size="sm" variant="outline" className="hidden md:inline-flex border-primary-foreground/30 text-primary hover:bg-primary-foreground/20 hover:text-primary">
              Admin
            </Button>
          </Link>
          <Link to="/umpire">
            <Button size="sm" className="hidden md:inline-flex bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold">
              Umpire
            </Button>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-primary-foreground p-2"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-primary border-t border-primary-foreground/10 animate-slide-in-right">
          <nav className="container py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`px-3 py-3 text-sm font-medium rounded-sm ${
                  location.pathname === item.path
                    ? "bg-secondary text-secondary-foreground"
                    : "text-primary-foreground/80"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-2 px-3">
              <Link to="/admin" onClick={() => setMobileOpen(false)}>
                <Button size="sm" variant="outline" className="border-primary-foreground/30 text-primary hover:bg-primary-foreground/20 hover:text-primary">
                  Log In
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
