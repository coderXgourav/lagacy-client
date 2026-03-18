import { useState, useEffect, useRef, useCallback } from "react";
import {
    MessageSquare,
    Send,
    Search,
    RefreshCw,
    User,
    Clock,
    Check,
    CheckCheck,
    ArrowLeft,
    Phone,
    Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Conversation {
    phone: string;
    name: string;
    lastMessage: string;
    lastTimestamp: string;
    lastDirection: 'inbound' | 'outbound';
    unreadCount: number;
    totalMessages: number;
}

interface Message {
    _id: string;
    phone: string;
    name: string;
    direction: 'inbound' | 'outbound';
    body: string;
    contentSid?: string;
    twilioSid?: string;
    status: string;
    timestamp: string;
    read: boolean;
}

export default function CsvUploaderWhatsAppChat() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/whatsapp-chat/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setConversations(data.conversations);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMessages = useCallback(async (phone: string) => {
        try {
            setMessagesLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/whatsapp-chat/messages/${encodeURIComponent(phone)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setMessages(data.messages);
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [fetchConversations]);

    useEffect(() => {
        if (selectedPhone) {
            fetchMessages(selectedPhone);
            const interval = setInterval(() => fetchMessages(selectedPhone), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedPhone, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSelectConversation = (phone: string) => {
        setSelectedPhone(phone);
        setShowMobileChat(true);
        fetchMessages(phone);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedPhone || sending) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/whatsapp-chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    phone: selectedPhone,
                    message: newMessage.trim()
                })
            });

            const data = await response.json();
            if (data.success) {
                setNewMessage("");
                fetchMessages(selectedPhone);
                fetchConversations();
                toast({
                    title: "Message Sent",
                    description: "Your WhatsApp reply has been sent.",
                });
            } else {
                toast({
                    title: "Failed to Send",
                    description: data.error || "Something went wrong",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedConversation = conversations.find(c => c.phone === selectedPhone);

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                        <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    WhatsApp Chat
                    {totalUnread > 0 && (
                        <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                            {totalUnread} new
                        </Badge>
                    )}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    View and reply to WhatsApp conversations
                </p>
            </div>

            <Card className="overflow-hidden border shadow-xl" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
                <div className="flex h-full">
                    {/* Left Panel - Conversations List */}
                    <div className={cn(
                        "w-full md:w-[340px] lg:w-[380px] border-r flex flex-col bg-card",
                        showMobileChat ? "hidden md:flex" : "flex"
                    )}>
                        {/* Search */}
                        <div className="p-3 border-b bg-muted/30">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search conversations..."
                                    className="pl-9 h-9 bg-background"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Conversations */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                                    <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
                                    <p>No conversations yet</p>
                                    <p className="text-xs mt-1">WhatsApp replies will appear here</p>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => (
                                    <div
                                        key={conv.phone}
                                        onClick={() => handleSelectConversation(conv.phone)}
                                        className={cn(
                                            "flex items-start gap-3 p-3 cursor-pointer border-b transition-all hover:bg-muted/50",
                                            selectedPhone === conv.phone && "bg-primary/5 border-l-2 border-l-primary"
                                        )}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-sm truncate">
                                                    {conv.name || conv.phone}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                                    {formatDate(conv.lastTimestamp)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-0.5">
                                                <p className="text-xs text-muted-foreground truncate pr-2">
                                                    {conv.lastDirection === 'outbound' && (
                                                        <CheckCheck className="w-3 h-3 inline mr-1 text-blue-500" />
                                                    )}
                                                    {conv.lastMessage}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <Badge className="bg-green-500 text-white text-[10px] h-5 w-5 rounded-full flex items-center justify-center p-0 flex-shrink-0">
                                                        {conv.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                                {conv.phone}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Refresh */}
                        <div className="p-2 border-t bg-muted/20">
                            <Button variant="ghost" size="sm" className="w-full gap-2 text-xs" onClick={fetchConversations}>
                                <RefreshCw className="w-3 h-3" />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {/* Right Panel - Chat Thread */}
                    <div className={cn(
                        "flex-1 flex flex-col bg-gradient-to-b from-muted/10 to-muted/30",
                        !showMobileChat ? "hidden md:flex" : "flex"
                    )}>
                        {selectedPhone ? (
                            <>
                                {/* Chat Header */}
                                <div className="px-4 py-3 border-b bg-card flex items-center gap-3 shadow-sm">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden"
                                        onClick={() => setShowMobileChat(false)}
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">
                                            {selectedConversation?.name || selectedPhone}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {selectedPhone}
                                        </p>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                                }}>
                                    {messagesLoading && messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                            <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="text-sm">No messages yet</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg._id}
                                                className={cn(
                                                    "flex",
                                                    msg.direction === 'outbound' ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                <div className={cn(
                                                    "max-w-[75%] rounded-2xl px-4 py-2 shadow-sm",
                                                    msg.direction === 'outbound'
                                                        ? "bg-emerald-600 text-white rounded-br-md"
                                                        : "bg-card border rounded-bl-md"
                                                )}>
                                                    <p className="text-sm whitespace-pre-wrap break-words">
                                                        {msg.body || (msg.contentSid ? '[Template Message]' : '[No content]')}
                                                    </p>
                                                    <div className={cn(
                                                        "flex items-center gap-1 mt-1",
                                                        msg.direction === 'outbound' ? "justify-end" : "justify-start"
                                                    )}>
                                                        <span className={cn(
                                                            "text-[10px]",
                                                            msg.direction === 'outbound' ? "text-emerald-100" : "text-muted-foreground"
                                                        )}>
                                                            {formatTime(msg.timestamp)}
                                                        </span>
                                                        {msg.direction === 'outbound' && (
                                                            msg.status === 'delivered' || msg.status === 'read' ? (
                                                                <CheckCheck className={cn(
                                                                    "w-3 h-3",
                                                                    msg.status === 'read' ? "text-blue-300" : "text-emerald-200"
                                                                )} />
                                                            ) : (
                                                                <Check className="w-3 h-3 text-emerald-200" />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input */}
                                <div className="p-3 border-t bg-card">
                                    <div className="flex items-end gap-2">
                                        <Textarea
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="min-h-[40px] max-h-[120px] resize-none text-sm"
                                            rows={1}
                                        />
                                        <Button
                                            onClick={handleSendMessage}
                                            disabled={!newMessage.trim() || sending}
                                            className="bg-emerald-600 hover:bg-emerald-700 h-10 w-10 p-0 flex-shrink-0 rounded-full"
                                        >
                                            {sending ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Send className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                                        Press Enter to send • Shift+Enter for new line
                                    </p>
                                </div>
                            </>
                        ) : (
                            /* Empty State */
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-800/30 flex items-center justify-center mb-6">
                                    <MessageSquare className="w-12 h-12 text-emerald-500 opacity-60" />
                                </div>
                                <h2 className="text-xl font-semibold text-foreground mb-2">WhatsApp Chat</h2>
                                <p className="text-sm text-center max-w-xs">
                                    Select a conversation from the left to view messages and reply
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
