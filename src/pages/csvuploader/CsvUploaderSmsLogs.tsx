import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Search, RefreshCw, Send, AlertCircle, Calendar, Phone, User, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SmsLog {
    _id: string;
    phone: string;
    name: string;
    message: string;
    status: 'Sent' | 'Failed' | 'Replied';
    error?: string;
    replyMessage?: string;
    sentAt: string;
    updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CsvUploaderSmsLogs() {
    const [logs, setLogs] = useState<SmsLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/csv-uploader/sms-logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setLogs(data.logs);
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to fetch SMS logs",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Error fetching SMS logs:', error);
            toast({
                title: "Error",
                description: "Failed to connect to server",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = logs.filter(log => 
        log.phone.includes(searchQuery) ||
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string, error?: string) => {
        switch (status) {
            case 'Sent':
                return <Badge className="bg-green-500 hover:bg-green-600 border-none shadow-sm"><Send className="w-3 h-3 mr-1" /> Sent</Badge>;
            case 'Replied':
                return <Badge className="bg-purple-500 hover:bg-purple-600 border-none shadow-sm"><MessageSquare className="w-3 h-3 mr-1" /> Replied</Badge>;
            case 'Failed':
                return (
                    <div className="flex flex-col gap-1 items-start">
                        <Badge variant="destructive" className="shadow-sm"><AlertCircle className="w-3 h-3 mr-1" /> Failed</Badge>
                        {error && <span className="text-[10px] text-red-500 max-w-[120px] leading-tight font-medium">{error}</span>}
                    </div>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">SMS Campaign Logs</h1>
                    <p className="text-muted-foreground mt-1">Track SMS delivery, failures, and customer responses</p>
                </div>
                <Button onClick={fetchLogs} disabled={isLoading} variant="outline" className="h-11 px-6 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group">
                    <RefreshCw className={cn("h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500", isLoading && "animate-spin")} />
                    Refresh Logs
                </Button>
            </div>

            <Card className="border-none shadow-xl shadow-primary/5 bg-gradient-to-b from-card to-card/95">
                <CardHeader className="pb-3 border-b border-border/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by phone, name or content..."
                                className="pl-10 h-11 bg-muted/30 border-none rounded-xl focus-visible:ring-primary/20"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-primary">{logs.length}</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Sent</span>
                            </div>
                            <div className="w-px h-8 bg-border/50" />
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-red-500">{logs.filter(l => l.status === 'Failed').length}</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Failures</span>
                            </div>
                            <div className="w-px h-8 bg-border/50" />
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-purple-500">{logs.filter(l => l.status === 'Replied').length}</span>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Replies</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/30 text-muted-foreground font-medium border-b border-border/50">
                                    <th className="text-left p-4 font-semibold uppercase tracking-wider text-[11px]">Contact</th>
                                    <th className="text-left p-4 font-semibold uppercase tracking-wider text-[11px]">Message Content</th>
                                    <th className="text-left p-4 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                                    <th className="text-left p-4 font-semibold uppercase tracking-wider text-[11px]">Replies</th>
                                    <th className="text-left p-4 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="p-4" colSpan={5}>
                                                <div className="h-10 bg-muted/50 rounded-lg w-full" />
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log._id} className="hover:bg-primary/[0.02] transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        <Phone className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{log.name || 'Unknown'}</span>
                                                        <span className="text-xs text-muted-foreground">{log.phone}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 max-w-[250px]">
                                                <p className="line-clamp-2 text-muted-foreground italic font-medium">"{log.message}"</p>
                                            </td>
                                            <td className="p-4">{getStatusBadge(log.status, log.error)}</td>
                                            <td className="p-4">
                                                {log.status === 'Replied' ? (
                                                    <div className="flex items-start gap-2 max-w-[200px] p-2 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800 animate-in slide-in-from-right-2 duration-300">
                                                        <ArrowRight className="w-3 h-3 text-purple-500 mt-1 flex-shrink-0" />
                                                        <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 italic line-clamp-3">"{log.replyMessage}"</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/50">No reply yet</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(log.sentAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-3 grayscale opacity-30">
                                                <MessageSquare className="h-12 w-12" />
                                                <p className="text-lg font-medium">No SMS logs found</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
