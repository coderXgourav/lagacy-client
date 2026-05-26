import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, FileText, X, CheckCircle, AlertCircle, Send, Mail, Lock, Eye, EyeOff, Loader2, StopCircle, ArrowLeft, Zap, FileSpreadsheet, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

// @ts-ignore
import infographicBase64Text from "./growth_optimizers_infographic_base64.txt?raw";
// @ts-ignore
import logoBase64Text from "./growth_optimizers_logo_base64.txt?raw";

interface Contact {
  name: string;
  email: string;
  domainName?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DEFAULT_SUBJECT = "Launch Your Free Custom Website Design — Growth Optimizers";
const DEFAULT_BODY = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Growth Optimizers</title>
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { border: 0; outline: none; text-decoration: none; max-width: 100%; height: auto; }
body { margin: 0; padding: 0; width: 100% !important; background-color: #f8fafc; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #334155; }
.content-table { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.header-bar { height: 6px; background: linear-gradient(90deg, #0284c7 0%, #22c55e 100%); }
.nav-link { color: #0284c7; text-decoration: none; font-weight: 600; font-size: 13px; margin: 0 10px; display: inline-block; letter-spacing: 0.5px; }
.nav-sep { color: #cbd5e1; }
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;">
<tr>
<td align="center" style="padding:40px 10px;">
<table width="600" cellpadding="0" cellspacing="0" class="content-table">
<tr><td class="header-bar"></td></tr>
<tr>
<td style="padding:40px 50px;font-size:16px;line-height:1.8;">

<div style="text-align: center; margin-bottom: 35px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
  <img src="cid:growth_optimizers_logo" alt="Growth Optimizers" style="width: 150px; max-width: 150px; height: auto; margin-bottom: 15px; display: inline-block;">
  <div style="margin-top: 5px;">
    <a href="https://growthoptimizers.net/about" class="nav-link">STORY</a>
    <span class="nav-sep">|</span>
    <a href="https://growthoptimizers.net/case-studies" class="nav-link">BLOG</a>
    <span class="nav-sep">|</span>
    <a href="https://growthoptimizers.net/resources/audit-hub" class="nav-link">FREE AUDIT</a>
    <span class="nav-sep">|</span>
    <a href="https://growthoptimizers.net/resources/my-playbook" class="nav-link">PLAYBOOK</a>
  </div>
</div>

<p>Hey {{name}},</p>
<p>You bought the domain.</p>
<p>That’s the first step most people never take.</p>
<p>But here’s the problem:</p>
<p><strong>Most domain owners stop there.</strong></p>
<p style="margin-left: 20px; font-weight: 500; color: #e11d48;">
❌ No website.<br>
❌ No lead system.<br>
❌ No customers.<br>
❌ No growth.
</p>
<p>That’s where we come in.</p>
<p>At <strong>Growth Optimizers</strong>, we help turn domains into real businesses with:</p>
<ul style="padding-left: 20px; list-style-type: none;">
  <li style="margin-bottom: 8px;">🚀 <strong>High-converting websites</strong></li>
  <li style="margin-bottom: 8px;">🤖 <strong>AI automation setup</strong></li>
  <li style="margin-bottom: 8px;">🎯 <strong>Lead generation systems</strong></li>
  <li style="margin-bottom: 8px;">💬 <strong>CRM & WhatsApp integration</strong></li>
  <li style="margin-bottom: 8px;">📈 <strong>Meta + Google Ads</strong></li>
  <li style="margin-bottom: 8px;">⚙️ <strong>Sales funnel setup</strong></li>
</ul>
<p>And here’s the best part:</p>
<p>We’ll design your website for <strong>FREE</strong> first.</p>
<p>You only pay if you approve the design.</p>
<p style="margin-bottom: 20px; font-weight: 600; color: #0f172a;">
✨ No upfront risk.<br>
✨ No commitment.<br>
✨ Unlimited revisions until you love it.
</p>

<div style="text-align: center; margin: 30px 0;">
  <img src="cid:growth_optimizers_infographic" alt="Growth Optimizers - Turn Domain Into Business" style="max-width:100%; height:auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
</div>

<p>So before your domain sits unused for another few months, let’s build something real around it.</p>
<p style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px 20px; border-radius: 8px; font-weight: 600; color: #166534; margin: 30px 0;">
  Reply with “LAUNCH” and we’ll send over a free demo concept for your business.
</p>
<div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
  <p style="margin: 0; font-weight: bold; color: #0f172a;">Best,</p>
  <p style="margin: 5px 0 0; font-weight: 600; color: #0284c7;">Growth Optimizers</p>
  <p style="margin: 2px 0 15px; font-size: 14px; color: #64748b;">Digital Solutions. Real Results.</p>
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

export default function GrowthCampaignPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [senderEmail, setSenderEmail] = useState("");
  const [senderPassword, setSenderPassword] = useState("");
  const [senderName, setSenderName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [showPreview, setShowPreview] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // Poll stats while sending
  useEffect(() => {
    if (!isSending) return;
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/growth-campaign/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          if (!data.stats.isRunning) setIsSending(false);
        }
      } catch (e) { /* ignore */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [isSending]);

  const testConnection = async () => {
    if (!senderEmail || !senderPassword) {
      toast({ title: "Missing credentials", description: "Enter email and password first", variant: "destructive" });
      return;
    }
    setIsTestingConnection(true);
    setConnectionStatus("idle");
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/growth-campaign/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ senderEmail, senderPassword, smtpHost, smtpPort })
      });
      const data = await res.json();
      if (data.success) {
        setConnectionStatus("success");
        toast({ title: "✅ Connected!", description: data.message });
      } else {
        setConnectionStatus("error");
        toast({ title: "Connection Failed", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      setConnectionStatus("error");
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // CSV/Excel parsing
  const findCol = (headers: string[], keywords: string[]) => {
    for (const k of keywords) {
      const idx = headers.findIndex(h => h.toLowerCase() === k);
      if (idx >= 0) return idx;
    }
    for (const k of keywords) {
      const idx = headers.findIndex(h => h.toLowerCase().includes(k));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const extractContacts = (headers: string[], rows: any[][]): Contact[] => {
    const nameIdx = findCol(headers, ['name', 'full_name', 'fullname', 'contact', 'first_name', 'firstname', 'person']);
    const emailIdx = findCol(headers, ['email', 'e-mail', 'mail', 'email_address']);
    const domainIdx = findCol(headers, ['domain', 'domainname', 'website', 'url', 'site']);

    // Auto-detect email column
    let detectedEmailIdx = emailIdx;
    if (detectedEmailIdx === -1 && rows.length > 0) {
      for (let col = 0; col < (rows[0]?.length || 0); col++) {
        let matches = 0;
        for (const row of rows.slice(0, 10)) {
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row[col] || '').trim())) matches++;
        }
        if (matches >= Math.min(rows.length, 10) * 0.3) { detectedEmailIdx = col; break; }
      }
    }

    return rows
      .map(row => ({
        name: nameIdx >= 0 ? String(row[nameIdx] || '').trim() : '',
        email: detectedEmailIdx >= 0 ? String(row[detectedEmailIdx] || '').trim() : '',
        domainName: domainIdx >= 0 ? String(row[domainIdx] || '').trim() : ''
      }))
      .filter(c => c.email && c.email.includes('@'));
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
        let extracted: Contact[] = [];

        if (isExcel) {
          const wb = XLSX.read(buffer, { type: 'array' });
          for (const name of wb.SheetNames) {
            const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' }) as any[][];
            if (data.length < 2) continue;
            const hdrs = data[0].map((h: any) => String(h || '').trim().toLowerCase());
            extracted = extracted.concat(extractContacts(hdrs, data.slice(1)));
          }
        } else {
          const text = new TextDecoder().decode(buffer);
          const result = Papa.parse(text, { skipEmptyLines: true });
          const rows = result.data as any[][];
          if (rows.length >= 2) {
            const hdrs = rows[0].map((h: any) => String(h || '').trim().toLowerCase());
            extracted = extractContacts(hdrs, rows.slice(1));
          }
        }

        // Dedup
        const seen = new Set<string>();
        extracted = extracted.filter(c => { const k = c.email.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });

        setContacts(extracted);
        setFileName(file.name);
        toast({ title: "File Parsed", description: `Found ${extracted.length} contacts with valid emails` });
      } catch (err: any) {
        toast({ title: "Parse Error", description: err.message, variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find(f => /\.(csv|xlsx|xls)$/i.test(f.name));
    if (file) processFile(file);
    else toast({ title: "Invalid File", description: "Upload a CSV or Excel file", variant: "destructive" });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = Array.from(e.target.files || []).find(f => /\.(csv|xlsx|xls)$/i.test(f.name));
    if (file) processFile(file);
    e.target.value = '';
  };

  const sendEmails = async () => {
    if (!senderEmail || !senderPassword) {
      toast({ title: "Missing SMTP credentials", description: "Enter email and password", variant: "destructive" });
      return;
    }
    if (contacts.length === 0) {
      toast({ title: "No contacts", description: "Upload a CSV/Excel file first", variant: "destructive" });
      return;
    }
    setIsSending(true);
    setStats(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/growth-campaign/send-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ contacts, subject, body, senderEmail, senderPassword, senderName, smtpHost, smtpPort })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "🚀 Campaign Started!", description: data.message });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        setIsSending(false);
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setIsSending(false);
    }
  };

  const stopCampaign = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/growth-campaign/stop`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast({ title: "Stop Requested", description: "Campaign will stop after current email" });
    } catch (e) { /* ignore */ }
  };

  const getProviderLabel = () => {
    const domain = senderEmail.split('@')[1]?.toLowerCase();
    if (domain === 'gmail.com') return '🔵 Gmail';
    if (domain === 'outlook.com' || domain === 'hotmail.com') return '🔷 Outlook';
    if (domain === 'yahoo.com') return '🟣 Yahoo';
    if (domain === 'zoho.com') return '🟢 Zoho';
    return domain ? `📧 ${domain}` : '';
  };

  const progress = stats ? Math.round(((stats.sent + stats.failed) / Math.max(stats.total, 1)) * 100) : 0;

  // Substitute CID image for local public URL in preview
  const getPreviewBody = () => {
    const infographicBase64DataUri = `data:image/jpeg;base64,${(infographicBase64Text || '').trim()}`;
    const logoBase64DataUri = `data:image/png;base64,${(logoBase64Text || '').trim()}`;
    return body
      .replace(/cid:growth_optimizers_infographic/gi, infographicBase64DataUri)
      .replace(/cid:growth_optimizers_logo/gi, logoBase64DataUri)
      .replace(/\{\{name\}\}/gi, 'John Doe')
      .replace(/\{\{email\}\}/gi, 'johndoe@example.com')
      .replace(/\{\{domainName\}\}/gi, 'example.com');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/offerings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <Sparkles className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Email Campaign for Growth Optimizers</h1>
              <p className="text-xs text-muted-foreground">Launch customized domain-to-business lead campaigns</p>
            </div>
          </div>
          <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</Badge>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Row 1: SMTP + Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SMTP Config */}
          <Card className="shadow-lg border-emerald-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Lock className="h-5 w-5 text-emerald-600" /> SMTP Configuration</CardTitle>
              <CardDescription>Enter your email credentials to send from your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sender-name">Sender Name (optional)</Label>
                <Input id="sender-name" placeholder="Growth Optimizers" value={senderName} onChange={e => setSenderName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sender-email">Email Address</Label>
                <div className="relative">
                  <Input id="sender-email" type="email" placeholder="you@gmail.com" value={senderEmail} onChange={e => { setSenderEmail(e.target.value); setConnectionStatus("idle"); }} />
                  {getProviderLabel() && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{getProviderLabel()}</span>}
                </div>
              </div>
              <div>
                <Label htmlFor="sender-pass">App Password</Label>
                <div className="relative">
                  <Input id="sender-pass" type={showPassword ? "text" : "password"} placeholder="Enter app password" value={senderPassword} onChange={e => { setSenderPassword(e.target.value); setConnectionStatus("idle"); }} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">For Gmail: Use an App Password (Google Account → Security → App Passwords)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp-host">SMTP Host (optional)</Label>
                  <Input id="smtp-host" placeholder="smtp.gmail.com" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input id="smtp-port" placeholder="587" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} />
                </div>
              </div>
              <Button onClick={testConnection} disabled={isTestingConnection} variant="outline" className="w-full border-emerald-500/30 hover:bg-emerald-500/10">
                {isTestingConnection ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing...</> : connectionStatus === "success" ? <><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Connected!</> : connectionStatus === "error" ? <><AlertCircle className="h-4 w-4 mr-2 text-red-500" /> Retry Connection</> : <><Zap className="h-4 w-4 mr-2 text-emerald-500" /> Test Connection</>}
              </Button>
            </CardContent>
          </Card>

          {/* CSV Upload */}
          <Card className="shadow-lg border-teal-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><FileSpreadsheet className="h-5 w-5 text-teal-600" /> Upload Recipients</CardTitle>
              <CardDescription>Upload CSV or Excel file with name and email columns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25 hover:border-emerald-500/50'}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById('growth-file-input')?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Drop CSV/Excel here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .xls</p>
                <input id="growth-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
              </div>
              {fileName && (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">{fileName}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">{contacts.length} contacts</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { setFileName(null); setContacts([]); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {contacts.length > 0 && (
                <div className="max-h-40 overflow-auto rounded-lg border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr><th className="p-2 text-left">#</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th></tr>
                    </thead>
                    <tbody>
                      {contacts.slice(0, 50).map((c, i) => (
                        <tr key={i} className="border-t"><td className="p-2 text-muted-foreground">{i + 1}</td><td className="p-2">{c.name || '—'}</td><td className="p-2">{c.email}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {contacts.length > 50 && <p className="text-xs text-center text-muted-foreground py-2">...and {contacts.length - 50} more</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Email Template */}
        <Card className="shadow-lg border-emerald-500/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-5 w-5 text-emerald-600" /> Email Template</CardTitle>
                <CardDescription>Professional Growth Optimizers email template. Use {'{{name}}'}, {'{{email}}'}, {'{{domainName}}'} as placeholders.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10">
                {showPreview ? 'Edit Template' : 'Preview Live'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject Line</Label>
              <Input id="email-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." className="focus-visible:ring-emerald-500" />
            </div>
            {showPreview ? (
              <div className="border rounded-xl overflow-hidden bg-white">
                <iframe srcDoc={getPreviewBody()} className="w-full h-[550px] border-0" title="Email Preview" />
              </div>
            ) : (
              <Textarea value={body} onChange={e => setBody(e.target.value)} className="min-h-[350px] font-mono text-xs focus-visible:ring-emerald-500" placeholder="HTML email body..." />
            )}
          </CardContent>
        </Card>

        {/* Row 3: Send */}
        <Card className="shadow-lg border-emerald-500/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Send className="h-5 w-5 text-emerald-600" /> Send Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats during send */}
            {stats && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{stats.currentAction}</span>
                  <span className="font-medium">{stats.sent + stats.failed}/{stats.total}</span>
                </div>
                <Progress value={progress} className="h-3" />
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500" /> {stats.sent} sent</span>
                  <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4 text-red-500" /> {stats.failed} failed</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={sendEmails} disabled={isSending || contacts.length === 0 || !senderEmail || !senderPassword} className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold">
                {isSending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : <><Send className="h-4 w-4 mr-2" /> Send to {contacts.length} Contact{contacts.length !== 1 ? 's' : ''}</>}
              </Button>
              {isSending && (
                <Button variant="destructive" onClick={stopCampaign}>
                  <StopCircle className="h-4 w-4 mr-2" /> Stop
                </Button>
              )}
            </div>

            {!senderEmail && <p className="text-xs text-amber-500">⚠️ Configure SMTP credentials above</p>}
            {senderEmail && contacts.length === 0 && <p className="text-xs text-amber-500">⚠️ Upload a CSV/Excel file with contacts</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
