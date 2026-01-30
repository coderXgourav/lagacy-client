import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Linkedin, Mail, Phone, CheckCircle, XCircle, AlertCircle, Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Status Colors & Labels
const STATUS_CONFIG = {
    NEW: { label: "New", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
    ENRICHING: { label: "Enriching...", color: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse" },
    READY: { label: "Ready", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    NEEDS_REVIEW: { label: "Needs Review", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    LINKEDIN_SENT: { label: "LinkedIn Sent", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    REJECTED: { label: "Rejected", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" }
};

export default function CandidateBoard() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const fetchCandidates = async () => {
        if (!jobId) return;
        try {
            const res = await axios.get(`${API_URL}/hr/candidates?jobId=${jobId}`);
            setCandidates(res.data);
        } catch (error) {
            console.error("Failed to fetch candidates", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
        // Poll for updates every 2 seconds for faster feedback during enrichment
        const interval = setInterval(fetchCandidates, 2000);
        return () => clearInterval(interval);
    }, [jobId]);

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await axios.patch(`${API_URL}/hr/candidates/${id}/status`, { status: newStatus });
            toast.success(`Candidate moved to ${STATUS_CONFIG[newStatus].label}`);
            fetchCandidates(); // Refresh list
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        const form = e.target as HTMLFormElement;
        const data = new FormData(form);
        const newCandidate = {
            jobId,
            name: data.get("name"),
            linkedinUrl: data.get("linkedinUrl"),
            status: "NEW", // Backend will trigger enrichment immediately
            confidenceScore: 0
        };

        try {
            await axios.post(`${API_URL}/hr/candidates`, newCandidate);
            toast.success("Candidate added. Enrichment starting...");
            fetchCandidates();
            (document.getElementById("add-candidate-trigger") as HTMLButtonElement)?.click(); 
        } catch (error: any) {
            if (error.response?.data?.skipped) {
                toast.info("Candidate already exists (Skipped)");
            } else {
                toast.error(error.response?.data?.error || "Failed to add candidate");
            }
        } finally {
            setIsAdding(false);
        }
    };

    const handleBulkImport = async () => {
        const textarea = document.getElementById("bulk-urls") as HTMLTextAreaElement;
        const urlStr = textarea?.value || "";
        const urls = urlStr.split("\n").map(u => u.trim()).filter(u => u.length > 0);

        if (urls.length === 0) {
            toast.error("Please paste at least one URL");
            return;
        }

        if (urls.length > 50) {
            toast.warning("Importing first 50 candidates only (batch limit)");
        }

        setIsAdding(true);
        try {
            const res = await axios.post(`${API_URL}/hr/candidates/bulk`, {
                jobId,
                urls: urls.slice(0, 50)
            });
            
            toast.success(`Import complete! Created: ${res.data.created}, Skipped: ${res.data.skipped}`);
            fetchCandidates();
            (document.getElementById("add-candidate-trigger") as HTMLButtonElement)?.click();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Bulk import failed");
        } finally {
            setIsAdding(false);
        }
    };

    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [connectDialogOpen, setConnectDialogOpen] = useState(false);

    const getTemplates = (candidate: any) => {
        const firstName = candidate.name.split(' ')[0];
        const company = candidate.companyData?.name || "your company";
        
        return {
            connect: `Hi ${firstName}, saw your background in ${candidate.companyData?.industry || 'your field'} and would love to connect!`,
            followUp: `Hi ${firstName}, thanks for connecting! I'm reaching out from Kyptronix regarding a role that might be a great fit given your experience at ${company}. Would you be open to a quick chat?`
        };
    };

    const handleConnectDone = async (id: string) => {
        await updateStatus(id, 'LINKEDIN_SENT');
        setConnectDialogOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this candidate?")) return;
        try {
            await axios.delete(`${API_URL}/hr/candidates/${id}`);
            toast.success("Candidate deleted");
            fetchCandidates();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Delete failed");
        }
    };

    const renderColumn = (status: keyof typeof STATUS_CONFIG) => {
        const items = candidates.filter((c: any) => c.status === status);
        const config = STATUS_CONFIG[status];

        return (
            <div className="flex-1 min-w-[280px] flex flex-col gap-4">
                <div className={`p-3 rounded-xl border ${config.color} flex justify-between items-center`}>
                    <span className="font-bold">{config.label}</span>
                    <span className="text-xs font-mono opacity-80 bg-white/10 px-2 py-0.5 rounded">{items.length}</span>
                </div>

                <div className="flex-1 space-y-3">
                    {items.map((candidate: any) => (
                        <div key={candidate._id} className="p-4 rounded-xl border border-white/5 bg-[#0F172A]/40 backdrop-blur-sm hover:border-indigo-500/30 transition-all group relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-200">{candidate.name}</h4>
                                    {candidate.companyData?.name && (
                                        <p className="text-xs text-slate-400">{candidate.companyData.name}</p>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="text-slate-500 hover:text-white transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#0B1120] border-white/10 text-slate-200">
                                        <DropdownMenuItem 
                                            className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer"
                                            onClick={() => handleDelete(candidate._id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Candidate
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            
                            <div className="space-y-1 mb-3">
                                <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-indigo-400 hover:underline truncate">
                                    <Linkedin className="w-3 h-3" /> Profile
                                </a>
                                {candidate.email ? (
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 truncate">
                                        <Mail className="w-3 h-3" /> {candidate.email}
                                    </div>
                                ) : (
                                    status === 'REJECTED' && (
                                        <div className="text-xs text-rose-500 italic">No email found</div>
                                    )
                                )}
                            </div>

                            {status === 'REJECTED' && candidate.rejectionReason && (
                                <div className="p-2 mb-3 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300">
                                    🚫 {candidate.rejectionReason}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2 border-t border-white/5">
                                {status === 'READY' && (
                                    <Button 
                                        size="xs" 
                                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white" 
                                        onClick={() => {
                                            setSelectedCandidate(candidate);
                                            setConnectDialogOpen(true);
                                        }}
                                    >
                                        <Send className="w-3 h-3 mr-1" /> Connect
                                    </Button>
                                )}
                                
                                {status === 'NEEDS_REVIEW' && (
                                    <Button size="xs" variant="outline" className="flex-1 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10" onClick={() => updateStatus(candidate._id, 'READY')}>
                                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                    </Button>
                                )}

                                {status === 'LINKEDIN_SENT' && (
                                    <div className="w-full text-center text-xs text-emerald-400 font-medium py-1">
                                        <CheckCircle className="w-3 h-3 inline mr-1" /> Sent
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="h-24 rounded-xl border border-dashed border-white/5 flex items-center justify-center text-slate-600 text-sm">
                            Empty
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between mb-6 px-1">
                <Button variant="ghost" className="gap-2 text-slate-400 hover:text-white" onClick={() => navigate("/hr-portal/recruitment")}>
                    <ArrowLeft className="w-4 h-4" /> Back to Jobs
                </Button>
                
                <Dialog>
                    <DialogTrigger asChild>
                        <Button id="add-candidate-trigger" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                            + Add Candidates
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#0B1120] border-white/10 text-slate-200 max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-white">Add Candidates</DialogTitle>
                        </DialogHeader>
                        
                        <Tabs defaultValue="single" className="w-full mt-4">
                            <TabsList className="bg-white/5 border-white/10 w-full mb-4">
                                <TabsTrigger value="single" className="flex-1">Single Entry</TabsTrigger>
                                <TabsTrigger value="bulk" className="flex-1">Bulk Paste (URLs)</TabsTrigger>
                            </TabsList>

                            <TabsContent value="single">
                                <form onSubmit={handleAddCandidate} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Candidate Name</Label>
                                        <Input name="name" required className="bg-white/5 border-white/10 text-white" placeholder="e.g. John Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>LinkedIn URL</Label>
                                        <Input name="linkedinUrl" required className="bg-white/5 border-white/10 text-white" placeholder="https://linkedin.com/in/..." />
                                    </div>
                                    <Button type="submit" disabled={isAdding} className="w-full bg-indigo-600 hover:bg-indigo-500">
                                        {isAdding ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Candidate"}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="bulk">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Paste LinkedIn URLs (One per line)</Label>
                                        <textarea 
                                            id="bulk-urls"
                                            className="w-full h-48 bg-white/5 border border-white/10 rounded-md p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="https://linkedin.com/in/user1&#10;https://linkedin.com/in/user2"
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleBulkImport} 
                                        disabled={isAdding} 
                                        className="w-full bg-indigo-600 hover:bg-indigo-500"
                                    >
                                        {isAdding ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                        Import All Candidates
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 px-1">
                {renderColumn('ENRICHING')}
                {renderColumn('READY')}
                {renderColumn('NEEDS_REVIEW')}
                {renderColumn('LINKEDIN_SENT')}
                {renderColumn('REJECTED')}
            </div>
            {/* Connection Outreach Dialog */}
            <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
                <DialogContent className="bg-[#0B1120] border-white/10 text-slate-200 max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Linkedin className="w-5 h-5 text-indigo-400" /> Outreach to {selectedCandidate?.name}
                        </DialogTitle>
                    </DialogHeader>
                    
                    {selectedCandidate && (
                        <div className="space-y-6 mt-4">
                            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-indigo-300">
                                💡 Step 1: Open Profile &rarr; Step 2: Copy Note &rarr; Step 3: Mark as Sent
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-slate-400">1. Connection Request Note</Label>
                                        <Button 
                                            variant="ghost" 
                                            size="xs" 
                                            className="h-7 text-indigo-400 hover:text-indigo-300"
                                            onClick={() => {
                                                navigator.clipboard.writeText(getTemplates(selectedCandidate).connect);
                                                toast.success("Note copied!");
                                            }}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="p-3 rounded-md bg-white/5 border border-white/10 text-sm text-slate-300 italic">
                                        "{getTemplates(selectedCandidate).connect}"
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-slate-400">2. Follow-up DM (Post-Connection)</Label>
                                        <Button 
                                            variant="ghost" 
                                            size="xs" 
                                            className="h-7 text-indigo-400 hover:text-indigo-300"
                                            onClick={() => {
                                                navigator.clipboard.writeText(getTemplates(selectedCandidate).followUp);
                                                toast.success("Follow-up copied!");
                                            }}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="p-3 rounded-md bg-white/5 border border-white/10 text-sm text-slate-300 italic">
                                        "{getTemplates(selectedCandidate).followUp}"
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button 
                                    className="flex-1 bg-white/5 hover:bg-white/10 border-white/10 text-white"
                                    onClick={() => window.open(selectedCandidate.linkedinUrl, '_blank')}
                                >
                                    <Linkedin className="w-4 h-4 mr-2" /> Open Profile
                                </Button>
                                <Button 
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                                    onClick={() => handleConnectDone(selectedCandidate._id)}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Mark as Sent
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
