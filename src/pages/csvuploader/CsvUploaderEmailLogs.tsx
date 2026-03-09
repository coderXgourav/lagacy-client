import { useState, useEffect } from "react";
import { Mail, Clock, Search, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CsvUploaderEmailLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/api/csv-uploader/email-logs`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setLogs(data.logs || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const filteredLogs = logs.filter((log) => {
        const query = searchQuery.toLowerCase();
        return (
            (log.email || "").toLowerCase().includes(query) ||
            (log.name || "").toLowerCase().includes(query) ||
            (log.subject || "").toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Mail className="w-8 h-8 text-primary" />
                    Email Logs
                </h1>
                <p className="text-muted-foreground mt-1">
                    Review your automated email history and read receipts.
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-lg">Recent Emails</CardTitle>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, or subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Mail className="w-12 h-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground font-medium">No email logs found matching your criteria.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50">
                                    <TableHead className="font-semibold">Recipient</TableHead>
                                    <TableHead className="font-semibold">Subject</TableHead>
                                    <TableHead className="font-semibold">Status</TableHead>
                                    <TableHead className="font-semibold">Sent At</TableHead>
                                    <TableHead className="font-semibold">First Opened</TableHead>
                                    <TableHead className="font-semibold text-center">Opens</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log, i) => (
                                    <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{log.name || 'Unknown'}</span>
                                                <span className="text-xs text-muted-foreground">{log.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium">{log.subject}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={log.openCount > 0 ? "default" : "secondary"}
                                                className={log.openCount > 0 ? "bg-green-500 hover:bg-green-600" : ""}
                                            >
                                                {log.openCount > 0 ? "Seen" : log.status || "Unseen"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                {log.sentAt ? format(new Date(log.sentAt), "MMM d, yyyy h:mm a") : format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {log.firstOpenedAt ? format(new Date(log.firstOpenedAt), "MMM d, yyyy h:mm a") : "-"}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {log.openCount || 0}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
