import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Sparkles,
  Link2,
  Phone,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Award,
  ExternalLink,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertCircle,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  MapPin,
  Star
} from "lucide-react";

const workflowSteps = [
  { step: 1, title: "Admin Form", icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
  { step: 2, title: "Campaign Validation", icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { step: 3, title: "FB Page Scraper", icon: Search, color: "text-blue-600", bg: "bg-blue-600/10" },
  { step: 4, title: "Deduplication", icon: Trash2, color: "text-pink-500", bg: "bg-pink-500/10" },
  { step: 5, title: "Website Crawl", icon: Globe, color: "text-purple-500", bg: "bg-purple-500/10" },
  { step: 6, title: "LinkedIn Company", icon: Link2, color: "text-sky-500", bg: "bg-sky-500/10" },
  { step: 7, title: "LinkedIn People", icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
  { step: 8, title: "Contact Enrichment", icon: Mail, color: "text-amber-500", bg: "bg-amber-500/10" },
  { step: 9, title: "Email Verification", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { step: 10, title: "Website Audit", icon: FileText, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { step: 11, title: "Tech Stack Check", icon: Layout, color: "text-orange-500", bg: "bg-orange-500/10" },
  { step: 12, title: "AI Opportunity", icon: Sparkles, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { step: 13, title: "Lead Scoring", icon: BarChart3, color: "text-rose-500", bg: "bg-rose-500/10" },
  { step: 14, title: "CRM Sync", icon: Database, color: "text-green-500", bg: "bg-green-500/10" },
  { step: 15, title: "Outreach platform", icon: Zap, color: "text-teal-500", bg: "bg-teal-500/10" },
  { step: 16, title: "CEO Report", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-600/10" }
];

export default function FacebookB2BCampaignPage() {
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form Config
  const [query, setQuery] = useState("Marketing agency");
  const [country, setCountry] = useState("US");
  const [city, setCity] = useState("");
  const [limit, setLimit] = useState(50);
  
  // UI Tabs & details
  const [filterTab, setFilterTab] = useState<"all" | "qualified" | "skipped">("all");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const [logs, setLogs] = useState<any[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, level: string = "info") => {
    setLogs(prev => [...prev, { timestamp: new Date(), message: msg, level }]);
  };

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await (api as any).facebookB2b.getLatestWorkflow();
      if (res.success && res.data) {
        setPipeline(res.data.pipeline);
        setLeads(res.data.leads || []);
        if (res.data.pipeline?.logs) {
          setLogs(res.data.pipeline.logs);
        }
        if (res.data.pipeline?.config) {
          setQuery(res.data.pipeline.config.query || "Marketing agency");
          setCountry(res.data.pipeline.config.country || "US");
          setCity(res.data.pipeline.config.city || "");
          setLimit(res.data.pipeline.config.limit || 50);
        }
      }
    } catch (err) {
      console.error(err);
      addLog("Failed to fetch campaign workflow status.", "error");
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
      setLeads([]);
      setLogs([]);
      setPipeline(null);
      setLoading(true);
      addLog(`🚀 Campaign initialized from Admin Form...`, "info");
      
      const res = await (api as any).facebookB2b.triggerWorkflow({
        query,
        country,
        city,
        limit
      });

      if (res.success) {
        addLog(`✅ Campaign configuration validated. Autonomous workflow sequence started in background.`, "success");
        toast({ title: "Campaign Started", description: "Facebook Pages lead generation running in background." });
        
        let pollCount = 0;
        const MAX_POLLS = 100;
        const poll = setInterval(async () => {
          pollCount++;
          const latestRes = await (api as any).facebookB2b.getLatestWorkflow();
          if (latestRes.success && latestRes.data) {
            setPipeline(latestRes.data.pipeline);
            setLeads(latestRes.data.leads || []);
            if (latestRes.data.pipeline?.logs) {
              setLogs(latestRes.data.pipeline.logs);
            }
            if (latestRes.data.pipeline?.status !== "running" || pollCount > MAX_POLLS) {
              clearInterval(poll);
              setLoading(false);
              toast({ title: "Campaign Finished", description: "Lead generation workflow completed." });
            }
          }
        }, 1500);
      }
    } catch (err: any) {
      addLog(`❌ Trigger Failed: ${err.message}`, "error");
      toast({ title: "Trigger Failed", variant: "destructive" });
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied to Clipboard", description: `Successfully copied ${fieldName}.` });
  };

  const filteredLeads = leads.filter(lead => {
    if (filterTab === "qualified") return lead.status === "qualified";
    if (filterTab === "skipped") return lead.status === "skipped";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="container mx-auto max-w-7xl space-y-8 animate-fade-in pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('/offerings')} 
              className="h-9 w-9 rounded-lg border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                Facebook B2B Lead Generator
              </h1>
              <p className="text-sm text-slate-400">
                16-Step Autonomous Lead Generation, Scoring, and Outreach Pipeline (Under $100/mo)
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs px-3 py-1 font-semibold uppercase tracking-wider"
          >
            Primary Source: Facebook Pages
          </Badge>
        </div>

        {/* 16 Steps Workflow Tracker */}
        <Card className="border-slate-800 bg-slate-800/50 backdrop-blur-md">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-md font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-400" />
              16-STEP AUTONOMOUS LEAD GENERATION WORKFLOW
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Follow the real-time progression of the campaign pipeline steps
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {workflowSteps.map((step) => {
                const StepIcon = step.icon;
                const isActive = pipeline?.status === "running" && pipeline?.currentStep === step.step;
                const isCompleted = pipeline?.status === "completed" || (pipeline?.status === "running" && pipeline?.currentStep > step.step);
                
                let borderClass = "border-slate-800 bg-slate-900/40 text-slate-500";
                if (isActive) {
                  borderClass = "border-blue-500 bg-blue-500/15 text-blue-400 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30";
                } else if (isCompleted) {
                  borderClass = "border-emerald-500 bg-emerald-500/10 text-emerald-400";
                }

                return (
                  <div 
                    key={step.step} 
                    className={`flex flex-col items-center justify-between p-3 rounded-lg border transition-all duration-300 ${borderClass}`}
                  >
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Step {step.step}
                    </div>
                    <StepIcon className="h-5 w-5 mb-2" />
                    <span className="text-[11px] font-medium text-center leading-tight truncate w-full">
                      {step.title}
                    </span>
                    {isActive && (
                      <span className="flex h-2 w-2 relative mt-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Form and Logs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config form */}
          <Card className="border-slate-800 bg-slate-800/40">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-200">Campaign Configuration</CardTitle>
              <CardDescription className="text-slate-400">Configure parameters for targeting Facebook Page directories</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="query" className="text-slate-300">Facebook Search Query</Label>
                <Input 
                  id="query"
                  placeholder="e.g. Dentists, SaaS, Marketing, Plumbers" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  disabled={loading}
                  className="bg-slate-900 border-slate-700 text-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-slate-300">Country</Label>
                  <Select value={country} onValueChange={setCountry} disabled={loading}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-slate-300">City (optional)</Label>
                  <Input
                    id="city"
                    placeholder="e.g. New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                    className="bg-slate-900 border-slate-700 text-slate-200 focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit" className="text-slate-300">Lead Target Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
                  disabled={loading}
                  className="bg-slate-900 border-slate-700 text-slate-200 focus-visible:ring-blue-500"
                />
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-blue-400 font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  SOFTWARE BUDGET ASSURANCE
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Calculated costs: <strong>~$0.003/lead</strong> using lightweight Facebook Page scraper Apify inputs + local deduplication. Highly compatible with $100/month budget caps.
                </p>
              </div>

              <Button 
                onClick={handleManualTrigger} 
                disabled={loading || !query} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-11 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting Leads...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Launch B2B Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Logs */}
          <Card className="lg:col-span-2 border-slate-800 bg-slate-800/40 flex flex-col h-[380px]">
            <CardHeader className="py-4 border-b border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-200">Execution Logs</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Real-time status updates of the B2B pipeline</CardDescription>
              </div>
              {pipeline?.status === "running" && (
                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse">
                  Running Step {pipeline.currentStep}/16
                </Badge>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-slate-950/60 rounded-b-lg">
              <div className="space-y-1.5">
                {logs.map((log, i) => {
                  let textClass = "text-slate-400";
                  if (log.message.startsWith("❌")) textClass = "text-red-400 font-bold";
                  else if (log.message.startsWith("✅") || log.message.includes("complete")) textClass = "text-emerald-400 font-semibold";
                  else if (log.message.startsWith("🚀") || log.message.startsWith("📊")) textClass = "text-blue-300 font-semibold";
                  else if (log.level === "warning") textClass = "text-amber-400";

                  return (
                    <div key={i} className={`py-0.5 border-b border-slate-900/10 ${textClass}`}>
                      <span className="text-slate-600 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      {log.message}
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Table Section */}
        <Card className="border-slate-800 bg-slate-800/40">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-slate-200">Extracted B2B Leads</CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Leads scoring 80+ are qualified and automatically synced to outreach & CRM
                </CardDescription>
              </div>
              
              {/* Tab Filter Button */}
              <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800 self-start">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFilterTab("all")} 
                  className={`text-xs h-8 px-3 rounded-md ${filterTab === "all" ? "bg-slate-800 text-white font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  All Leads ({leads.length})
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFilterTab("qualified")} 
                  className={`text-xs h-8 px-3 rounded-md ${filterTab === "qualified" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  Qualified 80+ ({leads.filter(l => l.status === "qualified").length})
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFilterTab("skipped")} 
                  className={`text-xs h-8 px-3 rounded-md ${filterTab === "skipped" ? "bg-amber-600/20 text-amber-400 font-semibold" : "text-slate-400 hover:text-slate-200"}`}
                >
                  Skipped ({leads.filter(l => l.status === "skipped").length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
                <AlertCircle className="h-10 w-10 text-slate-600" />
                <p className="font-semibold">No Leads Found</p>
                <p className="text-xs">Configure the query and launch the B2B campaign to find leads.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-950/40 border-b border-slate-800">
                    <TableRow className="hover:bg-transparent border-slate-800">
                      <TableHead className="text-slate-400 text-xs">Company</TableHead>
                      <TableHead className="text-slate-400 text-xs">Decision Maker</TableHead>
                      <TableHead className="text-slate-400 text-xs">Contact info</TableHead>
                      <TableHead className="text-slate-400 text-xs">Lead Score</TableHead>
                      <TableHead className="text-slate-400 text-xs">Best service</TableHead>
                      <TableHead className="text-slate-400 text-xs">Integration Sync</TableHead>
                      <TableHead className="text-slate-400 text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow 
                        key={lead._id} 
                        className="hover:bg-slate-800/30 border-slate-800 cursor-pointer"
                        onClick={() => setSelectedLead(lead)}
                      >
                        <TableCell className="font-semibold text-slate-200">
                          <div className="flex flex-col">
                            <span>{lead.company}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{lead.industry}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">
                          {lead.decision_maker || "Not Enriched"}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">
                          <div className="flex flex-col text-[11px] space-y-0.5">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-500" /> {lead.email || "No Email"}</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-500" /> {lead.business_phone || "No Phone"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`font-mono text-xs ${
                                lead.lead_score >= 80 
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                                  : lead.lead_score >= 60 
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                  : "bg-red-500/10 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {lead.lead_score} pts
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                              lead.status === "qualified" 
                                ? "bg-blue-500/5 text-blue-400 border-blue-500/20" 
                                : "bg-slate-800 text-slate-500 border-slate-700"
                            }`}>
                              {lead.status === "qualified" ? "Qualified" : "Skipped"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs">
                            {lead.best_service}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] px-1.5 ${
                                lead.crm_synced 
                                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                                  : "bg-slate-800 text-slate-500 border-transparent"
                              }`}
                            >
                              GHL CRM
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-[9px] px-1.5 ${
                                lead.outreach_synced 
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" 
                                  : "bg-slate-800 text-slate-500 border-transparent"
                              }`}
                            >
                              Outreach
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-slate-800 border border-slate-700 text-xs hover:bg-slate-700 text-slate-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                            }}
                          >
                            Review AI Pitch
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Lead Details & AI Outreach Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span>{selectedLead?.company}</span>
              <Badge 
                className={`font-mono text-xs ${
                  selectedLead?.lead_score >= 80 
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" 
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                Score: {selectedLead?.lead_score} / 100
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Review details, technical audit, and AI personalized outreach generated for this lead
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 mt-4 text-sm">
              
              {/* Target & Decision Maker Overview */}
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs uppercase block font-bold">Decision Maker</span>
                  <span className="text-slate-200 font-semibold">{selectedLead.decision_maker}</span>
                  {selectedLead.linkedin && (
                    <a 
                      href={selectedLead.linkedin} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1"
                    >
                      <Link2 className="h-3 w-3" /> View LinkedIn Profile
                    </a>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs uppercase block font-bold">Website & Country</span>
                  <a 
                    href={selectedLead.website} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-slate-200 hover:underline flex items-center gap-1 font-semibold"
                  >
                    {selectedLead.website?.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-xs text-slate-400 mt-1 block">Country: {selectedLead.country} | Industry: {selectedLead.industry}</span>
                </div>
              </div>

              {/* Social Media Presence */}
              {(selectedLead.facebook || selectedLead.twitter || selectedLead.instagram || selectedLead.youtube) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Social Media Presence</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.facebook && (
                      <a
                        href={selectedLead.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 text-blue-400"
                      >
                        <Facebook className="h-3.5 w-3.5" /> Facebook
                      </a>
                    )}
                    {selectedLead.twitter && (
                      <a
                        href={selectedLead.twitter}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 text-sky-400"
                      >
                        <Twitter className="h-3.5 w-3.5" /> Twitter / X
                      </a>
                    )}
                    {selectedLead.instagram && (
                      <a
                        href={selectedLead.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 text-pink-400"
                      >
                        <Instagram className="h-3.5 w-3.5" /> Instagram
                      </a>
                    )}
                    {selectedLead.youtube && (
                      <a
                        href={selectedLead.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 text-red-400"
                      >
                        <Youtube className="h-3.5 w-3.5" /> YouTube
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Google Business Profile */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Google Business Profile</h4>
                {selectedLead.gmb_found ? (
                  <a
                    href={selectedLead.gmb_url || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg border border-slate-700 w-fit"
                  >
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-slate-200 font-semibold">Listing found</span>
                    {selectedLead.gmb_rating != null && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400" /> {selectedLead.gmb_rating}
                      </span>
                    )}
                    <span className="text-slate-400">
                      ({selectedLead.gmb_reviews_count} review{selectedLead.gmb_reviews_count === 1 ? "" : "s"})
                    </span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 w-fit text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> No Google Business Profile listing found
                  </div>
                )}
              </div>

              {/* Score Breakdown weights */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Score Weights & Breakdown</h4>
                <div className="grid grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">ICP Fit</span>
                    <strong className="text-slate-200">Max 30</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Contact</span>
                    <strong className="text-slate-200">Max 20</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Web Audit</span>
                    <strong className="text-slate-200">Max 20</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Marketing</span>
                    <strong className="text-slate-200">Max 15</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Tech Gap</span>
                    <strong className="text-slate-200">Max 10</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Reach</span>
                    <strong className="text-slate-200">Max 5</strong>
                  </div>
                </div>
              </div>

              {/* Website Audit & Tech Stack */}
              {(selectedLead.page_speed_score != null || selectedLead.tech_stack?.length > 0 || selectedLead.audit_issues?.length > 0) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Website Audit & Tech Stack</h4>

                  {selectedLead.page_speed_score != null && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800 p-3 rounded border border-slate-700/50 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase">PageSpeed Score</span>
                        <strong className={`text-lg ${
                          selectedLead.page_speed_score >= 70 ? "text-emerald-400" :
                          selectedLead.page_speed_score >= 40 ? "text-amber-400" : "text-red-400"
                        }`}>
                          {selectedLead.page_speed_score}/100
                        </strong>
                      </div>
                      <div className="bg-slate-800 p-3 rounded border border-slate-700/50 text-center">
                        <span className="text-slate-500 block text-[10px] uppercase">Load Time (mobile)</span>
                        <strong className="text-lg text-slate-200">
                          {selectedLead.page_load_seconds != null ? `${selectedLead.page_load_seconds}s` : "N/A"}
                        </strong>
                      </div>
                    </div>
                  )}

                  {selectedLead.audit_issues?.length > 0 && (
                    <div className="bg-slate-950/20 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-xs uppercase block font-bold mb-1.5">Flagged Issues (real Lighthouse audit)</span>
                      <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                        {selectedLead.audit_issues.map((issue: string, idx: number) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedLead.tech_stack?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLead.tech_stack.map((tech: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-300">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4 text-xs">
                    <span className={`flex items-center gap-1 ${selectedLead.running_meta_ads ? "text-emerald-400" : "text-slate-500"}`}>
                      {selectedLead.running_meta_ads ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      Meta Ads
                    </span>
                    <span className={`flex items-center gap-1 ${selectedLead.running_google_ads ? "text-emerald-400" : "text-slate-500"}`}>
                      {selectedLead.running_google_ads ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      Google Ads Tracking Detected
                    </span>
                  </div>
                </div>
              )}

              {/* Currently Running Ads — real creative pulled from Meta's public Ad Library */}
              {selectedLead.active_ads?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Currently Running Ads — Meta ({selectedLead.active_ads.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {selectedLead.active_ads.map((ad: { text?: string; imageUrl?: string; startDate?: string; adLibraryUrl?: string }, idx: number) => (
                      <div key={idx} className="bg-slate-950/40 rounded-lg border border-slate-800 overflow-hidden">
                        {ad.imageUrl && (
                          <img src={ad.imageUrl} alt="Ad creative" className="w-full h-28 object-cover bg-slate-800" />
                        )}
                        <div className="p-2.5 space-y-1">
                          {ad.text && <p className="text-xs text-slate-300 line-clamp-3">{ad.text}</p>}
                          {ad.startDate && (
                            <span className="text-[10px] text-slate-500 block">Running since {ad.startDate}</span>
                          )}
                          {ad.adLibraryUrl ? (
                            <a href={ad.adLibraryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                              <ExternalLink className="h-3 w-3" /> View Ad
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-500">No direct link available</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Currently Running Ads — real data pulled from Google's Ads Transparency Center */}
              {selectedLead.google_ads?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Currently Running Ads — Google ({selectedLead.google_ads.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedLead.google_ads.map((ad: { advertiser?: string; format?: string; firstShown?: string; lastShown?: string; totalDaysShown?: number; detailsLink?: string }, idx: number) => {
                      const summary = (
                        <div>
                          <span className="text-slate-200 font-semibold">{ad.format || "Ad"}</span>
                          {ad.totalDaysShown != null && (
                            <span className="text-slate-500 ml-2">Shown {ad.totalDaysShown} day{ad.totalDaysShown === 1 ? "" : "s"}</span>
                          )}
                          {ad.lastShown && <span className="text-slate-500 ml-2">Last seen {ad.lastShown.slice(0, 10)}</span>}
                        </div>
                      );
                      return ad.detailsLink ? (
                        <a
                          key={idx}
                          href={ad.detailsLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between text-xs bg-slate-950/40 hover:bg-slate-900 p-2.5 rounded-lg border border-slate-800"
                        >
                          {summary}
                          <span className="flex items-center gap-1 text-blue-400 font-medium shrink-0 ml-2"><ExternalLink className="h-3 w-3" /> View Ad</span>
                        </a>
                      ) : (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                          {summary}
                          <span className="text-slate-500 shrink-0 ml-2">No direct link available</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommended Service & Pain Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/20 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase">
                    <Award className="h-4 w-4" /> Recommended Kyptronix Service
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-sm font-bold">
                    {selectedLead.best_service}
                  </Badge>
                  <p className="text-xs text-slate-400 italic mt-2">
                    Why: {selectedLead.sales_angle}
                  </p>
                </div>

                <div className="bg-slate-950/20 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-xs text-red-400 font-bold uppercase">
                    ⚠️ Detected System Pain Points
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    {selectedLead.pain_points?.map((pt: string, idx: number) => (
                      <li key={idx}>{pt}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Outreach Generation tab views */}
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-slate-300">Generated Outreach Materials</h4>
                </div>

                {/* Email Section */}
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-bold">
                      Personalized Email Copy
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-slate-400 hover:text-white"
                      onClick={() => handleCopyToClipboard(selectedLead.email_body, "Email Body")}
                    >
                      {copiedField === "Email Body" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="text-slate-500 block">Subject:</span>
                    <strong className="text-slate-200 block border-b border-slate-800 pb-1">{selectedLead.email_subject}</strong>
                    <span className="text-slate-500 block pt-1">Body:</span>
                    <pre className="text-slate-300 font-sans whitespace-pre-wrap leading-relaxed mt-1 text-[11px]">
                      {selectedLead.email_body}
                    </pre>
                  </div>
                </div>

                {/* LinkedIn and WhatsApp Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* LinkedIn */}
                  <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px] font-bold">
                        LinkedIn DM Script
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-slate-400 hover:text-white"
                        onClick={() => handleCopyToClipboard(selectedLead.linkedin_message, "LinkedIn Message")}
                      >
                        {copiedField === "LinkedIn Message" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      {selectedLead.linkedin_message}
                    </p>
                  </div>

                  {/* WhatsApp */}
                  <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                        WhatsApp Outreach Script
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-slate-400 hover:text-white"
                        onClick={() => handleCopyToClipboard(selectedLead.whatsapp_message, "WhatsApp Message")}
                      >
                        {copiedField === "WhatsApp Message" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      {selectedLead.whatsapp_message}
                    </p>
                  </div>
                </div>

              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
