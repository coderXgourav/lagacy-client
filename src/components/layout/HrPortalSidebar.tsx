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
        <aside className="w-[280px] min-h-screen relative flex flex-col z-50">
            {/* Glass Background Layer */}
            <div className="absolute inset-0 bg-[#0B1120]/90 backdrop-blur-3xl border-r border-white/5 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.3)] z-0" />

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Header / Logo Section */}
                <div className="px-6 py-8 mb-2">
                    <button 
                        onClick={() => navigate('/offerings')} 
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-xs font-medium uppercase tracking-wider group"
                    >
                        <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                        Back to Offerings
                    </button>
                    
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Gem className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-xl tracking-tight leading-none">
                                HR Nexus
                            </h1>
                            <span className="text-indigo-400/80 text-xs font-semibold tracking-widest mt-1 block">
                                ENTERPRISE
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-4">
                    <div className="px-4 pb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Main Menu</p>
                    </div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/hr-portal"}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                                    isActive
                                        ? "bg-gradient-to-r from-indigo-500/10 to-violet-500/5 text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.1)] border border-indigo-500/10"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon 
                                        className={cn(
                                            "w-5 h-5 transition-colors duration-300", 
                                            isActive ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "text-slate-500 group-hover:text-slate-300"
                                        )} 
                                    />
                                    <span className={cn("font-medium tracking-wide text-sm", isActive ? "font-semibold" : "")}>
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-indigo-400 rounded-r-full shadow-[0_0_12px_2px_rgba(99,102,241,0.4)]" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 mt-auto border-t border-white/5 space-y-1 bg-[#0B1120]/50 backdrop-blur-md">
                    <button
                        onClick={() => navigate('/hr-portal/settings')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-all group"
                    >
                        <Settings className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                        <span>Settings</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
                    >
                        <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                        <span>Logout</span>
                    </button>
                    
                    <div className="pt-4 px-2 pb-2">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-[#0F172A]">
                                KL
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-semibold text-white truncate">Kyptronix LLP</p>
                                <p className="text-[10px] text-indigo-400 truncate">Pro Plan Active</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
