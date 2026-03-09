import { useState, useEffect, useMemo } from "react";
import { MessageCircle, Phone, Clock, FileText, Search, Calendar as CalendarIcon, User, Eye, ArrowLeft, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CsvUploaderTranscripts() {
    const [transcripts, setTranscripts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    // Search state
    const [hasSearched, setHasSearched] = useState(false);

    // View state
    const [selectedCall, setSelectedCall] = useState<any | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Filters state
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        name: '',
        phone: '',
        duration: 'All', // Represents min minimum duration filter
        endedReason: 'All'
    });

    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/csv-uploader/transcripts`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setTranscripts(data.transcripts || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTranscripts();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleSelectChange = (value: string, name: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const filteredTranscripts = useMemo(() => {
        return transcripts.filter((t) => {
            let match = true;

            const name = (t.contactName || t.customerSettings?.name || "Customer").toLowerCase();
            if (filters.name && !name.includes(filters.name.toLowerCase())) match = false;

            const phone = (t.customerSettings?.number || t.phone || t.customerNumber || "").toLowerCase();
            if (filters.phone && !phone.includes(filters.phone.toLowerCase())) match = false;

            // Min Duration filter
            let callDuration = parseInt(t.duration as string, 10);
            if (!callDuration || isNaN(callDuration)) {
                if (t.endedAt && t.createdAt) {
                    callDuration = Math.max(0, Math.floor((new Date(t.endedAt).getTime() - new Date(t.createdAt).getTime()) / 1000));
                } else {
                    callDuration = 0;
                }
            }

            if (filters.duration !== 'All') {
                const minDuration = parseInt(filters.duration, 10);
                if (callDuration < minDuration) match = false;
            }

            const endedReason = t.endedReason || "Unknown";
            if (filters.endedReason !== 'All' && filters.endedReason !== endedReason) match = false;

            if (filters.dateFrom) {
                const date = new Date(t.endedAt || t.createdAt);
                if (date < new Date(filters.dateFrom)) match = false;
            }

            if (filters.dateTo) {
                const date = new Date(t.endedAt || t.createdAt);
                const toDate = new Date(filters.dateTo);
                // set to end of day to include the entire 'to' date
                toDate.setHours(23, 59, 59, 999);
                if (date > toDate) match = false;
            }

            return match;
        });
    }, [transcripts, filters]);

    const paginatedTranscripts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTranscripts.slice(start, start + itemsPerPage);
    }, [filteredTranscripts, currentPage]);

    const totalPages = Math.ceil(filteredTranscripts.length / itemsPerPage);

    // Get unique ended reasons for the dropdown
    const uniqueEndedReasons = useMemo(() => {
        const reasons = new Set<string>();
        transcripts.forEach(t => {
            if (t.endedReason) reasons.add(t.endedReason);
        });
        return Array.from(reasons);
    }, [transcripts]);

    const formatDuration = (t: any) => {
        let seconds = parseInt(t.duration as string, 10);

        // Failsafe for older backend responses where duration might be missing or 0
        if (!seconds || isNaN(seconds)) {
            if (t.endedAt && t.createdAt) {
                seconds = Math.max(0, Math.floor((new Date(t.endedAt).getTime() - new Date(t.createdAt).getTime()) / 1000));
            }
        }

        if (!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {!selectedCall ? (
                <>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <MessageCircle className="w-8 h-8 text-primary" />
                            AI Agent Transcripts
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Review and filter the AI agent call transcripts from your Vapi sequence automation.
                        </p>
                    </div>

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
                                                            setHasSearched(false);
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
                                                            setHasSearched(false);
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="flex items-end xs:col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-6 mt-2">
                                            <Button
                                                onClick={() => setHasSearched(true)}
                                                disabled={!filters.dateFrom || !filters.dateTo}
                                                className="w-full sm:w-auto"
                                            >
                                                <Search className="w-4 h-4 mr-2" />
                                                Search Transcripts
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
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</label>
                                            <div className="relative">
                                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    name="name"
                                                    placeholder="Search name..."
                                                    value={filters.name}
                                                    onChange={handleFilterChange}
                                                    className="pl-9 h-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 focus-within:ring-1 ring-ring rounded-md">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    type="text"
                                                    name="phone"
                                                    placeholder="Search phone..."
                                                    value={filters.phone}
                                                    onChange={handleFilterChange}
                                                    className="pl-9 h-9"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 focus-within:ring-1 ring-ring rounded-md">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Min Duration</label>
                                            <Select
                                                value={filters.duration}
                                                onValueChange={(val) => handleSelectChange(val, 'duration')}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="All Durations" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="All">All Durations</SelectItem>
                                                    <SelectItem value="20">{">"} 20 seconds</SelectItem>
                                                    <SelectItem value="30">{">"} 30 seconds</SelectItem>
                                                    <SelectItem value="60">{">"} 1 minute</SelectItem>
                                                    <SelectItem value="120">{">"} 2 minutes</SelectItem>
                                                    <SelectItem value="180">{">"} 3 minutes</SelectItem>
                                                    <SelectItem value="300">{">"} 5 minutes</SelectItem>
                                                    <SelectItem value="600">{">"} 10 minutes</SelectItem>
                                                    <SelectItem value="900">{">"} 15 minutes</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5 focus-within:ring-1 ring-ring rounded-md">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ended Reason</label>
                                            <Select
                                                value={filters.endedReason}
                                                onValueChange={(val) => handleSelectChange(val, 'endedReason')}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Select Reason" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="All">All Reasons</SelectItem>
                                                    {uniqueEndedReasons.map(r => (
                                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end mt-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setHasSearched(false);
                                                    setFilters(prev => ({ ...prev, name: '', phone: '', duration: '', endedReason: 'All' }));
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

                    {!hasSearched ? (
                        <Card className="border-dashed bg-muted/10 mt-6">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <Filter className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold text-foreground">Awaiting Search Criteria</h3>
                                <p className="text-muted-foreground mt-1 max-w-sm">
                                    Please select your desired date range above and click "Search Transcripts" to view your call records.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="mt-6">
                            <CardContent className="p-0">
                                {filteredTranscripts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
                                        <p className="text-muted-foreground font-medium">No calls found matching your filters.</p>
                                        <Button
                                            variant="link"
                                            onClick={() => setFilters({ dateFrom: '', dateTo: '', name: '', phone: '', duration: '', endedReason: 'All' })}
                                            className="mt-2 text-primary"
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                    <TableHead className="font-semibold">Name</TableHead>
                                                    <TableHead className="font-semibold">Phone Number</TableHead>
                                                    <TableHead className="font-semibold">Duration</TableHead>
                                                    <TableHead className="font-semibold">Ended Reason</TableHead>
                                                    <TableHead className="font-semibold">Date</TableHead>
                                                    <TableHead className="text-right font-semibold">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedTranscripts.map((t, i) => (
                                                    <TableRow key={i} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedCall(t)}>
                                                        <TableCell className="font-medium">
                                                            {t.contactName || t.customerSettings?.name || "Customer"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="secondary" className="font-mono bg-muted/60">
                                                                {t.customerSettings?.number || t.phone || t.customerNumber || "N/A"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1 text-muted-foreground">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {formatDuration(t)}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={t.endedReason === 'customer-ended-call' ? 'outline' : 'default'} className="capitalize whitespace-nowrap">
                                                                {t.endedReason?.replace(/-/g, ' ') || 'Unknown'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                                            {new Date(t.endedAt || t.createdAt).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="sm" className="h-8 gap-2 hover:bg-primary/10 hover:text-primary">
                                                                <Eye className="w-4 h-4" />
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between px-6 py-4 border-t">
                                                <div className="text-sm text-muted-foreground">
                                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTranscripts.length)} of {filteredTranscripts.length} entries
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        disabled={currentPage === 1}
                                                    >
                                                        Previous
                                                    </Button>
                                                    <div className="text-sm font-medium px-2">
                                                        Page {currentPage} of {totalPages}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        disabled={currentPage >= totalPages}
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
                </>
            ) : (
                // Selected Call Details View 
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setSelectedCall(null)}
                            className="gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to List
                        </Button>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                            <Clock className="w-4 h-4" />
                            {new Date(selectedCall.endedAt || selectedCall.createdAt).toLocaleString()}
                        </div>
                    </div>

                    <Card className="border-t-4 border-t-primary shadow-md">
                        <CardHeader className="bg-muted/20 pb-4 border-b">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2 mb-2">
                                        <User className="w-5 h-5 text-primary" />
                                        {selectedCall.contactName || selectedCall.customerSettings?.name || "Customer"}
                                    </CardTitle>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-background">
                                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                            {selectedCall.customerSettings?.number || selectedCall.phone || selectedCall.customerNumber || "N/A"}
                                        </Badge>
                                        {selectedCall.customerSettings?.email && (
                                            <Badge variant="outline" className="gap-1.5 px-3 py-1 bg-background">
                                                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                                                {selectedCall.customerSettings?.email}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 items-start md:items-end">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Duration:</span>
                                        <span className="font-semibold">{formatDuration(selectedCall)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant="secondary" className="capitalize">
                                            {selectedCall.endedReason?.replace(/-/g, ' ') || 'Unknown'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                    <MessageCircle className="w-5 h-5 text-muted-foreground" />
                                    Call Transcript
                                </h3>
                                {selectedCall.transcript ? (
                                    <div className="bg-muted/10 border border-border/50 rounded-xl p-5 shadow-inner">
                                        <div className="space-y-4">
                                            {selectedCall.transcript.split('\n').map((line: string, idx: number) => {
                                                const isUser = line.toLowerCase().startsWith('user:') || line.toLowerCase().startsWith('customer:');
                                                const isAgent = line.toLowerCase().startsWith('bot:') || line.toLowerCase().startsWith('agent:') || line.toLowerCase().startsWith('ai:');

                                                if (isUser) {
                                                    return (
                                                        <div key={idx} className="flex flex-col items-end w-full group">
                                                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-1 mr-1 font-semibold group-hover:text-primary transition-colors">Customer</span>
                                                            <div className="bg-primary text-primary-foreground px-4 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm leading-relaxed">
                                                                {line.replace(/^(User|Customer):\s*/i, '')}
                                                            </div>
                                                        </div>
                                                    );
                                                } else if (isAgent) {
                                                    return (
                                                        <div key={idx} className="flex flex-col items-start w-full group">
                                                            <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-1 ml-1 font-semibold group-hover:text-primary transition-colors">AI Agent</span>
                                                            <div className="bg-card text-foreground px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] border shadow-sm leading-relaxed">
                                                                {line.replace(/^(Bot|Agent|AI):\s*/i, '')}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={idx} className="flex justify-center my-3 relative">
                                                        <div className="absolute inset-0 flex items-center">
                                                            <span className="w-full border-t border-muted" />
                                                        </div>
                                                        <div className="relative flex justify-center text-xs uppercase bg-background px-3 text-muted-foreground italic">
                                                            {line}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-xl border border-dashed border-border/60">
                                        <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
                                        <p className="text-sm font-medium text-foreground">Transcript Unavailable</p>
                                        <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">The transcript is currently processing or was not recorded for this specific call.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
