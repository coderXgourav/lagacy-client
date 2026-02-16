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
    Zap,
    ChevronDown,
    ChevronUp,
    Phone,
    Layers,
    Ban
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
    currentAction?: string;
    lastUpdated: string;
}

interface StageInfo {
    id: string;
    stage: number;
    status: string;
    totalContacts: number;
    processedContacts: number;
    currentAction: string;
    nextScheduledTime: string;
    createdAt: string;
    updatedAt: string;
}

export default function CsvUploaderStats() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [stages, setStages] = useState<StageInfo[]>([]);
    const [stagesExpanded, setStagesExpanded] = useState(false);
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

    const fetchStages = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/csv-uploader/sequence-status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setStages(data.stages);
            }
        } catch (err) {
            console.error('Failed to fetch stages:', err);
        }
    };

    const cancelAllSequences = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/csv-uploader/cancel-sequences`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                fetchStages();
                fetchStats();
            }
        } catch (err) {
            console.error('Failed to cancel sequences:', err);
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
        fetchStages();
        const interval = setInterval(() => {
            fetchStats();
            fetchStages();
        }, 2000);
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

    const getStageStatusConfig = (status: string) => {
        switch (status) {
            case 'completed':
                return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30', label: 'Completed' };
            case 'active':
                return { icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'In Progress' };
            case 'cancelled':
                return { icon: Ban, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Cancelled' };
            default:
                return { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Scheduled' };
        }
    };

    const getTimeUntil = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - Date.now();
        if (diff <= 0) return 'Due now';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    // Group stages by most recent batch (latest createdAt)
    const latestBatchStages = (() => {
        if (stages.length === 0) return [];
        const latestTime = Math.max(...stages.map(s => new Date(s.createdAt).getTime()));
        return stages.filter(s => Math.abs(new Date(s.createdAt).getTime() - latestTime) < 60000);
    })();

    const hasActiveStages = latestBatchStages.some(s => s.status === 'active');

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
                        onClick={() => { fetchStats(); fetchStages(); }} 
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

            {/* Real-time Status Alert */}
            {stats?.currentAction && stats.currentAction !== "Idle" && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                            <Activity className="h-5 w-5 text-primary relative" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-primary">Current Server Action</p>
                            <p className="text-lg font-bold tracking-tight">{stats.currentAction}</p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm">
                            <Zap className="h-4 w-4 fill-current" />
                            LIVE SEQUENCE ACTIVE
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Polling every 2s</p>
                    </div>
                </div>
            )}

            {error ? (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            ) : stats ? (
                <>
                    {/* ============ STAGE PROGRESS PANEL ============ */}
                    {latestBatchStages.length > 0 && (
                        <Card className="border-2 border-indigo-200 dark:border-indigo-800 overflow-hidden">
                            <CardHeader 
                                className="cursor-pointer select-none hover:bg-muted/30 transition-colors"
                                onClick={() => setStagesExpanded(!stagesExpanded)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/10">
                                            <Layers className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">
                                                4-Stage Sequence Progress
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {latestBatchStages.filter(s => s.status === 'completed').length}/4 stages completed
                                                {hasActiveStages && ' • Processing...'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {hasActiveStages && (
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                className="text-red-500 border-red-300 hover:bg-red-50"
                                                onClick={(e) => { e.stopPropagation(); cancelAllSequences(); }}
                                            >
                                                <Ban className="w-4 h-4 mr-1" />
                                                Cancel All
                                            </Button>
                                        )}
                                        {stagesExpanded ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>

                                {/* Mini progress bar indicators */}
                                <div className="flex gap-2 mt-4">
                                    {[1, 2, 3, 4].map(stageNum => {
                                        const stage = latestBatchStages.find(s => s.stage === stageNum);
                                        const cfg = getStageStatusConfig(stage?.status || 'waiting');
                                        return (
                                            <div key={stageNum} className="flex-1">
                                                <div className={cn("h-2 rounded-full transition-all", 
                                                    stage?.status === 'completed' ? "bg-green-500" :
                                                    stage?.status === 'active' ? "bg-blue-500 animate-pulse" :
                                                    stage?.status === 'cancelled' ? "bg-gray-400" :
                                                    "bg-gray-200 dark:bg-gray-700"
                                                )} />
                                                <p className={cn("text-xs mt-1 text-center font-medium", cfg.color)}>
                                                    S{stageNum}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardHeader>

                            {/* Expanded stage details */}
                            {stagesExpanded && (
                                <CardContent className="pt-0">
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4].map(stageNum => {
                                            const stage = latestBatchStages.find(s => s.stage === stageNum);
                                            if (!stage) return null;
                                            const cfg = getStageStatusConfig(stage.status);
                                            const StatusIcon = cfg.icon;
                                            const progress = stage.totalContacts > 0 
                                                ? Math.round((stage.processedContacts / stage.totalContacts) * 100) 
                                                : 0;
                                            const isScheduled = new Date(stage.nextScheduledTime).getTime() > Date.now() && stage.status === 'active' && stage.processedContacts === 0;

                                            return (
                                                <div 
                                                    key={stage.id} 
                                                    className={cn("rounded-xl border-2 p-5 transition-all", cfg.border, cfg.bg)}
                                                >
                                                    {/* Stage header */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <StatusIcon className={cn("w-6 h-6", cfg.color)} />
                                                            <div>
                                                                <h3 className="font-bold text-lg">Stage {stage.stage}</h3>
                                                                <span className={cn("text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", cfg.bg, cfg.color)}>
                                                                    {cfg.label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-2xl font-bold">{stage.processedContacts}/{stage.totalContacts}</p>
                                                            <p className="text-xs text-muted-foreground">contacts processed</p>
                                                        </div>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                                                        <div 
                                                            className={cn(
                                                                "h-3 rounded-full transition-all duration-500",
                                                                stage.status === 'completed' ? "bg-green-500" :
                                                                stage.status === 'active' ? "bg-blue-500" :
                                                                stage.status === 'cancelled' ? "bg-gray-400" :
                                                                "bg-yellow-500"
                                                            )}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>

                                                    {/* Stage channel details */}
                                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="w-4 h-4 text-blue-400" />
                                                            <span className="text-muted-foreground">
                                                                {stage.status === 'active' && stage.currentAction === 'email' ? (
                                                                    <span className="text-blue-500 font-medium">📧 Sending...</span>
                                                                ) : stage.status === 'completed' ? '✅ Done' : 'Email'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="w-4 h-4 text-purple-400" />
                                                            <span className="text-muted-foreground">
                                                                {stage.status === 'active' && stage.currentAction === 'sms' ? (
                                                                    <span className="text-purple-500 font-medium">💬 Sending...</span>
                                                                ) : stage.status === 'completed' ? '✅ Done' : 'SMS'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="w-4 h-4 text-indigo-400" />
                                                            <span className="text-muted-foreground">
                                                                {stage.status === 'active' && stage.currentAction === 'call' ? (
                                                                    <span className="text-indigo-500 font-medium">📞 Calling...</span>
                                                                ) : stage.status === 'completed' ? '✅ Done' : 'Call'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Scheduled time countdown */}
                                                    {isScheduled && (
                                                        <div className="mt-3 pt-3 border-t border-dashed flex items-center gap-2 text-sm">
                                                            <Clock className="w-4 h-4 text-yellow-500" />
                                                            <span className="text-muted-foreground">
                                                                Starts in <span className="font-bold text-yellow-600">{getTimeUntil(stage.nextScheduledTime)}</span>
                                                                {' '}({new Date(stage.nextScheduledTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    )}

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
                        Auto-refreshes every 2 seconds
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
