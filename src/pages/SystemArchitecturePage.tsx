import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowRight, 
  Database, 
  Search, 
  Users, 
  Mail, 
  MessageSquare, 
  Calendar, 
  BarChart3, 
  Brain, 
  Globe, 
  CheckCircle2, 
  ShieldCheck, 
  Zap,
  Layout,
  Loader2,
  Play,
  TrendingUp,
  Activity
} from "lucide-react";

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const stepData = [
  {
    step: 1,
    title: "INPUT (Startup DNA)",
    icon: Layout,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    endpoint: "structure",
    prompt: `Act as a startup analyst. Convert raw input into structured JSON profile.`
  },
  {
    step: 2,
    title: "INVESTOR DISCOVERY",
    icon: Search,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    endpoint: "discover",
    prompt: `(NO LLM) Use Crunchbase + Apollo.io to pull raw list.`
  },
  {
    step: 3,
    title: "DATA ENRICHMENT",
    icon: Globe,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    endpoint: "enrich",
    prompt: `(NO LLM) Use APIs + Scraping (LinkedIn, Websites).`
  },
  {
    step: 4,
    title: "LLM SUMMARIZATION",
    icon: Brain,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    endpoint: "summarize",
    prompt: `Convert messy enrichment data → structured insights (Thesis, Stage, Geo).`
  },
  {
    step: 5,
    title: "SCORING ENGINE",
    icon: Zap,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    endpoint: "scoring",
    prompt: `Hybrid: Rule-based base score + LLM-based fit refinement.`
  },
  {
    step: 6,
    title: "WARM INTRO DETECTION",
    icon: Users,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    endpoint: "warm-intro",
    prompt: `(NO LLM) Pure data mapping via LinkedIn/CRM graph.`
  },
  {
    step: 7,
    title: "SEGMENTATION",
    icon: ShieldCheck,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    endpoint: "segment",
    prompt: `(NO LLM) 80+ HOT | 60-79 WARM | <60 COLD.`
  },
  {
    step: 8,
    title: "OUTREACH ENGINE",
    icon: Mail,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    endpoint: "outreach",
    prompt: `Generate hyper-personalized, controlled outreach (No fluff).`
  },
  {
    step: 9,
    title: "DELIVERABILITY",
    icon: Activity,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    endpoint: "deliverability",
    prompt: `(NO LLM) Automated email infrastructure & warm-up check.`
  },
  {
    step: 10,
    title: "REPLY INTELLIGENCE",
    icon: MessageSquare,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    endpoint: "reply-ai",
    prompt: `Classify intent: Interested, Follow-up, Not a fit.`
  },
  {
    step: 11,
    title: "CRM (Zoho)",
    icon: Database,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    endpoint: "crm-sync",
    prompt: `(NO LLM) One-way sync to Zoho CRM.`
  },
  {
    step: 12,
    title: "LEARNING LOOP",
    icon: TrendingUp,
    color: "text-red-500",
    bg: "bg-red-500/10",
    endpoint: "learning-loop",
    prompt: `LLM-driven optimization suggestions based on campaign results.`
  }
];

export default function SystemArchitecturePage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    niche: "AI SaaS for Venture Capital",
    stage: "Seed",
    geography: "USA / Global",
    fundingAsk: "$2M at $10M Post-money",
    summary: "Kyptronix AI is an autonomous fundraising machine that helps founders target the right investors with hyper-personalized outreach.",
    traction: "Beta launched, 50 founder waitlist, MVP ready."
  });

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  const fetchPipeline = async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/fundraising/pipeline/${id}`, getHeaders());
      setPipeline(res.data.data.pipeline);
      setInvestors(res.data.data.investors);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadLatest = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/fundraising/latest`, getHeaders());
        if (res.data.data) {
          setPipeline(res.data.data.pipeline);
          setInvestors(res.data.data.investors);
        }
      } catch (err) {
        console.error("Failed to load latest pipeline:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLatest();
  }, []);

  const handleInitialize = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/fundraising/initialize`, formData, getHeaders());
      setPipeline(res.data.data);
      setInvestors([]);
      toast({ title: "Pipeline Initialized", description: "Your fundraising run has started!" });
    } catch (err: any) {
      toast({ title: "Initialization Failed", description: err.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const runStep = async (step: any) => {
    if (!pipeline?._id) return;
    try {
      setLoading(true);
      const endpoint = step.endpoint;
      
      if (!endpoint) {
         toast({ title: "Not Implemented", description: `${step.title} implementation is coming soon!` });
         return;
      }

      await axios.post(`${API_URL}/fundraising/pipeline/${pipeline._id}/${endpoint}`, {}, getHeaders());
      await fetchPipeline(pipeline._id);
      toast({ title: `Step ${step.step} Completed`, description: `${step.title} successfully executed.` });
    } catch (err: any) {
      toast({ title: "Operation Failed", description: err.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-12 animate-fade-in pb-20">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          FOUNDER FUNDRAISING MACHINE
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto uppercase tracking-wider">
          System Architecture & Implementation
        </p>
      </div>

      {/* Startup Profile Form (Persistent) */}
      <Card className="max-w-4xl mx-auto border-primary/20 shadow-2xl overflow-hidden bg-card">
        <CardHeader className="bg-primary/5 border-b border-primary/10 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" /> Complete 14-Step LLM Prompt Architectural Flow for Growth Mastery
            </CardTitle>
            <CardDescription>Configure your startup DNA to trigger the autonomous architecture.</CardDescription>
          </div>
          {pipeline && (
            <Button variant="outline" size="sm" onClick={() => { setPipeline(null); setInvestors([]); }} className="font-bold border-primary/30 text-[10px] uppercase">
              Start New Run
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-70">Niche / Industry</label>
              <Input value={formData.niche} onChange={(e) => setFormData({...formData, niche: e.target.value})} className="bg-muted/50 border-primary/10" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-70">Current Stage</label>
              <Input value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})} className="bg-muted/50 border-primary/10" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-70">Target Geography</label>
              <Input value={formData.geography} onChange={(e) => setFormData({...formData, geography: e.target.value})} className="bg-muted/50 border-primary/10" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-70">Funding Ask</label>
              <Input value={formData.fundingAsk} onChange={(e) => setFormData({...formData, fundingAsk: e.target.value})} className="bg-muted/50 border-primary/10" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase opacity-70">Startup Summary</label>
            <Textarea value={formData.summary} onChange={(e) => setFormData({...formData, summary: e.target.value})} className="bg-muted/50 h-20 border-primary/10" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase opacity-70">Traction Signals</label>
            <Textarea value={formData.traction} onChange={(e) => setFormData({...formData, traction: e.target.value})} className="bg-muted/50 h-16 border-primary/10" placeholder="Users, Revenue, Waitlist, etc." />
          </div>
          <Button onClick={handleInitialize} className="w-full h-12 text-md font-bold uppercase tracking-widest shadow-xl group transition-all" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 group-hover:scale-125 transition-transform" />}
            {pipeline ? "Update & Restart Machine" : "Launch Fundraising Machine"}
          </Button>
        </CardContent>
      </Card>

      {pipeline && (
        <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-700">
          {/* Active Pipeline Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="bg-primary/5 border-primary/20 shadow-sm">
               <CardHeader className="pb-2">
                 <CardDescription className="uppercase font-bold text-[10px] tracking-widest">Active Run ID</CardDescription>
                 <CardTitle className="text-sm font-mono truncate">{pipeline._id}</CardTitle>
               </CardHeader>
             </Card>
             <Card className="bg-primary/5 border-primary/20 shadow-sm">
               <CardHeader className="pb-2">
                 <CardDescription className="uppercase font-bold text-[10px] tracking-widest">Current Status</CardDescription>
                 <CardTitle className="text-sm uppercase font-black text-primary">{pipeline.status}</CardTitle>
               </CardHeader>
             </Card>
             <Card className="bg-primary/5 border-primary/20 shadow-sm">
               <CardHeader className="pb-2">
                 <CardDescription className="uppercase font-bold text-[10px] tracking-widest">Completion Progress</CardDescription>
                 <CardTitle className="text-sm font-black text-primary">{(pipeline.currentStep / 12 * 100).toFixed(0)}%</CardTitle>
               </CardHeader>
             </Card>
          </div>

          {/* Structured Profile Results (Step 1 Output) */}
          {pipeline.structuredProfile && (
            <Card className="border-primary/20 bg-primary/5 shadow-inner">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> AI Structured Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase opacity-50 font-bold">Industry Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {pipeline.structuredProfile.industry_tags?.map((t: string) => <Badge key={t} variant="outline" className="text-[9px] px-1 h-4">{t}</Badge>)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase opacity-50 font-bold">Growth Signals</p>
                    <div className="flex flex-wrap gap-1">
                      {pipeline.structuredProfile.growth_signals?.length > 0 ? (
                        pipeline.structuredProfile.growth_signals.map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-[9px] px-1 h-4">{s}</Badge>
                        ))
                      ) : (
                        <p className="text-[10px] opacity-30 italic">No signals detected</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase opacity-50 font-bold">Risk Level</p>
                    <Badge className="text-[10px]">{pipeline.structuredProfile.risk_level}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase opacity-50 font-bold">Ticket Size</p>
                    <p className="text-xs font-bold">{pipeline.structuredProfile.ticket_size_required}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pipeline 14 Steps Interactive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stepData.map((step) => {
              const isActive = pipeline.currentStep === step.step;
              const isCompleted = pipeline.currentStep > step.step;
              const Icon = step.icon;
              
              return (
                <Card key={step.step} className={`relative border-primary/10 transition-all duration-500 overflow-hidden ${isActive ? "ring-2 ring-primary shadow-2xl scale-105 z-10" : isCompleted ? "opacity-70 bg-primary/5 shadow-none" : "opacity-40"}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-3 rounded-xl ${step.bg} ${step.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant={isCompleted ? "default" : isActive ? "secondary" : "outline"} className="text-[10px] font-black italic">
                        {isCompleted ? "COMPLETED" : isActive ? "IN PROGRESS" : "QUEUED"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold uppercase truncate">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-2">{step.prompt}</p>
                    {isActive && (
                      <Button onClick={() => runStep(step)} className="w-full h-10 font-bold uppercase tracking-widest text-[10px] animate-pulse" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
                        Execute Step {step.step}
                      </Button>
                    )}
                    {isCompleted && <CheckCircle2 className="h-5 w-5 text-primary absolute bottom-4 right-4" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Real-time Results Area */}
          {investors.length > 0 && (
             <div className="space-y-6 pt-12 animate-in fade-in slide-in-from-bottom-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-primary" /> Live Investor Feed
                  </h2>
                  <Badge className="bg-[#0073B1] hover:bg-[#0073B1]/90 text-white font-black py-2 px-4 rounded-full border-none flex items-center gap-2 shadow-lg">
                    <Activity className="h-4 w-4" /> POWERED BY APOLLO LEAD INTELLIGENCE
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {investors.map((inv, i) => (
                     <Card key={i} className="bg-card border-primary/10 hover:border-primary/30 transition-all group overflow-hidden">
                        <CardHeader className="pb-2 bg-muted/20">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg font-bold">{inv.name}</CardTitle>
                              <CardDescription className="font-mono text-xs">{inv.firm} • {inv.geography}</CardDescription>
                            </div>
                            {inv.scoring?.totalScore && (
                              <div className="text-right">
                                <Badge className={inv.scoring.fitCategory === 'Hot' ? 'bg-red-500' : inv.scoring.fitCategory === 'Warm' ? 'bg-orange-500' : 'bg-blue-500'}>
                                  {inv.scoring.fitCategory} {inv.scoring.totalScore}%
                                </Badge>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{inv.type}</Badge>
                            <Badge variant="outline">{inv.investmentStage}</Badge>
                            {inv.enrichment?.fundSize && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{inv.enrichment.fundSize}</Badge>}
                          </div>
                          
                          {inv.enrichment?.thesis && (
                            <p className="text-[10px] text-muted-foreground line-clamp-2 italic">"{inv.enrichment.thesis}"</p>
                          )}

                          {inv.scoring?.reasoning && (
                            <div className="bg-primary/5 p-2 rounded text-[10px] border-l-2 border-primary">
                              <span className="font-bold uppercase opacity-50 block mb-1 underline">AI FIT REASONING</span>
                              {inv.scoring.reasoning}
                            </div>
                          )}

                          {inv.outreach?.emailBody && (
                            <div className="pt-2 border-t border-primary/5">
                              <Button variant="outline" size="sm" className="w-full text-[10px] h-8 font-black uppercase tracking-widest" onClick={() => {
                                 toast({ title: "Outreach Copy", description: "Personalized email generated and ready for CRM sync." });
                              }}>
                                <Mail className="mr-2 h-3 w-3" /> View Personalized Lead
                              </Button>
                            </div>
                          )}

                          <p className="text-[9px] text-muted-foreground opacity-50 pt-2 text-right">
                            Source: {inv.source}
                          </p>
                        </CardContent>
                     </Card>
                   ))}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
