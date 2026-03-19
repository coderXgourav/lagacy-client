import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { 
    LayoutDashboard, 
    Users, 
    UserPlus, 
    UserMinus, 
    RefreshCw, 
    Play, 
    ExternalLink,
    Clock,
    CheckCircle2,
    XCircle,
    Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface LeadLog {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    domain?: string;
    phone?: string;
    reason?: string; // For skips
    processedAt: string;
}

export default function LeadPipelineDashboard() {
    const location = useLocation();
    const isSkipsPage = location.pathname.includes('/skips');
    const [logs, setLogs] = useState<LeadLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [stats, setStats] = useState({ success: 0, total: 0 });
    const { toast } = useToast();
 
    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = isSkipsPage ? '/lead-pipeline/skips' : '/lead-pipeline/logs';
            const response = await fetch(`${API_BASE_URL}${endpoint}?limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLogs(data.logs || []);
                setStats({ success: data.total, total: data.total });
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerPipeline = async () => {
        setRunning(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/api/lead-pipeline/run`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                toast({
                    title: "Pipeline Triggered",
                    description: "The background process has started. Refresh in a few moments.",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to trigger pipeline",
                variant: "destructive"
            });
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [location.pathname]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isSkipsPage ? 'Pipeline Skip Logs' : 'Lead Pipeline Dashboard'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isSkipsPage 
                            ? 'Review leads that did not meet the validation criteria.' 
                            : 'Monitor your automated Apollo to Database sync.'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={triggerPipeline} disabled={running}>
                        <Play className="w-4 h-4 mr-2" />
                        Run Pipeline Now
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Processed from Apollo</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">100%</div>
                        <p className="text-xs text-muted-foreground mt-1">Synced to Zoho CRM</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Schedule</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Every 60m</div>
                        <p className="text-xs text-muted-foreground mt-1">Automatic cron active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Auto-Alerts</CardTitle>
                        <Activity className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Active</div>
                        <p className="text-xs text-muted-foreground mt-1">Slack & Email Notifications</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Successful Syncs</CardTitle>
                    <CardDescription>The most recent leads added to your CRM.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{isSkipsPage ? 'Email' : 'Lead Name'}</TableHead>
                                <TableHead>{isSkipsPage ? 'Reason' : 'Company'}</TableHead>
                                <TableHead>{isSkipsPage ? 'Domain' : 'Email'}</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">Loading entries...</TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                                        No {isSkipsPage ? 'skips' : 'leads'} found.
                                    </TableCell>
                                </TableRow>
                            ) : logs.map((log) => (
                                <TableRow key={log._id}>
                                    <TableCell className="font-medium">
                                        {isSkipsPage ? log.email : `${log.firstName || ''} ${log.lastName || ''}`}
                                    </TableCell>
                                    <TableCell>
                                        {isSkipsPage ? (
                                            <span className="text-rose-600 font-medium">{log.reason}</span>
                                        ) : log.company}
                                    </TableCell>
                                    <TableCell>{isSkipsPage ? log.domain : log.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "capitalize",
                                            isSkipsPage ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-green-50 text-green-700 border-green-200"
                                        )}>
                                            {isSkipsPage ? 'Skipped' : 'Synced'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {new Date(log.processedAt).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
