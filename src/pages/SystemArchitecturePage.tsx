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
  Activity,
  History,
  DollarSign
} from "lucide-react";

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const stepData = [
  {
    step: 1,
    title: "LAYER 1: INPUT (DNA)",
    icon: Layout,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    endpoint: "structure",
    prompt: `Niche, geography, stage, funding ask, summary, traction, deck.`
  },
  {
    step: 2,
    title: "LAYER 2: DISCOVERY",
    icon: Search,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    endpoint: "discover",
    prompt: `Use APIs, scraping, and enrichment tools to gather data across multiple sources.`
  },
  {
    step: 3,
    title: "LAYER 3: ENRICHMENT",
    icon: Globe,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    endpoint: "enrich",
    prompt: `Collect fund size, thesis, portfolio, recent investments, and contact details.`
  },
  {
    step: 4,
    title: "LAYER 4: INTELLIGENCE",
    icon: Brain,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    endpoint: "summarize",
    prompt: `Top 10 portfolio companies, total investments, last 12 months activity.`
  },
  {
    step: 5,
    title: "LAYER 5: CHECK SIZE",
    icon: BarChart3,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    endpoint: "scoring",
    prompt: `Known check size, estimated average, estimated max based on behavior.`
  },
  {
    step: 6,
    title: "LAYER 6: CONTACTS",
    icon: Users,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    endpoint: "warm-intro",
    prompt: `Email, phone, LinkedIn, WhatsApp availability with confidence score.`
  },
  {
    step: 7,
    title: "LAYER 7: SCORING",
    icon: ShieldCheck,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    endpoint: "segment",
    prompt: `Score based on niche fit, stage, geography, activity, and relevance.`
  },
  {
    step: 8,
    title: "LAYER 8: OUTREACH",
    icon: Mail,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
    endpoint: "outreach",
    prompt: `Generate personalized email, LinkedIn DM, and follow-ups.`
  },
  {
    step: 9,
    title: "LAYER 9: REPLIES",
    icon: MessageSquare,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
    endpoint: "reply-ai",
    prompt: `Classify replies: interested, pass, referral, follow-up.`
  },
  {
    step: 10,
    title: "INFRASTRUCTURE",
    icon: Activity,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    endpoint: "deliverability",
    prompt: `Automated email infrastructure & deliverability monitoring.`
  },
  {
    step: 11,
    title: "CRM (ZOHO) SYNC",
    icon: Database,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    endpoint: "crm-sync",
    prompt: `Automated synchronization of high-intent leads to CRM.`
  },
  {
    step: 12,
    title: "LEARNING LOOP",
    icon: TrendingUp,
    color: "text-red-500",
    bg: "bg-red-500/10",
    endpoint: "learning-loop",
    prompt: `Recursive optimization of the entire 12-layer stack.`
  }
];

export default function SystemArchitecturePage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const demoProfiles = [
    {
      niche: "AI SaaS for Venture Capital",
      stage: "Seed",
      geography: "USA / Global",
      fundingAsk: "$2M at $10M Post-money",
      summary: "Kyptronix AI is an autonomous fundraising machine that helps founders target the right investors with hyper-personalized outreach.",
      traction: "Beta launched, 50 founder waitlist, MVP ready."
    },
    {
      niche: "Web3 Infrastructure for India",
      stage: "Seed",
      geography: "India / APAC",
      fundingAsk: "$1.5M at $8M Post-money",
      summary: "Kyptronix Node is a decentralized RPC layer providing ultra-low latency for Indian dApps.",
      traction: "10M requests/day, 5 pilot partners, mainnet in 3 months."
    },
    {
      niche: "Sustainable E-commerce Logistics",
      stage: "Series A",
      geography: "Europe",
      fundingAsk: "$5M at $25M Post-money",
      summary: "GreenPath is an AI-driven last-mile delivery network using 100% electric cargo bikes.",
      traction: "$200K MRR, 15 city partnerships, 98% carbon reduction."
    },
    {
      niche: "Fintech for Gig Economy",
      stage: "Pre-seed",
      geography: "Latin America / SE Asia",
      fundingAsk: "$500K at $3M Post-money",
      summary: "GigPay provides instant credit and insurance products for independent delivery and ride-share workers.",
      traction: "1.2K active users, Partnership with 2 major platforms."
    }
  ];

  const [demoIndex, setDemoIndex] = useState(0);

  const [formData, setFormData] = useState(demoProfiles[0]);

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
      console.log("[Fundraising Debug] API Response:", res.data);
      if (res.data.data) {
        setPipeline(res.data.data.pipeline);
        setInvestors(res.data.data.investors || []);
        return res.data.data.pipeline;
      }
      return null;
    } catch (err) {
      console.error("[Fundraising Debug] Fetch failed:", err);
      return null;
    }
  };

  useEffect(() => {
    const loadLatest = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/fundraising/latest`, getHeaders());
        console.log("[Fundraising Debug] Latest Response:", res.data);
        if (res.data.data) {
          setPipeline(res.data.data.pipeline);
          setInvestors(res.data.data.investors || []);
        }
      } catch (err) {
        console.error("[Fundraising Debug] Load latest failed:", err);
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
    if (!pipeline?._id || loading) return;
    try {
      setLoading(true);
      const endpoint = step.endpoint;
      
      if (!endpoint) {
         toast({ title: "Not Implemented", description: `${step.title} implementation is coming soon!` });
         setAutoRun(false);
         setLoading(false);
         return;
      }

      await axios.post(`${API_URL}/fundraising/pipeline/${pipeline._id}/${endpoint}`, {}, getHeaders());
      const updated = await fetchPipeline(pipeline._id);
      addLog(`Step ${step.step} completed successfully.`);
      toast({ title: `Step ${step.step} Completed`, description: `${step.title} successfully executed.` });
    } catch (err: any) {
      addLog(`Error in Step ${step.step}: ${err.message}`);
      toast({ title: "Operation Failed", description: err.response?.data?.message || err.message, variant: "destructive" });
      setAutoRun(false);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [new Date().toLocaleTimeString() + ": " + msg, ...prev].slice(0, 10));
  };

  useEffect(() => {
    if (autoRun && !loading && pipeline && pipeline.currentStep <= 12) {
      const currentStepObj = stepData.find(s => s.step === pipeline.currentStep);
      if (currentStepObj) {
        // Auto-scroll the sidebar to the active node
        const node = document.getElementById(`step-node-${pipeline.currentStep}`);
        if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });

        addLog(`Auto-Run Coordinator triggering Step ${pipeline.currentStep} (${currentStepObj.title})...`);
        const timer = setTimeout(() => runStep(currentStepObj), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [autoRun, loading, pipeline?.currentStep, pipeline?._id]);

  const handleQuickFill = () => {
    const nextIndex = (demoIndex + 1) % demoProfiles.length;
    setDemoIndex(nextIndex);
    setFormData(demoProfiles[nextIndex]);
    toast({ 
      title: "DNA Initialized", 
      description: `Loaded ${demoProfiles[nextIndex].niche} Profile.` 
    });
    addLog(`Switched to demo profile: ${demoProfiles[nextIndex].niche}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-hidden flex flex-col">
      {/* Top Navigation / Progress Bar */}
      <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-primary/10 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-primary/20">
            System Architecture 2.0
          </Badge>
          <h1 className="text-lg font-black tracking-tighter uppercase whitespace-nowrap">
            Founder Fundraising Machine
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {pipeline && (
            <div className="flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase opacity-70">Active Run: {pipeline._id.substring(0, 8)}...</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => { setPipeline(null); setInvestors([]); setAutoRun(false); }} className="text-[10px] font-bold uppercase opacity-50 hover:opacity-100">
            New Run
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Left Sidebar: n8n Flow (30%) */}
        <div className="w-[380px] border-r border-primary/10 bg-muted/20 overflow-y-auto p-4 custom-scrollbar relative">
          <div className="space-y-4 relative">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 px-4 mb-6 sticky top-0 bg-transparent py-2 z-10">
              Automation Propagation Flow
            </h3>

            {/* Connecting Line (SVG Background) */}
            <div className="absolute left-[33px] top-12 bottom-12 w-[2px] bg-gradient-to-b from-primary/5 via-primary/20 to-primary/5 z-0" />

            {stepData.map((step, i) => {
              const isActive = pipeline?.currentStep === step.step;
              const isCompleted = pipeline?.currentStep > step.step;
              const isUpcoming = !pipeline || pipeline.currentStep < step.step;
              const Icon = step.icon;

              return (
                <div 
                  key={step.step} 
                  id={`step-node-${step.step}`}
                  className={`relative flex gap-4 p-4 rounded-xl transition-all duration-300 z-10 group
                    ${isActive ? "bg-primary/10 ring-1 ring-primary/30 shadow-lg scale-[1.02]" : "hover:bg-primary/5"}
                    ${isCompleted ? "opacity-70" : isUpcoming ? "opacity-40" : ""}
                  `}
                >
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                    ${isActive ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.5)] animate-pulse" : 
                      isCompleted ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground border border-primary/10"}
                  `}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>

                  <div className="space-y-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-primary" : "opacity-50"}`}>
                      Step {step.step}
                    </p>
                    <h4 className="text-sm font-bold truncate tracking-tight">{step.title}</h4>
                    {isActive && (
                      <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1">
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">{step.prompt}</p>
                        <Button size="sm" onClick={() => runStep(step)} className="h-8 w-full text-[10px] font-black uppercase tracking-widest gap-2" disabled={loading}>
                          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                          Propagate Now
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Content: Intelligence Feed (70%) */}
        <div className="flex-1 overflow-y-auto bg-card/30 p-8 custom-scrollbar">
          {!pipeline ? (
            <div className="max-w-2xl mx-auto space-y-8 pt-12 animate-in fade-in slide-in-from-bottom-5">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Initialize Target DNA</h2>
                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest opacity-60">Architecting your path to capital</p>
              </div>

              <Card className="border-primary/20 shadow-2xl bg-muted/20 backdrop-blur-sm">
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase opacity-60">Niche / Industry</label>
                      <Input value={formData.niche} onChange={(e) => setFormData({...formData, niche: e.target.value})} className="bg-background/50 border-primary/10 font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase opacity-60">Current Stage</label>
                       <Input value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})} className="bg-background/50 border-primary/10 font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase opacity-60">Geography</label>
                      <Input value={formData.geography} onChange={(e) => setFormData({...formData, geography: e.target.value})} className="bg-background/50 border-primary/10 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase opacity-60">Funding Ask</label>
                      <Input value={formData.fundingAsk} onChange={(e) => setFormData({...formData, fundingAsk: e.target.value})} className="bg-background/50 border-primary/10 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase opacity-60">Startup Summary</label>
                    <Textarea value={formData.summary} onChange={(e) => setFormData({...formData, summary: e.target.value})} className="bg-background/50 border-primary/10 font-bold h-20" />
                  </div>
                  <Button onClick={handleInitialize} className="w-full h-14 text-md font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(var(--primary),0.3)] group transition-all" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Zap className="mr-2 h-6 w-6 group-hover:scale-125 transition-transform" />}
                    Launch Fundraising Machine
                  </Button>
                  <Button variant="ghost" onClick={handleQuickFill} className="w-full text-[10px] font-black uppercase opacity-40 hover:opacity-100 italic tracking-widest">
                    (Use Curated Demo Profiles)
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
              {/* Controls Header */}
              <div className="flex items-center justify-between border-b border-primary/10 pb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Automation Status</p>
                  <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                    {pipeline.status === 'completed' ? "Run Finished" : "Propagation Active"}
                    <span className="text-sm font-normal text-muted-foreground opacity-50 font-mono">[{pipeline.status}]</span>
                  </h2>
                </div>

                <div className="flex items-center gap-4">
                  <Button 
                    variant={autoRun ? "default" : "outline"}
                    onClick={() => {
                        setAutoRun(!autoRun);
                        addLog(`Automation ${!autoRun ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`h-11 px-6 font-black uppercase tracking-widest transition-all shadow-xl ${autoRun ? "bg-orange-600 hover:bg-orange-700 animate-pulse border-none ring-2 ring-orange-500/20" : "border-primary/20"}`}
                  >
                    {autoRun ? <TrendingUp className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {autoRun ? "Auto-Propagating..." : "Enable Auto-Run"}
                  </Button>
                </div>
              </div>

              {/* Status Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-primary/5 space-y-1">
                  <p className="text-[10px] font-black uppercase opacity-40">Pipeline Health</p>
                  <p className="text-lg font-black text-primary">{(pipeline.currentStep / 12 * 100).toFixed(0)}% Stable</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-primary/5 space-y-1">
                  <p className="text-[10px] font-black uppercase opacity-40">Leads Harvested</p>
                  <p className="text-lg font-black text-primary">{investors?.length || 0} Entities</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border border-primary/5 space-y-1">
                  <p className="text-[10px] font-black uppercase opacity-40">CRM Synchronization</p>
                  <p className="text-lg font-black text-primary">
                    {pipeline.crmSyncStatus?.syncedCount || 0} Synced
                  </p>
                </div>
                {/* Visual Logs in small cards */}
                <div className="bg-black/40 p-3 rounded-xl border border-primary/10 overflow-hidden relative group">
                   <p className="text-[8px] font-black uppercase opacity-30 absolute top-2 right-3 italic">STDOUT</p>
                   <div className="font-mono text-[9px] h-10 overflow-hidden">
                      {logs[0] || "> Waiting for propagation..."}
                   </div>
                </div>
              </div>

              {/* Learning Loop Insights - Layer 12 */}
              {pipeline.learningLoopInsights && pipeline.learningLoopInsights.length > 0 && (
                <div className="bg-primary/[0.03] border border-primary/20 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-lg">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary">Layer 12: Recursive Optimization Insights</h4>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Machine learning derived strategy for {pipeline.input.niche}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pipeline.learningLoopInsights.map((insight: string, i: number) => (
                      <div key={i} className="bg-background/40 border border-primary/10 p-4 rounded-xl shadow-sm hover:border-primary/30 transition-all flex gap-3">
                        <span className="text-primary font-black opacity-20 text-2xl leading-none">{i+1}</span>
                        <p className="text-[11px] font-bold text-muted-foreground leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LIVE RESULTS FEED - Hero Section */}
              {pipeline.currentStep >= 2 && (
                <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                       <TrendingUp className="h-6 w-6 text-primary" /> Live Intelligence Feed
                       <span className="text-[10px] font-normal opacity-50 px-2 py-0.5 bg-primary/10 rounded-full">({investors?.length || 0} MATCHES)</span>
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => fetchPipeline(pipeline._id)} className="h-8 w-8 hover:bg-primary/20 text-primary">
                      <Activity className="h-4 w-4" />
                    </Button>
                  </div>

                  {investors && investors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {investors.map((inv, idx) => (
                        <Card key={idx} className="bg-card/50 border-primary/10 hover:border-primary/30 transition-all shadow-xl group overflow-hidden">
                           <div className="p-4 border-b border-primary/5 flex justify-between items-start bg-muted/20">
                              <div className="space-y-0.5">
                                <h4 className="font-black tracking-tight text-md">{inv.name || 'Anonymous Investor'}</h4>
                                <p className="text-[10px] font-mono opacity-50 uppercase">{inv.firm || 'Legacy Firm'} • {inv.geography || 'Global'}</p>
                              </div>
                               {inv.scoring && (
                                 <div className="flex flex-col items-end gap-1">
                                   <Badge className={`text-[10px] font-black italic border-none shadow-md ${inv.scoring.fitCategory === 'Hot' ? 'bg-red-500' : inv.scoring.fitCategory === 'Warm' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                     {inv.scoring.totalScore}% FIT
                                   </Badge>
                                   {inv.enrichment?.netWorth && inv.enrichment.netWorth !== 'Proprietary' && (
                                     <div className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                       <DollarSign className="h-2.5 w-2.5" /> {inv.enrichment.netWorth}
                                     </div>
                                   )}
                                 </div>
                               )}
                           </div>
                            <CardContent className="p-4 space-y-4">
                              <div className="flex flex-wrap gap-2 pt-1 uppercase font-black text-[9px] tracking-widest opacity-70">
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{inv.type}</span>
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[8px]">{inv.investmentStage}</span>
                                {inv.checkSize && (
                                  <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full">Avg Check: {inv.checkSize.avg}</span>
                                )}
                                {inv.enrichment?.totalFunding && inv.enrichment.totalFunding !== 'N/A' && (
                                  <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">Firm Capital: {inv.enrichment.totalFunding}</span>
                                )}
                                 {inv.enrichment?.fundSize && (
                                   <span className="bg-purple-500/10 text-purple-500 px-2 py-0.5 rounded-full">Fund Size: {inv.enrichment.fundSize}</span>
                                 )}
                                 {inv.enrichment?.annualRevenue && inv.enrichment.annualRevenue !== 'Proprietary' && inv.enrichment.annualRevenue !== 'N/A' && (
                                   <span className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full text-[8px]">Rev: {inv.enrichment.annualRevenue}</span>
                                 )}
                                 {inv.enrichment?.foundedYear && (
                                   <span className="bg-slate-500/10 text-slate-500 px-2 py-0.5 rounded-full text-[8px]">Est. {inv.enrichment.foundedYear}</span>
                                 )}
                               </div>

                              {/* Layer 3-4: Scraped Intelligence */}
                              {(inv.enrichment?.portfolioCompanies || inv.intelligence) && (
                                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-primary/5">
                                   {inv.enrichment?.portfolioCompanies && inv.enrichment.portfolioCompanies.length > 0 && (
                                     <div className="space-y-1.5">
                                        <p className="text-[8px] font-black uppercase opacity-40 flex items-center gap-1"><Zap className="h-2 w-2" /> Top Portfolio</p>
                                        <div className="flex flex-wrap gap-1">
                                           {inv.enrichment.portfolioCompanies.slice(0, 4).map((co: string) => (
                                             <Badge key={co} variant="outline" className="text-[8px] px-1.5 h-4 border-primary/10 bg-background/50 font-bold">{co}</Badge>
                                           ))}
                                           {inv.enrichment.portfolioCompanies.length > 4 && <span className="text-[8px] opacity-40 font-bold">+{inv.enrichment.portfolioCompanies.length - 4} more</span>}
                                        </div>
                                     </div>
                                   )}

                                     {inv.enrichment?.thesis && (
                                       <div className="space-y-1 pt-2 border-t border-primary/5">
                                          <p className="text-[8px] font-black uppercase opacity-40 flex items-center gap-1"><Brain className="h-2 w-2" /> Investment Thesis</p>
                                          <p className="text-[10px] font-bold text-muted-foreground leading-tight">{inv.enrichment.thesis}</p>
                                       </div>
                                    )}

                                    {inv.enrichment?.fundingHistory && inv.enrichment.fundingHistory.length > 0 && (
                                      <div className="space-y-1.5 pt-2 border-t border-primary/5">
                                         <p className="text-[8px] font-black uppercase opacity-40 flex items-center gap-1"><History className="h-2 w-2" /> Financial Journey</p>
                                         <div className="space-y-1 pl-1 border-l border-primary/10 ml-1">
                                            {inv.enrichment.fundingHistory.map((h: string, i: number) => (
                                              <div key={i} className="flex items-start gap-2 group">
                                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                                                <p className="text-[9px] font-medium text-muted-foreground/80 leading-tight">{h}</p>
                                              </div>
                                            ))}
                                         </div>
                                      </div>
                                    )}

                                   {inv.intelligence && (
                                     <div className="space-y-2 pt-1 border-t border-primary/5">
                                        <div className="flex items-center justify-between">
                                          <p className="text-[8px] font-black uppercase opacity-40 italic">12M Activity Signal</p>
                                          <div className="text-[9px] font-black text-primary flex items-center gap-1">
                                            <TrendingUp className="h-2.5 w-2.5" /> {inv.intelligence.totalInvestments || '50+'} Deals
                                          </div>
                                        </div>
                                        <p className="text-[10px] font-bold italic text-primary/80 leading-tight">"{inv.intelligence.recentActivity}"</p>
                                        
                                        <div className="flex flex-wrap gap-1 opacity-70">
                                           {inv.intelligence.sectorConcentration?.map((s, i) => (
                                             <span key={i} className="text-[7px] font-bold uppercase tracking-widest bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/10">
                                               {s}
                                             </span>
                                           ))}
                                        </div>
                                     </div>
                                   )}
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-3 pt-2">
                                {inv.contact?.email && (
                                  <a href={`mailto:${inv.contact.email}`} className="text-[9px] font-black text-primary border border-primary/20 px-3 py-1 rounded-full uppercase hover:bg-primary/10 transition-colors flex items-center gap-1.5 shadow-sm">
                                    <Mail className="h-3 w-3" /> Email
                                  </a>
                                )}
                                {inv.contact?.linkedIn && (
                                  <a href={inv.contact.linkedIn} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-[#0073B1] border border-[#0073B1]/20 px-3 py-1 rounded-full uppercase hover:bg-[#0073B1]/10 transition-colors flex items-center gap-1.5 shadow-sm">
                                    <Globe className="h-3 w-3" /> LinkedIn
                                  </a>
                                )}
                                {inv.contact?.whatsapp && (
                                  <div className="text-[9px] font-black text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 bg-emerald-500/5 shadow-sm">
                                    <MessageSquare className="h-3 w-3" /> WhatsApp
                                  </div>
                                )}
                                {inv.contact?.phone ? (
                                  <div className="flex flex-col gap-0.5">
                                    <div className="text-[9px] font-black text-muted-foreground border border-primary/5 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 bg-muted/20 shadow-inner">
                                      <Activity className="h-3 w-3" /> {inv.contact.phone}
                                    </div>
                                    <span className="text-[7px] font-black uppercase tracking-tighter opacity-40 ml-2 text-emerald-500">
                                      {inv.contact.validationStatus || 'Verified'}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-[9px] font-black text-rose-500/50 border border-rose-500/10 px-3 py-1 rounded-full uppercase flex items-center gap-1.5 bg-rose-500/5 italic">
                                    <Search className="h-3 w-3" /> No Direct Phone
                                  </div>
                                )}
                              </div>
                            </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-primary/[0.02] border-2 border-dashed border-primary/5 rounded-3xl p-16 text-center space-y-4 shadow-inner">
                       <Loader2 className="h-10 w-10 animate-spin text-primary/20 mx-auto" />
                       <div className="space-y-1">
                         <p className="text-xs font-black uppercase tracking-[0.3em] text-primary/40 italic">Syncing Apollo Intelligence Layer</p>
                         <p className="text-[9px] opacity-30 uppercase font-bold tracking-widest">Architecting verified lead profiles for {formData.geography}...</p>
                       </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
