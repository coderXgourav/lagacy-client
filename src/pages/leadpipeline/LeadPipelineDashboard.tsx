import { useState, useEffect, useCallback } from "react";
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
    FileSpreadsheet,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
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
const ITEMS_PER_PAGE = 20;

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
    domainCreated?: string;
}

export default function LeadPipelineDashboard() {
    const location = useLocation();
    const isSkipsPage = location.pathname.includes('/skips');
    const [logs, setLogs] = useState<LeadLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);
    const [stats, setStats] = useState({ success: 0, total: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedMonth, setSelectedMonth] = useState<string>(""); // MM
    const [selectedYear, setSelectedYear] = useState<string>("Any"); // YYYY or 'Any'
    const [filterBy, setFilterBy] = useState<'processedAt' | 'domainCreated'>('processedAt');
    const [counts, setCounts] = useState({ sync: 0, reg: 0 });
    const [backfilling, setBackfilling] = useState(false);
    const { toast } = useToast();
 
    const fetchLogs = useCallback(async (page: number = currentPage) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = isSkipsPage ? '/lead-pipeline/skips' : '/lead-pipeline/logs';
            let url = `${API_BASE_URL}${endpoint}?page=${page}&limit=${ITEMS_PER_PAGE}`;
            
            if (selectedMonth) {
                const monthValue = selectedYear === 'Any' ? selectedMonth : `${selectedYear}-${selectedMonth}`;
                url += `&month=${monthValue}&filterBy=${filterBy}`;
            }
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLogs(data.logs || []);
                setStats({ success: data.total, total: data.total });
                setTotalPages(data.totalPages || 1);
                
                // Update specific count for the active filter
                if (filterBy === 'processedAt') setCounts(c => ({ ...c, sync: data.total }));
                else setCounts(c => ({ ...c, reg: data.total }));
            }
        } catch (error) {
            console.error('[Dashboard] Fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, isSkipsPage, selectedMonth, selectedYear, filterBy]);

    // Fetch the "other" count purely for the UI buttons
    const fetchOppositeCount = useCallback(async () => {
        if (!selectedMonth) return;
        try {
            const token = localStorage.getItem('token');
            const oppositeFilter = filterBy === 'processedAt' ? 'domainCreated' : 'processedAt';
            const endpoint = isSkipsPage ? '/lead-pipeline/skips' : '/lead-pipeline/logs';
            const monthValue = selectedYear === 'Any' ? selectedMonth : `${selectedYear}-${selectedMonth}`;
            const url = `${API_BASE_URL}${endpoint}?limit=1&month=${monthValue}&filterBy=${oppositeFilter}`;
            
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            if (data.success) {
                if (oppositeFilter === 'processedAt') setCounts(c => ({ ...c, sync: data.total }));
                else setCounts(c => ({ ...c, reg: data.total }));
            }
        } catch (err) {}
    }, [selectedMonth, selectedYear, filterBy, isSkipsPage]);

    useEffect(() => {
        fetchLogs();
        if (selectedMonth) fetchOppositeCount();
    }, [fetchLogs, fetchOppositeCount, selectedMonth]);

    // Auto-switch logic
    useEffect(() => {
        if (counts.reg > 0 && counts.sync === 0 && filterBy === 'processedAt' && selectedMonth) {
            setFilterBy('domainCreated');
        }
    }, [counts, selectedMonth, filterBy]);

    const triggerPipeline = async () => {
        setRunning(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/lead-pipeline/run`, {
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
            let url = `${API_BASE_URL}${endpoint}?all=true`;
            if (selectedMonth) {
                const monthValue = selectedYear === 'Any' ? selectedMonth : `${selectedYear}-${selectedMonth}`;
                url += `&month=${monthValue}&filterBy=${filterBy}`;
            }

            const response = await fetch(url, {
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
                headers = ["Email", "Reason", "Domain", "Reg. Date", "Sync Date"];
                rows = allLogs.map(log => [
                    log.email,
                    log.reason || 'N/A',
                    log.domain || 'N/A',
                    log.domainCreated ? new Date(log.domainCreated).toLocaleDateString() : 'N/A',
                    new Date(log.processedAt).toLocaleString()
                ]);
            } else {
                headers = ["Name", "Email", "Company", "Domain", "Phone", "Reg. Date", "Sync Date"];
                rows = allLogs.map(log => [
                    `${log.firstName || ''} ${log.lastName || ''}`.trim() || 'N/A',
                    log.email,
                    log.company || 'N/A',
                    log.domain || 'N/A',
                    log.phone || 'N/A',
                    log.domainCreated ? new Date(log.domainCreated).toLocaleDateString() : 'N/A',
                    new Date(log.processedAt).toLocaleString()
                ]);
            }

            const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
            const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const csvUrl = URL.createObjectURL(csvBlob);
            const link = document.createElement("a");
            link.setAttribute("href", csvUrl);
            link.setAttribute("download", `lead_pipeline_${isSkipsPage ? 'skips' : 'success'}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Revoke after a short delay to ensure triggered download
            setTimeout(() => URL.revokeObjectURL(csvUrl), 100);
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
            let pdfUrl = `${API_BASE_URL}${endpoint}?all=true`;
            if (selectedMonth) pdfUrl += `&month=${selectedMonth}`;

            const response = await fetch(pdfUrl, {
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
                tableColumn = ["Email", "Reason", "Domain", "Reg. Date", "Sync Date"];
                tableRows = allLogs.map(log => [
                    log.email,
                    log.reason || 'N/A',
                    log.domain || 'N/A',
                    log.domainCreated ? new Date(log.domainCreated).toLocaleDateString() : 'N/A',
                    new Date(log.processedAt).toLocaleString()
                ]);
            } else {
                tableColumn = ["Name", "Email", "Company", "Domain", "Phone", "Reg. Date", "Sync Date"];
                tableRows = allLogs.map(log => [
                    `${log.firstName || ''} ${log.lastName || ''}`.trim() || 'N/A',
                    log.email,
                    log.company || 'N/A',
                    log.domain || 'N/A',
                    log.phone || 'N/A',
                    log.domainCreated ? new Date(log.domainCreated).toLocaleDateString() : 'N/A',
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

    const triggerBackfill = async () => {
        setBackfilling(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/lead-pipeline/backfill`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                toast({
                    title: "Backfill Started",
                    description: "Missing registration dates are being fetched in the background.",
                });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to start backfill", variant: "destructive" });
        } finally {
            setBackfilling(false);
        }
    };

    // Reset to page 1 when switching between Dashboard and Skip Logs
    useEffect(() => {
        setCurrentPage(1);
    }, [location.pathname]);

    // Fetch logs when page or route changes
    useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage, location.pathname]);

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
                <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
                        <button 
                            onClick={() => setFilterBy('processedAt')}
                            className={`text-[10px] px-2 py-1 rounded-md transition-all flex items-center gap-1.5 ${filterBy === 'processedAt' ? 'bg-background shadow-sm text-blue-600 dark:text-blue-400 font-bold border border-border/50' : 'text-muted-foreground'}`}
                        >
                            Sync Date
                            {selectedMonth && <span className={`px-1 rounded ${filterBy === 'processedAt' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted-foreground/10'}`}>{counts.sync}</span>}
                        </button>
                        <button 
                            onClick={() => setFilterBy('domainCreated')}
                            className={`text-[10px] px-2 py-1 rounded-md transition-all flex items-center gap-1.5 ${filterBy === 'domainCreated' ? 'bg-background shadow-sm text-blue-600 dark:text-blue-400 font-bold border border-border/50' : 'text-muted-foreground'}`}
                        >
                            Reg. Date
                            {selectedMonth && <span className={`px-1 rounded ${filterBy === 'domainCreated' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted-foreground/10'}`}>{counts.reg}</span>}
                        </button>
                    </div>
                    <div className="flex items-center gap-1 bg-muted/50 p-1 px-2 rounded-md border border-border">
                        <select 
                            className="bg-transparent text-xs outline-none cursor-pointer p-1 text-foreground dark:bg-muted"
                            value={selectedMonth}
                            onChange={(e) => {
                                setSelectedMonth(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="" className="dark:bg-background">Month</option>
                            {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                                <option key={m} value={m} className="dark:bg-background">{new Date(2000, parseInt(m)-1).toLocaleString('default', { month: 'short' })}</option>
                            ))}
                        </select>
                        <select 
                            className="bg-transparent text-xs outline-none cursor-pointer p-1 text-foreground dark:bg-muted"
                            value={selectedYear}
                            onChange={(e) => {
                                setSelectedYear(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="Any" className="dark:bg-background">Year (Any)</option>
                            <option value="2026" className="dark:bg-background">2026</option>
                            <option value="2025" className="dark:bg-background">2025</option>
                            <option value="2024" className="dark:bg-background">2024</option>
                        </select>
                        {selectedMonth && (
                            <button 
                                onClick={() => { setSelectedMonth(""); setSelectedYear("Any"); }}
                                className="text-muted-foreground hover:text-foreground text-xs font-bold px-1"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchLogs()} disabled={loading}>
                        <RefreshCw className={`w-3 h-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button size="sm" onClick={triggerPipeline} disabled={running}>
                        <Play className="w-3 h-3 mr-2" />
                        Run Now
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Synced Leads</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {selectedMonth ? `Total in ${selectedMonth}` : 'All time syncs'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-transparent">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Data Intelligence</CardTitle>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={triggerBackfill}
                            disabled={backfilling}
                            title="Fetch missing registration dates"
                        >
                            <RefreshCw className={`h-3 w-3 ${backfilling ? 'animate-spin' : ''}`} />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">WHOIS</div>
                        <p className="text-xs text-muted-foreground mt-1 text-green-700 font-medium">
                            Auto-capturing Reg. Dates
                        </p>
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
                                {!isSkipsPage && <TableHead>Reg. Date</TableHead>}
                                {!isSkipsPage && <TableHead>Phone</TableHead>}
                                <TableHead>Status</TableHead>
                                <TableHead>Sync Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={isSkipsPage ? 6 : 7} className="text-center py-10">Loading entries...</TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isSkipsPage ? 6 : 7} className="text-center py-10 text-muted-foreground italic">
                                        <div className="flex flex-col items-center gap-2">
                                            <span>No {isSkipsPage ? 'skips' : 'leads'} found.</span>
                                            {selectedMonth && filterBy === 'processedAt' && (
                                                <p className="not-italic text-sm text-blue-600 font-bold mt-2">
                                                    💡 Use "Reg. Date" above to find leads registered in this month.
                                                </p>
                                            )}
                                        </div>
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
                                    {!isSkipsPage && (
                                        <TableCell className="text-xs text-blue-600 font-medium whitespace-nowrap">
                                            {log.domainCreated ? new Date(log.domainCreated).toLocaleDateString() : '—'}
                                        </TableCell>
                                    )}
                                    {!isSkipsPage && (
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {log.phone || '—'}
                                        </TableCell>
                                    )}
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

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t mt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages} &middot; {stats.total} total entries
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage <= 1 || loading}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage <= 1 || loading}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <span className="text-sm font-medium px-2">
                                    {currentPage}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage >= totalPages || loading}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage >= totalPages || loading}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
