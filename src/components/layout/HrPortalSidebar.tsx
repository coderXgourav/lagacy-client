import { NavLink, useNavigate } from "react-router-dom";
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
    { to: "/hr-portal/performance", label: "Performance", icon: LineChart },
    { to: "/hr-portal/payroll", label: "Payroll", icon: Wallet },
];

export function HrPortalSidebar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <aside className="w-[280px] min-h-screen relative flex flex-col z-50 transition-all duration-300 group/sidebar">
            {/* Premium Glass Background */}
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-2xl z-0" />
            
            {/* Gradient Border (Right) */}
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-white/20 via-white/5 to-transparent z-10" />

            {/* Content Container */}
            <div className="relative z-20 flex flex-col h-full">
                {/* Header / Logo Section */}
                <div className="px-6 py-8 mb-2">
                    <button 
                        onClick={() => navigate('/offerings')} 
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-[10px] font-bold uppercase tracking-widest hover:translate-x-1 duration-300"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Back to Offerings
                    </button>
                    
                    <div className="flex items-center gap-4 group">
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-teal-500/20 rounded-xl blur-lg group-hover:bg-teal-500/40 transition-all duration-500" />
                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300">
                                <Gem className="w-5 h-5 text-teal-400 group-hover:text-teal-300 transition-colors" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg tracking-tight leading-none group-hover:text-teal-200 transition-colors">
                                HR Nexus
                            </h1>
                            <div className="h-px w-8 bg-teal-500/50 my-1" />
                            <span className="text-teal-400/80 text-[10px] font-bold tracking-[0.2em] block">
                                ENTERPRISE
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto py-4 custom-scrollbar">
                    <div className="px-4 pb-2 flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</p>
                        <div className="h-px flex-1 bg-white/5 ml-4" />
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/hr-portal"}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-teal-500/20 via-teal-500/5 to-transparent text-white border-l-2 border-teal-500"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon 
                                        className={cn(
                                            "w-5 h-5 transition-all duration-300 opacity-80", 
                                            isActive ? "text-teal-300 scale-110 opacity-100" : "group-hover:text-white group-hover:opacity-100"
                                        )} 
                                    />
                                    <span className={cn("font-medium tracking-wide text-sm transition-all", isActive ? "translate-x-1" : "group-hover:translate-x-1")}>
                                        {item.label}
                                    </span>
                                    
                                    {/* Active Glow Background */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-teal-500/5 blur-md -z-10" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 mt-auto space-y-2">
                    {/* Floating Profile Card */}
                    <div className="relative p-0.5 rounded-2xl bg-gradient-to-br from-white/10 to-white/0 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative p-3 rounded-[14px] bg-[#022c22]/80 backdrop-blur-xl flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-purple-600 p-[1px]">
                                <div className="w-full h-full rounded-full bg-[#022c22] flex items-center justify-center text-xs font-bold text-white relative overflow-hidden">
                                     <span className="relative z-10">KP</span>
                                     <div className="absolute inset-0 bg-teal-500/20" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate group-hover:text-teal-200 transition-colors">Kyptronix LLP</p>
                                <p className="text-[10px] text-emerald-400 font-medium truncate flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Pro Plan Active
                                </p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all transform hover:rotate-90"
                                title="Logout"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
