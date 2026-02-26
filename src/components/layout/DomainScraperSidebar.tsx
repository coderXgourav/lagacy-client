import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Database,
  LayoutDashboard,
  Settings,
  ArrowLeft,
  Globe,
  Zap,
  ShieldCheck,
  Search,
  Download,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const DomainScraperSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      title: "Navigation",
      items: [
        {
          name: "Dashboard",
          icon: LayoutDashboard,
          path: "/domain-scraper",
        },
        {
          name: "Settings",
          icon: Settings,
          path: "/domain-scraper/settings",
        }
      ]
    },
    {
      title: "Quick Actions",
      items: [
        {
          name: "Recent Hits",
          icon: Zap,
          path: "/domain-scraper/#/recent",
        }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col h-full bg-gradient-to-b from-sidebar-background to-sidebar-background/95">
      <div className="p-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-sidebar-foreground">Domain Scraper</h2>
            <p className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-wider">Intel Crawler</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/*<Button
          variant="ghost"
          onClick={() => navigate("/offerings")}
          className="w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 mb-6 group transition-all"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Offerings
        </Button>*/}

        <nav className="space-y-6">
          {menuItems.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="px-2 text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.2em]">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      location.pathname === item.path
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 translate-x-1"
                        : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4",
                      location.pathname === item.path ? "text-white" : "text-sidebar-foreground/40"
                    )} />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-sidebar-border/50">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/10">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-1">
            <Globe className="w-3.5 h-3.5" />
            Live Vector
          </div>
          <p className="text-[10px] text-sidebar-foreground/50 leading-relaxed font-medium">
            Real-time domain registration stream active.
          </p>
        </div>
      </div>
    </aside>
  );
};
