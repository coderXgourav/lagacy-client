import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MapPin, Calendar, Clock, ArrowRight, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HrRecruitment() {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Recruitment & ATS</h1>
                    <p className="text-slate-400 mt-1">Manage open requisitions and track agent sourcing.</p>
                </div>
                <Button 
                    onClick={() => navigate("/hr-portal/recruitment/new")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Job Request
                </Button>
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {jobs.map((job: any) => (
                    <div 
                        key={job._id}
                        className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-md p-6 hover:bg-white/[0.04] transition-all duration-300 hover:border-indigo-500/20 cursor-pointer"
                        onClick={() => navigate(`/hr-portal/recruitment/board/${job._id}`)}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                job.urgency === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                job.urgency === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            }`}>
                                {job.urgency} Priority
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                            {job.title}
                        </h3>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" /> {job.location}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Posted {formatDistanceToNow(new Date(job.createdAt))} ago
                            </div>
                        </div>

                        <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {/* Placeholder avatars for candidates */}
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#0B1120] flex items-center justify-center text-[10px] text-white font-bold">
                                        ?
                                    </div>
                                ))}
                                <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#0B1120] flex items-center justify-center text-[10px] text-slate-400 font-bold">
                                    +
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                                View Board <ArrowRight className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Empty State */}
                {jobs.length === 0 && !loading && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5 text-center">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Briefcase className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-white">No active jobs</h3>
                        <p className="text-slate-400 mt-1 max-w-sm">Create a new job request to start the AI sourcing agent.</p>
                        <Button 
                            variant="outline" 
                            className="mt-6 border-indigo-500/50 text-indigo-400 hover:bg-indigo-950"
                            onClick={() => navigate("/hr-portal/recruitment/new")}
                        >
                            Create Job
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
