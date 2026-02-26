import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Linkedin, Mail, Phone, CheckCircle, XCircle, AlertCircle, Loader2, Send, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { notification } from "antd";
import axios from "axios";
import { CandidateDetailsDialog } from "./CandidateDetailsDialog";
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
    NEW: { label: "New", color: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
    ENRICHING: { label: "Enriching...", color: "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse" },
    READY: { label: "Ready", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    NEEDS_REVIEW: { label: "Needs Review", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    LINKEDIN_SENT: { label: "LinkedIn Sent", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
    VAPI_CALLED: { label: "Vapi Call Initiated", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    REJECTED: { label: "Rejected", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" }
};

export default function CandidateBoard() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [jobTitle, setJobTitle] = useState("");

    const fetchCandidates = async () => {
        if (!jobId) return;
        try {
            const res = await axios.get(`${API_URL}/hr/candidates?jobId=${jobId}`);
            setCandidates(res.data);
        } catch (error: any) {
            notification.error({
                message: 'Pipeline Sync Error',
                description: "Failed to reload candidates. Please refresh the page.",
                placement: 'topRight'
            });
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

    useEffect(() => {
        const fetchJob = async () => {
            if (!jobId) return;
            try {
                const res = await axios.get(`${API_URL}/hr/jobs/${jobId}`);
                setJobTitle(res.data?.title || "");
            } catch (err) {
                console.error("Failed to fetch job title", err);
            }
        };
        fetchJob();
    }, [jobId]);

    const updateStatus = async (id: string, newStatus: string, metadata: any = {}) => {
        if (newStatus === 'LINKEDIN_SENT') setIsSending(true);
        try {
            await axios.patch(`${API_URL}/hr/candidates/${id}/status`, { status: newStatus, ...metadata });
            toast.success(`Candidate moved to ${STATUS_CONFIG[newStatus].label}`);
            fetchCandidates(); // Refresh list
        } catch (error: any) {
            notification.error({
                message: 'Status Update Failed',
                description: error.response?.data?.error || "Failed to update candidate status.",
                placement: 'topRight'
            });
        } finally {
            if (newStatus === 'LINKEDIN_SENT') setIsSending(false);
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
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [connectDialogOpen, setConnectDialogOpen] = useState(false);

    const handleCardClick = (candidate: any) => {
        setSelectedCandidate(candidate);
        setDetailsOpen(true);
    };

    const getTemplates = (candidate: any) => {
        const firstName = candidate.name.split(' ')[0];
        const title = jobTitle || "your field";
        const calendarLink = "https://calendar.app.google/4nwNSZdtumvdNJgm7";

        return {
            connect: `Hi ${firstName}, liked your work in ${title}. We're hiring a ${title} & want to discuss your career growth. Book here: ${calendarLink} - Paromita P, HR Manager`,
            followUp: `Hi ${firstName}, I came across your profile and reviewed your work; it truly stood out. We currently have an opening for a ${title} and are connecting with professionals who are genuinely looking for career growth, ownership, and long-term opportunities. If this aligns with what you're looking for, I'd like to schedule a quick interview to discuss the role and growth path. Book here: ${calendarLink} - Best regards, Paromita Pututunda, HR Manager, Kyptronix LLP`
        };
    };

    const handleConnectDone = async (id: string) => {
        const templates = getTemplates(selectedCandidate);
        await updateStatus(id, 'LINKEDIN_SENT', { message: templates.connect });
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

    // Calculate visible columns once
    const visibleStatuses = (['ENRICHING', 'READY', 'NEEDS_REVIEW', 'VAPI_CALLED', 'LINKEDIN_SENT', 'REJECTED'] as const).filter(status => {
        if (status === 'ENRICHING') {
            return candidates.some((c: any) => c.status === 'ENRICHING' || c.status === 'NEW');
        }
        return candidates.some((c: any) => c.status === status);
    });

    const isSingleView = visibleStatuses.length === 1;

    const renderColumn = (status: keyof typeof STATUS_CONFIG) => {
        let items = candidates.filter((c: any) => c.status === status);
        if (status === 'ENRICHING') {
            const newItems = candidates.filter((c: any) => c.status === 'NEW');
            items = [...items, ...newItems];
        }
        const config = STATUS_CONFIG[status];

        return (
            <div className={`flex flex-col gap-4 min-h-0 h-full ${isSingleView ? 'w-full' : ''}`}>
                <div className={`p-3 rounded-xl border ${config.color} flex justify-between items-center shrink-0`}>
                    <span className="font-bold truncate">{config.label}</span>
                    <span className="text-xs font-mono opacity-80 bg-white/10 px-2 py-0.5 rounded">{items.length}</span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                    {items.map((candidate: any) => (
                        <div
                            key={candidate._id}
                            onClick={() => handleCardClick(candidate)}
                            className={`rounded-xl border border-border bg-card hover:border-indigo-500/30 hover:bg-muted/50 cursor-pointer transition-all group relative ${isSingleView ? 'p-3 flex items-center justify-between gap-4' : 'p-4 shadow-sm'}`}
                        >

                            {/* SECTION 1: Identity (Left) */}
                            <div className={`${isSingleView ? 'flex-1 min-w-[300px]' : 'mb-2'}`}>
                                <div className="flex gap-4 items-start">
                                    {/* Avatar */}
                                    {candidate.profilePicture ? (
                                        <img src={candidate.profilePicture} alt={candidate.name} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/20" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold border border-indigo-500/20 text-lg">
                                            {candidate.name.charAt(0)}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-foreground text-base truncate pr-2" title={candidate.name}>{candidate.name}</h4>
                                            {!isSingleView && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className="text-muted-foreground hover:text-foreground transition-colors" onClick={(e) => e.stopPropagation()}>
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="bg-popover border-border text-popover-foreground">
                                                        <DropdownMenuItem className="text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDelete(candidate._id); }}>
                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>

                                        {/* Headline / Current Role */}
                                        <p className="text-xs text-indigo-600 line-clamp-2 mt-0.5" title={candidate.headline}>
                                            {candidate.headline || (candidate.experience?.[0] ? `${candidate.experience[0].position} at ${candidate.experience[0].companyName}` : '')}
                                        </p>

                                        {/* Location */}
                                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                                            <span>{candidate.location || "Unknown Location"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Info (Center) */}
                            <div className={`${isSingleView ? 'flex-[2] flex flex-col justify-center px-4 border-l border-border border-r' : 'mb-3 space-y-2 mt-3'}`}>
                                <div className="space-y-2">
                                    {candidate.experience?.[0] && (
                                        <div className="flex items-center gap-2 text-xs text-foreground/80">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500/50"></span>
                                            <span className="font-medium">{candidate.experience[0].position}</span>
                                            <span className="text-muted-foreground">at</span>
                                            <span className="text-foreground/70 truncate max-w-[150px]">{candidate.experience[0].companyName}</span>
                                        </div>
                                    )}

                                    {candidate.skills && candidate.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {candidate.skills.slice(0, isSingleView ? 5 : 3).map((skill: string, idx: number) => (
                                                <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border whitespace-nowrap">
                                                    {skill}
                                                </span>
                                            ))}
                                            {candidate.skills.length > (isSingleView ? 5 : 3) && (
                                                <span className="px-1.5 py-0.5 text-[9px] text-muted-foreground/60">+{candidate.skills.length - (isSingleView ? 5 : 3)}</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-1">
                                        <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 transition-colors" onClick={(e) => e.stopPropagation()}>
                                            <Linkedin className="w-3 h-3" /> <span className="underline decoration-indigo-600/30 underline-offset-2">LinkedIn</span>
                                        </a>
                                        {candidate.email && (
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                                                <Mail className="w-3 h-3" /> {candidate.email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: Actions (Right) */}
                            <div className={`${isSingleView ? 'flex-1 flex justify-end gap-2 items-center' : 'flex gap-2 pt-2 border-t border-border'}`}>
                                {status === 'READY' && (
                                    <Button
                                        size="sm"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCandidate(candidate);
                                            setConnectDialogOpen(true);
                                        }}
                                    >
                                        <Send className="w-3 h-3 mr-1" /> Connect
                                    </Button>
                                )}

                                {status === 'NEEDS_REVIEW' && (
                                    <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10" onClick={(e) => { e.stopPropagation(); updateStatus(candidate._id, 'READY'); }}>
                                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                                    </Button>
                                )}

                                {status === 'LINKEDIN_SENT' && (
                                    <div className="text-center text-xs text-emerald-600 font-medium py-1">
                                        <CheckCircle className="w-3 h-3 inline mr-1" /> Sent
                                    </div>
                                )}

                                {isSingleView && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-muted-foreground hover:text-foreground transition-colors p-1" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="bg-popover border-border text-popover-foreground">
                                            <DropdownMenuItem className="text-destructive cursor-pointer" onClick={(e) => { e.stopPropagation(); handleDelete(candidate._id); }}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    ))}
                    {items.length === 0 && (
                        <div className="h-24 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground text-sm bg-muted/20">
                            No candidates in this stage
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/20 p-6 flex flex-col">
            <div className="container mx-auto max-w-[1600px] space-y-6 flex-1 flex flex-col">

                {/* Header/Back Button */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/hr-portal/recruitment")}>
                        <ArrowLeft className="w-4 h-4" /> Back to Jobs
                    </Button>

                    {loading && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 font-medium ">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Syncing data...</span>
                        </div>
                    )}
                </div>

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-10 mb-2">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                                    <CheckCircle className="h-6 w-6 text-white" />
                                </div>
                                <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-xs font-semibold tracking-wide uppercase">
                                    Candidate Pipeline
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                {jobTitle || "Candidate Pipeline"}
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl">
                                Manage and track candidates through your recruitment workflow stages.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button id="add-candidate-trigger" size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                    <Plus className="w-4 h-4 mr-2" /> Add Candidates
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-popover border-border text-popover-foreground max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Add Candidates</DialogTitle>
                                </DialogHeader>

                                <Tabs defaultValue="single" className="w-full mt-4">
                                    <TabsList className="bg-muted border-border w-full mb-4">
                                        <TabsTrigger value="single" className="flex-1">Single Entry</TabsTrigger>
                                        <TabsTrigger value="bulk" className="flex-1">Bulk Paste (URLs)</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="single">
                                        <form onSubmit={handleAddCandidate} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Candidate Name</Label>
                                                <Input name="name" required placeholder="e.g. John Doe" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>LinkedIn URL</Label>
                                                <Input name="linkedinUrl" required placeholder="https://linkedin.com/in/..." />
                                            </div>
                                            <Button type="submit" disabled={isAdding} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
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
                                                    className="w-full h-48 bg-background border border-border rounded-md p-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="https://linkedin.com/in/user1&#10;https://linkedin.com/in/user2"
                                                />
                                            </div>
                                            <Button
                                                onClick={handleBulkImport}
                                                disabled={isAdding}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
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
                </div>

                <div className="flex-1 overflow-hidden pb-4 min-h-0 mt-4">
                    {loading && candidates.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6 text-muted-foreground">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                                <Loader2 className="w-16 h-16 animate-spin text-indigo-600 relative z-10" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-lg font-bold text-foreground tracking-tight">Syncing Pipeline</p>
                                <p className="text-sm font-medium">Fetching candidate data...</p>
                            </div>
                        </div>
                    ) : visibleStatuses.length > 0 ? (
                        <div className={`grid gap-4 h-full ${isSingleView ? 'grid-cols-1 max-w-5xl mx-auto w-full' : `grid-cols-${visibleStatuses.length}`
                            }`}>
                            {visibleStatuses.map(status => renderColumn(status))}
                        </div>
                    ) : (
                        <div className="h-full border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center gap-4 text-muted-foreground bg-muted/20">
                            <div className="p-4 rounded-full bg-muted border border-border">
                                <ArrowLeft className="w-8 h-8 opacity-20" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-bold">No candidates yet</p>
                                <p className="text-sm">Click "+ Add Candidates" to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CandidateDetailsDialog
                candidate={selectedCandidate}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />

            {/* Connection Outreach Dialog */}
            <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
                <DialogContent className="bg-popover border-border text-popover-foreground max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Linkedin className="w-5 h-5 text-indigo-600" /> Outreach to {selectedCandidate?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedCandidate && (
                        <div className="space-y-6 mt-4">
                            <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[10px] text-indigo-600 font-medium uppercase tracking-tight">
                                💡 Step 1: Open Profile &rarr; Step 2: Copy Note &rarr; Step 3: Mark as Sent
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-muted-foreground">1. Connection Request Note</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-indigo-600 hover:text-indigo-700"
                                            onClick={() => {
                                                navigator.clipboard.writeText(getTemplates(selectedCandidate).connect);
                                                toast.success("Note copied!");
                                            }}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="p-4 rounded-md bg-muted border border-border text-sm italic leading-relaxed">
                                        "{getTemplates(selectedCandidate).connect}"
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-muted-foreground">2. Follow-up DM (Post-Connection)</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-indigo-600 hover:text-indigo-700"
                                            onClick={() => {
                                                navigator.clipboard.writeText(getTemplates(selectedCandidate).followUp);
                                                toast.success("Follow-up copied!");
                                            }}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="p-4 rounded-md bg-muted border border-border text-sm italic leading-relaxed">
                                        "{getTemplates(selectedCandidate).followUp}"
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    className="flex-1 bg-muted hover:bg-muted/80 border-border text-foreground"
                                    onClick={() => window.open(selectedCandidate.linkedinUrl, '_blank')}
                                >
                                    <Linkedin className="w-4 h-4 mr-2" /> Open Profile
                                </Button>
                                <Button
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => handleConnectDone(selectedCandidate._id)}
                                    disabled={isSending}
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Mark as Sent
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
