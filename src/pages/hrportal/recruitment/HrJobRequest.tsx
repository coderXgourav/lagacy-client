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
import { notification } from "antd";
import axios from "axios";

// API Base URL (adjust if needed)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function HrJobRequest() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();

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
            notification.error({
                message: 'Creation Failed',
                description: 'Failed to create job request. Please check all fields and try again.',
                placement: 'topRight'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <div className="container mx-auto max-w-4xl space-y-6">

                {/* Header/Back Button */}
                <div className="mb-2">
                    <Button
                        variant="ghost"
                        className="pl-0 hover:pl-2 transition-all gap-2 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate("/hr-portal/recruitment")}
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Recruitment
                    </Button>
                </div>

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12 mb-6">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                                    <Briefcase className="h-7 w-7 text-white" />
                                </div>
                                <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 text-xs font-semibold tracking-wide uppercase">
                                    New Requisition
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                                New Job Request
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl">
                                Open a new requisition for the AI Agent to start sourcing candidates from high-quality pools.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-2xl border border-border bg-card shadow-xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-foreground">Job Title <span className="text-rose-500">*</span></Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="title"
                                    placeholder="e.g. Senior Frontend Engineer"
                                    className="pl-10 focus:ring-indigo-500"
                                    {...register("title", { required: "Job title is required" })}
                                />
                            </div>
                            {errors.title && <span className="text-xs text-rose-500">{String(errors.title.message)}</span>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="location" className="text-foreground">Location <span className="text-rose-500">*</span></Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="location"
                                        placeholder="e.g. Remote / New York"
                                        className="pl-10 focus:ring-indigo-500"
                                        {...register("location", { required: "Location is required" })}
                                    />
                                </div>
                                {errors.location && <span className="text-xs text-rose-500">{String(errors.location.message)}</span>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="urgency" className="text-foreground">Urgency</Label>
                                <Select onValueChange={(val) => setValue("urgency", val)} defaultValue="Medium">
                                    <SelectTrigger className="w-full">
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
                            <Label htmlFor="skills" className="text-foreground">Required Skills (Comma Separated)</Label>
                            <Textarea
                                id="skills"
                                placeholder="e.g. React, Node.js, TypeScript, AWS"
                                className="min-h-[80px] focus:ring-indigo-500"
                                {...register("skills")}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="yearsOfExperience" className="text-foreground">Years of Experience</Label>
                                <Select onValueChange={(val) => setValue("yearsOfExperience", val)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Experience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                                        <SelectItem value="1 to 2 years">1 to 2 years</SelectItem>
                                        <SelectItem value="3 to 5 years">3 to 5 years</SelectItem>
                                        <SelectItem value="6 to 10 years">6 to 10 years</SelectItem>
                                        <SelectItem value="More than 10 years">More than 10 years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="yearsAtCompany" className="text-foreground">Years at Current Company</Label>
                                <Select onValueChange={(val) => setValue("yearsAtCompany", val)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Tenure" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Less than 1 year">Less than 1 year</SelectItem>
                                        <SelectItem value="1 to 2 years">1 to 2 years</SelectItem>
                                        <SelectItem value="3 to 5 years">3 to 5 years</SelectItem>
                                        <SelectItem value="6 to 10 years">6 to 10 years</SelectItem>
                                        <SelectItem value="More than 10 years">More than 10 years</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="seniorityLevel" className="text-foreground">Seniority Level</Label>
                                <Select onValueChange={(val) => setValue("seniorityLevel", val)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Entry Level">Entry Level</SelectItem>
                                        <SelectItem value="In Training">In Training</SelectItem>
                                        <SelectItem value="Senior">Senior</SelectItem>
                                        <SelectItem value="Strategic">Strategic</SelectItem>
                                        <SelectItem value="Entry Level Manager">Entry Level Manager</SelectItem>
                                        <SelectItem value="Experienced Manager">Experienced Manager</SelectItem>
                                        <SelectItem value="Director">Director</SelectItem>
                                        <SelectItem value="Vice President">Vice President</SelectItem>
                                        <SelectItem value="CXO">CXO</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                                <div className="space-y-0.5">
                                    <Label htmlFor="autoOutreach" className="text-base font-semibold text-foreground">Auto-send LinkedIn Connection Requests</Label>
                                    <p className="text-sm text-muted-foreground">Automatically queue connection requests for every candidate found via Apify.</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="autoOutreach"
                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        {...register("autoOutreach")}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="outreachMessage" className="text-foreground">Custom Outreach Message</Label>
                                <Textarea
                                    id="outreachMessage"
                                    placeholder="Came across your profile—your experience stood out..."
                                    className="min-h-[120px] focus:ring-indigo-500"
                                    defaultValue={"Came across your profile—your experience stood out.\nWe’re building a high-performance team at Kyptronix LLP (AI, sales, and product roles), and I think you could be a strong fit.\nOpen to a quick chat to explore this?\n— HR Team, Kyptronix"}
                                    {...register("outreachMessage")}
                                />
                                <p className="text-xs text-muted-foreground">Use <b>#firstName#</b> as a placeholder for the candidate's name.</p>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20"
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
        </div>
    );
}
