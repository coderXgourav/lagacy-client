import React, { useState, useEffect } from 'react';
import { 
  Twitter, Search, Filter, ShieldCheck, Zap, 
  UserCheck, Database, Layout, Send, 
  MessageSquare, Calendar, CheckCircle2, 
  Play, Loader2, Globe, ExternalLink, 
  ArrowRight, Info, AlertTriangle, Cpu,
  BarChart3, Sparkles, TrendingUp
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
  { 
    id: "website", 
    label: "Website Problems", 
    keywords: ["website redesign needed", "website developer needed", "need a website developer", "website redesign help", "website looks outdated", "slow website problem", "website not converting", "website loading too slow", "shopify developer needed", "wordpress developer needed", "need ecommerce website", "website UX problems", "website design agency recommendation", "website revamp cost", "website optimization help"]
  },
  { 
    id: "leads", 
    label: "Lead Generation", 
    keywords: ["need more leads", "lead generation help", "how to generate B2B leads", "lead generation agency", "struggling to get leads", "not getting clients online", "how to get customers online", "local business marketing help", "how to generate leads for my business", "sales pipeline empty", "need appointment setting"]
  },
  { 
    id: "marketing", 
    label: "Marketing Problems", 
    keywords: ["facebook ads not working", "google ads not converting", "ads expensive no results", "marketing agency recommendation", "paid ads ROI problem", "how to improve ad conversion", "instagram ads not working", "meta ads expensive", "customer acquisition cost too high", "ads wasting money"]
  },
  { 
    id: "automation", 
    label: "Automation Problems", 
    keywords: ["business automation tools", "how to automate business processes", "crm automation help", "workflow automation", "zapier alternative", "make.com automation", "n8n automation help", "automate lead follow up", "automate marketing workflow", "AI automation for business"]
  },
  { 
    id: "crm", 
    label: "CRM Problems", 
    keywords: ["crm recommendation for small business", "crm implementation help", "crm integration help", "crm setup cost", "crm automation problems", "hubspot integration help", "salesforce integration help", "crm migration help"]
  },
  { 
    id: "ecommerce", 
    label: "E-commerce Problems", 
    keywords: ["shopify store not converting", "ecommerce conversion problems", "shopify developer needed urgently", "woocommerce developer help", "abandoned cart high", "how to increase ecommerce conversion", "product page not converting"]
  },
  { 
    id: "branding", 
    label: "Founder Personal Branding", 
    keywords: ["personal branding for founders", "linkedin growth help", "how to grow linkedin audience", "linkedin content strategy", "personal branding agency", "build founder brand online"]
  },
  { 
    id: "growth", 
    label: "Startup Growth Problems", 
    keywords: ["startup marketing strategy", "startup growth help", "startup lead generation", "startup go to market strategy", "b2b saas growth strategy", "startup struggling with traction"]
  },
  { 
    id: "realestate", 
    label: "Real Estate / Local Business", 
    keywords: ["real estate lead generation", "real estate website developer", "property portal development", "crm for real estate", "real estate marketing automation"]
  },
  { 
    id: "emergency", 
    label: "Emergency Signals", 
    keywords: ["agency recommendation urgently", "looking for marketing agency", "need developer urgently", "need automation consultant", "hire growth consultant", "looking for web development agency", "need help scaling business"]
  }
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
      toast.success("Project Initiated");
      addLog("Pipeline created. Ready for Step 1.");
    } catch (err) { toast.error("Launch failed"); }
    finally { setLoading(false); }
  };

  const executeStep = async () => {
    if (!pipeline) return;
    setLoading(true);
    const step = twitterStepData[pipeline.currentStep - 1];
    addLog(`Executing Step ${pipeline.currentStep}: ${step.title}...`);
    
    try {
      let endpoint = "";
      let payload = {};

      switch (pipeline.currentStep) {
        case 1:
          endpoint = `/twitter-automation/pipeline/${pipeline._id}/filter`;
          break;
        case 2:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/validate-engagement`;
          break;
        case 3:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/pain-detection`;
          break;
        case 4:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/qualify`;
          break;
        case 5:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/identity`;
          break;
        case 6:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/enrich`;
          break;
        case 7:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/structure`;
          break;
        case 8:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/outreach`;
          break;
        case 9:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/personalize`;
          break;
        case 10:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/booking`;
          break;
        case 11:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/reply`;
          break;
        default:
          if (leads.length > 0) endpoint = `/twitter-automation/lead/${leads[0]._id}/${step.title.toLowerCase()}`;
      }

      if (!endpoint) throw new Error("No leads available for processing");

      const { data } = await axios.post(`${API_URL}${endpoint}`, payload, getHeaders());
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
      {/* Header */}
      <div className="text-center space-y-4 pt-10">
        <h1 className="text-6xl font-black uppercase tracking-tighter flex items-center justify-center gap-4 italic text-white">
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
            <label className="text-xs font-bold uppercase opacity-70 text-slate-400">Discovery Presets (Select to populate)</label>
            <div className="flex flex-wrap gap-2">
              {keywordPresets.map((preset) => {
                const currentQueries = searchQuery.split(', ').filter(q => q.trim() !== "");
                const isActive = currentQueries.includes(preset.label);
                
                const togglePreset = () => {
                  if (isActive) {
                    setSearchQuery(currentQueries.filter(q => q !== preset.label).join(', '));
                  } else {
                    setSearchQuery([...currentQueries, preset.label].join(', '));
                  }
                };

                return (
                  <Badge 
                    key={preset.id} 
                    variant={isActive ? "default" : "outline"} 
                    className={`cursor-pointer transition-all py-1.5 px-4 text-[10px] uppercase font-black tracking-widest text-white border-white/20 ${isActive ? "bg-white text-black border-white" : "hover:bg-white/10 hover:border-white/50"}`}
                    onClick={togglePreset}
                  >
                    {preset.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1 group">
              <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40 group-focus-within:text-white transition-colors" />
              <Input 
                placeholder="YouTube Search Target (e.g. Website Problems, CRM help...)"
                className="pl-12 h-16 bg-black border-white/10 text-xl font-bold rounded-2xl focus:ring-2 focus:ring-white/20 transition-all text-white placeholder:text-white/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
                onClick={handleLaunch} 
                disabled={loading}
                className="h-16 px-10 bg-white text-black hover:bg-slate-200 font-black text-lg uppercase tracking-tighter rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Play className="mr-2 h-6 w-6 fill-current" />}
              Click to launch
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Status */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-11 gap-2">
          {twitterStepData.map((step) => {
            const isCompleted = currentStep > step.step;
            const isActive = currentStep === step.step;
            const Icon = step.icon;

            return (
              <div key={step.step} className="space-y-3">
                <div className={`aspect-square rounded-xl border flex items-center justify-center transition-all duration-500 relative group
                  ${isCompleted ? 'bg-white border-white scale-95 opacity-50' : ''}
                  ${isActive ? 'bg-[#0A0A0A] border-white ring-4 ring-white/10 shadow-[0_0_30px_rgba(255,255,255,0.2)] scale-110' : 'bg-slate-900/40 border-slate-800 opacity-30'}
                `}>
                  <Icon className={`h-6 w-6 ${isCompleted ? 'text-black' : isActive ? 'text-white' : 'text-slate-600'}`} />
                  {isActive && <div className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full animate-ping" />}
                </div>
                <div className={`text-[9px] font-black uppercase text-center tracking-tighter leading-none
                  ${isActive ? 'text-white' : 'text-slate-600'}
                `}>{step.title}</div>
              </div>
            );
          })}
        </div>

        {pipeline && (
            <Card className="border-white/20 bg-white/5 backdrop-blur-3xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <CardContent className="relative z-10 p-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-center gap-10 flex-1">
                        <div className="h-24 w-24 rounded-3xl bg-white flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                            {React.createElement(twitterStepData[currentStep-1]?.icon || Search, { className: "h-12 w-12 text-black" })}
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-white text-black font-black px-4 py-1 text-sm uppercase">Step {currentStep} / {twitterStepData.length}</Badge>
                                <span className="text-white/40 font-bold uppercase tracking-widest text-xs">Autonomous Pipeline Active</span>
                            </div>
                            <h3 className="text-5xl font-black uppercase tracking-tighter text-white uppercase italic">
                                {twitterStepData[currentStep-1]?.title}
                            </h3>
                            <p className="text-white/60 text-lg font-medium">{twitterStepData[currentStep-1]?.prompt}</p>
                        </div>
                    </div>
                    <Button 
                        size="lg" 
                        onClick={executeStep}
                        disabled={loading}
                        className="h-24 px-16 bg-white text-black hover:bg-slate-200 text-3xl font-black uppercase tracking-tighter rounded-3xl group shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                    >
                        {loading ? <Loader2 className="h-10 w-10 animate-spin" /> : (
                            <>EXECUTE STEP {currentStep} <ArrowRight className="ml-4 h-10 w-10 transition-transform group-hover:translate-x-2" /></>
                        )}
                    </Button>
                </CardContent>
            </Card>
        )}

        {/* Results Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                   <Twitter className="h-6 w-6 text-white" /> Discovered Leads ({leads.length})
                 </h2>
                 <div className="space-y-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar text-white">
                    {leads.length > 0 ? leads.map((lead) => (
                      <Card key={lead._id} className={`mb-3 border-l-4 ${lead.status === 'qualified' ? 'border-l-emerald-500' : 'border-l-slate-700'} bg-[#0A0A0A] border-white/5`}>
                        <CardContent className="p-4 flex gap-4">
                            <div className="relative">
                              <Avatar className="h-10 w-10 border-2 border-slate-700">
                                <AvatarImage src={lead.profile_image} />
                                <AvatarFallback className="bg-slate-800 text-slate-400">FB</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                  <a 
                                    href={lead.tweet_url || "#"} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="font-bold text-sm hover:text-blue-500 flex items-center gap-1 text-white"
                                  >
                                    @{lead.username || "User"} <Globe className="h-3 w-3 opacity-50" />
                                  </a>
                                  <div className="flex gap-2 items-center">
                                    <Badge variant="outline" className={`text-[8px] uppercase border-white/10 text-white ${lead.status === 'qualified' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : ''}`}>{lead.status}</Badge>
                                    <a 
                                      href={lead.tweet_url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[9px] font-bold text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                      <Twitter className="h-2.5 w-2.5" /> View Tweet
                                    </a>
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  {lead.is_pain && <Badge className="bg-amber-500 text-black font-black text-[9px] uppercase tracking-tighter animate-pulse">PAIN_DETECTED</Badge>}
                                  {lead.qualified && <Badge className="bg-emerald-500 text-white font-black text-[9px] uppercase tracking-tighter">QUALIFIED_B2B</Badge>}
                                </div>
                              </div>

                              <p className="text-xs text-slate-300 line-clamp-2 italic border-l-2 border-slate-700 pl-2">
                                {lead.comment?.split(' ').map((word: string, i: number) => {
                                  const isHit = ALL_PAIN_SIGNALS.some(s => word.toLowerCase().includes(s.split(' ')[0].toLowerCase()));
                                  return isHit ? <span key={i} className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">{word} </span> : word + " ";
                                })}
                              </p>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {lead.matched_keyword && (
                                  <Badge variant="outline" className="text-[9px] border-yellow-500/50 text-yellow-500 bg-yellow-500/5 uppercase font-black tracking-tighter">
                                    🎯 SIGNAL: {lead.matched_keyword}
                                  </Badge>
                                )}
                                {lead.category && (
                                  <Badge variant="outline" className="text-[9px] border-white/20 text-white uppercase font-black tracking-tighter">
                                    🏷️ {lead.category}
                                  </Badge>
                                )}
                              </div>
                              
                              {lead.problem_summary && (
                                <div className="mt-2 bg-slate-800/30 rounded-lg p-2 border border-slate-700/50">
                                   <div className="flex items-center gap-1 text-[8px] font-black text-slate-500 uppercase mb-1">
                                      <Cpu className="h-2.5 w-2.5" /> Analysis Summary
                                   </div>
                                   <div className="text-[10px] text-slate-300 font-medium">
                                      {lead.problem_summary}
                                   </div>
                                </div>
                              )}

                              {lead.contact && (
                                <div className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 border-t border-slate-800/50 pt-2">
                                  {lead.contact.email && lead.contact.email !== 'N/A' && <span className="flex items-center gap-1">📧 {lead.contact.email}</span>}
                                  {lead.contact.phone && lead.contact.phone !== 'N/A' && <span className="flex items-center gap-1">📞 {lead.contact.phone}</span>}
                                  {lead.contact.company && lead.contact.company !== 'N/A' && <span className="flex items-center gap-1 text-slate-300"><Database className="h-3 w-3" /> {lead.contact.company}</span>}
                                  {lead.contact.website && lead.contact.website !== 'N/A' && (
                                    <a href={lead.contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                                      <Globe className="h-3 w-3" /> {lead.contact.website}
                                    </a>
                                  )}
                                  {(!lead.contact.email || lead.contact.email === 'N/A') && (!lead.contact.website || lead.contact.website === 'N/A') && lead.tweet_url && (
                                    <a href={lead.tweet_url.split('/status/')[0]} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                                      <Twitter className="h-3 w-3" /> Twitter Profile: @{lead.username}
                                    </a>
                                  )}
                                </div>
                              )}

                              {lead.outreach && (lead.outreach.finalMessage || lead.outreach.emailBody) && (
                                <div className="mt-2 bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
                                  <div className="flex items-center gap-1 text-[8px] font-black text-blue-400 uppercase mb-1.5">
                                    <Send className="h-2.5 w-2.5" /> AI-Generated DM
                                  </div>
                                  <p className="text-[11px] text-blue-200 font-medium leading-relaxed">
                                    {lead.outreach.finalMessage || lead.outreach.emailBody}
                                  </p>
                                  {lead.outreach.cta && (
                                    <p className="text-[9px] text-blue-400/70 mt-1 italic">CTA: {lead.outreach.cta}</p>
                                  )}
                                </div>
                              )}

                              {lead.reply && lead.reply.nextAction && (
                                <div className="mt-2 bg-emerald-500/5 rounded-lg p-3 border border-emerald-500/20">
                                  <div className="flex items-center gap-1 text-[8px] font-black text-emerald-400 uppercase mb-1.5">
                                    <MessageSquare className="h-2.5 w-2.5" /> Reply Intelligence
                                  </div>
                                  <div className="flex gap-2 mb-1">
                                    <Badge className="text-[7px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{lead.reply.sentiment}</Badge>
                                    <Badge className="text-[7px] bg-slate-500/20 text-slate-300 border-slate-500/30">{lead.reply.category}</Badge>
                                  </div>
                                  <p className="text-[10px] text-emerald-200/80">Next: {lead.reply.nextAction}</p>
                                </div>
                              )}
                            </div>
                        </CardContent>
                      </Card>
                    )) : (
                      <div className="h-64 rounded-2xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-slate-600">
                        <Database className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-xs uppercase font-bold tracking-widest opacity-20">Standby for data ingestion...</p>
                      </div>
                    )}
                 </div>
               </div>

               <div className="space-y-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2 text-white">
                   <BarChart3 className="h-6 w-6 text-white" /> Extraction Logs
                 </h2>
                 <div className="bg-black/80 rounded-2xl p-6 h-[600px] font-mono text-xs border border-white/5 shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023_original.svg')] bg-[length:200px] bg-no-repeat bg-center opacity-[0.03] grayscale pointer-events-none" />
                    <div className="relative space-y-2 overflow-auto h-full pr-2 custom-scrollbar">
                      {logs.length > 0 ? logs.map((log, i) => (
                        <div key={i} className={`flex gap-3 ${log.includes('Error') ? 'text-rose-500' : 'text-slate-400'}`}>
                          <span className="text-white/20 select-none">[{logs.length - i}]</span>
                          <span className={`${i === 0 ? 'text-white' : ''}`}>
                            {log}
                            {i === 0 && <span className="inline-block w-1.5 h-3.5 ml-1 bg-white animate-pulse align-middle" />}
                          </span>
                        </div>
                      )) : (
                        <div className="text-slate-700 animate-pulse italic">C:\System\X-Engine\ standby...</div>
                      )}
                    </div>
                 </div>
               </div>
        </div>
      </div>
    </div>
  );
}
