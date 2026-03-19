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
    Activity,
    Download,
    FileText,
    FileSpreadsheet
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

    const handleDownloadCSV = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = isSkipsPage ? '/lead-pipeline/skips' : '/lead-pipeline/logs';
            const response = await fetch(`${API_BASE_URL}${endpoint}?all=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!data.success || !data.logs || data.logs.length === 0) {
                toast({ title: "No Data", description: "No logs found to download.", variant: "destructive" });
                return;
            }

            const allLogs: LeadLog[] = data.logs;
            let headers: string[];
            let rows: string[][];

            if (isSkipsPage) {
                headers = ["Email", "Reason", "Domain", "Date"];
                rows = allLogs.map(log => [
                    log.email,
                    log.reason || 'N/A',
                    log.domain || 'N/A',
                    new Date(log.processedAt).toLocaleString()
                ]);
            } else {
                headers = ["Name", "Email", "Company", "Domain", "Phone", "Date"];
                rows = allLogs.map(log => [
                    `${log.firstName || ''} ${log.lastName || ''}`.trim() || 'N/A',
                    log.email,
                    log.company || 'N/A',
                    log.domain || 'N/A',
                    log.phone || 'N/A',
                    new Date(log.processedAt).toLocaleString()
                ]);
            }

            const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `lead_pipeline_${isSkipsPage ? 'skips' : 'success'}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
            toast({ title: "Error", description: "Failed to download CSV", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = isSkipsPage ? '/lead-pipeline/skips' : '/lead-pipeline/logs';
            const response = await fetch(`${API_BASE_URL}${endpoint}?all=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (!data.success || !data.logs || data.logs.length === 0) {
                toast({ title: "No Data", description: "No logs found to download.", variant: "destructive" });
                return;
            }

            const allLogs: LeadLog[] = data.logs;
            const doc = new jsPDF();
            const title = isSkipsPage ? 'Pipeline Skip Logs' : 'Lead Pipeline - Successful Syncs';
            doc.setFontSize(14);
            doc.text(title, 14, 15);
            doc.setFontSize(11);
            doc.text(`Total: ${allLogs.length}`, 14, 23);

            let tableColumn: string[];
            let tableRows: string[][];

            if (isSkipsPage) {
                tableColumn = ["Email", "Reason", "Domain", "Date"];
                tableRows = allLogs.map(log => [
                    log.email,
                    log.reason || 'N/A',
                    log.domain || 'N/A',
                    new Date(log.processedAt).toLocaleString()
                ]);
            } else {
                tableColumn = ["Name", "Email", "Company", "Domain", "Phone", "Date"];
                tableRows = allLogs.map(log => [
                    `${log.firstName || ''} ${log.lastName || ''}`.trim() || 'N/A',
                    log.email,
                    log.company || 'N/A',
                    log.domain || 'N/A',
                    log.phone || 'N/A',
                    new Date(log.processedAt).toLocaleString()
                ]);
            }

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 28,
                styles: { fontSize: 7 },
                headStyles: { fillColor: isSkipsPage ? [220, 38, 38] : [0, 86, 179] },
            });

            doc.save(`lead_pipeline_${isSkipsPage ? 'skips' : 'success'}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Download error:', error);
            toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
        } finally {
            setLoading(false);
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{isSkipsPage ? 'Skip Logs' : 'Recent Successful Syncs'}</CardTitle>
                        <CardDescription>
                            {isSkipsPage 
                                ? 'Leads that were skipped during pipeline processing.' 
                                : 'The most recent leads added to your CRM.'}
                        </CardDescription>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="w-3.5 h-3.5" />
                                Download
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDownloadCSV} className="cursor-pointer">
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                Export to CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
                                <FileText className="w-4 h-4 mr-2" />
                                Export to PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
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
