import { useState, useEffect } from "react";
import { MessageCircle, Phone, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CsvUploaderTranscripts() {
    const [transcripts, setTranscripts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                // Assuming backend route: /api/csv-uploader/transcripts
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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <MessageCircle className="w-8 h-8 text-primary" />
                    AI Agent Transcripts
                </h1>
                <p className="text-muted-foreground mt-1">
                    Review the AI agent call transcripts from your Vapi sequence automation.
                </p>
            </div>

            <div className="space-y-4 mt-6">
                {transcripts.length === 0 ? (
                    <Card className="border-dashed bg-muted/10">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center min-h-[300px]">
                            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground font-medium">No call transcripts available yet.</p>
                            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                                Transcripts will appear here automatically after the AI agent completes calls to your contacts from the sequence.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    transcripts.map((t: any, i) => (
                        <Card key={i}>
                            <CardHeader className="bg-muted/30 pb-3 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="gap-1 px-3 py-1 bg-background">
                                            <Phone className="w-3.5 h-3.5" />
                                            {t.contactName || t.customerSettings?.name || "Customer"}
                                        </Badge>
                                        <span className="text-sm font-medium text-muted-foreground border bg-background px-2 py-1 rounded-md">
                                            {t.customerSettings?.number || t.phone || t.customerNumber}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(t.endedAt || t.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">
                                    {t.transcript ? (
                                        <div className="bg-muted/10 border rounded-lg p-5">
                                            <div className="space-y-3">
                                                {t.transcript.split('\n').map((line: string, idx: number) => {
                                                    const isUser = line.toLowerCase().startsWith('user:') || line.toLowerCase().startsWith('customer:');
                                                    const isAgent = line.toLowerCase().startsWith('bot:') || line.toLowerCase().startsWith('agent:') || line.toLowerCase().startsWith('ai:');
                                                    
                                                    if (isUser) {
                                                        return (
                                                            <div key={idx} className="flex flex-col items-end w-full">
                                                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-1 mr-1 font-semibold">Customer</span>
                                                                <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                                                                    {line.replace(/^(User|Customer):\s*/i, '')}
                                                                </div>
                                                            </div>
                                                        );
                                                    } else if (isAgent) {
                                                        return (
                                                            <div key={idx} className="flex flex-col items-start w-full">
                                                                <span className="text-[11px] uppercase tracking-wider text-muted-foreground/70 mb-1 ml-1 font-semibold">AI Agent</span>
                                                                <div className="bg-muted text-foreground px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[85%] border shadow-sm">
                                                                    {line.replace(/^(Bot|Agent|AI):\s*/i, '')}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <p key={idx} className="text-sm text-muted-foreground italic bg-muted/30 px-3 py-1.5 rounded text-center my-2">
                                                            {line}
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center p-8 bg-muted/10 rounded-lg border border-dashed">
                                            <p className="text-sm text-muted-foreground italic">Transcript is processing or unavailable for this call.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
