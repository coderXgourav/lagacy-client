import { NavLink, useNavigate } from "react-router-dom";
import {
    Upload,
    LogOut,
    ArrowLeft,
    BarChart3,
    FileText,
    Inbox
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { to: "/csv-uploader", label: "Dashboard", icon: Upload },
    { to: "/csv-uploader/stats", label: "Stats", icon: BarChart3 },
    { to: "/csv-uploader/inbox", label: "Inbox", icon: Inbox },
    { to: "/csv-uploader/templates", label: "Templates", icon: FileText },
];

export function CsvUploaderSidebar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-sidebar-background to-sidebar-background/95 border-r border-sidebar-border flex flex-col shadow-xl">
            <div className="p-6 border-b border-sidebar-border bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                    <div onClick={() => navigate('/offerings')} className="cursor-pointer hover:opacity-80 transition-opacity">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-sidebar-foreground font-bold text-lg tracking-tight">
                            CSV Uploader
                        </h1>
                        <p className="text-muted-foreground text-xs font-medium">Pro Tool</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-2 mt-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/csv-uploader"}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group relative overflow-hidden",
                                isActive
                                    ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25"
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
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-all"
                >
                    <div className="p-1.5 rounded-lg bg-muted/50">
                        <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Logout</span>
                </button>
            </div>
        </aside>
    );
}
