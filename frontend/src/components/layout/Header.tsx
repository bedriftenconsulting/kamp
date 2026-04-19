import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, LayoutDashboard, ShieldCheck, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Live Scores", path: "/live" },
  { label: "Schedule", path: "/schedule" },
  { label: "Players", path: "/players" },
  { label: "Standings", path: "/standings" },
  { label: "Results", path: "/results" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated } = (() => {
    // Handling useAuth being used potentially outside Provider during dev/test
    try {
      const auth = useAuth();
      return { ...auth, isAuthenticated: !!auth.token };
    } catch {
      return { user: null, logout: () => {}, isAuthenticated: false };
    }
  })();

  const isAdmin = user?.role === "admin";
  const isDirector = user?.role === "director";
  const isUmpire = user?.role === "umpire" || isAdmin || isDirector;

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
          
          {/* Staff Links */}
          {isAuthenticated && (
            <>
              <div className="w-px h-4 bg-primary-foreground/20 mx-2" />
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-sm text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <LayoutDashboard size={14} />
                  Admin
                </Link>
              )}
              {isDirector && (
                <Link
                  to="/director"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-sm text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <LayoutDashboard size={14} />
                  Director
                </Link>
              )}
              {isUmpire && (
                <Link
                  to="/umpire"
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-sm text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <ShieldCheck size={14} />
                  Umpire
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  <Avatar className="h-8 w-8 border-2 border-secondary/60">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-black">
                      {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="pb-1">
                  <p className="text-sm font-semibold truncate">
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.email}
                  </p>
                  {(user.first_name || user.last_name) && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                  <Badge
                    variant="secondary"
                    className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider
                      ${user.role === "admin" ? "bg-red-500/10 text-red-500" : ""}
                      ${user.role === "director" ? "bg-blue-500/10 text-blue-500" : ""}
                      ${user.role === "umpire" ? "bg-green-500/10 text-green-500" : ""}
                      ${user.role === "user" ? "bg-slate-500/10 text-slate-500" : ""}
                    `}
                  >
                    {user.role}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                >
                  <LogOut size={14} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button
                variant="secondary"
                size="sm"
                className="font-bold"
              >
                Sign In
              </Button>
            </Link>
          )}
          
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
            
            {isAuthenticated && (
              <>
                <div className="h-px bg-primary-foreground/10 my-2" />
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-3 text-sm font-medium rounded-sm text-primary-foreground/80"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {isDirector && (
                  <Link
                    to="/director"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-3 text-sm font-medium rounded-sm text-primary-foreground/80"
                  >
                    Director Dashboard
                  </Link>
                )}
                {isUmpire && (
                  <Link
                    to="/umpire"
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-3 text-sm font-medium rounded-sm text-primary-foreground/80"
                  >
                    Umpire Scoring
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
