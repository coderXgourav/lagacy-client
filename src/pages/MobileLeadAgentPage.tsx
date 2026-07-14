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
  Smartphone,
  Webhook,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Link2,
  Users,
  Briefcase,
  Globe,
  Sparkles,
  BarChart3,
  HardDriveDownload,
  ArrowLeft,
  Award,
  ExternalLink,
  FileDown,
  CheckCircle,
  History,
} from "lucide-react";

const workflowSteps = [
  { step: 1, title: "Webhook Trigger", icon: Webhook, color: "text-blue-500" },
  { step: 2, title: "Campaign Validation", icon: ShieldCheck, color: "text-indigo-500" },
  { step: 3, title: "Search Parameters", icon: SlidersHorizontal, color: "text-blue-600" },
  { step: 4, title: "Company Discovery", icon: Store, color: "text-orange-500" },
  { step: 5, title: "LinkedIn Company", icon: Link2, color: "text-sky-500" },
  { step: 6, title: "LinkedIn People", icon: Users, color: "text-violet-500" },
  { step: 7, title: "Job Signals", icon: Briefcase, color: "text-amber-500" },
  { step: 8, title: "Website Crawl", icon: Globe, color: "text-purple-500" },
  { step: 9, title: "Mobile Enrichment", icon: Smartphone, color: "text-rose-500" },
  { step: 10, title: "AI Analysis", icon: Sparkles, color: "text-yellow-500" },
  { step: 11, title: "Lead Score", icon: BarChart3, color: "text-pink-500" },
  { step: 12, title: "Drive Export", icon: HardDriveDownload, color: "text-green-500" },
];

export default function MobileLeadAgentPage() {
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfDownloadingId, setPdfDownloadingId] = useState<string | null>(null);

  const [niche, setNiche] = useState("Dentists");
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
      const res = await (api as any).mobileLeads.getHistory();
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
      const res = await (api as any).mobileLeads.getHistoryById(id);
      if (res.success && res.data) {
        setPipeline(res.data.pipeline);
        setLeads(res.data.leads || []);
        if (res.data.pipeline?.logs) setLogs(res.data.pipeline.logs);
        if (res.data.pipeline?.config) {
          setNiche(res.data.pipeline.config.niche || "Dentists");
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
      const res = await (api as any).mobileLeads.getLatestWorkflow();
      if (res.success && res.data) {
        setPipeline(res.data.pipeline);
        setLeads(res.data.leads || []);
        if (res.data.pipeline?.logs) setLogs(res.data.pipeline.logs);
        if (res.data.pipeline?.config) {
          setNiche(res.data.pipeline.config.niche || "Dentists");
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

      const res = await (api as any).mobileLeads.triggerWorkflow({ niche, country, city, limit });

      if (res.success) {
        toast({ title: "Campaign Started", description: "Mobile Lead Agent running in background." });
        let pollCount = 0;
        const MAX_POLLS = 150;
        const poll = setInterval(async () => {
          pollCount++;
          const latestRes = await (api as any).mobileLeads.getLatestWorkflow();
          if (latestRes.success && latestRes.data) {
            setPipeline(latestRes.data.pipeline);
            setLeads(latestRes.data.leads || []);
            if (latestRes.data.pipeline?.logs) setLogs(latestRes.data.pipeline.logs);
            if (latestRes.data.pipeline?.status !== "running" || pollCount > MAX_POLLS) {
              clearInterval(poll);
              setLoading(false);
              toast({ title: "Campaign Finished", description: "Mobile Lead Agent workflow completed." });
            }
          }
        }, 1500);
      }
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Error", description: err.message || "Failed to start campaign", variant: "destructive" });
    }
  };

  const handleDownloadPdf = async (lead: any) => {
    try {
      setPdfDownloadingId(lead._id);
      await (api as any).mobileLeads.downloadLeadPdf(lead._id, lead.company);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate PDF", variant: "destructive" });
    } finally {
      setPdfDownloadingId(null);
    }
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
              <h1 className="text-2xl font-bold text-rose-400">Mobile Lead Agent</h1>
              <p className="text-slate-400 text-sm">Generate qualified mobile app leads — CEO/Founder mobile number mandatory, email optional</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 font-mono text-xs">
              NO GOOGLE SEARCH / MAPS — VERIFIED CEO MOBILE ONLY
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
                        <span className="font-semibold text-slate-200">{h.config?.niche || "(no niche)"}{h.config?.city ? ` · ${h.config.city}` : ""}</span>
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
              <BarChart3 className="h-4 w-4 text-rose-400" /> 12-Step Workflow
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Real-time progression of the mobile lead pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {workflowSteps.map((s) => {
                const Icon = s.icon;
                const isActive = pipeline?.currentStep === s.step && pipeline?.status === 'running';
                const isDone = pipeline?.currentStep > s.step || pipeline?.status === 'completed';
                return (
                  <div
                    key={s.step}
                    className={`border rounded-lg p-3 text-center space-y-1.5 transition-all ${isActive ? 'border-rose-500 bg-rose-500/10 animate-pulse' : isDone ? 'border-emerald-800 bg-emerald-500/5' : 'border-slate-800 bg-slate-900'}`}
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
              <CardDescription className="text-slate-500 text-xs">Configure the business category/location to discover real local businesses via Yellow Pages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Business Category</Label>
                <Input
                  placeholder="e.g. Dentists, Law Firms, Restaurants"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">City</Label>
                  <Input
                    placeholder="e.g. Miami"
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

              {country !== "US" && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
                  ⚠️ Company Discovery currently only covers the US (Yellow Pages). Canada/UK/Australia directories are not yet integrated — this run will find 0 companies.
                </div>
              )}

              <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-rose-400 font-semibold">
                  <ShieldCheck className="h-4 w-4" /> HARD RULES
                </div>
                <ul className="text-slate-400 space-y-1 list-disc pl-4">
                  <li>No Google Search or Google Maps used anywhere in this pipeline</li>
                  <li>CEO/Founder verified mobile number is mandatory — no exceptions</li>
                  <li>Only companies scoring 80+ are qualified</li>
                  <li>Email is optional and never blocks qualification</li>
                </ul>
              </div>

              <Button onClick={handleManualTrigger} disabled={loading} className="w-full bg-rose-600 hover:bg-rose-700">
                {loading ? "Running..." : "Launch Mobile Lead Agent"}
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
              <CardTitle className="text-slate-200 text-base">Mobile App Leads</CardTitle>
              <CardDescription className="text-slate-500 text-xs">Every company enrichment touched is shown here — qualified (verified CEO mobile + score 80+) or skipped (with the real reason)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge onClick={() => setFilterTab("all")} className={`cursor-pointer ${filterTab === "all" ? "bg-rose-600" : "bg-slate-800 text-slate-400"}`}>All ({leads.length})</Badge>
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
                  <TableHead className="text-slate-400">CEO / Founder</TableHead>
                  <TableHead className="text-slate-400">Verified Mobile</TableHead>
                  <TableHead className="text-slate-400">Lead Score</TableHead>
                  <TableHead className="text-slate-400">Recommended Service</TableHead>
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
                      {lead.city ? `${lead.city}, ${lead.country}` : (lead.country || "—")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {lead.website ? (
                        <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                          {lead.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-slate-500">Not found</span>
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
                      <div className="text-slate-300">{lead.ceo || "Not found"}</div>
                      <div className="text-xs text-slate-500">{lead.ceo_title}</div>
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
                      {lead.recommended_service ? (
                        <Badge variant="outline" className="border-rose-500/40 text-rose-300">{lead.recommended_service}</Badge>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)} className="border-slate-700 text-slate-300">
                          {lead.status === "qualified" ? "Review" : "Details"}
                        </Button>
                        {lead.status === "qualified" && (
                          <Button size="sm" variant="outline" disabled={pdfDownloadingId === lead._id} onClick={() => handleDownloadPdf(lead)} className="border-slate-700 text-slate-300">
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-slate-500 py-8">
                      {leads.length === 0 ? "No leads yet. Configure the category/city and launch the campaign." : "No leads in this tab."}
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
                ? "Real mobile-app-need, growth, and CEO contact signals for this company"
                : `Discarded before qualifying — ${selectedLead?.skip_reason}`}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && (
            <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 mt-4 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                <div className="space-y-1">
                  <span className="text-slate-500 text-xs uppercase block font-bold">CEO / Founder</span>
                  <span className="text-slate-200 font-semibold">{selectedLead.ceo || "Not found"}</span>
                  <span className="text-xs text-slate-400 block">{selectedLead.ceo_title}</span>
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
                      {selectedLead.website?.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-slate-500">Not found</span>
                  )}
                  <span className="text-xs text-slate-400 mt-1 block">Verified Mobile: {selectedLead.mobile_phone} | Email: {selectedLead.email || 'Not found (optional)'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score Breakdown</h4>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">ICP Fit</span>
                    <strong className="text-slate-200">{selectedLead.score_icp_fit}/30</strong>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Mobile App Need</span>
                    <strong className="text-slate-200">{selectedLead.score_mobile_app_need}/30</strong>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">CEO + Verified Mobile</span>
                    <strong className="text-slate-200">{selectedLead.score_ceo_verified_mobile}/20</strong>
                  </div>
                  <div className="bg-slate-800 p-2.5 rounded border border-slate-700/50">
                    <span className="text-slate-500 block text-[10px]">Growth Signals</span>
                    <strong className="text-slate-200">{selectedLead.score_growth_signals}/20</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800 p-2.5 rounded border border-slate-700/50">
                  <span className="text-slate-500 block text-[10px]">Mobile App Detected</span>
                  <strong className="text-slate-200">{selectedLead.has_app_detected ? "Yes" : "No"}</strong>
                </div>
                <div className="bg-slate-800 p-2.5 rounded border border-slate-700/50">
                  <span className="text-slate-500 block text-[10px]">Open Jobs</span>
                  <strong className="text-slate-200">{selectedLead.job_openings_count}</strong>
                </div>
              </div>

              {selectedLead.tech_stack?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLead.tech_stack.map((t: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-slate-800 border-slate-700 text-slate-300">{t}</Badge>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/20 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold uppercase">
                    <Award className="h-4 w-4" /> Recommended Service
                  </div>
                  <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-sm font-bold">{selectedLead.recommended_service}</Badge>
                  <p className="text-xs text-slate-400 mt-2">Estimated Value: <strong className="text-slate-300">{selectedLead.estimated_project_value}</strong></p>
                </div>
                <div className="bg-slate-950/20 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-xs text-red-400 font-bold uppercase">⚠️ Detected Pain Points</div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    {selectedLead.pain_points?.map((pt: string, idx: number) => <li key={idx}>{pt}</li>)}
                  </ul>
                </div>
              </div>

              {selectedLead.status === "qualified" && (
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 space-y-2">
                  <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] font-bold">Why This Company Needs a Mobile App</Badge>
                  <p className="text-xs text-slate-300">{selectedLead.why_needs_app}</p>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-bold mt-2">Sales Angle</Badge>
                  <p className="text-xs text-slate-300">{selectedLead.sales_angle}</p>
                </div>
              )}

              {selectedLead.status === "qualified" && (
                <Button size="sm" onClick={() => handleDownloadPdf(selectedLead)} disabled={pdfDownloadingId === selectedLead._id} className="w-full bg-rose-600 hover:bg-rose-700">
                  <FileDown className="h-3.5 w-3.5 mr-1.5" /> {pdfDownloadingId === selectedLead._id ? "Generating PDF..." : "Download CEO PDF Summary"}
                </Button>
              )}

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
