import { Link, useLocation } from "react-router-dom";
import { Sparkles, LayoutDashboard, Settings } from "lucide-react";

export function DomainScraperSidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-card border-r min-h-screen p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Domain Scraper</h2>
          <p className="text-xs text-muted-foreground">Auto-scrape domains</p>
        </div>
      </div>

      <nav className="space-y-2">
        <Link
          to="/domain-scraper"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive("/domain-scraper")
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="font-medium">Dashboard</span>
        </Link>

        <Link
          to="/domain-scraper/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isActive("/domain-scraper/settings")
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="font-medium">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
