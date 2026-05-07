import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Database
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const workflowSteps = [
  { step: 1, title: "CRON TRIGGER (8 PM)", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10", description: "Automated daily trigger at 8 PM for fresh lead discovery." },
  { step: 2, title: "LINKEDIN SALES NAVIGATOR", icon: Search, color: "text-indigo-500", bg: "bg-indigo-500/10", description: "Scrape companies based on industry, location, and employee size." },
  { step: 3, title: "COMPANY ENRICHMENT", icon: Building2, color: "text-purple-500", bg: "bg-purple-500/10", description: "Extract full company details, growth, and hiring activity." },
  { step: 4, title: "DECISION MAKERS", icon: Users, color: "text-pink-500", bg: "bg-pink-500/10", description: "Identify CEOs, Founders, and Marketing Heads with contact info." },
  { step: 5, title: "CEO ACTIVITY TRACKER", icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10", description: "Analyze latest posts for hiring, funding, or scaling signals." },
  { step: 6, title: "META ADS CHECK", icon: Layout, color: "text-blue-600", bg: "bg-blue-600/10", description: "Check active Facebook/Instagram ads as buying intent signals." },
  { step: 7, title: "GOOGLE ADS SCAN", icon: Target, color: "text-red-500", bg: "bg-red-500/10", description: "Analyze Google Ads activity to increase lead scoring." },
  { step: 8, title: "GOOGLE MAPS DATA", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10", description: "Pull business ratings, reviews, and physical location data." },
  { step: 9, title: "WEBSITE AUDIT", icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10", description: "AI analysis of speed, SEO, UI/UX, and conversion funnels." },
  { step: 10, title: "AI LEAD SCORING", icon: BarChart3, color: "text-orange-500", bg: "bg-orange-500/10", description: "Analyze 50 signals to assign HOT/WARM/COLD scores." },
  { step: 11, title: "SAVE & PUSH LEADS", icon: Database, color: "text-green-500", bg: "bg-green-500/10", description: "Sync leads to Google Sheets/Airtable and internal database." }
];

export default function KyptronixWorkflowPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Standing by for scheduled trigger...", "[READY] Kyptronix N8N + Apify Blueprint v1.0 active"]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const getHeaders = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/kyptronix-leads/latest`, getHeaders());
      if (res.data.data) {
        setPipeline(res.data.data.pipeline || { currentStep: 1 });
        setLeads(res.data.data.leads || []);
      }
    } catch (err) { 
      console.error(err); 
      // Initialize if not found
      setPipeline({ currentStep: 1, _id: "new" });
    }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPipeline(); }, []);

  const handleManualTrigger = async () => {
    try {
      setLoading(true);
      addLog(`🚀 Manually triggering Kyptronix N8N Workflow...`);
      await axios.post(`${API_URL}/kyptronix-leads/trigger`, {}, getHeaders());
      addLog(`✅ Workflow triggered! Autonomous sequence started.`);
      toast({ title: "Workflow Triggered", description: "The 11-step autonomous engine is now running in the background." });
      
      // Start polling for updates
      const poll = setInterval(async () => {
        const res = await axios.get(`${API_URL}/kyptronix-leads/latest`, getHeaders());
        if (res.data.data.pipeline) {
          setPipeline(res.data.data.pipeline);
          setLeads(res.data.data.leads || []);
          if (res.data.data.pipeline.status === 'completed' || res.data.data.pipeline.status === 'failed') {
            clearInterval(poll);
          }
        }
      }, 3000);
    } catch (err: any) { 
      addLog(`❌ Trigger Failed: ${err.message}`);
      toast({ title: "Trigger Failed", variant: "destructive" }); 
    }
    finally { setLoading(false); }
  };

  const runStep = async () => {
    if (!pipeline) return;
    const currentStepIndex = pipeline.currentStep - 1;
    const step = workflowSteps[currentStepIndex];

    try {
      setLoading(true);
      addLog(`🔄 Executing Step ${pipeline.currentStep}: ${step.title}...`);
      
      // Simulated backend interaction for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addLog(`✅ Step ${pipeline.currentStep} completed successfully.`);
      
      if (pipeline.currentStep < 11) {
        setPipeline({ ...pipeline, currentStep: pipeline.currentStep + 1 });
      } else {
        addLog(`🏁 Full workflow sequence complete! Leads synced.`);
        toast({ title: "Workflow Complete", description: "All 11 steps processed successfully." });
      }

      toast({ title: `Step ${pipeline.currentStep} Success`, description: `Completed ${step.title}` });
    } catch (err: any) {
      toast({ title: "Execution Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = workflowSteps[pipeline?.currentStep - 1] || workflowSteps[0];

  return (
    <div className="container mx-auto p-6 space-y-12 animate-fade-in pb-20">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-blue-400 bg-clip-text text-transparent flex items-center justify-center gap-4">
          <Zap className="h-12 w-12 text-indigo-600" /> KYPTRONIX N8N BLUEPRINT
        </h1>
        <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest">Apify + N8N 11-Step Intelligence Engine</p>
      </div>

      <Card className="max-w-4xl mx-auto border-indigo-500/20 shadow-2xl overflow-hidden bg-card">
        <CardHeader className="bg-indigo-500/5 border-b border-indigo-500/10 flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">⚙️ WORKFLOW CONFIGURATION</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Cron Active: 8 PM</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-70">Target Industries</label>
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-muted/50 border-indigo-500/10 h-12 text-sm font-bold uppercase tracking-widest" placeholder="SaaS, Fintech, Healthtech..." />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase opacity-70">Geographic Focus</label>
                <Input className="bg-muted/50 border-indigo-500/10 h-12 text-sm font-bold uppercase tracking-widest" placeholder="USA, UK, Europe..." />
             </div>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={handleManualTrigger} className="flex-1 h-14 text-lg font-bold uppercase tracking-widest shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading || pipeline?.currentStep > 1}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5" />}
              {pipeline?.currentStep > 1 ? "PIPELINE RUNNING" : "Trigger Manual Run"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-12">
         {/* Step Grid */}
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {workflowSteps.map((step) => {
              const isActive = pipeline?.currentStep === step.step;
              const isCompleted = pipeline?.currentStep > step.step;
              return (
                <Card key={step.step} className={`p-4 border-indigo-500/10 relative transition-all ${isActive ? "ring-2 ring-indigo-500 bg-indigo-500/5 scale-105 z-10 shadow-[0_0_20px_rgba(79,70,229,0.2)]" : isCompleted ? "bg-emerald-500/5 opacity-80" : "opacity-40"}`}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-2 rounded-lg ${step.bg} ${step.color}`}><step.icon className="h-4 w-4" /></div>
                    <div>
                      <p className="text-[8px] font-black uppercase opacity-50">Step {step.step}</p>
                      <p className="text-[9px] font-bold leading-tight uppercase">{step.title}</p>
                    </div>
                    {isCompleted && <CheckCircle2 className="h-3 w-3 text-emerald-500 absolute top-2 right-2" />}
                  </div>
                </Card>
              );
            })}
         </div>

         {/* Execution Control */}
         <Card className="border-indigo-500/30 bg-black/40 shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-4 max-w-2xl">
                 <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${currentStepData.bg} ${currentStepData.color}`}><currentStepData.icon className="h-6 w-6" /></div>
                    <div>
                      <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">Active Step {pipeline?.currentStep || 1}</p>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">{currentStepData.title}</h3>
                    </div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-lg border border-white/10 italic text-sm text-muted-foreground">
                    "{currentStepData.description}"
                 </div>
              </div>
              <Button onClick={runStep} disabled={loading || !pipeline} size="lg" className="h-20 px-12 text-xl font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 shadow-2xl transition-all hover:scale-105 min-w-[280px]">
                 {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Play className="mr-2 h-6 w-6 fill-current" />}
                 Execute Step {pipeline?.currentStep || 1}
              </Button>
            </CardContent>
         </Card>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
               <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Users className="h-6 w-6 text-indigo-500" /> Live Discovery Hub
               </h2>
               <div className="space-y-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                  {leads.length > 0 ? leads.map((lead, i) => (
                    <Card key={i} className="mb-3 border-l-4 border-l-indigo-500 bg-slate-900/40 backdrop-blur-md">
                      <CardContent className="p-4 flex gap-4">
                          <Avatar className="h-10 w-10 border-2 border-slate-700">
                            <AvatarFallback className="bg-slate-800 text-slate-400">CP</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm uppercase">{lead.companyName || "Company Name"}</h4>
                              <Badge variant="outline" className="text-[8px] bg-indigo-500/10 text-indigo-500">{lead.score || "SCORING..."}</Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{lead.industry || "Technology"} • {lead.location || "USA"}</p>
                            <div className="flex gap-2 mt-2">
                               <Badge className="text-[8px] bg-blue-600">Decision Maker: {lead.dm || "CEO"}</Badge>
                               <Badge className="text-[8px] bg-emerald-600">Status: {lead.status || "Processing"}</Badge>
                            </div>
                          </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="p-12 text-center opacity-30 italic bg-slate-900/20 rounded-xl border border-dashed border-white/10">
                      Discovery engine in standby mode. Execute steps to populate leads.
                    </div>
                  )}
               </div>
            </div>
            <div className="space-y-6">
               <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <Activity className="h-6 w-6 text-indigo-500" /> Blueprint Logs
               </h2>
               <Card className="bg-black/90 font-mono text-[11px] p-6 h-[600px] overflow-auto border-indigo-500/20 shadow-inner custom-scrollbar relative">
                  <div className="absolute top-0 right-0 p-2 opacity-20"><Database className="h-10 w-10 text-indigo-600" /></div>
                  <div className="space-y-1.5">
                    {(pipeline?.logs?.length > 0 ? pipeline.logs.map((l: any) => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.message}`) : logs).map((log, i) => (
                      <p key={i} className={`${log.includes('❌') || log.includes('failed') ? 'text-red-400' : log.includes('✅') || log.includes('completed') ? 'text-emerald-400' : log.includes('🚀') ? 'text-blue-400 font-bold' : 'text-indigo-400/80'}`}>
                        {log}
                      </p>
                    ))}
                    <div className="animate-pulse inline-block w-2 h-4 bg-indigo-500 ml-1 mt-2" />
                  </div>
               </Card>
            </div>
         </div>
      </div>
    </div>
  );
}
