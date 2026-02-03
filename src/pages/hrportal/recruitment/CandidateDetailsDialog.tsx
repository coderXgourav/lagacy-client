import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, GraduationCap, MapPin, Calendar, Linkedin, Mail } from "lucide-react";

interface CandidateDetailsDialogProps {
    candidate: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CandidateDetailsDialog({ candidate, open, onOpenChange }: CandidateDetailsDialogProps) {
    if (!candidate) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-hidden bg-[#0B1120] border-white/10 text-slate-200">
                <ScrollArea className="h-full">
                    {/* Cover Photo */}
                    <div className="h-32 w-full bg-gradient-to-r from-teal-900/50 to-violet-900/50 relative">
                        {candidate.coverPicture && (
                            <img 
                                src={candidate.coverPicture} 
                                alt="Cover" 
                                className="w-full h-full object-cover opacity-80"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B1120]" />
                    </div>

                    <div className="px-8 pb-8 -mt-12 relative">
                        {/* Header Section */}
                        <div className="flex justify-between items-end mb-6">
                            <div className="flex items-end gap-6">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full border-4 border-[#0B1120] bg-[#1E293B] overflow-hidden shadow-xl">
                                        {candidate.profilePicture ? (
                                            <img src={candidate.profilePicture} alt={candidate.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-500">
                                                {candidate.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-[#0B1120] rounded-full" />
                                </div>
                                
                                {/* Name & Headline */}
                                <div className="pb-1">
                                    <h2 className="text-2xl font-bold text-white">{candidate.name}</h2>
                                    <p className="text-teal-300 font-medium text-sm mt-1 max-w-xl">{candidate.headline}</p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                        {candidate.location && (
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {candidate.location}</span>
                                        )}
                                        <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                                            <Linkedin className="w-3 h-3" /> LinkedIn
                                        </a>
                                        {candidate.email && (
                                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {candidate.email}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-3 gap-8">
                            {/* Left Column: Main Info */}
                            <div className="col-span-2 space-y-8">
                                {/* About */}
                                {candidate.about && (
                                    <section>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">About</h3>
                                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{candidate.about}</p>
                                    </section>
                                )}

                                {/* Experience */}
                                {candidate.experience && candidate.experience.length > 0 && (
                                    <section>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Experience</h3>
                                        <div className="space-y-6">
                                            {candidate.experience.map((exp: any, idx: number) => (
                                                <div key={idx} className="relative pl-6 border-l border-white/10 last:border-0 pb-6 last:pb-0">
                                                    <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-teal-500/50 border border-[#0B1120]" />
                                                    <h4 className="font-semibold text-slate-200">{exp.position}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-teal-400 mt-0.5 mb-2">
                                                        <Building2 className="w-3 h-3" />
                                                        <span>{exp.companyName}</span>
                                                        <span className="text-slate-600">•</span>
                                                        <span className="text-slate-500">{exp.startDate?.text || exp.startDate} - {exp.endDate?.text || exp.endDate || 'Present'}</span>
                                                    </div>
                                                    {exp.description && (
                                                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">
                                                            {exp.description}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Education */}
                                {candidate.education && candidate.education.length > 0 && (
                                    <section>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Education</h3>
                                        <div className="space-y-4">
                                            {candidate.education.map((edu: any, idx: number) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                        <GraduationCap className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-slate-200">{edu.schoolName}</h4>
                                                        <p className="text-xs text-slate-400">{edu.degree} · {edu.fieldOfStudy}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{edu.startDate?.year} - {edu.endDate?.year}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* Right Column: Skills & Sidebar */}
                            <div className="space-y-8">
                                {/* Skills */}
                                {candidate.skills && candidate.skills.length > 0 && (
                                    <section>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {candidate.skills.slice(0, 15).map((skill: string, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/20 text-[10px] px-2 py-0.5">
                                                    {skill}
                                                </Badge>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
