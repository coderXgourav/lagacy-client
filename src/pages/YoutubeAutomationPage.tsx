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
  Heart,
  Send,
  Copy
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  { id: "website", label: "Website Problems", keywords: "website redesign needed, website developer needed, need a website developer, website redesign help, website looks outdated, slow website problem, website not converting, website loading too slow, shopify developer needed, wordpress developer needed, need ecommerce website, website UX problems, website design agency recommendation, website revamp cost, website optimization help" },
  { id: "leads", label: "Lead Generation", keywords: "need more leads, lead generation help, how to generate B2B leads, lead generation agency, struggling to get leads, not getting clients online, how to get customers online, local business marketing help, how to generate leads for my business, sales pipeline empty, need appointment setting" },
  { id: "marketing", label: "Marketing Problems", keywords: "facebook ads not working, google ads not converting, ads expensive no results, marketing agency recommendation, paid ads ROI problem, how to improve ad conversion, instagram ads not working, meta ads expensive, customer acquisition cost too high, ads wasting money" },
  { id: "automation", label: "Automation Problems", keywords: "business automation tools, how to automate business processes, crm automation help, workflow automation, zapier alternative, make.com automation, n8n automation help, automate lead follow up, automate marketing workflow, AI automation for business" },
  { id: "crm", label: "CRM Problems", keywords: "crm recommendation for small business, crm implementation help, crm integration help, crm setup cost, crm automation problems, hubspot integration help, salesforce integration help, crm migration help" },
  { id: "ecommerce", label: "E-commerce Problems", keywords: "shopify store not converting, ecommerce conversion problems, shopify developer needed urgently, woocommerce developer help, abandoned cart high, how to increase ecommerce conversion, product page not converting" },
  { id: "branding", label: "Founder Personal Branding", keywords: "personal branding for founders, linkedin growth help, how to grow linkedin audience, linkedin content strategy, personal branding agency, build founder brand online" },
  { id: "growth", label: "Startup Growth Problems", keywords: "startup marketing strategy, startup growth help, startup lead generation, startup go to market strategy, b2b saas growth strategy, startup struggling with traction" },
  { id: "realestate", label: "Real Estate / Local Business", keywords: "real estate lead generation, real estate website developer, property portal development, crm for real estate, real estate marketing automation" },
  { id: "emergency", label: "Emergency Signals", keywords: "agency recommendation urgently, looking for marketing agency, need developer urgently, need automation consultant, hire growth consultant, looking for web development agency, need help scaling business" }
];

export default function YoutubeAutomationPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Standing by for new mission...", "[READY] Keyword framework loaded: Kyptronix v2.0"]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

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
      addLog(`🚀 Initializing YouTube Pipeline for query: "${searchQuery.substring(0, 30)}..."`);
      const res = await axios.post(`${API_URL}/youtube-automation/initialize`, { query: searchQuery }, getHeaders());
      setPipeline(res.data.data);
      setLeads([]);
      addLog(`✅ Pipeline created! Launching Step 1: Video Relevance Filter.`);
      toast({ title: "YouTube Machine Launched", description: "Scanning for high-intent leads..." });
    } catch (err: any) { 
      addLog(`❌ Launch Failed: ${err.message}`);
      toast({ title: "Launch Failed", variant: "destructive" }); 
    }
    finally { setLoading(false); }
  };

  const runStep = async () => {
    if (!pipeline) return;
    const currentStepIndex = pipeline.currentStep - 1;
    const step = ytStepData[currentStepIndex];

    try {
      setLoading(true);
      let endpointSuffix = "";
      let payload = {};

      switch (pipeline.currentStep) {
        case 1:
          endpointSuffix = "PIPELINE_FILTER";
          break;
        case 2: endpointSuffix = "validate-engagement"; break;
        case 3: endpointSuffix = "pain-detection"; payload = { comment: null }; break;
        case 4: endpointSuffix = "qualify"; break;
        case 5: endpointSuffix = "identity"; break;
        case 6: endpointSuffix = "enrich"; break;
        case 7: endpointSuffix = "structure"; break;
        case 8: endpointSuffix = "outreach"; break;
        case 9: endpointSuffix = "personalize"; break;
        case 10: endpointSuffix = "booking"; break;
        case 11: endpointSuffix = "reply"; payload = { replyText: "Interested, tell me more." }; break;
        default:
          toast({ title: "Simulation Mode", description: `Executing Step ${pipeline.currentStep}: ${step.title}` });
          setPipeline({ ...pipeline, currentStep: pipeline.currentStep + 1 });
          setLoading(false);
          return;
      }

      if (endpointSuffix === "PIPELINE_FILTER") {
        await axios.post(`${API_URL}/youtube-automation/pipeline/${pipeline._id}/filter`, { videos: [] }, getHeaders());
      } else if (endpointSuffix && leads.length > 0) {
        addLog(`🔄 Processing ${leads.length} leads for Step ${pipeline.currentStep}...`);
        for (let i = 0; i < leads.length; i++) {
          try {
            await axios.post(`${API_URL}/youtube-automation/lead/${leads[i]._id}/${endpointSuffix}`, payload, getHeaders());
            addLog(`✅ Processed [${i+1}/${leads.length}] @${leads[i].username}`);
          } catch (e: any) {
            addLog(`❌ Failed [${i+1}/${leads.length}] @${leads[i].username}: ${e.message}`);
          }
        }
      }

      toast({ title: `Step ${pipeline.currentStep} Success`, description: `Processed ${leads.length} leads for ${step.title}` });
      loadPipeline();
    } catch (err: any) {
      toast({ title: "Execution Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoReply = async (leadId: string) => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/youtube-automation/lead/${leadId}/reply`, {}, getHeaders());
      toast({ title: "Success", description: "Automated YouTube reply posted natively!" });
      loadPipeline();
    } catch (err: any) {
      toast({ title: "Auto-Post Failed", description: err.response?.data?.message || err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const syncApify = async () => {
    if (!pipeline) return;
    try {
      setLoading(true);
      addLog(`🌐 Connecting to Apify Deep Scraper...`);
      addLog(`🔍 Category-Specific Search: "${searchQuery.split(',')[0]}..."`);
      
      const currentQueries = searchQuery.split(', ').filter(q => q.trim() !== "");
      addLog(`🕵️ Multi-Discovery Active: Firing signals for ${currentQueries.join(' + ')}.`);
      
      const res = await axios.post(`${API_URL}/youtube-automation/pipeline/${pipeline._id}/fetch-apify`, { query: searchQuery }, getHeaders());
      
      const newLeads = res.data.data;
      addLog(`🎯 Sync Complete! Captured ${newLeads.length} multi-category leads.`);
      addLog(`🚀 Pipeline Moving: Auto-advanced to Step 3 (Pain Intelligence).`);
      
      toast({ title: "Apify Sync Complete", description: `Ingested ${newLeads.length} new potential leads with AI intelligence.` });
      loadPipeline();
    } catch (err: any) {
      addLog(`❌ Apify Sync Failed: ${err.message}`);
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
                    className={`cursor-pointer transition-all py-1.5 px-4 text-[10px] uppercase font-black tracking-widest border-red-500/30 ${isActive ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] border-red-500" : "hover:bg-red-500/10 hover:border-red-500/50 text-muted-foreground"}`}
                    onClick={togglePreset}
                  >
                    {preset.label}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase opacity-70">YouTube Search Target</label>
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-muted/50 border-red-500/10 h-12 text-sm font-bold uppercase tracking-widest placeholder:opacity-40" placeholder="LEAVE BLANK FOR AUTONOMOUS DISCOVERY (v2.0)..." />
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
                      <Card key={lead._id} className={`mb-3 border-l-4 ${lead.status === 'qualified' ? 'border-l-emerald-500' : 'border-l-slate-700'} bg-slate-900/40 backdrop-blur-md`}>
                        <CardContent className="p-4 flex gap-4">
                            <div className="relative">
                              <Avatar className="h-10 w-10 border-2 border-slate-700">
                                <AvatarImage src={lead.profile_image} />
                                <AvatarFallback className="bg-slate-800 text-slate-400">U</AvatarFallback>
                              </Avatar>
                              {lead.filter_type && (
                                <div className={`absolute -bottom-1 -right-1 px-1 rounded text-[7px] font-bold uppercase ${
                                  lead.filter_type === 'IDEAL' ? 'bg-emerald-500 text-white' : 
                                  lead.filter_type === 'RELAXED' ? 'bg-amber-500 text-black' : 'bg-slate-600 text-white'
                                }`}>
                                  {lead.filter_type}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                  <a 
                                    href={lead.channel_id ? `https://youtube.com/channel/${lead.channel_id}` : "#"} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="font-bold text-sm hover:text-red-500 flex items-center gap-1"
                                  >
                                    @{lead.username || "User"} <Globe className="h-3 w-3 opacity-50" />
                                  </a>
                                  {lead.title && <p className="text-[9px] opacity-40 truncate max-w-[150px]">{lead.title}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className={`text-[8px] uppercase ${lead.status === 'qualified' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : ''}`}>{lead.status}</Badge>
                                  <a 
                                    href={lead.comment_id ? `https://www.youtube.com/watch?v=${lead.video_id}&lc=${lead.comment_id}` : `https://youtube.com/watch?v=${lead.video_id}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-[9px] font-bold text-red-500 hover:underline flex items-center gap-1"
                                  >
                                    <Youtube className="h-2.5 w-2.5" /> View Comment
                                  </a>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-red-500/10 transition-all">
                                {lead.matched_keyword && lead.comment.toLowerCase().includes(lead.matched_keyword.toLowerCase()) ? (
                                  (() => {
                                    const parts = lead.comment.split(new RegExp(`(${lead.matched_keyword})`, 'gi'));
                                    return (
                                      <>
                                        {parts.map((part: string, i: number) => 
                                          part.toLowerCase() === lead.matched_keyword.toLowerCase() ? 
                                          <span key={i} className="bg-yellow-500/30 text-yellow-200 font-black px-1 rounded border border-yellow-500/50">{part}</span> : 
                                          part
                                        )}
                                      </>
                                    );
                                  })()
                                ) : lead.pain_snippet ? (
                                  <>
                                    {lead.comment.split(lead.pain_snippet)[0]}
                                    <span className="bg-red-500/20 text-red-400 font-bold px-1 rounded">{lead.pain_snippet}</span>
                                    {lead.comment.split(lead.pain_snippet)[1]}
                                  </>
                                ) : (
                                  `"${lead.comment}"`
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {lead.matched_keyword && (
                                  <Badge variant="outline" className="text-[9px] border-yellow-500/50 text-yellow-500 bg-yellow-500/5 uppercase font-black tracking-tighter">
                                    🎯 SIGNAL: {lead.matched_keyword}
                                  </Badge>
                                )}
                                {lead.category && (
                                  <Badge className="text-[9px] bg-red-600 hover:bg-red-600 uppercase font-black">
                                    🔥 PAIN: {lead.category}
                                  </Badge>
                                )}
                                {lead.problem_summary && (
                                  <p className="text-[10px] text-red-400 font-bold uppercase">{lead.problem_summary}</p>
                                )}
                              </div>
                              {lead.contact && (lead.contact.email || lead.contact.phone) && lead.contact.email !== 'search@google.com' && (
                                <div className="mt-3 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg flex flex-wrap gap-3">
                                  {lead.contact.email && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400"><Mail className="h-3 w-3" /> {lead.contact.email}</div>}
                                  {lead.contact.phone && lead.contact.phone !== 'N/A' && <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400"><Activity className="h-3 w-3" /> {lead.contact.phone}</div>}
                                </div>
                              )}
                              
                              {lead.outreach && (lead.outreach.finalMessage || lead.outreach.emailBody) && (
                                <div className="mt-2 bg-red-500/5 rounded-lg p-3 border border-red-500/20 group/reply relative">
                                  <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                                    <div className="flex items-center gap-1 text-[8px] font-black text-red-500 uppercase">
                                      <Send className="h-2.5 w-2.5" /> AI-Generated Reply
                                    </div>
                                    {lead.reply_posted ? (
                                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/20 text-[8px] uppercase">
                                        Posted Automatically ✅
                                      </Badge>
                                    ) : (
                                      <div className="flex gap-2">
                                        <Button 
                                          size="sm" 
                                          variant="outline" 
                                          className="h-6 text-[9px] px-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border-red-500/30 font-bold uppercase tracking-widest transition-all"
                                          onClick={() => {
                                            navigator.clipboard.writeText(lead.outreach.finalMessage || lead.outreach.emailBody || "");
                                            toast({ title: "Manual Fallback: Copied!", description: "Opening YouTube tab..." });
                                            window.open(lead.comment_id ? `https://www.youtube.com/watch?v=${lead.video_id}&lc=${lead.comment_id}` : `https://youtube.com/watch?v=${lead.video_id}`, "_blank");
                                          }}
                                        >
                                          <Copy className="h-3 w-3 mr-1" /> Manual
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          className="h-6 text-[9px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                                          disabled={loading}
                                          onClick={() => handleAutoReply(lead._id)}
                                        >
                                          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                                          Auto-Post Reply
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-red-200 font-medium leading-relaxed">
                                    {lead.outreach.finalMessage || lead.outreach.emailBody}
                                  </p>
                                  {lead.outreach.cta && (
                                    <p className="text-[9px] text-red-400/70 mt-1 italic">CTA: {lead.outreach.cta}</p>
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
                      <div className="p-12 text-center opacity-30 italic">No leads discovered yet. Run Step 1.</div>
                    )}
                 </div>
              </div>
              <div className="space-y-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <Activity className="h-6 w-6 text-red-500" /> Extraction Logs
                 </h2>
                 <Card className="bg-black/90 font-mono text-[11px] p-6 h-[600px] overflow-auto border-red-500/20 shadow-inner custom-scrollbar relative">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Youtube className="h-10 w-10 text-red-600" /></div>
                    <div className="space-y-1.5">
                      {logs.map((log, i) => (
                        <p key={i} className={`${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : log.includes('🚀') ? 'text-blue-400 font-bold' : 'text-emerald-400/80'}`}>
                          {log}
                        </p>
                      ))}
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
