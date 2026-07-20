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

const BAILEYS_API = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"}/revenue-intelligence`;
import {
  MessageCircle,
  Upload,
  FileText,
  ShieldCheck,
  Hash,
  Copy as CopyDedup,
  LayoutGrid,
  Timer,
  Sparkles,
  Send,
  Save,
  RotateCcw,
  ArrowLeft,
  Play,
  RefreshCw,
  Download,
} from "lucide-react";

type Step = "upload" | "configure" | "processing" | "results";

const workflowSteps = [
  { step: 1, title: "CSV Upload", icon: Upload },
  { step: 2, title: "Read CSV", icon: FileText },
  { step: 3, title: "Clean & Validate", icon: ShieldCheck },
  { step: 4, title: "Check Phone Format", icon: Hash },
  { step: 5, title: "Remove Duplicates", icon: CopyDedup },
  { step: 6, title: "Split in Batches", icon: LayoutGrid },
  { step: 7, title: "Random Wait (30-90s)", icon: Timer },
  { step: 8, title: "Personalize Message", icon: Sparkles },
  { step: 9, title: "Send via WhatsApp API", icon: Send },
  { step: 10, title: "Save Status", icon: Save },
  { step: 11, title: "Retry Failed Messages", icon: RotateCcw },
];

export default function WhatsAppOutreachPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);

  const [nameColumn, setNameColumn] = useState("");
  const [phoneColumn, setPhoneColumn] = useState("");
  const [emailColumn, setEmailColumn] = useState("none");
  const [companyColumn, setCompanyColumn] = useState("none");

  const [templateName, setTemplateName] = useState("");
  const [languageCode, setLanguageCode] = useState("en_US");
  const [minDelaySec, setMinDelaySec] = useState(30);
  const [maxDelaySec, setMaxDelaySec] = useState(90);
  const [batchSize, setBatchSize] = useState(10);
  const [maxRetries, setMaxRetries] = useState(2);
  const [includeCompanyVar, setIncludeCompanyVar] = useState(false);

  const [campaign, setCampaign] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [whatsappConfigured, setWhatsappConfigured] = useState(true);
  const [nexbotixConfigured, setNexbotixConfigured] = useState(true);
  const [twilioConfigured, setTwilioConfigured] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "sent" | "failed" | "skipped">("all");

  const [sendMethod, setSendMethod] = useState<"meta" | "nexbotix" | "twilio" | "baileys">("meta");

  // Baileys (self-hosted WhatsApp Web, QR-linked) connection state — same global singleton
  // connection already used by the B2B Campaign Intelligence page's "Send via Baileys" feature.
  const [baileysStatus, setBaileysStatus] = useState<string | null>(null);
  const [baileysPhone, setBaileysPhone] = useState<string | null>(null);
  const [baileysQr, setBaileysQr] = useState<string | null>(null);
  const [baileysError, setBaileysError] = useState<string | null>(null);

  const refreshBaileysStatus = async () => {
    try {
      const r = await fetch(`${BAILEYS_API}/baileys-status`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setBaileysStatus(data.status);
      setBaileysPhone(data.phone || null);
      setBaileysError(null);
      if (data.status === "qr_ready") {
        const qrRes = await fetch(`${BAILEYS_API}/baileys-qr`);
        const qrData = await qrRes.json();
        if (qrRes.ok) setBaileysQr(qrData.qrCode || null);
      } else {
        setBaileysQr(null);
      }
    } catch (e: unknown) {
      setBaileysError(e instanceof Error ? e.message : "Failed to check WhatsApp status");
    }
  };

  const restartBaileysSession = async () => {
    setBaileysError(null);
    try {
      const r = await fetch(`${BAILEYS_API}/baileys-restart`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setTimeout(refreshBaileysStatus, 2000);
    } catch (e: unknown) {
      setBaileysError(e instanceof Error ? e.message : "Failed to restart session");
    }
  };

  useEffect(() => {
    if (sendMethod !== "baileys") return;
    refreshBaileysStatus();
    const interval = setInterval(refreshBaileysStatus, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendMethod]);
  const [messageText, setMessageText] = useState(
    "Hi {{name}}, we noticed your business may benefit from our automation services. Would you like a free consultation?"
  );

  const logEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadLatest = async () => {
    try {
      const res = await (api as any).whatsappOutreach.getLatestCampaign();
      if (res.success && res.data) {
        setCampaign(res.data.campaign);
        setContacts(res.data.contacts || []);
        setWhatsappConfigured(res.data.whatsappConfigured);
        setNexbotixConfigured(!!res.data.nexbotixConfigured);
        setTwilioConfigured(!!res.data.twilioConfigured);
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
    setNameColumn(find(["name"]) || fields[0] || "");
    setPhoneColumn(find(["phone", "mobile", "number"]) || "");
    setEmailColumn(find(["email"]) || "none");
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
    if (f) { setFile(f); parseHeaders(f); }
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && /\.(csv|xlsx|xls)$/i.test(f.name)) { setFile(f); parseHeaders(f); }
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
        toast({ title: "Campaign Finished", description: "WhatsApp Outreach Workflow completed." });
      }
    }, 3000);
  };

  const handleLaunch = async () => {
    if (!nameColumn || !phoneColumn) {
      toast({ title: "Please select both a Name and a Phone column.", variant: "destructive" });
      return;
    }
    if (sendMethod === "meta" && !templateName.trim()) {
      toast({ title: "Template name is required — Meta requires a pre-approved template for cold outreach.", variant: "destructive" });
      return;
    }
    if (sendMethod === "twilio" && !templateName.trim()) {
      toast({ title: "Content SID is required — Twilio requires a pre-approved Content Template for cold outreach.", variant: "destructive" });
      return;
    }
    if (sendMethod === "twilio" && !twilioConfigured) {
      toast({ title: "Twilio WhatsApp API is not configured", description: "Set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_NUMBER in the server .env, or switch to another Send Method.", variant: "destructive" });
      return;
    }
    if (sendMethod === "nexbotix" && !messageText.trim()) {
      toast({ title: "Message text is required.", variant: "destructive" });
      return;
    }
    if (sendMethod === "nexbotix" && !nexbotixConfigured) {
      toast({ title: "NexBotix WhatsApp API is not configured", description: "Set NEXBOTIX_API_KEY in the server .env, or switch to Meta Cloud API.", variant: "destructive" });
      return;
    }
    if (sendMethod === "baileys" && !messageText.trim()) {
      toast({ title: "Message text is required.", variant: "destructive" });
      return;
    }
    if (sendMethod === "baileys" && baileysStatus !== "connected") {
      toast({ title: "WhatsApp is not linked yet", description: "Scan the QR code below to connect before launching a Baileys campaign.", variant: "destructive" });
      return;
    }

    const contactsPayload = parsedRows.map(row => ({
      name: row[nameColumn] || "",
      phone: row[phoneColumn] || "",
      email: emailColumn !== "none" ? row[emailColumn] || "" : "",
      company: companyColumn !== "none" ? row[companyColumn] || "" : "",
    }));

    try {
      setLoading(true);
      setStep("processing");
      const res = await (api as any).whatsappOutreach.triggerCampaign({
        contacts: contactsPayload,
        sendMethod,
        templateName: templateName.trim(),
        languageCode,
        messageText,
        minDelaySec,
        maxDelaySec,
        batchSize,
        bodyParamFields: includeCompanyVar ? ["name", "company"] : ["name"],
        maxRetries,
      });
      if (res.success) {
        toast({ title: "Campaign Started", description: "WhatsApp Outreach Workflow running in background." });
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
    setFile(null); setHeaders([]); setParsedRows([]);
    setNameColumn(""); setPhoneColumn(""); setEmailColumn("none"); setCompanyColumn("none");
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sentCount = contacts.filter(c => c.status === "sent").length;
  const failedCount = contacts.filter(c => c.status === "failed").length;
  const skippedCount = contacts.filter(c => c.status?.startsWith("skipped")).length;
  const pendingCount = contacts.filter(c => c.status === "pending").length;
  const filteredContacts = filterTab === "all" ? contacts
    : filterTab === "skipped" ? contacts.filter(c => c.status?.startsWith("skipped"))
    : contacts.filter(c => c.status === filterTab);

  const handleDownloadContacts = () => {
    if (contacts.length === 0) {
      toast({ title: "Nothing to download", description: "No contacts yet — upload a CSV and run a campaign first." });
      return;
    }
    const rows = contacts.map((c) => ({
      Name: c.name || "",
      Phone: c.phone || c.rawPhone || "",
      Company: c.company || "",
      Status: c.status || "",
      Detail: c.status === "sent" ? `Message ID: ${c.whatsappMessageId || ""}` : (c.error || ""),
      Retries: c.retryCount || 0,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whatsapp-outreach-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    if (status === "sent") return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Sent</Badge>;
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
              <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                <MessageCircle className="h-6 w-6" /> WhatsApp Outreach Workflow
              </h1>
              <p className="text-slate-400 text-sm">CSV-driven bulk outreach via the real WhatsApp Business Cloud API</p>
            </div>
          </div>
          {step !== "upload" && (
            <Button variant="outline" size="sm" onClick={resetState} className="gap-2 border-slate-700">
              <RefreshCw className="h-4 w-4" /> Start Over
            </Button>
          )}
        </div>

        {!whatsappConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
            ⚠️ WhatsApp Business Platform is not configured yet (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN missing in .env) — you can still upload and configure a campaign, but sends will fail until this is set up in Meta Business Manager.
          </div>
        )}

        {!nexbotixConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
            ⚠️ NexBotix WhatsApp API is not configured yet (NEXBOTIX_API_KEY missing in .env) — you can still upload and configure a campaign, but sends via NexBotix will fail until this is set, and until a WhatsApp number is connected on nexbotix.online/developer.
          </div>
        )}

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2 text-base">
              <LayoutGrid className="h-4 w-4 text-emerald-400" /> 11-Step Workflow
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">Real-time progression of the outreach pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3">
              {workflowSteps.map((s) => {
                const Icon = s.icon;
                const isActive = campaign?.currentStep === s.step && campaign?.status === "running";
                const isDone = campaign?.currentStep > s.step || campaign?.status === "completed";
                return (
                  <div
                    key={s.step}
                    className={`border rounded-lg p-2.5 text-center space-y-1.5 transition-all ${isActive ? "border-emerald-500 bg-emerald-500/10 animate-pulse" : isDone ? "border-emerald-800 bg-emerald-500/5" : "border-slate-800 bg-slate-900"}`}
                  >
                    <span className="text-[9px] text-slate-500 block">STEP {s.step}</span>
                    <Icon className={`h-4 w-4 mx-auto ${isDone ? "text-emerald-500" : "text-slate-400"}`} />
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
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragging ? "border-emerald-500 bg-emerald-500/5" : "border-slate-700 hover:border-emerald-500/50"}`}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-200">Drop your CSV or Excel file here, or click to browse</p>
                <p className="text-sm text-slate-500 mt-1">Expected columns: name, email, phone, company (any naming convention works — you'll map columns next).</p>
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
                  <Label className="text-slate-300">Name Column *</Label>
                  <Select value={nameColumn} onValueChange={setNameColumn}>
                    <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Phone Column *</Label>
                  <Select value={phoneColumn} onValueChange={setPhoneColumn}>
                    <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue placeholder="Select column" /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Email Column (optional)</Label>
                  <Select value={emailColumn} onValueChange={setEmailColumn}>
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
                <CardDescription className="text-slate-500 text-xs">Must match a template already approved for cold outreach (Meta Business Manager or Twilio Content Template Builder, depending on Send Method)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Send Method</Label>
                  <Select value={sendMethod} onValueChange={(v) => setSendMethod(v as "meta" | "nexbotix" | "twilio" | "baileys")}>
                    <SelectTrigger className="bg-slate-950 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="meta">Meta Cloud API (official, template required)</SelectItem>
                      <SelectItem value="twilio">Twilio WhatsApp API (Content Template required)</SelectItem>
                      <SelectItem value="nexbotix">NexBotix API (freeform text)</SelectItem>
                      <SelectItem value="baileys">Baileys (self-hosted, QR-linked, freeform)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {sendMethod === "baileys" && (
                  <div className="rounded-lg p-3 text-xs border bg-slate-950 border-slate-700 space-y-2">
                    {baileysError && (
                      <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded p-2">{baileysError}</div>
                    )}
                    {baileysStatus === "connected" ? (
                      <div className="text-center py-2">
                        <div className="text-emerald-400 font-semibold">✅ Connected{baileysPhone ? ` as ${baileysPhone}` : ""}</div>
                      </div>
                    ) : baileysQr ? (
                      <div className="text-center">
                        <img src={baileysQr} alt="WhatsApp QR Code" className="mx-auto w-48 h-48 border border-slate-700 rounded bg-white p-1" />
                        <p className="text-slate-400 mt-2">Open WhatsApp on your phone → Settings → Linked Devices → Link a Device, then scan this code.</p>
                        <p className="text-slate-500 mt-1">Waiting for scan — refreshes every 5s…</p>
                      </div>
                    ) : (!baileysStatus || baileysStatus === "connecting") ? (
                      <div className="text-center py-2 text-slate-400">Checking connection…</div>
                    ) : (
                      <div className="text-center py-2 space-y-2">
                        <div className="text-slate-400">Status: {baileysStatus}</div>
                        <Button size="sm" onClick={restartBaileysSession} className="text-xs">Generate QR Code</Button>
                      </div>
                    )}
                  </div>
                )}

                {sendMethod === "nexbotix" && (
                  <div className={`rounded-lg p-3 text-xs border ${nexbotixConfigured ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-red-500/5 border-red-500/30 text-red-300"}`}>
                    {nexbotixConfigured ? "✔️ NexBotix API key is configured." : "⚠️ NexBotix API key is NOT configured — set NEXBOTIX_API_KEY in the server .env."} Make sure a WhatsApp number is connected at nexbotix.online/developer before sending.
                  </div>
                )}

                {sendMethod === "twilio" && (
                  <div className={`rounded-lg p-3 text-xs border ${twilioConfigured ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-red-500/5 border-red-500/30 text-red-300"}`}>
                    {twilioConfigured ? "✔️ Twilio WhatsApp is configured." : "⚠️ Twilio WhatsApp is NOT configured — set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_NUMBER in the server .env."}
                  </div>
                )}

                {sendMethod === "meta" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Approved Template Name *</Label>
                      <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. free_consultation_offer" className="bg-slate-950 border-slate-700" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Language Code</Label>
                      <Input value={languageCode} onChange={(e) => setLanguageCode(e.target.value)} placeholder="en_US" className="bg-slate-950 border-slate-700" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" checked={includeCompanyVar} onChange={(e) => setIncludeCompanyVar(e.target.checked)} />
                      Template has a 2nd variable ({"{{2}}"}) for Company
                    </label>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-xs text-slate-400">
                      Template body must use {"{{1}}"} for Name{includeCompanyVar ? " and {{2}} for Company" : ""}. This must already be approved in Meta Business Manager — freeform text will be rejected for cold outreach.
                    </div>
                  </>
                )}

                {sendMethod === "twilio" && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Content SID *</Label>
                      <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. HXbfe4834a3a63b2092643391f0e1894a7" className="bg-slate-950 border-slate-700" />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input type="checkbox" checked={includeCompanyVar} onChange={(e) => setIncludeCompanyVar(e.target.checked)} />
                      Template has a 2nd variable ({"{{2}}"}) for Company
                    </label>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 text-xs text-slate-400">
                      Enter the Content SID (starts with "HX...") from Twilio's Content Template Builder — must already be approved for WhatsApp. Template body must use {"{{1}}"} for Name{includeCompanyVar ? " and {{2}} for Company" : ""}.
                    </div>
                  </>
                )}

                {(sendMethod === "nexbotix" || sendMethod === "baileys") && (
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Message Text *</Label>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md p-2 text-sm text-slate-200"
                      placeholder="Hi {{name}}, ..."
                    />
                    <p className="text-xs text-slate-500">Use {"{{name}}"}, {"{{company}}"}, {"{{email}}"} — filled in per contact.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Batch Size</Label>
                    <Input type="number" value={batchSize} onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)} className="bg-slate-950 border-slate-700" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Max Retries</Label>
                    <Input type="number" value={maxRetries} onChange={(e) => setMaxRetries(parseInt(e.target.value) || 2)} className="bg-slate-950 border-slate-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Min Delay (sec)</Label>
                    <Input type="number" value={minDelaySec} onChange={(e) => setMinDelaySec(parseInt(e.target.value) || 30)} className="bg-slate-950 border-slate-700" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Max Delay (sec)</Label>
                    <Input type="number" value={maxDelaySec} onChange={(e) => setMaxDelaySec(parseInt(e.target.value) || 90)} className="bg-slate-950 border-slate-700" />
                  </div>
                </div>

                <Button onClick={handleLaunch} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Play className="h-4 w-4" /> Launch WhatsApp Outreach Workflow
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
                  {campaign?.status === "running" ? "Running — real pacing means this can take a while, not stuck." : "Real-time status updates"}
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
                  <CardDescription className="text-slate-500 text-xs">{pendingCount} pending · {sentCount} sent · {failedCount} failed · {skippedCount} skipped</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge onClick={() => setFilterTab("all")} className={`cursor-pointer ${filterTab === "all" ? "bg-emerald-600" : "bg-slate-800 text-slate-400"}`}>All ({contacts.length})</Badge>
                  <Badge onClick={() => setFilterTab("sent")} className={`cursor-pointer ${filterTab === "sent" ? "bg-emerald-600" : "bg-slate-800 text-slate-400"}`}>Sent ({sentCount})</Badge>
                  <Badge onClick={() => setFilterTab("failed")} className={`cursor-pointer ${filterTab === "failed" ? "bg-red-600" : "bg-slate-800 text-slate-400"}`}>Failed ({failedCount})</Badge>
                  <Badge onClick={() => setFilterTab("skipped")} className={`cursor-pointer ${filterTab === "skipped" ? "bg-amber-600" : "bg-slate-800 text-slate-400"}`}>Skipped ({skippedCount})</Badge>
                  <Button size="sm" variant="outline" onClick={handleDownloadContacts} className="border-slate-700 text-slate-300 gap-1.5 ml-1">
                    <Download className="h-3.5 w-3.5" /> Download CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800">
                      <TableHead className="text-slate-400">Name</TableHead>
                      <TableHead className="text-slate-400">Phone</TableHead>
                      <TableHead className="text-slate-400">Company</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Detail</TableHead>
                      <TableHead className="text-slate-400">Retries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((c) => (
                      <TableRow key={c._id} className="border-slate-800">
                        <TableCell className="text-slate-200 font-medium">{c.name || "—"}</TableCell>
                        <TableCell className="text-slate-300 text-sm">{c.phone || c.rawPhone || "—"}</TableCell>
                        <TableCell className="text-slate-300 text-sm">{c.company || "—"}</TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-[280px] truncate">
                          {c.status === "sent" ? `Message ID: ${c.whatsappMessageId || "—"}` : (c.error || "—")}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{c.retryCount || 0}</TableCell>
                      </TableRow>
                    ))}
                    {filteredContacts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-8">No contacts in this tab.</TableCell>
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
