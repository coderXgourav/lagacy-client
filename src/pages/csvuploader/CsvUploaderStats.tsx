import { useState, useEffect } from "react";
import {
    Mail,
    MessageSquare,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    BarChart3,
    Activity,
    TrendingUp,
    Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Stats {
    emails: {
        sent: number;
        failed: number;
        pending: number;
    };
    sms: {
        sent: number;
        failed: number;
        pending: number;
    };
    calls: {
        sent: number;
        failed: number;
        pending: number;
        completed?: number;
        successEvaluations?: {
            true: number;
            false: number;
        };
        reasons?: Record<string, number>;
    };
    sequences: {
        active: number;
        completed: number;
    };
    lastUpdated: string;
}

export default function CsvUploaderStats() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/csv-uploader/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            } else {
                setError(data.error || 'Failed to load stats');
            }
        } catch (err) {
            setError('Failed to connect to server');
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/csv-uploader/stats/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                fetchStats();
            }
        } catch (err) {
            console.error('Failed to reset stats:', err);
        }
    };

    useEffect(() => {
        fetchStats();
        // Refresh stats every 10 seconds
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const StatCard = ({ 
        title, 
        value, 
        icon: Icon, 
        color, 
        bgColor 
    }: { 
        title: string; 
        value: number; 
        icon: React.ElementType; 
        color: string; 
        bgColor: string;
    }) => (
        <div className={cn("rounded-xl p-4 border", bgColor)}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground font-medium">{title}</p>
                    <p className={cn("text-3xl font-bold mt-1", color)}>{value}</p>
                </div>
                <div className={cn("p-3 rounded-full", bgColor)}>
                    <Icon className={cn("w-6 h-6", color)} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-primary" />
                        Campaign Statistics
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time tracking of requests
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={fetchStats} 
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        Refresh
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={resetStats}
                        className="gap-2"
                    >
                        <XCircle className="w-4 h-4" />
                        Reset Stats
                    </Button>
                </div>
            </div>

            {error ? (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-1 gap-6">
                        {/* Email Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-blue-500" />
                                    Email Statistics
                                </CardTitle>
                                <CardDescription>
                                    Track your email campaign performance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard 
                                        title="Sent" 
                                        value={stats.emails.sent} 
                                        icon={CheckCircle}
                                        color="text-green-600 dark:text-green-400"
                                        bgColor="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                                    />
                                    <StatCard 
                                        title="Pending" 
                                        value={stats.emails.pending} 
                                        icon={Clock}
                                        color="text-yellow-600 dark:text-yellow-400"
                                        bgColor="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                                    />
                                    <StatCard 
                                        title="Failed" 
                                        value={stats.emails.failed} 
                                        icon={XCircle}
                                        color="text-red-600 dark:text-red-400"
                                        bgColor="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* SMS Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-purple-500" />
                                    SMS Statistics
                                </CardTitle>
                                <CardDescription>
                                    Track your SMS campaign performance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard 
                                        title="Sent" 
                                        value={stats.sms.sent} 
                                        icon={CheckCircle}
                                        color="text-green-600 dark:text-green-400"
                                        bgColor="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                                    />
                                    <StatCard 
                                        title="Pending" 
                                        value={stats.sms.pending} 
                                        icon={Clock}
                                        color="text-yellow-600 dark:text-yellow-400"
                                        bgColor="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                                    />
                                    <StatCard 
                                        title="Failed" 
                                        value={stats.sms.failed} 
                                        icon={XCircle}
                                        color="text-red-600 dark:text-red-400"
                                        bgColor="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* VAPI Call Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-500" />
                                    VAPI AI Call Statistics
                                </CardTitle>
                                <CardDescription>
                                    Track your AI phone call performance
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatCard 
                                        title="Calls Initiated" 
                                        value={stats.calls.sent} 
                                        icon={CheckCircle}
                                        color="text-green-600 dark:text-green-400"
                                        bgColor="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                                    />
                                    <StatCard 
                                        title="Pending Calls" 
                                        value={stats.calls.pending} 
                                        icon={Clock}
                                        color="text-yellow-600 dark:text-yellow-400"
                                        bgColor="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                                    />
                                    <StatCard 
                                        title="Failed Calls" 
                                        value={stats.calls.failed} 
                                        icon={XCircle}
                                        color="text-red-600 dark:text-red-400"
                                        bgColor="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                                    />
                                    
                                    {/* Success Evaluation Stats */}
                                    <StatCard 
                                        title="Evaluated Success" 
                                        value={stats.calls.successEvaluations?.true || 0} 
                                        icon={CheckCircle}
                                        color="text-emerald-600 dark:text-emerald-400"
                                        bgColor="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                                    />
                                    <StatCard 
                                        title="Evaluated Failed" 
                                        value={stats.calls.successEvaluations?.false || 0} 
                                        icon={XCircle}
                                        color="text-rose-600 dark:text-rose-400"
                                        bgColor="bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                                    />
                                </div>
                                
                                {/* Call Reasons/Failures */}
                                {stats.calls.reasons && Object.keys(stats.calls.reasons).length > 0 && (
                                    <div className="mt-6 pt-4 border-t">
                                        <h4 className="text-sm font-medium mb-3">Call End Reasons</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {Object.entries(stats.calls.reasons).map(([reason, count]) => (
                                                <div key={reason} className="p-2 bg-muted/30 rounded text-center border">
                                                    <div className="text-xs text-muted-foreground uppercase tracking-wide truncate" title={reason}>
                                                        {reason.replace(/-/g, ' ')}
                                                    </div>
                                                    <div className="font-bold text-lg">{count}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sequence Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-orange-500" />
                                Sequence Status
                            </CardTitle>
                            <CardDescription>
                                Track your email sequence progress
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StatCard 
                                    title="Active Sequences" 
                                    value={stats.sequences.active} 
                                    icon={Zap}
                                    color="text-blue-600 dark:text-blue-400"
                                    bgColor="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                                />
                                <StatCard 
                                    title="Completed Sequences" 
                                    value={stats.sequences.completed} 
                                    icon={TrendingUp}
                                    color="text-green-600 dark:text-green-400"
                                    bgColor="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Last Updated */}
                    <div className="text-center text-sm text-muted-foreground">
                        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                        <span className="mx-2">•</span>
                        Auto-refreshes every 10 seconds
                    </div>
                </>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                            <span>Loading statistics...</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
