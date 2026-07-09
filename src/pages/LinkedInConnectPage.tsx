import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
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
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/services/api";
import {
  Linkedin,
  Upload,
  FileText,
  Search,
  ShieldCheck,
  Send,
  ArrowLeft,
  Play,
  RefreshCw,
} from "lucide-react";

type Step = "upload" | "configure" | "processing" | "results";

const workflowSteps = [
  { step: 1, title: "CSV Upload / Read CSV", icon: Upload },
  { step: 2, title: "Email Enrichment (Prospeo)", icon: Search },
  { step: 3, title: "Profile Validation (Apify)", icon: ShieldCheck },
  { step: 4, title: "Send Connect (PhantomBuster)", icon: Send },
];

export default function LinkedInConnectPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);

  const [emailColumn, setEmailColumn] = useState("");
  const [nameColumn, setNameColumn] = useState("none");
  const [companyColumn, setCompanyColumn] = useState("none");

  const [inviteMessage, setInviteMessage] = useState("Hi {{name}}, I'd love to connect!");
  const [dailyLimit, setDailyLimit] = useState(25);
  const [minDelaySec, setMinDelaySec] = useState(180);
  const [maxDelaySec, setMaxDelaySec] = useState(480);

  const [campaign, setCampaign] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [prospeoConfigured, setProspeoConfigured] = useState(true);
  const [phantomConfigured, setPhantomConfigured] = useState(true);
  const [launchedToday, setLaunchedToday] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "launched" | "failed" | "skipped">("all");

  const logEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadLatest = async () => {
    try {
      const res = await (api as any).linkedinConnect.getLatestCampaign();
      if (res.success && res.data) {
        setCampaign(res.data.campaign);
        setContacts(res.data.contacts || []);
        setProspeoConfigured(res.data.prospeoConfigured);
        setPhantomConfigured(res.data.phantomConfigured);
        setLaunchedToday(res.data.launchedToday || 0);
        return res.data.campaign;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  useEffect(() => { loadLatest(); }, []);
  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [campaign?.logs]);

  const applyParsedData = (fields: string[], rows: Record<string, string>[]) => {
    setHeaders(fields);
    setParsedRows(rows);
    const find = (keywords: string[]) => fields.find(h => keywords.some(k => h.toLowerCase().includes(k)));
    setEmailColumn(find(["email"]) || fields[0] || "");
    setNameColumn(find(["name"]) || "none");
    setCompanyColumn(find(["company", "business", "organization"]) || "none");
    setStep("configure");
  };

  const parseHeaders = (targetFile: File) => {
    const isExcel = /\.(xlsx|xls)$/i.test(targetFile.name);
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const wb = XLSX.read(buffer, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows2d = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
          if (rows2d.length < 1) { toast({ title: "Empty sheet", variant: "destructive" }); return; }
          const fields = rows2d[0].map((h: any) => String(h || "").trim()).filter(Boolean);
          const rows = rows2d.slice(1).map(r => {
            const obj: Record<string, string> = {};
            fields.forEach((f, i) => { obj[f] = String(r[i] ?? "").trim(); });
            return obj;
          });
          applyParsedData(fields, rows);
        } catch (err: any) {
          toast({ title: "Error reading Excel file", description: err.message, variant: "destructive" });
        }
      };
      reader.readAsArrayBuffer(targetFile);
      return;
    }
    Papa.parse(targetFile, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (parseResults) => {
        const fields = parseResults.meta?.fields;
        if (!fields || fields.length === 0) {
          toast({ title: "Could not parse file headers", variant: "destructive" });
          return;
        }
        applyParsedData(fields, parseResults.data as Record<string, string>[]);
      },
      error: (err) => toast({ title: "Error reading file", description: err.message, variant: "destructive" }),
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) parseHeaders(f);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && /\.(csv|xlsx|xls)$/i.test(f.name)) parseHeaders(f);
    else toast({ title: "Please upload a valid CSV or Excel file", variant: "destructive" });
  };

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const c = await loadLatest();
      if (c && c.status !== "running") {
        if (pollRef.current) clearInterval(pollRef.current);
        setLoading(false);
        setStep("results");
        toast({ title: "Campaign Finished", description: "LinkedIn Connect Workflow completed." });
      }
    }, 3000);
  };

  const handleLaunch = async () => {
    if (!emailColumn) {
      toast({ title: "Please select an Email column.", variant: "destructive" });
      return;
    }
    if (!inviteMessage.trim()) {
      toast({ title: "Invite message is required.", variant: "destructive" });
      return;
    }

    const contactsPayload = parsedRows.map(row => ({
      email: row[emailColumn] || "",
      name: nameColumn !== "none" ? row[nameColumn] || "" : "",
      company: companyColumn !== "none" ? row[companyColumn] || "" : "",
    }));

    try {
      setLoading(true);
      setStep("processing");
      const res = await (api as any).linkedinConnect.triggerCampaign({
        contacts: contactsPayload,
        inviteMessage,
        dailyLimit,
        minDelaySec,
        maxDelaySec,
      });
      if (res.success) {
        toast({ title: "Campaign Started", description: "LinkedIn Connect Workflow running in background." });
        startPolling();
      } else {
        setLoading(false);
        toast({ title: "Error", description: res.message || "Failed to start campaign", variant: "destructive" });
      }
    } catch (err: any) {
      setLoading(false);
      toast({ title: "Error", description: err.message || "Failed to start campaign", variant: "destructive" });
    }
  };

  const resetState = () => {
    setHeaders([]); setParsedRows([]);
    setEmailColumn(""); setNameColumn("none"); setCompanyColumn("none");
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const launchedCount = contacts.filter(c => c.status === "launched").length;
  const failedCount = contacts.filter(c => c.status === "failed").length;
  const skippedCount = contacts.filter(c => c.status?.startsWith("no_linkedin") || c.status === "profile_invalid" || c.status === "skipped_daily_limit").length;
  const filteredContacts = filterTab === "all" ? contacts
    : filterTab === "launched" ? contacts.filter(c => c.status === "launched")
    : filterTab === "failed" ? contacts.filter(c => c.status === "failed")
    : contacts.filter(c => c.status?.startsWith("no_linkedin") || c.status === "profile_invalid" || c.status === "skipped_daily_limit");

  const statusBadge = (status: string) => {
    if (status === "launched") return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Launched</Badge>;
    if (status === "failed") return <Badge className="bg-red-500/15 text-red-400 border-red-500/30">Failed</Badge>;
    if (status === "pending") return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30">Pending</Badge>;
    return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">Skipped</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/offerings')} className="h-9 w-9 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-sky-400 flex items-center gap-2">
                <Linkedin className="h-6 w-6" /> LinkedIn Connect Workflow
              </h1>
              <p className="text-slate-400 text-sm">Email → LinkedIn profile → real connection request, via PhantomBuster</p>
            </div>
          </div>
          {step !== "upload" && (
            <Button variant="outline" size="sm" onClick={resetState} className="gap-2 border-slate-700">
              <RefreshCw className="h-4 w-4" /> Start Over
            </Button>
          )}
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
          ⚠️ Automated LinkedIn connection requests violate LinkedIn's Terms of Service and can result in account restriction. A real daily cap and randomized delays are enforced below — but the underlying risk to your account is real regardless.
        </div>

        {(!prospeoConfigured || !phantomConfigured) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
            {!prospeoConfigured && "⚠️ Prospeo (Email → LinkedIn) is not configured. "}
            {!phantomConfigured && "⚠️ PhantomBuster is not configured. "}
            You can still configure a campaign, but the affected step will fail until this is set up.
          </div>
        )}

        <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 text-sm text-sky-300">
          Sent today (across all campaigns): <strong>{launchedToday}</strong> / your configured daily limit
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-sky-400" /> 4-Step Workflow
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Real-time progression of the connect pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {workflowSteps.map((s) => {
                const Icon = s.icon;
                const isActive = campaign?.currentStep === s.step && campaign?.status === "running";
                const isDone = campaign?.currentStep > s.step || campaign?.status === "completed";
                return (
                  <div
                    key={s.step}
                    className={`border rounded-lg p-3 text-center space-y-1.5 transition-all ${isActive ? "border-sky-500 bg-sky-500/10 animate-pulse" : isDone ? "border-sky-800 bg-sky-500/5" : "border-slate-800 bg-slate-900"}`}
                  >
                    <span className="text-[9px] text-slate-500 block">STEP {s.step}</span>
                    <Icon className={`h-4 w-4 mx-auto ${isDone ? "text-sky-500" : "text-slate-400"}`} />
                    <span className="text-[10px] font-medium block leading-tight">{s.title}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {step === "upload" && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="pt-6">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragging ? "border-sky-500 bg-sky-500/5" : "border-slate-700 hover:border-sky-500/50"}`}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-200">Drop your CSV or Excel file here, or click to browse</p>
                <p className="text-sm text-slate-500 mt-1">Needs an email column — name and company columns are optional but improve personalization.</p>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === "configure" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200 text-base">Map Your Columns</CardTitle>
                <CardDescription className="text-slate-500 text-xs">{parsedRows.length} row(s) detected</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Email Column *</Label>
                  <Select value={emailColumn} onValueChange={setEmailColumn}>
                    <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Name Column (optional)</Label>
                  <Select value={nameColumn} onValueChange={setNameColumn}>
                    <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="none">None</SelectItem>
                      {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Company Column (optional)</Label>
                  <Select value={companyColumn} onValueChange={setCompanyColumn}>
                    <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="none">None</SelectItem>
                      {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200 text-base">Campaign Configuration</CardTitle>
                <CardDescription className="text-slate-500 text-xs">Safe sending limits are enforced as hard caps, not just suggestions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Invite Message *</Label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-200"
                  />
                  <p className="text-xs text-slate-500">Use {"{{name}}"} and {"{{company}}"} — filled in from the validated LinkedIn profile.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Daily Limit (max 80, per LinkedIn's own risk profile for established accounts)</Label>
                  <Input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(Math.min(80, parseInt(e.target.value) || 25))} className="bg-slate-950 border-slate-700" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Min Delay (sec)</Label>
                    <Input type="number" value={minDelaySec} onChange={(e) => setMinDelaySec(parseInt(e.target.value) || 180)} className="bg-slate-950 border-slate-700" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Max Delay (sec)</Label>
                    <Input type="number" value={maxDelaySec} onChange={(e) => setMaxDelaySec(parseInt(e.target.value) || 480)} className="bg-slate-950 border-slate-700" />
                  </div>
                </div>

                <Button onClick={handleLaunch} disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 gap-2">
                  <Play className="h-4 w-4" /> Launch LinkedIn Connect Workflow
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {(step === "processing" || step === "results") && (
          <>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-200 text-base">Execution Logs</CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  {campaign?.status === "running" ? "Running — real randomized delays mean this can take a while, not stuck." : "Real-time status updates"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 h-[320px] overflow-y-auto font-mono text-xs space-y-1">
                  {(!campaign?.logs || campaign.logs.length === 0) && <p className="text-slate-600">No logs yet.</p>}
                  {campaign?.logs?.map((log: any, idx: number) => (
                    <div key={idx} className={log.level === "error" ? "text-red-400" : log.level === "warning" ? "text-amber-400" : "text-slate-400"}>
                      [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-slate-200 text-base">Contacts</CardTitle>
                  <CardDescription className="text-slate-500 text-xs">{launchedCount} launched · {failedCount} failed · {skippedCount} skipped</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge onClick={() => setFilterTab("all")} className={`cursor-pointer ${filterTab === "all" ? "bg-sky-600" : "bg-slate-800 text-slate-400"}`}>All ({contacts.length})</Badge>
                  <Badge onClick={() => setFilterTab("launched")} className={`cursor-pointer ${filterTab === "launched" ? "bg-emerald-600" : "bg-slate-800 text-slate-400"}`}>Launched ({launchedCount})</Badge>
                  <Badge onClick={() => setFilterTab("failed")} className={`cursor-pointer ${filterTab === "failed" ? "bg-red-600" : "bg-slate-800 text-slate-400"}`}>Failed ({failedCount})</Badge>
                  <Badge onClick={() => setFilterTab("skipped")} className={`cursor-pointer ${filterTab === "skipped" ? "bg-amber-600" : "bg-slate-800 text-slate-400"}`}>Skipped ({skippedCount})</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Profile Name</TableHead>
                      <TableHead className="text-slate-400">LinkedIn URL</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((c) => (
                      <TableRow key={c._id} className="border-slate-800">
                        <TableCell className="text-slate-300 text-sm">{c.email || "—"}</TableCell>
                        <TableCell className="text-slate-200 font-medium">{c.profileName || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {c.linkedinUrl ? <a href={c.linkedinUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">View</a> : "—"}
                        </TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-[280px] truncate">{c.error || "—"}</TableCell>
                      </TableRow>
                    ))}
                    {filteredContacts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-500 py-8">No contacts in this tab.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
