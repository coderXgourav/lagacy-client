import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MapPin, Calendar, Clock, ArrowRight, Briefcase, Trash2, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { notification } from "antd";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HrRecruitment() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [navigatingId, setNavigatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await axios.get(`${API_URL}/hr/jobs`);
            setJobs(res.data);
        } catch (error) {
            console.error("Failed to fetch jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (id: string) => {
        setNavigatingId(id);
        navigate(`/hr-portal/recruitment/board/${id}`);
    };

    const handleDeleteJob = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm("Are you sure? This will delete the job and ALL its candidates.")) return;

        try {
            await axios.delete(`${API_URL}/hr/jobs/${id}`);
            toast.success("Job deleted successfully");
            setJobs(jobs.filter((j: any) => j._id !== id));
        } catch (error) {
            notification.error({
                message: 'Deletion Failed',
                description: 'Failed to delete job. Please try again later.',
                placement: 'topRight'
            });
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <div className="container mx-auto max-w-[1600px] space-y-6">

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12 mb-2">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                                    <UserPlus className="h-7 w-7 text-white" />
                                </div>
                                <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 text-xs font-semibold tracking-wide uppercase">
                                    Recruitment ATS
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                                Recruitment & ATS
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl">
                                Manage open requisitions and track candidate sourcing agents. Streamline your hiring pipeline with AI.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 items-end">
                            <Button
                                onClick={() => navigate("/hr-portal/recruitment/new")}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 gap-2"
                            >
                                <Plus className="h-4 w-4" /> New Job Request
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Job Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {jobs.map((job: any) => (
                        <Card
                            key={job._id}
                            className={`group relative overflow-hidden transition-all duration-300 cursor-pointer border-l-4 ${job.urgency === 'High' ? 'border-l-rose-500' :
                                job.urgency === 'Low' ? 'border-l-emerald-500' :
                                    'border-l-sky-500'
                                } ${navigatingId === job._id
                                    ? 'bg-muted/50 scale-[0.99] ring-2 ring-indigo-500/20'
                                    : 'hover:bg-muted/30 hover:shadow-lg'
                                }`}
                            onClick={() => handleNavigate(job._id)}
                        >
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <Badge variant="outline" className={`${job.urgency === 'High' ? 'text-rose-600 bg-rose-500/5 border-rose-500/20' :
                                            job.urgency === 'Low' ? 'text-emerald-600 bg-emerald-500/5 border-emerald-500/20' :
                                                'text-sky-600 bg-sky-500/5 border-sky-500/20'
                                            }`}>
                                            {job.urgency} Priority
                                        </Badge>
                                    </div>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors z-10"
                                        onClick={(e) => handleDeleteJob(e, job._id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-600 transition-colors">
                                    {job.title}
                                </h3>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" /> {job.location}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" /> Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {/* Placeholder avatars for candidates */}
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                                                ?
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                                            +
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
                                        {navigatingId === job._id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                View Board <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Empty State */}
                    {jobs.length === 0 && !loading && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-muted/30 text-center">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Briefcase className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-bold">No active jobs</h3>
                            <p className="text-muted-foreground mt-1 max-w-sm">Create a new job request to start the AI sourcing agent.</p>
                            <Button
                                variant="outline"
                                className="mt-6 border-indigo-500 text-indigo-600 hover:bg-indigo-500/10"
                                onClick={() => navigate("/hr-portal/recruitment/new")}
                            >
                                Create Job
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
