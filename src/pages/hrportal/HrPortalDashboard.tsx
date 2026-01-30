import { 
    Users, 
    UserPlus, 
    Clock, 
    TrendingUp, 
    Calendar,
    Briefcase,
    MoreHorizontal,
    ArrowRight,
    Search,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

// Reusable Glass Card Component
const GlassCard = ({ className, children }: { className?: string, children: React.ReactNode }) => (
    <div className={cn(
        "relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-xl transition-all duration-300 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-indigo-900/10 group",
        className
    )}>
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        {children}
    </div>
);

export default function HrPortalDashboard() {
    const stats = [
        { 
            title: "Total Employees", 
            value: "154", 
            trend: "+4 this month", 
            icon: Users,
            color: "text-indigo-400", 
            gradient: "from-indigo-500/20 to-indigo-500/0"
        },
        { 
            title: "Active Roles", 
            value: "12", 
            trend: "3 critical", 
            icon: Briefcase,
            color: "text-sky-400", 
            gradient: "from-sky-500/20 to-sky-500/0"
        },
        { 
            title: "New Applicants", 
            value: "48", 
            trend: "+12% vs last week", 
            icon: UserPlus,
            color: "text-violet-400", 
            gradient: "from-violet-500/20 to-violet-500/0"
        },
        { 
            title: "Onboarding", 
            value: "6", 
            trend: "2 starting today", 
            icon: Clock,
            color: "text-amber-400", 
            gradient: "from-amber-500/20 to-amber-500/0"
        },
    ];

    const upcomingEvents = [
        { name: "John Doe", event: "Performance Review", time: "2:00 PM", type: "Review", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
        { name: "Sarah Smith", event: "Onboarding Start", time: "Tomorrow", type: "Onboarding", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
        { name: "Mike Johnson", event: "Work Anniversary", time: "Feb 2", type: "Celebration", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    ];

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                    <p className="text-slate-400 mt-1">Overview of your organization's performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            placeholder="Quick search..." 
                            className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-64 transition-all"
                        />
                    </div>
                    <button className="p-2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.6)]">
                         + New Action
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <GlassCard key={i} className="p-6">
                        <div className={`absolute top-0 right-0 p-4 rounded-bl-3xl bg-gradient-to-br ${stat.gradient} opacity-50`} />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <button className="text-slate-600 hover:text-white transition-colors">
                                <MoreHorizontal className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                            <p className="text-slate-400 text-sm font-medium mb-2">{stat.title}</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-white/5 border border-white/5 ${stat.color}`}>
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Main Content Grid (Bento) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recruitment Pipeline */}
                <GlassCard className="lg:col-span-2 p-6 md:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                Recruitment Pipeline
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">Real-time candidate tracking across all roles.</p>
                        </div>
                        <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            View ATS <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {[
                            { label: "Sourcing", value: "45%", count: "12 Candidates", color: "bg-indigo-500" },
                            { label: "Technical Interview", value: "28%", count: "8 Candidates", color: "bg-sky-500" },
                            { label: "Final Round", value: "12%", count: "3 Candidates", color: "bg-violet-500" }
                        ].map((item, i) => (
                            <div key={i} className="group">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{item.label}</span>
                                    <span className="text-slate-400">{item.count}</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)]`} 
                                        style={{ width: item.value }} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                {/* Upcoming Events (Timeline) */}
                <GlassCard className="p-6 md:p-8">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-400" />
                        Today's Agenda
                    </h2>
                    <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                        {upcomingEvents.map((event, i) => (
                            <div key={i} className="relative pl-10 group">
                                <div className="absolute left-[14px] top-1 w-3 h-3 rounded-full bg-[#0F172A] border-2 border-indigo-500/50 group-hover:border-indigo-400 group-hover:scale-110 transition-all z-10" />
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-slate-200 text-sm">{event.name}</span>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${event.color}`}>
                                            {event.type}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-400">{event.event}</span>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-indigo-400/80 font-medium">
                                        <Clock className="w-3 h-3" />
                                        {event.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2.5 rounded-xl border border-dashed border-white/10 text-slate-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-all">
                        View Full Calendar
                    </button>
                </GlassCard>
            </div>
        </div>
    );
}
