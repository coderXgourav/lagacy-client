import { Link, useLocation } from "react-router-dom";
import { Calendar, Search, History, Settings } from "lucide-react";

export default function NewDomainSidebar() {
  const location = useLocation();

  const menuItems = [
    { icon: Calendar, label: "Dashboard", path: "/new-domain" },
    { icon: Search, label: "New Search", path: "/new-domain/search" },
    { icon: History, label: "Recent Searches", path: "/new-domain/recent-searches" },
    { icon: Settings, label: "Settings", path: "/new-domain/settings" },
  ];

  return (
    <aside className="w-64 bg-card border-r min-h-screen p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-primary/10">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">New Domain Tracker</h2>
          <p className="text-xs text-muted-foreground">Track new domains</p>
        </div>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <p className="text-sm font-semibold mb-2">💡 Pro Tip</p>
        <p className="text-xs text-muted-foreground">
          Track domains registered in the last 30 days to reach new businesses early
        </p>
      </div>
    </aside>
  );
}
