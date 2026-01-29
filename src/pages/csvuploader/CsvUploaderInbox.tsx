import { useState, useEffect } from "react";
import {
    Inbox,
    Mail,
    MessageSquare,
    Search,
    Clock,
    User,
    ChevronRight,
    RefreshCw,
    Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Reply {
    _id: string;
    type: 'email' | 'sms';
    from: string;
    to: string;
    subject?: string;
    content: string;
    timestamp: string;
    read: boolean;
}

export default function CsvUploaderInbox() {
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<'all' | 'email' | 'sms'>('all');
    const [selectedReply, setSelectedReply] = useState<Reply | null>(null);

    const fetchReplies = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/csv-uploader/replies`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setReplies(data.replies);
            }
        } catch (error) {
            console.error('Failed to fetch replies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReplies();
        const interval = setInterval(fetchReplies, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const filteredReplies = replies.filter(reply => {
        const matchesSearch = 
            reply.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (reply.subject && reply.subject.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesFilter = filterType === 'all' || reply.type === filterType;

        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Inbox className="w-8 h-8 text-primary" />
                        Inbox
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage incoming replies from your campaigns
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchReplies}
                    disabled={loading}
                    className="gap-2"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <Card>
                <CardHeader className="p-4 md:p-6 pb-2">
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative flex-1 md:max-w-md">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by sender, content..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Filter type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Messages</SelectItem>
                                    <SelectItem value="email">Emails</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md border-t">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Type</TableHead>
                                    <TableHead className="w-[200px]">From</TableHead>
                                    <TableHead className="hidden md:table-cell">Content Preview</TableHead>
                                    <TableHead className="w-[150px] text-right">Time</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReplies.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            {loading ? "Loading messages..." : "No messages found"}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReplies.map((reply) => (
                                        <TableRow 
                                            key={reply._id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => setSelectedReply(reply)}
                                        >
                                            <TableCell>
                                                <Badge 
                                                    variant="secondary" 
                                                    className={cn(
                                                        "gap-1",
                                                        reply.type === 'email' 
                                                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200" 
                                                            : "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200"
                                                    )}
                                                >
                                                    {reply.type === 'email' ? (
                                                        <Mail className="w-3 h-3" />
                                                    ) : (
                                                        <MessageSquare className="w-3 h-3" />
                                                    )}
                                                    {reply.type === 'email' ? 'Email' : 'SMS'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{reply.from}</span>
                                                    {reply.subject && (
                                                        <span className="text-xs text-muted-foreground truncate md:hidden">
                                                            {reply.subject}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex flex-col max-w-[400px]">
                                                    {reply.subject && (
                                                        <span className="font-medium text-sm truncate mb-0.5">
                                                            {reply.subject}
                                                        </span>
                                                    )}
                                                    <span className="text-muted-foreground text-sm truncate">
                                                        {reply.content}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(reply.timestamp)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedReply} onOpenChange={(open) => !open && setSelectedReply(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge 
                                variant="secondary" 
                                className={cn(
                                    "gap-1",
                                    selectedReply?.type === 'email' 
                                        ? "bg-blue-100 text-blue-700 border-blue-200" 
                                        : "bg-purple-100 text-purple-700 border-purple-200"
                                )}
                            >
                                {selectedReply?.type === 'email' ? (
                                    <Mail className="w-3 h-3" />
                                ) : (
                                    <MessageSquare className="w-3 h-3" />
                                )}
                                {selectedReply?.type === 'email' ? 'Email Reply' : 'SMS Reply'}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {selectedReply && formatDate(selectedReply.timestamp)}
                            </span>
                        </div>
                        <DialogTitle className="text-xl">
                            {selectedReply?.subject || 'Message Details'}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 mt-1">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-medium text-foreground">From:</span> {selectedReply?.from}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4 p-4 rounded-lg bg-muted/30 border">
                        <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap font-sans">
                            {selectedReply?.content}
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setSelectedReply(null)}>
                            Close
                        </Button>
                        <Button variant="default">
                            Reply
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
