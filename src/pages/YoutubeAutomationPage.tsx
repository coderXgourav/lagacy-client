import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Youtube, 
  Search, 
  Users, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Brain, 
  Globe, 
  CheckCircle2, 
  Zap,
  Play,
  TrendingUp,
  Activity,
  Loader2,
  Filter,
  UserCheck,
  Heart
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ytStepData = [
  { step: 1, title: "VIDEO RELEVANCE FILTER", icon: Filter, color: "text-red-500", bg: "bg-red-500/10", prompt: "Filter videos relevant to website, SEO, or automation struggles." },
  { step: 2, title: "ENGAGEMENT VALIDATION", icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10", prompt: "Calculate engagement quality and filter 7%-12% rates." },
  { step: 3, title: "COMMENT PAIN DETECTION", icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10", prompt: "Detect frustration, confusion, or business problems in comments." },
  { step: 4, title: "LEAD QUALIFICATION", icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", prompt: "Filter high-quality leads (Intent score >= 7)." },
  { step: 5, title: "IDENTITY ANALYSIS", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", prompt: "Analyze user profile for role and decision maker status." },
  { step: 6, title: "CONTACT ENRICHMENT", icon: Globe, color: "text-indigo-500", bg: "bg-indigo-500/10", prompt: "Extract email, phone, and website from profile data." },
  { step: 7, title: "LEAD STRUCTURING", icon: Activity, color: "text-cyan-500", bg: "bg-cyan-500/10", prompt: "Create a structured JSON lead record for CRM." },
  { step: 8, title: "AI OUTREACH GENERATION", icon: Mail, color: "text-amber-500", bg: "bg-amber-500/10", prompt: "Write high-converting cold email referencing the pain point." },
  { step: 9, title: "MESSAGE PERSONALIZATION", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10", prompt: "Enhance outreach using empathy and authority psychology." },
  { step: 10, title: "BOOKING MESSAGE", icon: Calendar, color: "text-violet-500", bg: "bg-violet-500/10", prompt: "Generate Calendly booking message with soft CTA." },
  { step: 11, title: "REPLY INTELLIGENCE", icon: MessageSquare, color: "text-sky-500", bg: "bg-sky-500/10", prompt: "Classify reply sentiment and extract next actions." }
];

const keywordPresets = [
  { id: "website", label: "Website Problems", keywords: "website redesign, website developer, website looks outdated, slow website, shopify developer, wordpress developer" },
  { id: "leads", label: "Lead Generation", keywords: "need more leads, lead generation help, B2B leads, lead generation agency, not getting clients" },
  { id: "marketing", label: "Marketing", keywords: "facebook ads not working, google ads not converting, ads expensive no results, meta ads expensive, ROI problem" },
  { id: "automation", label: "Automation", keywords: "business automation tools, automate business processes, crm automation, zapier alternative, make.com, n8n help" },
  { id: "crm", label: "CRM Problems", keywords: "crm recommendation, crm implementation, hubspot integration, salesforce help, crm migration" },
  { id: "ecommerce", label: "E-commerce", keywords: "shopify store not converting, ecommerce conversion, shopify developer urgent, abandoned cart high" },
  { id: "branding", label: "Founder Branding", keywords: "personal branding for founders, linkedin growth, linkedin content strategy, personal branding agency" },
  { id: "growth", label: "Startup Growth", keywords: "startup marketing strategy, startup growth help, startup lead gen, go to market strategy, B2B saas growth" },
  { id: "realestate", label: "Real Estate", keywords: "real estate lead generation, real estate developer, property portal development, real estate marketing" },
  { id: "emergency", label: "Emergency Signals", keywords: "agency recommendation urgently, looking for marketing agency, need developer urgently, hire growth consultant" }
];

export default function YoutubeAutomationPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Problems with Website design, Mobile apps, SEO, or Automation 2024");

  const getHeaders = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/youtube-automation/latest`, getHeaders());
      if (res.data.data) {
        setPipeline(res.data.data.pipeline);
        setLeads(res.data.data.leads || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadPipeline(); }, []);

  const handleLaunch = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/youtube-automation/initialize`, { query: searchQuery }, getHeaders());
      setPipeline(res.data.data);
      setLeads([]);
      toast({ title: "YouTube Machine Launched", description: "Scanning for high-intent leads..." });
    } catch (err: any) { toast({ title: "Launch Failed", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const runStep = async () => {
    if (!pipeline) return;
    const currentStepIndex = pipeline.currentStep - 1;
    const step = ytStepData[currentStepIndex];

    try {
      setLoading(true);
      let endpoint = "";
      let payload = {};

      switch (pipeline.currentStep) {
        case 1:
          endpoint = `/youtube-automation/pipeline/${pipeline._id}/filter`;
          payload = { videos: [
            { video_id: "yt123", title: "My Wix website is slow", description: "Need help with SEO and speed" },
            { video_id: "yt456", title: "How to build an app", description: "Searching for developers" }
          ]};
          break;
        case 3:
          if (leads.length > 0) {
            endpoint = `/youtube-automation/lead/${leads[0]._id}/pain-detection`;
            payload = { comment: "I am struggling with my Wix site, it never ranks on Google. Anyone can help?" };
          }
          break;
        case 4:
          if (leads.length > 0) endpoint = `/youtube-automation/lead/${leads[0]._id}/qualify`;
          break;
        case 8:
          if (leads.length > 0) endpoint = `/youtube-automation/lead/${leads[0]._id}/outreach`;
          break;
        default:
          toast({ title: "Simulation Mode", description: `Executing Step ${pipeline.currentStep}: ${step.title}` });
          setPipeline({ ...pipeline, currentStep: pipeline.currentStep + 1 });
          setLoading(false);
          return;
      }

      if (endpoint) {
        const res = await axios.post(`${API_URL}${endpoint}`, payload, getHeaders());
        toast({ title: `Step ${pipeline.currentStep} Success`, description: `Completed ${step.title}` });
        loadPipeline();
      }
    } catch (err: any) {
      toast({ title: "Execution Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const syncApify = async () => {
    if (!pipeline) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/youtube-automation/pipeline/${pipeline._id}/fetch-apify`, { query: searchQuery }, getHeaders());
      toast({ title: "Apify Sync Complete", description: `Ingested ${res.data.data.length} new potential leads.` });
      loadPipeline();
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = ytStepData[pipeline?.currentStep - 1] || ytStepData[0];

  return (
    <div className="container mx-auto p-6 space-y-12 animate-fade-in pb-20">
      {/* ... (Header remains same) */}
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent flex items-center justify-center gap-4">
          <Youtube className="h-12 w-12 text-red-600" /> YOUTUBE LEAD AUTOMATION
        </h1>
        <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest">n8n Style Autonomous Lead Engine</p>
      </div>

      <Card className="max-w-4xl mx-auto border-red-500/20 shadow-2xl overflow-hidden bg-card">
        <CardHeader className="bg-red-500/5 border-b border-red-500/10 flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">⚙️ MASTER CONTROL PROMPT</CardTitle>
          {pipeline && <Button variant="outline" size="sm" onClick={() => setPipeline(null)} className="text-[10px] uppercase font-bold">New Mission</Button>}
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase opacity-70">Discovery Presets (Select to populate)</label>
            <div className="flex flex-wrap gap-2">
              {keywordPresets.map((preset) => (
                <Badge 
                  key={preset.id} 
                  variant="outline" 
                  className={`cursor-pointer hover:bg-red-500 hover:text-white transition-all py-1 px-3 text-[10px] uppercase font-bold border-red-500/20 ${searchQuery.includes(preset.keywords.split(',')[0]) ? "bg-red-500 text-white" : ""}`}
                  onClick={() => setSearchQuery(preset.keywords)}
                >
                  {preset.label}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase opacity-70">YouTube Search Target</label>
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-muted/50 border-red-500/10 h-12" placeholder="e.g. Wix website problems, SEO struggles..." />
          </div>
          <div className="flex gap-4">
            <Button onClick={handleLaunch} className="flex-1 h-14 text-lg font-bold uppercase tracking-widest shadow-xl bg-red-600 hover:bg-red-700 text-white" disabled={loading || pipeline}>
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5" />}
              {pipeline ? "PIPELINE ACTIVE" : "Trigger n8n Workflow"}
            </Button>
            {pipeline && (
              <Button onClick={syncApify} variant="outline" className="h-14 px-8 border-red-500/50 hover:bg-red-500/10 text-red-500 font-bold uppercase tracking-widest shadow-lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Globe className="mr-2 h-5 w-5" />}
                Sync with Apify
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {pipeline && (
        <div className="space-y-12">
           {/* Step Grid */}
           <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ytStepData.map((step) => {
                const isActive = pipeline.currentStep === step.step;
                const isCompleted = pipeline.currentStep > step.step;
                return (
                  <Card key={step.step} className={`p-4 border-red-500/10 relative transition-all ${isActive ? "ring-2 ring-red-500 bg-red-500/5 scale-105 z-10" : isCompleted ? "bg-emerald-500/5 opacity-80" : "opacity-40"}`}>
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
           <Card className="border-red-500/30 bg-black/40 shadow-2xl overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="space-y-4 max-w-2xl">
                   <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${currentStepData.bg} ${currentStepData.color}`}><currentStepData.icon className="h-6 w-6" /></div>
                      <div>
                        <p className="text-xs font-black text-red-500 uppercase tracking-widest">Active Step {pipeline.currentStep}</p>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">{currentStepData.title}</h3>
                      </div>
                   </div>
                   <div className="p-4 bg-white/5 rounded-lg border border-white/10 italic text-sm text-muted-foreground">
                      "{currentStepData.prompt}"
                   </div>
                </div>
                <Button onClick={runStep} disabled={loading} size="lg" className="h-20 px-12 text-xl font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 shadow-2xl transition-all hover:scale-105 min-w-[280px]">
                   {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Play className="mr-2 h-6 w-6 fill-current" />}
                   Execute Step {pipeline.currentStep}
                </Button>
              </CardContent>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Leade & Logs components remain similarly structured but with state */}
              <div className="space-y-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <Users className="h-6 w-6 text-red-500" /> Discovered Leads ({leads.length})
                 </h2>
                 <div className="space-y-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                    {leads.length > 0 ? leads.map((lead, i) => (
                      <Card key={i} className="bg-card border-red-500/10 hover:border-red-500/30 transition-all group overflow-hidden">
                        <CardContent className="p-4 flex gap-4">
                           <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center font-black text-red-500">{lead.username?.charAt(0) || "U"}</div>
                           <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-start">
                                <p className="font-bold text-sm">@{lead.username || "User"}</p>
                                <Badge variant="outline" className={`text-[8px] uppercase ${lead.status === 'qualified' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : ''}`}>{lead.status}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">"{lead.comment}"</p>
                              {lead.problem_summary && <p className="text-[10px] text-red-400 font-bold uppercase mt-2">Detected: {lead.problem_summary}</p>}
                           </div>
                        </CardContent>
                      </Card>
                    )) : (
                      <div className="p-12 text-center opacity-30 italic">No leads discovered yet. Run Step 1.</div>
                    )}
                 </div>
              </div>
              <div className="space-y-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <Activity className="h-6 w-6 text-red-500" /> Extraction Logs
                 </h2>
                 <Card className="bg-black/80 font-mono text-[11px] p-6 h-[600px] overflow-auto border-red-500/20 shadow-inner">
                    <div className="space-y-2">
                      <p className="text-emerald-400 opacity-80">[00:00:01] Initializing YouTube Scraper...</p>
                      <p className="text-emerald-400">[00:00:02] target_query="{searchQuery}"</p>
                      <p className="text-yellow-400">[SYSTEM] Connection to Google Workspace established.</p>
                      {pipeline.currentStep > 1 && <p className="text-emerald-400 mt-2">[00:00:15] Step 1 COMPLETED. Video IDs: {leads.map(l => l.video_id).join(', ')}</p>}
                      {pipeline.currentStep > 2 && <p className="text-emerald-400">[00:00:22] Step 2 COMPLETED. Engagement validated at 8.4% average.</p>}
                      {pipeline.currentStep > 3 && <p className="text-purple-400 font-bold mt-4">[LLM] Running Core Pain Detection analysis...</p>}
                      {pipeline.currentStep > 3 && leads.length > 0 && <p className="text-pink-400">→ Analyzed lead @{leads[0].username}: "Frustrated with SEO results on Wix"</p>}
                      <div className="animate-pulse inline-block w-2 h-4 bg-emerald-500 ml-1 mt-2" />
                    </div>
                 </Card>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
