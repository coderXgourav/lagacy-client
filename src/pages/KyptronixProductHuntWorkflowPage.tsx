import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/services/api";
import { 
  Zap, 
  Search, 
  Users, 
  Globe, 
  CheckCircle2, 
  Play, 
  Activity, 
  Loader2, 
  Calendar,
  Building2,
  FileText,
  Mail,
  Target,
  Layout,
  BarChart3,
  Database,
  ArrowRight,
  Sparkles,
  Link2,
  Phone,
  ArrowUpCircle,
  MailOpen,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const workflowSteps = [
  { step: 1, title: "CRON TRIGGER", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10", description: "Daily scheduler triggers autonomous scraping sequences." },
  { step: 2, title: "PRODUCT HUNT API", icon: Search, color: "text-orange-500", bg: "bg-orange-500/10", description: "Collects new product launches, upvotes, & makers." },
  { step: 3, title: "WEBSITE ENRICHMENT", icon: Globe, color: "text-indigo-500", bg: "bg-indigo-500/10", description: "Fetches website meta titles, descriptions, and taglines." },
  { step: 4, title: "EMAIL & PHONE DISCOVERY", icon: Mail, color: "text-purple-500", bg: "bg-purple-500/10", description: "Retrieves professional business emails and phone numbers." },
  { step: 5, title: "LINKEDIN DISCOVERY", icon: Link2, color: "text-sky-500", bg: "bg-sky-500/10", description: "Discovers founder and key decision-maker LinkedIn profiles." },
  { step: 6, title: "AI LEAD SCORING", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10", description: "Assigns lead priority scores based on upvotes & signals." },
  { step: 7, title: "CRM INTEGRATION", icon: Database, color: "text-emerald-500", bg: "bg-emerald-500/10", description: "Syncs qualified leads to GoHighLevel / HubSpot CRM." },
  { step: 8, title: "EMAIL OUTREACH", icon: MailOpen, color: "text-pink-500", bg: "bg-pink-500/10", description: "Enqueues cold outreach sequences for launch feedback." },
  { step: 9, title: "LINKEDIN OUTREACH", icon: Users, color: "text-violet-500", bg: "bg-violet-500/10", description: "Triggers personalized connection messages to makers." },
  { step: 10, title: "FOLLOW-UPS", icon: Activity, color: "text-rose-500", bg: "bg-rose-500/10", description: "Schedules automated sequence follow-ups on Day 3 & 7." }
];

export default function KyptronixProductHuntWorkflowPage() {
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tag, setTag] = useState("AI");
  const [timeframe, setTimeframe] = useState("today");
  const [minUpvotes, setMinUpvotes] = useState(50);
  const [logs, setLogs] = useState<any[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, level: string = "info") => {
    setLogs(prev => [...prev, { timestamp: new Date(), message: msg, level }]);
  };

  const loadPipeline = async () => {
    try {
      setLoading(true);
      // Using direct call on client api wrapper
      const res = await (api as any).kyptronixPhLeads.getLatestWorkflow();
      if (res.success && res.data) {
        setPipeline(res.data.pipeline);
        setLeads(res.data.leads || []);
        if (res.data.pipeline?.logs) {
          setLogs(res.data.pipeline.logs);
        }
        if (res.data.pipeline?.config) {
          setTag(res.data.pipeline.config.tag || "AI");
          setTimeframe(res.data.pipeline.config.timeframe || "today");
          setMinUpvotes(res.data.pipeline.config.minUpvotes || 50);
        }
      }
    } catch (err) {
      console.error(err);
      addLog("Failed to fetch pipeline status.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleManualTrigger = async () => {
    try {
      // Clear old results immediately so stale data from previous search is removed
      setLeads([]);
      setLogs([]);
      setPipeline(null);
      setLoading(true);
      addLog(`🚀 Manually triggering Product Hunt Lead Generation Workflow...`, "info");
      
      const res = await (api as any).kyptronixPhLeads.triggerWorkflow({
        tag,
        timeframe,
        minUpvotes
      });

      if (res.success) {
        addLog(`✅ Workflow triggered successfully. Executing step-by-step pipeline...`, "success");
        toast({ title: "Workflow Started", description: "Product Hunt lead generation running in background." });
        
        // Start polling for updates every 2 seconds. A deep "Past 10 Days" + niche-tag search
        // can legitimately run for several minutes (per-day pagination, rate-limit retries) —
        // the old 30-poll (60s) cutoff gave up and froze the UI on a stale mid-run snapshot
        // while the backend kept going and finished with real results nobody ever saw.
        // Rely on the real status instead; this cap is just a last-resort safety net.
        let pollCount = 0;
        const MAX_POLLS = 300; // 10 minutes at 2s/poll
        const poll = setInterval(async () => {
          pollCount++;
          const latestRes = await (api as any).kyptronixPhLeads.getLatestWorkflow();
          if (latestRes.success && latestRes.data) {
            setPipeline(latestRes.data.pipeline);
            setLeads(latestRes.data.leads || []);
            if (latestRes.data.pipeline?.logs) {
              setLogs(latestRes.data.pipeline.logs);
            }
            if (latestRes.data.pipeline?.status !== "running" || pollCount > MAX_POLLS) {
              clearInterval(poll);
              setLoading(false);
              if (pollCount > MAX_POLLS && latestRes.data.pipeline?.status === "running") {
                addLog(`⚠️ Stopped polling after 10 minutes — the run may still be in progress on the server. Refresh to check.`, "error");
              }
            }
          }
        }, 2000);
      }
    } catch (err: any) {
      addLog(`❌ Trigger Failed: ${err.message}`, "error");
      toast({ title: "Trigger Failed", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const res = await (api as any).kyptronixPhLeads.deleteLead(id);
      if (res.success) {
        toast({ title: "Lead Deleted", description: "Successfully removed lead from workflow." });
        setLeads(prev => prev.filter(l => l._id !== id));
      }
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const currentStepData = workflowSteps[(pipeline?.currentStep || 1) - 1] || workflowSteps[0];

  return (
    <div className="container mx-auto p-6 space-y-12 animate-fade-in pb-20 max-w-7xl">
      <Button variant="ghost" size="icon" onClick={() => navigate("/offerings")} className="h-9 w-9 rounded-lg">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 text-xs font-semibold uppercase tracking-wider">
          <Zap className="h-3 w-3 animate-pulse" /> Kyptronix Automations Pro
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent flex items-center justify-center gap-4">
          PRODUCT HUNT LEAD GENERATION
        </h1>
        <p className="text-xl text-muted-foreground font-medium max-w-3xl mx-auto">
          Autonomous 10-step agent fetching live Product Hunt launches, finding contact details, scoring hot leads, and queueing outreach sequences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Config / Trigger Card */}
        <Card className="lg:col-span-1 border-orange-500/20 shadow-xl bg-card overflow-hidden flex flex-col justify-between">
          <CardHeader className="bg-orange-500/5 border-b border-orange-500/10">
            <CardTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
              ⚙️ Pipeline Settings
            </CardTitle>
            <CardDescription>Customize launch filters and scoring limits</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-75">Topic / Tag</label>
              <Input 
                value={tag} 
                onChange={(e) => setTag(e.target.value)} 
                className="bg-muted/50 border-orange-500/10 h-11 text-sm font-semibold tracking-wide" 
                placeholder="e.g. AI, SaaS, DevTools..." 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-75">Timeframe</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="bg-muted/50 border-orange-500/10 h-11 text-sm font-semibold">
                  <SelectValue placeholder="Select Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today's Launches</SelectItem>
                  <SelectItem value="yesterday">Yesterday's Launches</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="last10days">Past 10 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase opacity-75">Min Upvotes</label>
              <Input 
                type="number"
                value={minUpvotes} 
                onChange={(e) => setMinUpvotes(parseInt(e.target.value) || 0)} 
                className="bg-muted/50 border-orange-500/10 h-11 text-sm font-semibold" 
              />
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleManualTrigger} 
                className="w-full h-12 text-sm font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white shadow-lg transition-transform active:scale-95" 
                disabled={loading || pipeline?.status === 'running'}
              >
                {loading || pipeline?.status === 'running' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing Pipeline...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Trigger Manual Run
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Console / Active step card */}
        <Card className="lg:col-span-2 border-orange-500/20 shadow-xl bg-card overflow-hidden flex flex-col justify-between">
          <CardHeader className="bg-orange-500/5 border-b border-orange-500/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold uppercase tracking-tight">Active Engine State</CardTitle>
              <CardDescription>Real-time telemetry and step execution status</CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={`px-3 py-1 font-bold ${
                pipeline?.status === 'running' 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' 
                  : pipeline?.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : 'bg-slate-500/10 text-muted-foreground border-slate-500/20'
              }`}
            >
              {pipeline?.status ? pipeline.status.toUpperCase() : 'STANDBY'}
            </Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-orange-500/10">
              <div className={`p-3 rounded-lg ${currentStepData.bg} ${currentStepData.color}`}>
                <currentStepData.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                  Step {pipeline?.currentStep || 1} of 10
                </p>
                <h3 className="text-lg font-extrabold uppercase tracking-tight">
                  {currentStepData.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentStepData.description}
                </p>
              </div>
            </div>

            <div className="bg-slate-950 font-mono text-[11px] p-5 h-44 rounded-xl overflow-y-auto border border-orange-500/15 shadow-inner custom-scrollbar space-y-1.5">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={
                      log.level === 'error' || log.message.includes('❌') 
                        ? 'text-red-400' 
                        : log.level === 'warning'
                        ? 'text-amber-400'
                        : log.level === 'success' || log.message.includes('✅')
                        ? 'text-emerald-400'
                        : 'text-orange-400/80'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic">No logs generated. Trigger pipeline to show telemetry...</div>
              )}
              <div ref={logEndRef} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Visualization Progress Board */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
          📍 Pipeline Nodes Map
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {workflowSteps.map((step) => {
            const isActive = pipeline?.status === 'running' && pipeline?.currentStep === step.step;
            const isCompleted = pipeline?.status === 'completed' || (pipeline?.status === 'running' && pipeline?.currentStep > step.step);
            return (
              <Card 
                key={step.step} 
                className={`p-4 border border-orange-500/10 relative transition-all duration-300 ${
                  isActive 
                    ? "ring-2 ring-orange-500 bg-orange-500/5 scale-[1.03] shadow-[0_0_15px_rgba(249,115,22,0.15)] z-10" 
                    : isCompleted 
                    ? "bg-emerald-500/5 opacity-90 border-emerald-500/20" 
                    : "opacity-45"
                }`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`p-2 rounded-lg ${step.bg} ${step.color}`}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-60">Step {step.step}</p>
                    <p className="text-[10px] font-bold leading-tight uppercase tracking-tight">{step.title}</p>
                  </div>
                  {isCompleted && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 absolute top-2 right-2" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Discovery Hub */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
          🎯 Product Hunt Discovery Hub
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {leads.length > 0 ? (
            leads.map((lead) => (
              <Card key={lead._id} className="border-l-4 border-l-orange-500 bg-card border-orange-500/15 shadow-md flex flex-col justify-between hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-lg uppercase tracking-tight">{lead.companyName || lead.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{lead.description}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] font-black px-2 py-0.5 ${
                        lead.leadScore?.label === 'HOT' 
                          ? 'bg-red-500/10 text-red-500 border-red-500/25' 
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                      }`}
                    >
                      {lead.leadScore?.label}: {lead.leadScore?.score}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-orange-500/5 text-xs">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Website</p>
                      <a href={lead.website} target="_blank" rel="noreferrer" className="text-orange-500 font-semibold truncate hover:underline block">
                        {lead.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-slate-500">Niche</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300 truncate uppercase">{lead.industry}</p>
                    </div>
                    <div className="space-y-1 col-span-2 border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Founder & DM Info</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{lead.founderName} • CEO</p>
                      </div>
                      <Badge className="text-[8px] bg-orange-600 text-white font-bold px-1.5 py-0.5">
                        {lead.leadScore?.signals?.[0] || 'PH Launch'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    <Badge variant="secondary" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20">
                      CRM: {lead.crmStatus}
                    </Badge>
                    <Badge variant="secondary" className="bg-sky-500/10 text-sky-500 border-sky-500/20">
                      Outreach: {lead.outreachStatus}
                    </Badge>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Email: {lead.email}
                    </Badge>
                    {lead.decisionMakers?.[0]?.linkedin && lead.decisionMakers[0].linkedin !== 'Not Found' && (
                      <a href={lead.decisionMakers[0].linkedin} target="_blank" rel="noreferrer">
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:underline cursor-pointer">
                          LinkedIn: {lead.founderName}
                        </Badge>
                      </a>
                    )}
                  </div>
                </CardContent>
                <div className="px-6 py-3 border-t border-orange-500/10 bg-orange-500/5 flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-orange-500/70">Source: Product Hunt</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteLead(lead._id)} 
                    className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                  </Button>
                </div>
              </Card>
            ))
          ) : loading || pipeline?.status === 'running' ? (
            <div className="col-span-2 py-20 text-center bg-muted/10 rounded-2xl border border-dashed border-orange-500/25 flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                <Zap className="h-6 w-6 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-orange-500 animate-pulse">
                  Pipeline Running...
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  {pipeline?.currentStep 
                    ? `Executing Step ${pipeline.currentStep} of 10: ${workflowSteps[pipeline.currentStep - 1]?.title || 'Processing'}...`
                    : 'Initializing 10-step lead generation engine. Fetching live Product Hunt launches, enriching contacts, and scoring leads...'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 w-6 rounded-full transition-all duration-500 ${
                      pipeline?.currentStep && i < pipeline.currentStep 
                        ? 'bg-orange-500' 
                        : pipeline?.currentStep && i === pipeline.currentStep 
                        ? 'bg-orange-500/50 animate-pulse' 
                        : 'bg-muted/40'
                    }`} 
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="col-span-2 py-16 text-center opacity-40 italic bg-muted/20 rounded-2xl border border-dashed border-orange-500/25">
              🚀 Discovery engine is in standby. Click 'Trigger Manual Run' to scan and enrich Product Hunt launches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
