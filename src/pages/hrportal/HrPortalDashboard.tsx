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

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HrPortalDashboard() {
    const stats = [
        {
            title: "Total Employees",
            value: "154",
            trend: "+4 this month",
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            border: "border-l-blue-500"
        },
        {
            title: "Active Roles",
            value: "12",
            trend: "3 critical",
            icon: Briefcase,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
            border: "border-l-amber-500"
        },
        {
            title: "New Applicants",
            value: "48",
            trend: "+12% vs last week",
            icon: UserPlus,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            border: "border-l-emerald-500"
        },
        {
            title: "Onboarding",
            value: "6",
            trend: "2 starting today",
            icon: Clock,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            border: "border-l-purple-500"
        },
    ];

    const upcomingEvents = [
        { name: "John Doe", event: "Performance Review", time: "2:00 PM", type: "Review", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
        { name: "Sarah Smith", event: "Onboarding Start", time: "Tomorrow", type: "Onboarding", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
        { name: "Mike Johnson", event: "Work Anniversary", time: "Feb 2", type: "Celebration", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <div className="container mx-auto max-w-[1600px] space-y-6">

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12 mb-2">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                                    <Users className="h-7 w-7 text-white" />
                                </div>
                                <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 text-xs font-semibold tracking-wide uppercase">
                                    HR Central
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                                Enterprise Dashboard
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl">
                                Overview of your organization's performance and recruitment pipeline. Focus on what matters most.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <Card key={i} className={`overflow-hidden border-l-4 ${stat.border}`}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                                    <p className="text-muted-foreground text-sm font-medium mb-2">{stat.title}</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`${stat.color} bg-background`}>
                                            {stat.trend}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content Grid (Bento) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Recruitment Pipeline */}
                    <Card className="lg:col-span-2 overflow-hidden">
                        <CardContent className="p-6 md:p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                                        Recruitment Pipeline
                                    </h2>
                                    <p className="text-muted-foreground text-sm mt-1">Real-time candidate tracking across all roles.</p>
                                </div>
                                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center gap-1 transition-colors">
                                    View ATS <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { label: "Sourcing", value: "45%", count: "12 Candidates", color: "bg-indigo-500" },
                                    { label: "Technical Interview", value: "28%", count: "8 Candidates", color: "bg-cyan-500" },
                                    { label: "Final Round", value: "12%", count: "3 Candidates", color: "bg-emerald-500" }
                                ].map((item, i) => (
                                    <div key={i} className="group">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="font-medium text-muted-foreground transition-colors group-hover:text-foreground">{item.label}</span>
                                            <span className="text-muted-foreground">{item.count}</span>
                                        </div>
                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                                                style={{ width: item.value }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Events (Timeline) */}
                    <Card className="overflow-hidden">
                        <CardContent className="p-6 md:p-8">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-500" />
                                Today's Agenda
                            </h2>
                            <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-muted">
                                {upcomingEvents.map((event, i) => (
                                    <div key={i} className="relative pl-10 group">
                                        <div className="absolute left-[14px] top-1 w-3 h-3 rounded-full bg-background border-2 border-indigo-500/50 group-hover:border-indigo-500 group-hover:scale-110 transition-all z-10" />
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-sm">{event.name}</span>
                                                <Badge variant="outline" className={`${event.color}`}>
                                                    {event.type}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-muted-foreground">{event.event}</span>
                                            <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600 font-medium">
                                                <Clock className="w-3 h-3" />
                                                {event.time}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
