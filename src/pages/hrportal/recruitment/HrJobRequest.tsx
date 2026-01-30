import { useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save, Loader2, Calendar as CalendarIcon, MapPin, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";

// API Base URL (adjust if needed)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HrJobRequest() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            // Convert comma-separated skills to array
            const formattedData = {
                ...data,
                skills: data.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
            };

            await axios.post(`${API_URL}/hr/jobs`, formattedData);
            toast.success("Job Request Created Successfully");
            navigate("/hr-portal/recruitment");
        } catch (error) {
            console.error(error);
            toast.error("Failed to create job request");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <div className="mb-8">
                <Button 
                    variant="ghost" 
                    className="pl-0 hover:pl-2 transition-all gap-2 text-slate-400 hover:text-white"
                    onClick={() => navigate("/hr-portal/recruitment")}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Recruitment
                </Button>
                <h1 className="text-3xl font-bold text-white mt-4">New Job Request</h1>
                <p className="text-slate-400">Open a new requisition for the AI Agent to start sourcing.</p>
            </div>

            <div className="p-8 rounded-2xl border border-white/10 bg-[#0F172A]/50 backdrop-blur-md shadow-xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-white">Job Title <span className="text-rose-500">*</span></Label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <Input 
                                id="title" 
                                placeholder="e.g. Senior Frontend Engineer" 
                                className="pl-10 bg-white/5 border-white/10 text-white focus:border-indigo-500"
                                {...register("title", { required: "Job title is required" })}
                            />
                        </div>
                        {errors.title && <span className="text-xs text-rose-400">{String(errors.title.message)}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="location" className="text-white">Location <span className="text-rose-500">*</span></Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <Input 
                                    id="location" 
                                    placeholder="e.g. Remote / New York" 
                                    className="pl-10 bg-white/5 border-white/10 text-white focus:border-indigo-500"
                                    {...register("location", { required: "Location is required" })}
                                />
                            </div>
                            {errors.location && <span className="text-xs text-rose-400">{String(errors.location.message)}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="urgency" className="text-white">Agengy</Label>
                            <Select onValueChange={(val) => register("urgency").onChange({ target: { value: val, name: "urgency" } })} defaultValue="Medium">
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select Urgency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High - ASAP</SelectItem>
                                    <SelectItem value="Medium">Medium - Standard</SelectItem>
                                    <SelectItem value="Low">Low - Passive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="skills" className="text-white">Required Skills (Comma Separated)</Label>
                        <Textarea 
                            id="skills" 
                            placeholder="e.g. React, Node.js, TypeScript, AWS" 
                            className="bg-white/5 border-white/10 text-white min-h-[80px] focus:border-indigo-500"
                            {...register("skills")}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="calendarUrl" className="text-white">HR Calendar Link</Label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <Input 
                                id="calendarUrl" 
                                placeholder="https://calendly.com/hr-team/interview" 
                                className="pl-10 bg-white/5 border-white/10 text-white focus:border-indigo-500"
                                {...register("calendarUrl")}
                            />
                        </div>
                        <p className="text-xs text-slate-500">The agent will use this to schedule initial screens.</p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)]"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Request...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Submit Job Request
                                </>
                            )}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}
