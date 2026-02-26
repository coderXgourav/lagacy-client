import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    UserPlus,
    LineChart,
    Wallet,
    LogOut,
    ArrowLeft,
    Settings,
    Gem
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { to: "/hr-portal", label: "Dashboard", icon: LayoutDashboard },
    { to: "/hr-portal/employees", label: "Employees", icon: Users },
    { to: "/hr-portal/recruitment", label: "Recruitment", icon: UserPlus },
    { to: "/hr-portal/#/performance", label: "Performance", icon: LineChart },
    { to: "/hr-portal/#/payroll", label: "Payroll", icon: Wallet },
];

export function HrPortalSidebar() {
    const location = useLocation();

    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-sidebar-background to-sidebar-background/95 border-r border-sidebar-border flex flex-col shadow-xl">
            <div className="p-6 border-b border-sidebar-border bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
                            <Users className="w-6 h-6 text-white relative z-10 group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                    <div>
                        <h1 className="text-sidebar-foreground font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                            HR NEXUS
                        </h1>
                        <p className="text-muted-foreground text-xs font-medium">Enterprise HR</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-2 mt-2">
                {navItems.map((item) => {
                    const hasHash = item.to.includes('#');
                    const targetHash = hasHash ? item.to.substring(item.to.indexOf('#')) : "";

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/hr-portal"}
                            className={({ isActive }) => {
                                const isReallyActive = hasHash
                                    ? location.hash === targetHash
                                    : (item.to === "/hr-portal" ? isActive && !location.hash.startsWith('#/') : isActive);

                                return cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group relative overflow-hidden",
                                    isReallyActive
                                        ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground hover:shadow-md"
                                )
                            }}
                        >
                            {({ isActive }) => {
                                const isReallyActive = hasHash
                                    ? location.hash === targetHash
                                    : (item.to === "/hr-portal" ? isActive && !location.hash.startsWith('#/') : isActive);

                                return (
                                    <>
                                        <div className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            isReallyActive ? "bg-white/20" : "bg-muted/50 group-hover:bg-muted"
                                        )}>
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className={cn(
                                            "font-semibold transition-transform group-hover:translate-x-0.5",
                                            isReallyActive && "text-white"
                                        )}>
                                            {item.label}
                                        </span>
                                        {isReallyActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
                                        )}
                                    </>
                                )
                            }}
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}
