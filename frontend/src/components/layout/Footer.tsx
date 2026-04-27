import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <svg width="28" height="28" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="15" cy="15" r="14" fill="hsl(73 100% 50%)"/>
                <path d="M3 10.5 Q15 15.5 27 10.5" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                <path d="M3 19.5 Q15 14.5 27 19.5" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
              </svg>
              <span className="font-black text-primary-foreground text-xl tracking-[-0.04em]">KAMP</span>
            </div>
            <p className="text-primary-foreground/60 text-sm leading-relaxed">
              The premier international tennis tournament featuring the world's best players.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-primary-foreground/40">Tournament</h4>
            <div className="flex flex-col gap-2">
              <Link to="/schedule" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors">Schedule</Link>
              <Link to="/live" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors">Live Scores</Link>
              <Link to="/players" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors">Players</Link>
              <Link to="/results" className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors">Results</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-primary-foreground/40">Information</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-primary-foreground/70">Venue & Courts</span>
              <span className="text-sm text-primary-foreground/70">Rules & Format</span>
              <span className="text-sm text-primary-foreground/70">Contact Us</span>
              <span className="text-sm text-primary-foreground/70">Press</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-primary-foreground/40">Follow</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-primary-foreground/70">Twitter / X</span>
              <span className="text-sm text-primary-foreground/70">Instagram</span>
              <span className="text-sm text-primary-foreground/70">YouTube</span>
            </div>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-xs text-primary-foreground/40">
          © 2026 Grand Slam Open. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
