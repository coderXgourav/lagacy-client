import React, { useState, useEffect } from 'react';
import { 
  Twitter, Search, Filter, ShieldCheck, Zap, 
  UserCheck, Database, Layout, Send, 
  MessageSquare, Calendar, CheckCircle2, 
  Play, Loader2, Globe, ExternalLink, 
  ArrowRight, Info, AlertTriangle, Cpu,
  BarChart3, Sparkles, TrendingUp, Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const twitterStepData = [
  { step: 1, title: "DISCOVERY", icon: Search, color: "text-blue-500", bg: "bg-blue-500/10", prompt: "X (Twitter) Discovery is syncing high-intent threads..." },
  { step: 2, title: "ENGAGEMENT", icon: TrendingUp, color: "text-sky-400", bg: "bg-sky-400/10", prompt: "Validating engagement velocity and viral potential." },
  { step: 3, title: "PAIN DETECTION", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", prompt: "X-AI scanning tweets for high-intent pain signals." },
  { step: 4, title: "QUALIFICATION", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", prompt: "B2B Lead Score > 85 required for auto-advancement." },
  { step: 5, title: "IDENTITY", icon: UserCheck, color: "text-indigo-500", bg: "bg-indigo-500/10", prompt: "Verifying user authority and profile credibility." },
  { step: 6, title: "ENRICHMENT", icon: Database, color: "text-cyan-500", bg: "bg-cyan-500/10", prompt: "Extracting contact metadata and business intent." },
  { step: 7, title: "STRUCTURING", icon: Layout, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10", prompt: "Transforming raw data into outreach-ready payload." },
  { step: 8, title: "OUTREACH", icon: Send, color: "text-blue-600", bg: "bg-blue-600/10", prompt: "Sequencing initial bridge content and DMs." },
  { step: 9, title: "PERSONALIZE", icon: Sparkles, color: "text-rose-500", bg: "bg-rose-500/10", prompt: "Hyper-personalizing based on recent X activity." },
  { step: 10, title: "BOOKING", icon: Calendar, color: "text-violet-500", bg: "bg-violet-500/10", prompt: "Automate appointment booking sequences." },
  { step: 11, title: "REPLY INTELLIGENCE", icon: MessageSquare, color: "text-sky-500", bg: "bg-sky-500/10", prompt: "Classify incoming replies and next best actions." }
];

const keywordPresets = [
  { id: "web", label: "Web Development", keywords: ["website redesign needed", "website developer needed"] },
  { id: "leads", label: "Lead Generation", keywords: ["need more leads", "lead generation help"] },
  { id: "marketing", label: "Digital Marketing", keywords: ["facebook ads not working", "google ads help"] },
  { id: "automation", label: "AI & Automation", keywords: ["business automation tools", "AI marketing help"] },
  { id: "blockchain", label: "Blockchain", keywords: ["blockchain developer", "token creation help"] },
  { id: "crm", label: "CRM & Software", keywords: ["crm setup cost", "custom software development"] },
  { id: "ecommerce", label: "E-commerce", keywords: ["shopify developer", "ecommerce conversion help"] },
  { id: "branding", label: "Founders & Growth", keywords: ["personal branding for founders", "linkedin growth help"] },
  { id: "emergency", label: "Emergency Signals", keywords: ["need agency urgently", "help scaling business"] }
];

const ALL_PAIN_SIGNALS = keywordPresets.flatMap(p => p.keywords);

export default function TwitterAutomationPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const getHeaders = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

  useEffect(() => {
    fetchActivePipeline();
  }, []);

  const fetchActivePipeline = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/twitter-automation/pipeline/active`, getHeaders());
      if (data) {
        setPipeline(data);
        fetchLeads(data._id);
        setSearchQuery(data.query || "");
      }
    } catch (err) { console.error(err); }
  };

  const fetchLeads = async (id: string) => {
    try {
      const { data } = await axios.get(`${API_URL}/twitter-automation/pipeline/${id}/leads`, getHeaders());
      setLeads(data);
    } catch (err) { console.error(err); }
  };

  const handleLaunch = async () => {
    if (!searchQuery) return toast.error("Please enter a discovery query");
    setLoading(true);
    addLog(`Initializing Twitter Engine for: ${searchQuery}`);
    try {
      const { data } = await axios.post(`${API_URL}/twitter-automation/pipeline`, { query: searchQuery }, getHeaders());
      setPipeline(data);
      setLeads([]); // Clear old leads when starting a new pipeline
      toast.success("Project Initiated");
      addLog("Pipeline created. Ready for Step 1 (Discovery).");
    } catch (err) { toast.error("Launch failed"); }
    finally { setLoading(false); }
  };

  const handleManualAdd = async (manualText: string) => {
    if (!pipeline) return;
    try {
      setLoading(true);
      addLog(`📥 Manually injecting Twitter lead: "${manualText.substring(0, 30)}..."`);
      await axios.post(`${API_URL}/twitter-automation/pipeline/${pipeline._id}/filter`, { 
        query: manualText,
        isManual: true 
      }, getHeaders());
      addLog(`✅ Twitter Lead injected successfully!`);
      fetchLeads(pipeline._id);
      toast.success("Manual Lead Injected");
    } catch (err: any) {
      addLog(`❌ Injection Failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  const handleAutoReply = async (leadId: string) => {
    try {
      setLoading(true);
      addLog(`🚀 Triggering Automated X Reply for Lead ID: ${leadId}`);
      await axios.post(`${API_URL}/twitter-automation/lead/${leadId}/reply`, {}, getHeaders());
      addLog(`✅ Automated X Reply posted successfully!`);
      toast.success("X Reply Posted Natively");
      if (pipeline) fetchLeads(pipeline._id);
    } catch (err: any) {
      addLog(`❌ Auto-Post Failed: ${err.response?.data?.message || err.message}`);
      toast.error("Auto-Post Failed");
    } finally {
      setLoading(false);
    }
  };

  const executeStep = async () => {
    if (!pipeline) return;
    setLoading(true);
    const step = twitterStepData[pipeline.currentStep - 1];
    addLog(`Executing Step ${pipeline.currentStep}: ${step.title}...`);
    
    try {
      let endpointSuffix = "";
      let payload = {};

      switch (pipeline.currentStep) {
        case 1: endpointSuffix = "PIPELINE_FILTER"; break;
        case 2: endpointSuffix = "validate-engagement"; break;
        case 3: endpointSuffix = "pain-detection"; break;
        case 4: endpointSuffix = "qualify"; break;
        case 5: endpointSuffix = "identity"; break;
        case 6: endpointSuffix = "enrich"; break;
        case 7: endpointSuffix = "structure"; break;
        case 8: endpointSuffix = "outreach"; break;
        case 9: endpointSuffix = "personalize"; break;
        case 10: endpointSuffix = "booking"; break;
        case 11: endpointSuffix = "reply"; break;
      }

      if (endpointSuffix === "PIPELINE_FILTER") {
        await axios.post(`${API_URL}/twitter-automation/pipeline/${pipeline._id}/filter`, payload, getHeaders());
      } else if (endpointSuffix && leads.length > 0) {
        for (const lead of leads) {
          try {
            await axios.post(`${API_URL}/twitter-automation/lead/${lead._id}/${endpointSuffix}`, payload, getHeaders());
            addLog(`✅ Processed @${lead.username}`);
          } catch (e: any) {
            addLog(`❌ Failed @${lead.username}: ${e.response?.data?.message || e.message}`);
          }
        }
      }

      addLog(`Step ${pipeline.currentStep} Successful.`);
      toast.success(`${step.title} Completed`);
      fetchActivePipeline();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Execution Error");
      addLog(`Error: ${err.message}`);
    } finally { setLoading(false); }
  };

  const currentStep = pipeline?.currentStep || 0;

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 pb-20 p-6 space-y-12">
      <div className="text-center space-y-4 pt-10">
        <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center justify-center gap-4 italic text-white leading-none">
          <Twitter className="h-12 w-12 text-white" /> TWITTER LEAD AUTOMATION
        </h1>
        <p className="text-xl text-slate-400 font-medium uppercase tracking-widest">n8n Style Autonomous Lead Engine</p>
      </div>

      <Card className="max-w-4xl mx-auto border-slate-800 shadow-2xl overflow-hidden bg-[#0A0A0A]">
        <CardHeader className="bg-slate-900/50 border-b border-white/5">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter text-white">⚙️ MASTER CONTROL PROMPT</CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase opacity-70 text-slate-400">Discovery Presets</label>
            <div className="flex flex-wrap gap-2">
              {keywordPresets.map((preset) => (
                <Badge 
                  key={preset.id} 
                  variant="outline" 
                  className={`cursor-pointer border-white/20 hover:bg-white/10 ${searchQuery.includes(preset.label) ? "bg-white text-black" : ""}`}
                  onClick={() => setSearchQuery(preset.label)}
                >
                  {preset.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Input 
                placeholder="Search keywords..."
                className="h-16 bg-black border-white/10 text-xl font-bold rounded-2xl text-white placeholder:text-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
                onClick={handleLaunch} 
                disabled={loading}
                className="h-16 px-10 bg-white text-black hover:bg-slate-200 font-black text-lg uppercase tracking-tighter rounded-2xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Play className="mr-2 h-6 w-6 fill-current" />}
              {pipeline && pipeline.currentStep >= 1 ? "START NEW PIPELINE" : "Launch"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-11 gap-2">
          {twitterStepData.map((step) => (
            <div key={step.step} className="space-y-2 text-center">
              <div className={`aspect-square rounded-xl border flex items-center justify-center ${currentStep === step.step ? "bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "border-slate-800 opacity-30"}`}>
                <step.icon className={`h-5 w-5 ${currentStep === step.step ? "text-black" : "text-slate-600"}`} />
              </div>
              <p className="text-[8px] font-black uppercase text-slate-500">{step.title}</p>
            </div>
          ))}
        </div>

        {pipeline && (
          <Card className="border-white/20 bg-white/5 backdrop-blur-3xl overflow-hidden">
            <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className="bg-white text-black px-4 py-1 text-sm uppercase font-black">Step {currentStep}</Badge>
                  <span className="text-white/40 font-bold uppercase tracking-widest text-xs italic">Autonomous Pipeline Active</span>
                </div>
                <h3 className="text-5xl font-black uppercase tracking-tighter text-white italic">
                  {twitterStepData[currentStep-1]?.title}
                </h3>
                <p className="text-white/60 text-lg font-medium">"{twitterStepData[currentStep-1]?.prompt}"</p>
              </div>
              
              <div className="flex flex-col gap-4 min-w-[380px]">
                <div className="flex items-center gap-2">
                   <Input 
                        placeholder="Paste manual tweet text here..."
                        className="h-14 bg-black/40 border-white/20 text-sm rounded-xl text-white placeholder:text-white/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button 
                        onClick={() => handleManualAdd(searchQuery)} 
                        disabled={loading || !searchQuery}
                        className="h-14 px-4 bg-slate-900 border border-white/30 text-white hover:bg-slate-800 font-bold uppercase tracking-widest rounded-xl whitespace-nowrap text-[10px]"
                    >
                        <Zap className="mr-1 h-3 w-3" /> Inject Lead
                    </Button>
                </div>
                <Button 
                    size="lg" 
                    onClick={executeStep}
                    disabled={loading}
                    className="h-24 px-12 bg-white text-black hover:bg-slate-200 text-3xl font-black uppercase tracking-tighter rounded-3xl group shadow-[0_0_50px_rgba(255,255,255,0.3)] w-full"
                >
                    {loading ? <Loader2 className="h-10 w-10 animate-spin" /> : (
                        <>EXECUTE {currentStep} <ArrowRight className="ml-4 h-10 w-10" /></>
                    )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Twitter className="h-6 w-6 text-white" /> Discovered Leads ({leads.length})
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
              {leads.map((lead) => (
                <Card key={lead._id} className="bg-[#0A0A0A] border-white/5 p-4">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarImage src={lead.profile_image} />
                      <AvatarFallback>X</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                       <div className="flex justify-between items-start">
                          <span className="font-bold text-sm">@{lead.username}</span>
                          {lead.is_pain && <Badge className="bg-amber-500 text-black text-[8px] font-black">PAIN DETECTED</Badge>}
                       </div>
                       <p className="text-xs text-slate-400 italic line-clamp-2">"{lead.comment || lead.tweet_text || 'No content'}"</p>
                       
                       {lead.outreach && (lead.outreach.finalMessage || lead.outreach.emailBody) && (
                        <div className="mt-2 bg-blue-500/5 rounded-lg p-3 border border-blue-500/20 relative group">
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1"><Send className="h-2 w-2" /> Ready to post</span>
                            <Button size="sm" variant="outline" className="h-6 text-[8px] px-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-500/30" onClick={() => {
                              navigator.clipboard.writeText(lead.outreach.finalMessage || lead.outreach.emailBody || "");
                              toast.success("Ready! Clipboard updated.");
                              window.open(lead.tweet_url || "https://twitter.com", "_blank");
                            }}><Copy className="h-2 w-2 mr-1" /> Copy</Button>
                            
                            <Button 
                              size="sm" 
                              className={`h-6 text-[8px] px-2 font-bold uppercase tracking-widest ${lead.reply_posted ? "bg-emerald-600 hover:bg-emerald-700" : "bg-sky-600 hover:bg-sky-500"} text-white border-transparent shadow-lg shadow-sky-500/20`}
                              disabled={loading || lead.reply_posted}
                              onClick={() => handleAutoReply(lead._id)}
                            >
                              {loading ? <Loader2 className="h-2 w-2 animate-spin mr-1" /> : lead.reply_posted ? <CheckCircle2 className="h-2 w-2 mr-1" /> : <Zap className="h-2 w-2 mr-1" />}
                              {lead.reply_posted ? "Posted" : "Auto-Post"}
                            </Button>
                          </div>
                          <p className="text-[10px] text-blue-200 leading-tight">{lead.outreach.finalMessage || lead.outreach.emailBody}</p>
                        </div>
                       )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-white" /> Activity Log
            </h2>
            <div className="bg-black border border-white/5 rounded-2xl p-6 h-[600px] overflow-auto font-mono text-[10px] space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-3 ${log.includes('❌') ? 'text-rose-500' : 'text-slate-500'}`}>
                   <span className="opacity-20">[{logs.length - i}]</span>
                   <span className={i === 0 ? "text-white" : ""}>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
