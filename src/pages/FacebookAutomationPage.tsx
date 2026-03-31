import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Facebook, 
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
  Activity,
  Loader2,
  Filter,
  UserCheck,
  Heart,
  Database,
  Send,
  Copy
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const fbStepData = [
  { step: 1, title: "POST RELEVANCE FILTER", icon: Filter, color: "text-blue-500", bg: "bg-blue-500/10", prompt: "Filter Facebook posts relevant to business struggles." },
  { step: 2, title: "ENGAGEMENT VALIDATION", icon: Heart, color: "text-pink-500", bg: "bg-pink-500/10", prompt: "Analyze post engagement (Likes/Comments ratio)." },
  { step: 3, title: "COMMENT PAIN DETECTION", icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10", prompt: "Identify pain points in post comments using AI." },
  { step: 4, title: "LEAD QUALIFICATION", icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10", prompt: "Qualified leads with high-intent scores (7+)." },
  { step: 5, title: "IDENTITY ANALYSIS", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10", prompt: "Detect Decision Makers and business profiles." },
  { step: 6, title: "CONTACT ENRICHMENT", icon: Globe, color: "text-indigo-500", bg: "bg-indigo-500/10", prompt: "Extract email, website, and phone from profiles." },
  { step: 7, title: "LEAD STRUCTURING", icon: Activity, color: "text-cyan-500", bg: "bg-cyan-500/10", prompt: "Structure lead data for CRM ingestion." },
  { step: 8, title: "AI OUTREACH GENERATION", icon: Mail, color: "text-amber-500", bg: "bg-amber-500/10", prompt: "Generate hyper-personalized cold outreach." },
  { step: 9, title: "MESSAGE PERSONALIZATION", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10", prompt: "Refine messaging using psychology of authority." },
  { step: 10, title: "BOOKING MESSAGE", icon: Calendar, color: "text-violet-500", bg: "bg-violet-500/10", prompt: "Automate appointment booking sequences." },
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

export default function FacebookAutomationPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Facebook Engine Standby...", "[READY] Meta Discovery Framework v1.0"]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const getHeaders = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/facebook-automation/latest`, getHeaders());
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
      addLog(`🚀 Launching Facebook Discovery for: "${searchQuery}"`);
      const res = await axios.post(`${API_URL}/facebook-automation/initialize`, { query: searchQuery }, getHeaders());
      setPipeline(res.data.data);
      setLeads([]);
      addLog(`✅ Facebook Pipeline initialized.`);
    } catch (err: any) { 
      addLog(`❌ Launch Failed: ${err.message}`);
      toast({ title: "Launch Failed", variant: "destructive" }); 
    }
    finally { setLoading(false); }
  };

  const handleManualAdd = async (manualText: string) => {
    if (!pipeline) return;
    try {
      setLoading(true);
      addLog(`📥 Manually injecting lead: "${manualText.substring(0, 30)}..."`);
      const res = await axios.post(`${API_URL}/facebook-automation/pipeline/${pipeline._id}/fetch-apify`, { 
        query: manualText,
        isManual: true 
      }, getHeaders());
      addLog(`✅ Lead injected successfully!`);
      loadPipeline();
      toast({ title: "Lead Injected", description: "AI is now analyzing your manual lead." });
    } catch (err: any) {
      addLog(`❌ Injection Failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  const syncApify = async () => {
    if (!pipeline) return;
    try {
      setLoading(true);
      addLog(`🌐 Connecting to Apify Facebook Scraper...`);
      const res = await axios.post(`${API_URL}/facebook-automation/pipeline/${pipeline._id}/fetch-apify`, { query: searchQuery }, getHeaders());
      const newLeads = res.data.data;
      addLog(`🎯 Captured ${newLeads.length} Facebook leads.`);
      loadPipeline();
      toast({ title: "Apify Sync Complete", description: `Captured ${newLeads.length} leads.` });
    } catch (err: any) {
      addLog(`❌ Sync Failed: ${err.message}`);
      toast({ title: "Sync Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const runStep = async () => {
    if (!pipeline) return;
    const currentStepIndex = pipeline.currentStep - 1;
    const step = fbStepData[currentStepIndex];

    try {
      setLoading(true);
      let endpointSuffix = "";
      let payload = {};

      switch (pipeline.currentStep) {
        case 1:
          await axios.post(`${API_URL}/facebook-automation/pipeline/${pipeline._id}/filter`, {}, getHeaders());
          break;
        default:
          const map: any = {
              2: 'validate-engagement', 3: 'pain-detection', 4: 'qualify', 5: 'identity', 
              6: 'enrich', 7: 'structure', 8: 'outreach', 9: 'personalize', 10: 'booking', 11: 'reply'
          };
          endpointSuffix = map[pipeline.currentStep];
      }

      if (endpointSuffix && leads.length > 0) {
        addLog(`🔄 Processing ${leads.length} leads for Step ${pipeline.currentStep}...`);
        for (let i = 0; i < leads.length; i++) {
          try {
            await axios.post(`${API_URL}/facebook-automation/lead/${leads[i]._id}/${endpointSuffix}`, payload, getHeaders());
            addLog(`✅ Processed [${i+1}/${leads.length}] @${leads[i].username}`);
          } catch (e: any) {
            addLog(`❌ Failed [${i+1}/${leads.length}] @${leads[i].username}: ${e.message}`);
          }
        }
      }

      toast({ title: `Step ${pipeline.currentStep} Success` });
      loadPipeline();
    } catch (err: any) {
      toast({ title: "Execution Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = fbStepData[pipeline?.currentStep - 1] || fbStepData[0];

  return (
    <div className="container mx-auto p-6 space-y-12 animate-fade-in pb-20">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent flex items-center justify-center gap-4">
          <Facebook className="h-12 w-12 text-blue-600" /> FACEBOOK LEAD AUTOMATION
        </h1>
        <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest">n8n Style Autonomous Lead Engine</p>
      </div>

      <Card className="max-w-4xl mx-auto border-blue-500/20 shadow-2xl overflow-hidden bg-card">
        <CardHeader className="bg-blue-500/5 border-b border-blue-500/10">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">⚙️ MASTER CONTROL PROMPT</CardTitle>
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
                    className={`cursor-pointer transition-all py-1.5 px-4 text-[10px] uppercase font-black tracking-widest border-blue-500/30 ${isActive ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border-blue-500" : "hover:bg-blue-500/10 hover:border-blue-500/50 text-muted-foreground"}`}
                    onClick={togglePreset}
                  >
                    {preset.label}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase opacity-70">Facebook Search Target</label>
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-muted/50 border-blue-500/10 h-12" placeholder="Search for pain points..." />
          </div>
          <div className="flex gap-4">
            <Button onClick={handleLaunch} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 font-bold uppercase" disabled={loading || pipeline}>
              {loading ? <Loader2 className="mr-2 animate-spin" /> : <Zap className="mr-2" />}
              {pipeline ? "PIPELINE ACTIVE" : "Trigger n8n Workflow"}
            </Button>
            {pipeline && (
              <Button onClick={syncApify} variant="outline" className="h-14 px-8 border-blue-500 text-blue-500 font-bold uppercase" disabled={loading}>
                <Globe className="mr-2" /> Sync Apify
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {pipeline && (
        <div className="space-y-12">
           <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {fbStepData.map((step) => (
                <Card key={step.step} className={`p-4 border-blue-500/10 relative transition-all ${pipeline.currentStep === step.step ? "ring-2 ring-blue-500 bg-blue-500/5 scale-105" : pipeline.currentStep > step.step ? "bg-emerald-500/5 opacity-80" : "opacity-40"}`}>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={`p-2 rounded-lg ${step.bg} ${step.color}`}><step.icon className="h-4 w-4" /></div>
                    <p className="text-[9px] font-bold uppercase">{step.title}</p>
                    {pipeline.currentStep > step.step && <CheckCircle2 className="h-3 w-3 text-emerald-500 absolute top-2 right-2" />}
                  </div>
                </Card>
              ))}
           </div>

           <Card className="border-blue-500/30 bg-black/40 shadow-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-4 max-w-2xl">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${currentStepData.bg} ${currentStepData.color}`}><currentStepData.icon className="h-6 w-6" /></div>
                        <div>
                            <p className="text-xs font-black text-blue-500 uppercase tracking-widest">Active Step {pipeline.currentStep}</p>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">{currentStepData.title}</h3>
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg italic text-sm text-muted-foreground italic">"{currentStepData.prompt}"</div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Input 
                      placeholder="Paste facebook comment here to manually inject..."
                      className="h-14 bg-black/40 border-blue-500/20 text-lg rounded-xl focus:ring-2 focus:ring-blue-500/20 text-white placeholder:text-white/20"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button 
                        onClick={() => handleManualAdd(searchQuery)} 
                        disabled={loading || !searchQuery}
                        className="h-14 px-6 bg-slate-900 border border-blue-500/30 text-blue-400 hover:bg-slate-800 font-bold uppercase tracking-widest rounded-xl whitespace-nowrap"
                    >
                      <Zap className="mr-2 h-4 w-4" /> Inject Lead
                    </Button>
                  </div>
                  <Button onClick={runStep} disabled={loading} size="lg" className="h-20 px-12 text-xl font-black uppercase bg-blue-600 hover:bg-blue-700 shadow-2xl w-full">
                      {loading ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2 fill-current" />}
                      Execute Step {pipeline.currentStep}
                  </Button>
                </div>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                   <Users className="h-6 w-6 text-blue-500" /> Discovered Leads ({
                     leads.filter(l => {
                       const activePresets = searchQuery.split(', ').filter(q => q.trim() !== "");
                       if (activePresets.length === 0) return true;
                       return activePresets.some(p => l.category?.toLowerCase().includes(p.toLowerCase()) || l.matched_keyword?.toLowerCase().includes(p.toLowerCase()));
                     }).length
                   })
                 </h2>
                 <div className="space-y-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
                    {leads.length > 0 ? leads.filter(l => {
                       const activePresets = searchQuery.split(', ').filter(q => q.trim() !== "");
                       if (activePresets.length === 0) return true;
                       return activePresets.some(p => l.category?.toLowerCase().includes(p.toLowerCase()) || l.matched_keyword?.toLowerCase().includes(p.toLowerCase()));
                    }).map((lead) => (
                      <Card key={lead._id} className={`mb-3 border-l-4 ${lead.status === 'qualified' ? 'border-l-emerald-500' : 'border-l-slate-700'} bg-slate-900/40 backdrop-blur-md`}>
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
                                    href={lead.post_url || "#"} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="font-bold text-sm hover:text-blue-500 flex items-center gap-1"
                                  >
                                    @{lead.username || "User"} <Globe className="h-3 w-3 opacity-50" />
                                  </a>
                                  {lead.title && <p className="text-[9px] opacity-40 truncate max-w-[150px]">{lead.title}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className={`text-[8px] uppercase ${lead.status === 'qualified' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : ''}`}>{lead.status}</Badge>
                                  {lead.post_url && (
                                    <a 
                                      href={lead.post_url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[9px] font-bold text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                      <Facebook className="h-2.5 w-2.5" /> View Comment
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-blue-500/10 transition-all">
                                {lead.matched_keyword && lead.comment && lead.comment.toLowerCase().includes(lead.matched_keyword.toLowerCase()) ? (
                                  (() => {
                                    const parts = lead.comment.split(new RegExp(`(${lead.matched_keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
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
                                ) : lead.pain_snippet && lead.comment ? (
                                  <>
                                    {lead.comment.split(lead.pain_snippet)[0]}
                                    <span className="bg-blue-500/20 text-blue-400 font-bold px-1 rounded">{lead.pain_snippet}</span>
                                    {lead.comment.split(lead.pain_snippet)[1]}
                                  </>
                                ) : (
                                  `"${lead.comment || 'N/A'}"`
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {lead.matched_keyword && (
                                  <Badge variant="outline" className="text-[9px] border-yellow-500/50 text-yellow-500 bg-yellow-500/5 uppercase font-black tracking-tighter">
                                    🎯 SIGNAL: {lead.matched_keyword}
                                  </Badge>
                                )}
                                {lead.category && (
                                  <Badge className="text-[9px] bg-blue-600 hover:bg-blue-600 uppercase font-black">
                                    🔥 PAIN: {lead.category}
                                  </Badge>
                                )}
                                {lead.problem_summary && (
                                  <p className="text-[10px] text-blue-400 font-bold uppercase">{lead.problem_summary}</p>
                                )}
                              </div>
                              {lead.contact && (
                                <div className="flex flex-col gap-1.5 text-[10px] font-bold text-slate-400 border-t border-slate-800/50 pt-3 mt-3">
                                  {lead.contact.email && lead.contact.email !== 'N/A' && <span className="flex items-center gap-1">📧 {lead.contact.email}</span>}
                                  {lead.contact.phone && lead.contact.phone !== 'N/A' && <span className="flex items-center gap-1">📞 {lead.contact.phone}</span>}
                                  {lead.contact.company && lead.contact.company !== 'N/A' && <span className="flex items-center gap-1 text-slate-300"><Database className="h-3 w-3" /> {lead.contact.company}</span>}
                                  {lead.contact.website && lead.contact.website !== 'N/A' && (
                                    <a href={lead.contact.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                                      <Globe className="h-3 w-3" /> {lead.contact.website}
                                    </a>
                                  )}
                                  {lead.post_url && (
                                    <a href={lead.post_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                                      <Facebook className="h-3 w-3" /> Facebook Post Link
                                    </a>
                                  )}
                                </div>
                              )}

                              {lead.outreach && (lead.outreach.finalMessage || lead.outreach.emailBody) && (
                                <div className="mt-2 bg-blue-500/5 rounded-lg p-3 border border-blue-500/20 group/reply relative">
                                  <div className="flex items-center justify-between gap-1 mb-1.5 flex-wrap">
                                    <div className="flex items-center gap-1 text-[8px] font-black text-blue-400 uppercase">
                                      <Send className="h-2.5 w-2.5" /> AI-Generated Facebook DM
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="h-6 text-[9px] px-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border-blue-500/30 font-bold uppercase tracking-widest transition-all"
                                      onClick={() => {
                                        navigator.clipboard.writeText(lead.outreach.finalMessage || lead.outreach.emailBody || "");
                                        toast({ title: "Reply copied to clipboard!", description: "Paste it on Facebook." });
                                        window.open(lead.post_url ? lead.post_url : "#", "_blank");
                                      }}
                                    >
                                      <Copy className="h-3 w-3 mr-1" /> Copy & Reply
                                    </Button>
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
                      <div className="p-12 text-center opacity-30 italic">No leads discovered yet. Click "Sync Apify" to start.</div>
                    )}
                 </div>
              </div>
              <div className="space-y-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2"><Activity className="h-6 w-6 text-blue-500" /> Extraction Logs</h2>
                 <Card className="bg-black/90 font-mono text-[11px] p-6 h-[600px] overflow-auto border-blue-500/20 shadow-inner custom-scrollbar relative">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Facebook className="h-10 w-10 text-blue-600" /></div>
                    <div className="space-y-1.5">
                      {logs.map((log, i) => (
                        <p key={i} className={`${log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : log.includes('🚀') ? 'text-blue-400 font-bold' : 'text-blue-400/80'}`}>
                          {log}
                        </p>
                      ))}
                      <div className="animate-pulse inline-block w-2 h-4 bg-blue-500 ml-1 mt-2" />
                    </div>
                 </Card>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
