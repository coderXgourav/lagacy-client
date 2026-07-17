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
  DollarSign,
  Webhook,
  ShieldCheck,
  Search,
  Link2,
  Users,
  Landmark,
  Newspaper,
  Briefcase,
  Globe,
  Mail,
  Smartphone,
  Sparkles,
  BarChart3,
  HardDriveDownload,
  ArrowLeft,
  Award,
  ExternalLink,
  Copy,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  CheckCircle,
  XCircle,
  History,
} from "lucide-react";

const workflowSteps = [
  { step: 1, title: "Workflow Webhook", icon: Webhook, color: "text-blue-500", bg: "bg-blue-500/10" },
  { step: 2, title: "Campaign Validation", icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { step: 3, title: "Company Discovery", icon: Search, color: "text-blue-600", bg: "bg-blue-600/10" },
  { step: 4, title: "LinkedIn Company", icon: Link2, color: "text-sky-500", bg: "bg-sky-500/10" },
  { step: 5, title: "LinkedIn People", icon: Users, color: "text-violet-500", bg: "bg-violet-500/10" },
  { step: 6, title: "Crunchbase", icon: Landmark, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { step: 7, title: "News", icon: Newspaper, color: "text-orange-500", bg: "bg-orange-500/10" },
  { step: 8, title: "Job Signals", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
  { step: 9, title: "Website Crawl", icon: Globe, color: "text-purple-500", bg: "bg-purple-500/10" },
  { step: 10, title: "Contact Discovery", icon: Mail, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { step: 11, title: "Mobile Enrichment", icon: Smartphone, color: "text-rose-500", bg: "bg-rose-500/10" },
  { step: 12, title: "AI Analysis", icon: Sparkles, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { step: 13, title: "Lead Score", icon: BarChart3, color: "text-pink-500", bg: "bg-pink-500/10" },
  { step: 14, title: "Google Drive Export", icon: HardDriveDownload, color: "text-green-500", bg: "bg-green-500/10" },
];

export default function FundingLeadAgentPage() {
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("SaaS");
  const [country, setCountry] = useState("US");
  const [city, setCity] = useState("");
  const [limit, setLimit] = useState(25);

  const [filterTab, setFilterTab] = useState<"all" | "qualified" | "skipped">("all");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [historyList, setHistoryList] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await (api as any).fundingLeads.getHistory();
      if (res.success) setHistoryList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryRun = async (id: string) => {
    setShowHistory(false);
    setLoading(true);
    try {
      const res = await (api as any).fundingLeads.getHistoryById(id);
      if (res.success && res.data) {
        setPipeline(res.data.pipeline);
        setLeads(res.data.leads || []);
        if (res.data.pipeline?.logs) setLogs(res.data.pipeline.logs);
        if (res.data.pipeline?.config) {
          setQuery(res.data.pipeline.config.query || "SaaS");
          setCountry(res.data.pipeline.config.country || "US");
          setCity(res.data.pipeline.config.city || "");
          setLimit(res.data.pipeline.config.limit || 25);
        }
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load that run", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await (api as any).fundingLeads.getLatestWorkflow();
      if (res.success && res.data) {
        setPipeline(res.data.pipeline);
        setLeads(res.data.leads || []);
        if (res.data.pipeline?.logs) setLogs(res.data.pipeline.logs);
        if (res.data.pipeline?.config) {
          setQuery(res.data.pipeline.config.query || "SaaS");
          setCountry(res.data.pipeline.config.country || "US");
          setCity(res.data.pipeline.config.city || "");
          setLimit(res.data.pipeline.config.limit || 25);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPipeline(); }, []);
  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleManualTrigger = async () => {
    try {
      setLeads([]);
      setLogs([]);
      setPipeline(null);
      setLoading(true);

      const res = await (api as any).fundingLeads.triggerWorkflow({ query, country, city, limit });

      if (res.success) {
        toast({ title: "Campaign Started", description: "Funding Lead Agent running in background." });
        let pollCount = 0;
        const MAX_POLLS = 150;
        const poll = setInterval(async () => {
          pollCount++;
          const latestRes = await (api as any).fundingLeads.getLatestWorkflow();
          if (latestRes.success && latestRes.data) {
            setPipeline(latestRes.data.pipeline);
            setLeads(latestRes.data.leads || []);
            if (latestRes.data.pipeline?.logs) setLogs(latestRes.data.pipeline.logs);
            if (latestRes.data.pipeline?.status !== "running" || pollCount > MAX_POLLS) {
              clearInterval(poll);
              setLoading(false);
              toast({ title: "Campaign Finished", description: "Funding Lead Agent workflow completed." });
            }
          }
        }, 1500);
      }
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Error", description: err.message || "Failed to start campaign", variant: "destructive" });
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const filteredLeads = filterTab === "all" ? leads : leads.filter(l => l.status === filterTab);
  const qualifiedCount = leads.filter(l => l.status === "qualified").length;
  const skippedCount = leads.filter(l => l.status === "skipped").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/offerings')} className="h-9 w-9 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-blue-400">Funding Lead Agent</h1>
              <p className="text-slate-400 text-sm">14-Step Autonomous Funding-Signal Lead Generation Pipeline (Under $100/mo)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 font-mono text-xs">
              NO GOOGLE SEARCH / MAPS — VERIFIED MOBILE ONLY
            </Badge>
            <div className="relative">
              <Button
                variant="outline" size="sm"
                onClick={() => { const next = !showHistory; setShowHistory(next); if (next) loadHistory(); }}
                className="gap-2 border-slate-700"
              >
                <History className="h-4 w-4" /> History
              </Button>
              {showHistory && (
                <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 p-2">
                  {loadingHistory && <p className="text-xs text-slate-500 p-2">Loading past runs…</p>}
                  {!loadingHistory && historyList.length === 0 && (
                    <p className="text-xs text-slate-500 p-2">No past runs yet.</p>
                  )}
                  {historyList.map((h) => (
                    <button
                      key={h._id}
                      onClick={() => openHistoryRun(h._id)}
                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-800 text-xs border-b border-slate-800 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{h.config?.query || "(no query)"}{h.config?.city ? ` · ${h.config.city}` : ""}</span>
                        <Badge className={`text-[10px] ${h.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : h.status === "failed" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>{h.status}</Badge>
                      </div>
                      <div className="text-slate-500 mt-0.5">{new Date(h.createdAt).toLocaleString()} · {h.qualifiedCount} qualified / {h.totalCount} total</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-blue-400" /> 14-Step Workflow
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Real-time progression of the funding lead pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
              {workflowSteps.map((s) => {
                const Icon = s.icon;
                const isActive = pipeline?.currentStep === s.step && pipeline?.status === 'running';
                const isDone = pipeline?.currentStep > s.step || pipeline?.status === 'completed';
                return (
                  <div
                    key={s.step}
                    className={`border rounded-lg p-3 text-center space-y-1.5 transition-all ${isActive ? 'border-blue-500 bg-blue-500/10 animate-pulse' : isDone ? 'border-emerald-800 bg-emerald-500/5' : 'border-slate-800 bg-slate-900'}`}
                  >
                    <span className="text-[10px] text-slate-500 block">STEP {s.step}</span>
                    <Icon className={`h-4 w-4 mx-auto ${isDone ? 'text-emerald-500' : s.color}`} />
                    <span className="text-[11px] font-medium block leading-tight">{s.title}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base">Campaign Configuration</CardTitle>
              <CardDescription className="text-slate-500 text-xs">Configure the niche/location to discover real, recently-funded companies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Niche / Query</Label>
                <Input
                  placeholder="e.g. SaaS, Fintech, HealthTech"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={loading}
                  className="bg-slate-950 border-slate-700 text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Country</Label>
                  <Select value={country} onValueChange={setCountry} disabled={loading}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
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
                  <Label className="text-slate-300">City (optional)</Label>
                  <Input
                    placeholder="e.g. San Francisco"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                    className="bg-slate-950 border-slate-700 text-slate-200"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Lead Target Limit</Label>
                <Input
                  type="number"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 25)}
                  disabled={loading}
                  className="bg-slate-950 border-slate-700 text-slate-200"
                />
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-blue-400 font-semibold">
                  <DollarSign className="h-4 w-4" /> RULES
                </div>
                <ul className="text-slate-400 space-y-1 list-disc pl-4">
                  <li>Monthly budget: USD 100</li>
                  <li>Enrich only qualified companies (real Crunchbase funding record required)</li>
                  <li>Save only leads with a verified mobile/direct phone — others are discarded</li>
                  <li>AI recommends one Kyptronix service based on score and pain points</li>
                </ul>
              </div>

              <Button onClick={handleManualTrigger} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading ? "Running..." : "Launch Funding Lead Agent"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base">Execution Logs</CardTitle>
              <CardDescription className="text-slate-500 text-xs">Real-time status updates of the pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 h-[420px] overflow-y-auto font-mono text-xs space-y-1">
                {logs.length === 0 && <p className="text-slate-600">No logs yet. Launch a campaign to begin.</p>}
                {logs.map((log, idx) => (
                  <div key={idx} className={log.level === 'error' ? 'text-red-400' : log.level === 'warning' ? 'text-amber-400' : 'text-slate-400'}>
                    [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-200 text-base">Funding Leads</CardTitle>
              <CardDescription className="text-slate-500 text-xs">Every company enrichment touched is shown here — qualified (verified mobile found) or skipped (with the real reason)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge onClick={() => setFilterTab("all")} className={`cursor-pointer ${filterTab === "all" ? "bg-blue-600" : "bg-slate-800 text-slate-400"}`}>All ({leads.length})</Badge>
              <Badge onClick={() => setFilterTab("qualified")} className={`cursor-pointer ${filterTab === "qualified" ? "bg-emerald-600" : "bg-slate-800 text-slate-400"}`}>Qualified ({qualifiedCount})</Badge>
              <Badge onClick={() => setFilterTab("skipped")} className={`cursor-pointer ${filterTab === "skipped" ? "bg-amber-600" : "bg-slate-800 text-slate-400"}`}>Skipped ({skippedCount})</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Company</TableHead>
                  <TableHead className="text-slate-400">Location</TableHead>
                  <TableHead className="text-slate-400">Website</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Decision Maker</TableHead>
                  <TableHead className="text-slate-400">Funding</TableHead>
                  <TableHead className="text-slate-400">Verified Mobile</TableHead>
                  <TableHead className="text-slate-400">Lead Score</TableHead>
                  <TableHead className="text-slate-400">Best Service</TableHead>
                  <TableHead className="text-slate-400"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead._id} className="border-slate-800">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {lead.company_logo_url && (
                          <img src={lead.company_logo_url} alt="" className="h-6 w-6 rounded object-cover bg-slate-800 shrink-0" />
                        )}
                        <div>
                          <div className="font-semibold text-slate-200">{lead.company}</div>
                          <div className="text-xs text-slate-500">{lead.industry}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-300">
                      {lead.location_verified ? (
                        lead.city ? `${lead.city}, ${lead.country}` : (lead.country || "—")
                      ) : (
                        <span
                          className="text-slate-500 italic"
                          title={`Not confirmed — this is just the search filter (${[lead.city, lead.country].filter(Boolean).join(", ") || "—"}), not a verified location for this specific company. News-based discovery doesn't confirm company HQ location.`}
                        >
                          Unverified
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.website ? (
                        <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                          {lead.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-slate-500">Not found (news-discovered)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.status === "qualified" ? (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Qualified</Badge>
                      ) : (
                        <div className="space-y-1 max-w-[220px]">
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Skipped</Badge>
                          <div className="text-[11px] text-slate-500 leading-snug">{lead.skip_reason}</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-slate-300">{lead.decision_maker || "Not found"}</div>
                      <div className="text-xs text-slate-500">{lead.decision_maker_title}</div>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm max-w-[200px]">
                      {lead.funding_stage ? (
                        lead.source_article_url ? (
                          <a href={lead.source_article_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                            <Newspaper className="h-3 w-3 shrink-0" /> <span className="truncate">{lead.funding_stage}</span>
                          </a>
                        ) : lead.funding_stage
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-emerald-400 text-sm">{lead.mobile_phone || "—"}</TableCell>
                    <TableCell>
                      {lead.status === "qualified" ? (
                        <Badge className={lead.lead_score >= 80 ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-800 text-slate-400"}>
                          {lead.lead_score} pts
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {lead.best_service ? (
                        <Badge variant="outline" className="border-blue-500/40 text-blue-300">{lead.best_service}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)} className="border-slate-700 text-slate-300">
                        {lead.status === "qualified" ? "Review AI Pitch" : "View Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-slate-500 py-8">
                      {leads.length === 0 ? "No leads yet. Configure the query and launch the campaign." : "No leads in this tab."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl bg-slate-900 border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                {selectedLead?.company_logo_url && (
                  <img src={selectedLead.company_logo_url} alt="" className="h-7 w-7 rounded object-cover bg-slate-800" />
                )}
                {selectedLead?.company}
              </span>
              {selectedLead?.status === "qualified" ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-mono text-xs">
                  Score: {selectedLead?.lead_score} / 100
                </Badge>
              ) : (
                <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 font-mono text-xs">
                  Skipped
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              {selectedLead?.status === "qualified"
                ? "Real funding, growth, and contact signals for this company"
                : `Discarded before becoming a lead — ${selectedLead?.skip_reason}`}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 mt-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs uppercase block font-bold">Decision Maker</span>
                  <span className="text-slate-200 font-semibold">{selectedLead.decision_maker || "Not found"}</span>
                  <span className="text-xs text-slate-400 block">{selectedLead.decision_maker_title}</span>
                  {selectedLead.linkedin_person_url && (
                    <a href={selectedLead.linkedin_person_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1 mt-1">
                      <Link2 className="h-3 w-3" /> View LinkedIn Profile
                    </a>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs uppercase block font-bold">Website & Contact</span>
                  {selectedLead.website ? (
                    <a href={selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`} target="_blank" rel="noreferrer" className="text-slate-200 hover:underline flex items-center gap-1 font-semibold">
                      {selectedLead.website.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500">Not found (news-discovered)</span>
                  )}
                  <span className="text-xs text-slate-400 mt-1 block">Verified Mobile: {selectedLead.mobile_phone} | Email: {selectedLead.email || 'Not found'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Funding & Growth Signals</h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Funding Stage</span>
                    <strong className="text-slate-200">{selectedLead.funding_stage || 'Unknown'}</strong>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Total Funding</span>
                    <strong className="text-slate-200">{selectedLead.total_funding ? `$${selectedLead.total_funding.toLocaleString()}` : 'Undisclosed'}</strong>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Open Jobs</span>
                    <strong className="text-slate-200">{selectedLead.job_openings_count}</strong>
                  </div>
                </div>
                {selectedLead.crunchbase_url && (
                  <a href={selectedLead.crunchbase_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> View on Crunchbase
                  </a>
                )}
                {!selectedLead.crunchbase_url && selectedLead.source_article_url && (
                  <a href={selectedLead.source_article_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                    <Newspaper className="h-3 w-3" /> {selectedLead.source_article_title || "View source article"}
                  </a>
                )}
                {selectedLead.news_mentions?.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {selectedLead.news_mentions.map((n: any, i: number) => (
                      <a key={i} href={n.url} target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs bg-slate-950/40 hover:bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="truncate">{n.title}</span>
                        <span className="text-slate-500 shrink-0 ml-2">{n.source}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Score Breakdown</h4>
                <div className="grid grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Funding Intent</span>
                    <strong className="text-slate-200">{selectedLead.score_funding_intent}/30</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Growth Signals</span>
                    <strong className="text-slate-200">{selectedLead.score_growth_signals}/20</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">CEO Found</span>
                    <strong className="text-slate-200">{selectedLead.score_ceo_found}/15</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Verified Mobile</span>
                    <strong className="text-slate-200">{selectedLead.score_verified_mobile}/20</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Tech Opportunity</span>
                    <strong className="text-slate-200">{selectedLead.score_tech_opportunity}/10</strong>
                  </div>
                  <div className="bg-slate-800 p-2 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Website Quality</span>
                    <strong className="text-slate-200">{selectedLead.score_website_quality}/5</strong>
                  </div>
                </div>
              </div>

              {selectedLead.tech_stack?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLead.tech_stack.map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-300">{t}</Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {selectedLead.facebook && <a href={selectedLead.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-blue-400"><Facebook className="h-3.5 w-3.5" /> Facebook</a>}
                {selectedLead.twitter && <a href={selectedLead.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-sky-400"><Twitter className="h-3.5 w-3.5" /> Twitter/X</a>}
                {selectedLead.instagram && <a href={selectedLead.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-pink-400"><Instagram className="h-3.5 w-3.5" /> Instagram</a>}
                {selectedLead.youtube && <a href={selectedLead.youtube} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-red-400"><Youtube className="h-3.5 w-3.5" /> YouTube</a>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/20 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase">
                    <Award className="h-4 w-4" /> Recommended Kyptronix Service
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-sm font-bold">{selectedLead.best_service}</Badge>
                  <p className="text-xs text-slate-400 italic mt-2">Why: {selectedLead.sales_angle}</p>
                </div>
                <div className="bg-slate-950/20 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-xs text-red-400 font-bold uppercase">⚠️ Detected Pain Points</div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    {selectedLead.pain_points?.map((pt: string, idx: number) => <li key={idx}>{pt}</li>)}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-slate-300">Generated Outreach Materials</h4>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-bold">Personalized Email Copy</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyToClipboard(selectedLead.email_body, "Email")}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">Subject:</p>
                  <p className="text-sm font-semibold text-slate-200">{selectedLead.email_subject}</p>
                  <p className="text-xs text-slate-400 mt-2">Body:</p>
                  <p className="text-xs text-slate-300 whitespace-pre-line">{selectedLead.email_body}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 text-[10px] font-bold mb-2">LinkedIn Message</Badge>
                    <p className="text-xs text-slate-300">{selectedLead.linkedin_message}</p>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold mb-2">WhatsApp Message</Badge>
                    <p className="text-xs text-slate-300">{selectedLead.whatsapp_message}</p>
                  </div>
                </div>
              </div>

              {selectedLead.drive_exported && selectedLead.drive_file_url && (
                <a href={selectedLead.drive_file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-emerald-400 hover:underline">
                  <CheckCircle className="h-3.5 w-3.5" /> Exported to Google Drive
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
