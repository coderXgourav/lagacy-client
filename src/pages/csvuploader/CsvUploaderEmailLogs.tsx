import { useState, useCallback, useMemo } from "react";
import { Mail, Search, RefreshCw, Eye, EyeOff, MessageSquare, Clock, Calendar as CalendarIcon, User, Filter, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EmailLog {
    _id: string;
    email: string;
    name: string;
    phoneNumber?: string;
    subject: string;
    status: 'Seen' | 'Unseen' | 'Replied';
    openCount: number;
    sentAt: string;
    openedAt?: string;
    firstOpenedAt?: string;
    updatedAt: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const ITEMS_PER_PAGE = 10;

export default function CsvUploaderEmailLogs() {
    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: ITEMS_PER_PAGE, totalPages: 1 });
    const { toast } = useToast();

    // Filters state
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        searchQuery: '',
        status: 'All'
    });

    const fetchLogs = useCallback(async (page = 1) => {
        if (!filters.dateFrom || !filters.dateTo) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_BASE_URL}/csv-uploader/email-logs?page=${page}&limit=${ITEMS_PER_PAGE}&dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.success) {
                setLogs(data.logs);
                if (data.pagination) {
                    setPagination(data.pagination);
                }
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to fetch email logs",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fetching email logs:', error);
            toast({
                title: "Error",
                description: "Failed to connect to server",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [filters.dateFrom, filters.dateTo, toast]);

    const handleSearch = () => {
        setHasSearched(true);
        setCurrentPage(1);
        fetchLogs(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchLogs(page);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Client-side filtering for search query and status (applied on top of server-side date+pagination)
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            let match = true;

            if (filters.searchQuery) {
                const q = filters.searchQuery.toLowerCase();
                const matchesSearch =
                    log.email.toLowerCase().includes(q) ||
                    log.name.toLowerCase().includes(q) ||
                    log.subject.toLowerCase().includes(q);
                if (!matchesSearch) match = false;
            }

            if (filters.status !== 'All' && log.status !== filters.status) {
                match = false;
            }

            return match;
        });
    }, [logs, filters.searchQuery, filters.status]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Seen':
                return <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm"><Eye className="w-3 h-3 mr-1" /> Seen</Badge>;
            case 'Replied':
                return <Badge className="bg-purple-500 hover:bg-purple-600 border-none shadow-sm"><MessageSquare className="w-3 h-3 mr-1" /> Replied</Badge>;
            default:
                return <Badge variant="secondary" className="opacity-70"><EyeOff className="w-3 h-3 mr-1" /> Unseen</Badge>;
        }
    };

    const handleDownloadCSV = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Fetch ALL records matching current filters (bypass pagination)
            // Always download only "Seen" emails
            const response = await fetch(
                `${API_BASE_URL}/csv-uploader/email-logs?all=true&dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}&status=Seen`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            
            if (!data.success || !data.logs || data.logs.length === 0) {
                toast({ title: "No Data", description: "No 'Seen' logs found to download.", variant: "destructive" });
                return;
            }

            const allLogs: EmailLog[] = data.logs;
            const headers = ["Recipient Name", "Recipient Email", "Phone Number", "Subject", "Status", "Opens", "Sent Date"];
            const rows = allLogs.map(log => [
                log.name || 'Unknown',
                log.email,
                log.phoneNumber || 'N/A',
                `"${(log.subject || '').replace(/"/g, '""')}"`,
                log.status,
                log.openCount,
                new Date(log.sentAt).toLocaleDateString()
            ]);
            
            const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `email_logs_Seen_${filters.dateFrom}_to_${filters.dateTo}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
            toast({ title: "Error", description: "Failed to download CSV", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Always download only "Seen" emails
            const response = await fetch(
                `${API_BASE_URL}/csv-uploader/email-logs?all=true&dateFrom=${filters.dateFrom}&dateTo=${filters.dateTo}&status=Seen`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            
            if (!data.success || !data.logs || data.logs.length === 0) {
                toast({ title: "No Data", description: "No 'Seen' logs found to download.", variant: "destructive" });
                return;
            }

            const allLogs: EmailLog[] = data.logs;
            const doc = new jsPDF();
            doc.setFontSize(14);
            doc.text(`Email Logs - Seen Only (${filters.dateFrom} to ${filters.dateTo})`, 14, 15);
            doc.setFontSize(11);
            doc.text(`Total Seen: ${allLogs.length}`, 14, 23);
            
            const tableColumn = ["Name", "Email", "Phone", "Subject", "Status", "Opens", "Sent Date"];
            const tableRows = allLogs.map(log => [
                log.name || 'Unknown',
                log.email,
                log.phoneNumber || 'N/A',
                (log.subject || '').substring(0, 30) + ((log.subject || '').length > 30 ? '...' : ''),
                log.status,
                log.openCount.toString(),
                new Date(log.sentAt).toLocaleDateString()
            ]);
            
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 28,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [0, 86, 179] },
            });
            
            doc.save(`email_logs_Seen_${filters.dateFrom}_to_${filters.dateTo}.pdf`);
        } catch (error) {
            console.error('Download error:', error);
            toast({ title: "Error", description: "Failed to download PDF", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Mail className="w-8 h-8 text-primary" />
                    Email Tracking Logs
                </h1>
                <p className="text-muted-foreground mt-1">
                    Monitor your email outreach performance and engagement. Select a date range to view logs.
                </p>
            </div>

            {/* Filters Card */}
            <Card>
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {!hasSearched && (
                            <>
                                <div className="space-y-1.5 rounded-md">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal h-9",
                                                    !filters.dateFrom && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {filters.dateFrom ? format(new Date(filters.dateFrom), "PP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                                                onSelect={(date) => {
                                                    setFilters(prev => ({ ...prev, dateFrom: date ? format(date, 'yyyy-MM-dd') : '' }));
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-1.5 rounded-md">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To Date</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal h-9",
                                                    !filters.dateTo && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {filters.dateTo ? format(new Date(filters.dateTo), "PP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                                                onSelect={(date) => {
                                                    setFilters(prev => ({ ...prev, dateTo: date ? format(date, 'yyyy-MM-dd') : '' }));
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex items-end xs:col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-6 mt-2">
                                    <Button
                                        onClick={handleSearch}
                                        disabled={!filters.dateFrom || !filters.dateTo || isLoading}
                                    >
                                        {isLoading ? (
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Search className="w-4 h-4 mr-2" />
                                        )}
                                        Search Email Logs
                                    </Button>
                                    {(!filters.dateFrom || !filters.dateTo) && (
                                        <p className="text-xs text-muted-foreground ml-3 mb-1">
                                            * Please select both From and To dates
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                        {hasSearched && (
                            <>
                                <div className="space-y-1.5 focus-within:ring-1 ring-ring rounded-md">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            name="searchQuery"
                                            placeholder="Email, name, subject..."
                                            value={filters.searchQuery}
                                            onChange={handleFilterChange}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 focus-within:ring-1 ring-ring rounded-md">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                                    <Select
                                        value={filters.status}
                                        onValueChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Statuses</SelectItem>
                                            <SelectItem value="Seen">Seen</SelectItem>
                                            <SelectItem value="Unseen">Unseen</SelectItem>
                                            <SelectItem value="Replied">Replied</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end mt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setHasSearched(false);
                                            setLogs([]);
                                            setFilters(prev => ({ ...prev, searchQuery: '', status: 'All' }));
                                        }}
                                        className="w-full sm:w-auto"
                                    >
                                        Change Dates
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Content Area */}
            {!hasSearched ? (
                <Card className="border-dashed bg-muted/10 mt-6">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                        <Filter className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground">Awaiting Search Criteria</h3>
                        <p className="text-muted-foreground mt-1 max-w-sm">
                            Please select your desired date range above and click "Search Email Logs" to view your email tracking records.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="mt-6">
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Mail className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground font-medium">No email logs found matching your filters.</p>
                                <Button
                                    variant="link"
                                    onClick={() => {
                                        setHasSearched(false);
                                        setFilters({ dateFrom: '', dateTo: '', searchQuery: '', status: 'All' });
                                    }}
                                    className="mt-2 text-primary"
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Stats Bar */}
                                <div className="flex items-center gap-6 px-6 py-4 border-b bg-muted/20">
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-bold text-primary">{pagination.total}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total</span>
                                    </div>
                                    <div className="w-px h-8 bg-border/50" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-bold text-green-500">{logs.filter(l => l.status === 'Seen').length}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Seen</span>
                                    </div>
                                    <div className="w-px h-8 bg-border/50" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-bold text-purple-500">{logs.filter(l => l.status === 'Replied').length}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Replied</span>
                                    </div>
                                    <div className="w-px h-8 bg-border/50" />
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl font-bold text-muted-foreground">{logs.filter(l => l.status === 'Unseen').length}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Unseen</span>
                                    </div>
                                    <div className="flex-1" />
                                    
                                    <div className="flex items-center gap-2">
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

                                        <Button onClick={() => fetchLogs(currentPage)} disabled={isLoading} variant="outline" size="sm" className="gap-2">
                                            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                                            Refresh
                                        </Button>
                                    </div>
                                </div>

                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                                            <TableHead className="font-semibold">Recipient</TableHead>
                                            <TableHead className="font-semibold">Subject</TableHead>
                                            <TableHead className="font-semibold">Status</TableHead>
                                            <TableHead className="font-semibold">Engagement</TableHead>
                                            <TableHead className="font-semibold">Sent Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLogs.map((log) => (
                                            <TableRow key={log._id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                            {log.name ? log.name.charAt(0).toUpperCase() : log.email.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-foreground">{log.name || 'Unknown'}</span>
                                                            <span className="text-xs text-muted-foreground mb-0.5">{log.email}</span>
                                                            <span className="text-[10px] text-muted-foreground/80 font-medium">
                                                                {log.phoneNumber ? log.phoneNumber : 'No phone number'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate font-medium">{log.subject}</TableCell>
                                                <TableCell>{getStatusBadge(log.status)}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center text-xs gap-1.5">
                                                            <Eye className="w-3 h-3 text-primary" />
                                                            <span className="font-bold">{log.openCount}</span>
                                                            <span className="text-muted-foreground">opens</span>
                                                        </div>
                                                        {log.openedAt && (
                                                            <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                Last: {new Date(log.openedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground whitespace-nowrap">
                                                    {new Date(log.sentAt).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-between px-6 py-4 border-t">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {((currentPage - 1) * pagination.limit) + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} entries
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1 || isLoading}
                                            >
                                                Previous
                                            </Button>
                                            <div className="text-sm font-medium px-2">
                                                Page {currentPage} of {pagination.totalPages}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage >= pagination.totalPages || isLoading}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}