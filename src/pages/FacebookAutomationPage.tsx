import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Facebook, 
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
  AlertTriangle,
  Settings2,
  Key,
  Copy as CopyIcon
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
  { id: "website", label: "Website Problems" },
  { id: "leads", label: "Lead Generation" },
  { id: "marketing", label: "Marketing Problems" },
  { id: "automation", label: "Automation Problems" },
  { id: "ecommerce", label: "E-commerce Problems" }
];

export default function FacebookAutomationPage() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [manualLeadText, setManualLeadText] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    facebookPageId: "",
    metaAccessToken: "",
    facebookPageAccessToken: "",
    facebookCookie: ""
  });
  const [logs, setLogs] = useState<string[]>(["[SYSTEM] Facebook Engine Standby...", "[READY] Meta Discovery Framework v1.0"]);
  const logEndRef = useRef<HTMLDivElement>(null);

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
        setSettingsForm({
          facebookPageId: res.data.data.pipeline.facebookPageId || "",
          metaAccessToken: res.data.data.pipeline.metaAccessToken || "",
          facebookPageAccessToken: res.data.data.pipeline.facebookPageAccessToken || "",
          facebookCookie: res.data.data.pipeline.facebookCookie || ""
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setIsRefreshing(false); }
  };

  useEffect(() => { 
    loadPipeline(); 
    const interval = setInterval(() => {
       if (leads.some(l => !l.outreach?.finalMessage && !l.outreach?.emailBody)) {
          loadPipeline();
       }
    }, 5000);
    return () => clearInterval(interval);
  }, [leads.length]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const handleLaunch = async () => {
    try {
      setLoading(true);
      addLog(`🚀 Launching Facebook Discovery for: "${discoveryQuery}"`);
      const res = await axios.post(`${API_URL}/facebook-automation/initialize`, { query: discoveryQuery }, getHeaders());
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
      await axios.post(`${API_URL}/facebook-automation/pipeline/${pipeline._id}/fetch-apify`, { query: manualText, isManual: true }, getHeaders());
      addLog(`✅ Lead injected successfully!`);
      setManualLeadText("");
      loadPipeline();
      toast({ title: "Lead Injected", description: "AI is now analyzing your manual lead." });
    } catch (err: any) { addLog(`❌ Injection Failed: ${err.message}`); } 
    finally { setLoading(false); }
  };

  const syncApify = async () => {
    if (!pipeline) return;
    try {
      setLoading(true);
      addLog(`🌐 Connecting to Apify Facebook Scraper...`);
      const res = await axios.post(`${API_URL}/facebook-automation/pipeline/${pipeline._id}/fetch-apify`, { query: discoveryQuery }, getHeaders());
      addLog(`🎯 Captured ${res.data.data.length} Facebook leads.`);
      loadPipeline();
      toast({ title: "Apify Sync Complete" });
    } catch (err: any) {
      addLog(`❌ Sync Failed: ${err.message}`);
      toast({ title: "Sync Failed", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const runStep = async () => {
    if (!pipeline) return;
    if (manualLeadText) {
      await handleManualAdd(manualLeadText);
      return;
    }
    try {
      setLoading(true);
      const map: any = {
          2: 'validate-engagement', 3: 'pain-detection', 4: 'qualify', 5: 'identity', 
          6: 'enrich', 7: 'structure', 8: 'outreach', 9: 'personalize', 10: 'booking', 11: 'reply'
      };
      const endpointSuffix = map[pipeline.currentStep];
      // Updated validation: Ignore blockage if session cookie is active OR if they are simulation leads
      if (endpointSuffix === 'reply' && !pipeline.facebookCookie && leads.some(l => !l.comment_id?.startsWith('sim-') && l.post_url?.includes('groups') && l.groupJoinStatus !== 'joined')) {
        addLog(`⚠️ Cannot Execute: Some REAL leads still need group membership. Please join groups first (or use a Session Cookie).`);
        toast({ title: "Wait!", description: "You must join groups for real leads before AI can post, or connect a Session Cookie in settings.", variant: "destructive" });
        return;
      }
      if (endpointSuffix && leads.length > 0) {
        addLog(`🔄 Processing ${leads.length} leads for Step ${pipeline.currentStep}...`);
        for (let i = 0; i < leads.length; i++) {
          try {
            await axios.post(`${API_URL}/facebook-automation/lead/${leads[i]._id}/${endpointSuffix}`, {}, getHeaders());
            addLog(`✅ Processed [${i+1}/${leads.length}] @${leads[i].username}`);
          } catch (e: any) { 
            const msg = e.response?.data?.message || e.message;
            addLog(`❌ Failed @${leads[i].username}: ${msg}`); 
          }
        }
      }
      toast({ title: `Step ${pipeline.currentStep} Success` });
      loadPipeline();
    } catch (err: any) { 
        const msg = err.response?.data?.message || err.message;
        toast({ title: "Execution Failed", description: msg, variant: "destructive" }); 
    } 
    finally { setLoading(false); }
  };

  const handleUpdateSettings = async () => {
    if (!pipeline) return;
    try {
      setLoading(true);
      await axios.post(`${API_URL}/facebook-automation/pipeline/${pipeline._id}/update-tokens`, settingsForm, getHeaders());
      toast({ title: "Settings Updated", description: "Meta Cloud tokens saved successfully." });
      setShowSettings(false);
      loadPipeline();
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.response?.data?.message || err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleAutoJoin = async (leadId: string, url: string) => {
    try {
      addLog(`🤖 Launching REAL browser to join group: ${url}`);
      setLeads(prev => prev.map(l => l._id === leadId ? { ...l, groupJoinStatus: 'pending' } : l));
      toast({ title: "🤖 Browser Launching...", description: "Puppeteer is navigating to Facebook and clicking Join Group..." });
      
      const res = await axios.post(`${API_URL}/facebook-automation/lead/${leadId}/auto-join`, {}, getHeaders());
      if (res.data.success) {
        const status = res.data.data?.groupJoinStatus || 'pending';
        setLeads(prev => prev.map(l => l._id === leadId ? { ...l, groupJoinStatus: status } : l));
        addLog(`✅ ${res.data.message || 'Join request sent successfully!'}`);
        toast({ title: "✅ Group Join Success!", description: res.data.message || "Check Facebook to verify." });
        loadPipeline();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      addLog(`❌ Auto-Join Failed: ${msg}`);
      setLeads(prev => prev.map(l => l._id === leadId ? { ...l, groupJoinStatus: 'required' } : l));
      toast({ title: "Auto-Join Failed", description: msg, variant: "destructive" });
    }
  };

  const handleJoinAction = async (leadId: string, url: string) => {
    window.open(url, '_blank');
    addLog(`🌐 Opening Facebook Group: ${url}`);
    setLeads(prev => prev.map(l => l._id === leadId ? { ...l, groupJoinStatus: 'pending' } : l));
    try {
      await axios.post(`${API_URL}/facebook-automation/lead/${leadId}/update-join-status`, { status: 'pending' }, getHeaders());
      addLog(`🕒 Lead status updated to PENDING.`);
      loadPipeline();
    } catch (err) { 
      console.error(err);
      setLeads(prev => prev.map(l => l._id === leadId ? { ...l, groupJoinStatus: 'required' } : l));
    }
  };

  const handleJoinSuccess = async (leadId: string) => {
    setLeads(prev => prev.map(l => l._id === leadId ? { ...l, groupJoinStatus: 'joined' } : l));
    try {
      await axios.post(`${API_URL}/facebook-automation/lead/${leadId}/update-join-status`, { status: 'joined' }, getHeaders());
      toast({ title: "✅ Group Joined!", description: "You can now post the AI comment to this group." });
      addLog(`✅ Group join confirmed for lead ${leadId}. Commenting enabled.`);
      loadPipeline();
    } catch (err) { 
      console.error(err); 
      setLeads(prev => prev.map(l => l._id === leadId ? { ...l, groupJoinStatus: 'required' } : l));
      toast({ title: "Update Failed", description: "Could not update join status.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-12 animate-fade-in pb-20">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent flex items-center justify-center gap-4">
          <Facebook className="h-12 w-12 text-blue-600" /> FACEBOOK LEAD AUTOMATION
        </h1>
        <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest">n8n Style Autonomous Lead Engine</p>
      </div>

      <Card className="max-w-4xl mx-auto border-blue-500/20 shadow-2xl overflow-hidden bg-card">
        <CardHeader className="bg-blue-500/5 border-b border-blue-500/10 flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">⚙️ MASTER CONTROL PROMPT</CardTitle>
            <div className="flex items-center gap-4">
            {pipeline?.facebookCookie && <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-500/30 text-[10px]"><Zap className="h-3 w-3 mr-1" /> SESSION ACTIVE (li_at style)</Badge>}
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)} className="text-blue-400 hover:text-blue-300 gap-2">
                <Settings2 className="h-4 w-4" /> META API SETTINGS
            </Button>
            <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30">PAGE ID: {pipeline?.facebookPageId || '61584166509385'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-wrap gap-2">
            {keywordPresets.map((p) => (
              <Badge key={p.id} variant="outline" className="cursor-pointer py-1.5 px-4 text-[10px] uppercase font-black tracking-widest border-blue-500/30 hover:bg-blue-500/10" onClick={() => setDiscoveryQuery(p.label)}>{p.label}</Badge>
            ))}
          </div>
          <Input value={discoveryQuery} onChange={(e) => setDiscoveryQuery(e.target.value)} className="bg-muted/50 border-blue-500/10 h-12" placeholder="Search for pain points..." />
          <div className="flex gap-4">
            <Button onClick={handleLaunch} className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 font-bold uppercase" disabled={loading || pipeline}>
              {loading ? <Loader2 className="mr-2 animate-spin" /> : <Zap className="mr-2" />}
              {pipeline ? "PIPELINE ACTIVE" : "Trigger n8n Workflow"}
            </Button>
            {pipeline && (
              <div className="flex gap-2">
                <Button onClick={syncApify} variant="outline" className="h-14 px-8 border-blue-500 text-blue-500 font-bold uppercase" disabled={loading}>Sync Apify</Button>
                <Button onClick={() => handleManualAdd(discoveryQuery || "https://facebook.com/groups")} variant="outline" className="h-14 px-8 border-emerald-500 text-emerald-500 font-bold uppercase">🚀 Live Test</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {pipeline && (
        <div className="space-y-12">
           <Card className="border-blue-500/30 bg-black/40 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2 max-w-lg text-center md:text-left">
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                        <div className={`p-3 rounded-xl ${fbStepData[(pipeline?.currentStep || 1)-1]?.bg} ${fbStepData[(pipeline?.currentStep || 1)-1]?.color}`}><Brain className="h-6 w-6" /></div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">{fbStepData[(pipeline?.currentStep || 1)-1]?.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground italic">"{fbStepData[(pipeline?.currentStep || 1)-1]?.prompt}"</p>
                </div>
                <div className="flex flex-col gap-4 w-full md:w-auto">
                    <Input placeholder="Paste Facebook URL..." className="h-12 bg-black/40 border-blue-500/20" value={manualLeadText} onChange={(e) => setManualLeadText(e.target.value)} />
                    <Button onClick={runStep} disabled={loading} size="lg" className="h-16 px-12 text-xl font-black uppercase bg-blue-600 hover:bg-blue-700 shadow-2xl">
                        {loading ? <Loader2 className="mr-2 animate-spin" /> : <Play className="mr-2" />} {manualLeadText ? "INJECT URL" : `EXECUTE STEP ${pipeline.currentStep}`}
                    </Button>
                </div>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2"><Users className="h-6 w-6 text-blue-500" /> Discovered Leads ({leads.length})</h2>
                    <Button variant="ghost" size="sm" onClick={() => { setIsRefreshing(true); loadPipeline(); }} disabled={isRefreshing} className="text-blue-400 hover:text-blue-300">
                      <Activity className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                    </Button>
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                    {leads.map((lead) => (
                      <Card key={lead._id} className="bg-slate-900 border border-white/5 overflow-hidden hover:border-primary/30 transition-all">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                             <div className="p-6 border-r border-white/5 flex flex-col items-center justify-center bg-white/[0.02] min-w-[140px]">
                               <Avatar className="h-16 w-16 mb-2 border-2 border-primary/20"><AvatarImage src={lead.profile_image} /><AvatarFallback>FB</AvatarFallback></Avatar>
                               <h4 className="font-bold text-white text-[12px]">@{lead.username}</h4>
                               <Badge variant="outline" className="text-[8px] uppercase tracking-tighter mt-1">{lead.category || "Lead"}</Badge>
                             </div>
                             <div className="flex-1 p-6 space-y-4">
                               <div className="flex justify-between">
                                  <div className="space-y-2">
                                     <div className="flex gap-2">
                                        <Badge className="text-[9px] font-black uppercase bg-muted/50">{lead.status}</Badge>
                                        {lead.reply_posted && (
                                          <Badge className={`${lead.comment_id?.startsWith('sim-') ? 'bg-orange-600/20 text-orange-400 border-orange-500/20' : 'bg-blue-600 text-white'} text-[9px] font-black`}>
                                            {lead.comment_id?.startsWith('sim-') ? '🧪 SIMULATION POST' : 'REPLY POSTED ✅'}
                                          </Badge>
                                        )}
                                     </div>
                                     <p className="text-[11px] text-muted-foreground italic">"{lead.comment}"</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                      {lead.groupJoinStatus === 'required' && <Badge variant="destructive" className="text-[8px] font-black animate-pulse uppercase"><AlertTriangle className="h-2 w-2 mr-1" /> Manual Join Needed</Badge>}
                                      {lead.groupJoinStatus === 'pending' && <Badge className="text-[8px] font-black bg-orange-500/20 text-orange-400 uppercase">Approval Pending</Badge>}
                                      {lead.groupJoinStatus === 'joined' && <Badge className="text-[8px] font-black bg-green-500/20 text-green-400 uppercase">Group Joined ✅</Badge>}
                                      {pipeline?.facebookCookie && <Badge variant="outline" className="text-[8px] font-black text-blue-400 border-blue-500/20 uppercase tracking-tighter">Session Linked</Badge>}
                                      <Button variant="link" size="sm" className="h-4 p-0 text-[10px] font-bold text-blue-400" onClick={() => window.open(lead.post_url, '_blank')}>VIEW ON FACEBOOK ↗</Button>
                                   </div>
                                </div>

                               <div className="pt-4 border-t border-white/5 space-y-3">
                                 {(lead.groupJoinStatus === 'required' || lead.groupJoinStatus === 'pending') && !lead.reply_posted ? (
                                    <div className="bg-slate-800/50 border border-blue-500/20 rounded-xl p-4 space-y-3">
                                        <p className="text-[10px] font-black text-blue-400 uppercase text-center tracking-widest">Step 1: Join This Group First</p>
                                        {lead.groupJoinStatus === 'pending' ? (
                                          <div className="bg-slate-800/80 border border-orange-500/20 rounded-xl p-4 text-center space-y-4 shadow-inner">
                                            <div className="flex flex-col items-center gap-1">
                                              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-1">
                                                <Users className="h-5 w-5 text-orange-500 animate-pulse" />
                                              </div>
                                              <p className="text-orange-400 font-black text-sm uppercase tracking-tight">
                                                {pipeline?.facebookCookie ? "AI JOIN REQUEST SENT" : "Your membership is pending"}
                                              </p>
                                              <p className="text-muted-foreground text-[10px] px-4">
                                                {pipeline?.facebookCookie 
                                                  ? "The AI used your session cookie to send a join request automatically. Waiting for admin approval." 
                                                  : "You'll be notified if your request to join has been approved by the Group Admin."}
                                              </p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                              <Button 
                                                variant="outline"
                                                onClick={async () => {
                                                  try {
                                                    await axios.post(`${API_URL}/facebook-automation/lead/${lead._id}/update-join-status`, { status: 'required' }, getHeaders());
                                                    loadPipeline();
                                                    toast({ title: "Request Cancelled", description: "Status reset to Required." });
                                                  } catch (err) { console.error(err); }
                                                }}
                                                className="border-white/10 text-white hover:bg-white/5 text-[11px] font-bold h-10 tracking-tight"
                                              >
                                                Cancel Request
                                              </Button>
                                              <Button 
                                                onClick={() => handleJoinSuccess(lead._id)}
                                                className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold h-10 shadow-lg"
                                              >
                                                <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Joined
                                              </Button>
                                            </div>
                                            <Button 
                                                variant="link" 
                                                onClick={() => window.open(lead.post_url, '_blank')}
                                                className="text-[10px] text-blue-400 font-bold uppercase tracking-widest hover:text-blue-300"
                                            >
                                              Re-verify on Facebook ↗
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2">
                                            {pipeline?.facebookCookie ? (
                                              <Button 
                                                onClick={() => handleAutoJoin(lead._id, lead.post_url)} 
                                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-xs font-black shadow-lg animate-pulse"
                                              >
                                                <Sparkles className="mr-2 h-4 w-4" /> ✨ AUTO-SEND JOIN REQUEST
                                              </Button>
                                            ) : (
                                              <Button onClick={() => handleJoinAction(lead._id, lead.post_url)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs font-bold">
                                                <Users className="mr-2 h-4 w-4" /> Request Join ↗
                                              </Button>
                                            )}
                                            <Button variant="outline" onClick={() => handleJoinSuccess(lead._id)} className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10 text-xs font-bold">
                                              <CheckCircle2 className="mr-2 h-4 w-4" /> Confirm Joined
                                            </Button>
                                          </div>
                                        )}
                                    </div>
                                 ) : (
                                   (lead.outreach?.finalMessage || lead.outreach?.emailBody) ? (
                                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                                         <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest"><Brain className="h-4 w-4" /> AI Suggested Response</div>
                                         <p className="text-[12px] font-medium text-slate-200">"{lead.outreach.finalMessage || lead.outreach.emailBody}"</p>
                                         <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <Button 
                                                 className={`flex-1 font-black text-[12px] py-6 shadow-lg transition-all ${lead.reply_posted ? 'bg-green-600/50 hover:bg-green-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 shadow-lg'}`} 
                                                 disabled={lead.reply_posted}
                                                 onClick={() => {
                                                    axios.post(`${API_URL}/facebook-automation/lead/${lead._id}/reply`, {}, getHeaders())
                                                      .then(() => {
                                                         toast({ title: "Reply Sent!", description: "Your AI message was posted." });
                                                         loadPipeline();
                                                      })
                                                       .catch(e => {
                                                          const errorMsg = e.response?.data?.message || "Internal Token Error";
                                                          toast({ title: "Facebook API Error", description: errorMsg, variant: "destructive" });
                                                       });
                                                 }}
                                                >
                                                  {lead.reply_posted ? '✅ Reply Posted Successfully' : '🚀 Auto-Post to Facebook'}
                                                </Button>
                                                <Button variant="outline" className="h-14 w-14 p-0 border-white/10" onClick={() => navigator.clipboard.writeText(lead.outreach.finalMessage || lead.outreach.emailBody || "")}><CopyIcon className="h-5 w-5" /></Button>
                                            </div>
                                         </div>
                                      </div>
                                   ) : (
                                      <div className="bg-muted/5 border border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 text-blue-400">
                                        <Loader2 className="h-4 w-4 animate-spin" /><span className="text-[9px] font-bold uppercase tracking-widest">Generating AI Outreach...</span>
                                      </div>
                                   )
                                 )}
                               </div>
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                 </div>
              </div>
              <div className="space-y-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2"><Activity className="h-6 w-6 text-blue-500" /> Extraction Logs</h2>
                 <Card className="bg-black/90 font-mono text-[11px] p-6 h-[500px] overflow-auto border-white/10 custom-scrollbar">
                    <div className="space-y-1.5 text-blue-400/80">
                      {logs.map((L, i) => <p key={i}>{L}</p>)}
                      <div ref={logEndRef} />
                      <div className="animate-pulse inline-block w-2 h-4 bg-blue-500" />
                    </div>
                 </Card>
              </div>
           </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-blue-500/30 bg-slate-900 shadow-2xl">
                <CardHeader className="border-b border-white/5">
                    <CardTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                        <Key className="h-5 w-5 text-blue-500" /> Meta API Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Facebook Page ID</label>
                        <Input value={settingsForm.facebookPageId} onChange={e => setSettingsForm({...settingsForm, facebookPageId: e.target.value})} className="bg-black/50 border-white/10" placeholder="e.g. 6158416650..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase flex justify-between">
                            Meta User Access Token <span className="text-blue-400 font-normal normal-case italic">(For Group Posting)</span>
                        </label>
                        <Input type="password" value={settingsForm.metaAccessToken} onChange={e => setSettingsForm({...settingsForm, metaAccessToken: e.target.value})} className="bg-black/50 border-white/10" placeholder="EAANBG..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase flex justify-between">
                            Page Access Token <span className="text-blue-400 font-normal normal-case italic">(For Page Posting)</span>
                        </label>
                        <Input type="password" value={settingsForm.facebookPageAccessToken} onChange={e => setSettingsForm({...settingsForm, facebookPageAccessToken: e.target.value})} className="bg-black/50 border-white/10" placeholder="EAANBG..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase flex justify-between">
                            Facebook Session Cookie <span className="text-emerald-400 font-normal normal-case italic">(For Auto-Join Groups)</span>
                        </label>
                        <Input type="password" value={settingsForm.facebookCookie} onChange={e => setSettingsForm({...settingsForm, facebookCookie: e.target.value})} className="bg-black/50 border-white/10" placeholder="c_user=123456789; xs=abc123..." />
                        <p className="text-[9px] text-yellow-400/70 italic">
                          ⚠️ Format: c_user=YOUR_FACEBOOK_ID; xs=YOUR_XS_VALUE — Get both from Chrome DevTools → Application → Cookies → facebook.com
                        </p>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button onClick={() => setShowSettings(false)} variant="ghost" className="flex-1">Cancel</Button>
                        <Button onClick={handleUpdateSettings} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold uppercase">
                            {loading ? <Loader2 className="mr-2 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Save Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
