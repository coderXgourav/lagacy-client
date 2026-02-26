import { NavLink } from "react-router-dom";
import {
    Share2,
    Calendar,
    LayoutDashboard,
    Sparkles,
    BarChart
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { to: "/social-media", label: "Dashboard", icon: LayoutDashboard },
    // Add other social media routes here if they exist
];

export function SocialMediaSidebar() {
    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-sidebar-background to-sidebar-background/95 border-r border-sidebar-border flex flex-col shadow-xl">
            <div className="p-6 border-b border-sidebar-border bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                            <Share2 className="w-6 h-6 text-white relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar-background animate-pulse"></div>
                    </div>
                    <div>
                        <h1 className="text-sidebar-foreground font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                            SOCIAL MEDIA
                        </h1>
                        <p className="text-muted-foreground text-xs font-medium">Auto Publisher</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-2 mt-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/social-media"}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group relative overflow-hidden",
                                isActive
                                    ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hover:shadow-md"
                            )
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    isActive ? "bg-white/20" : "bg-muted/50 group-hover:bg-muted"
                                )}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className={cn(
                                    "font-semibold transition-transform group-hover:translate-x-0.5",
                                    isActive && "text-white"
                                )}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 space-y-3">
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent rounded-2xl p-5 border border-indigo-500/20 shadow-lg">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl"></div>
                    <div className="relative z-10 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-500/20">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                            </div>
                            <p className="text-foreground text-sm font-bold">Auto Sync Active</p>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                            Uploads are automatically scheduled and synced with connected APIs.
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
