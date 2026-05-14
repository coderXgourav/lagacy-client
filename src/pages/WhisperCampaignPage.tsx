import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, FileText, X, CheckCircle, AlertCircle, Send, Mail, Lock, Eye, EyeOff, Loader2, StopCircle, ArrowLeft, User, Zap, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  name: string;
  email: string;
  domainName?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DEFAULT_SUBJECT = "Whisper Paddles — Premium Paddle Experience Awaits You"; const DEFAULT_BODY = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Whisper Paddles</title>
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { border: 0; outline: none; text-decoration: none; max-width: 100%; height: auto; }
body { margin: 0; padding: 0; width: 100% !important; background-color: #f4f7f6; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #333333; }
.content-table { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.header-bar { height: 6px; background: linear-gradient(90deg, #ff6b6b 0%, #ff8e53 100%); }
.text-link { color: #ff6b6b; text-decoration: none; font-weight: bold; }
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;">
<tr>
<td align="center" style="padding:40px 10px;">
<table width="600" cellpadding="0" cellspacing="0" class="content-table">
<tr><td class="header-bar"></td></tr>
<tr>
<td style="padding:40px 50px;font-size:16px;line-height:1.8;">
<p>Hi {{name}},</p>
<p>Pickleball Performance isn’t just physical.</p>
<p><strong>It’s mental.</strong></p>
<p>And when you reduce the relentless noise, we give our brain—and our nervous system—room to perform at a higher level.</p>

<div style="text-align: center; margin: 30px 0;">
  <img src="https://drive.google.com/thumbnail?id=1QrrgK-LFA3ULmRSL1WrKxOFLpr7USmRS&sz=w1000" alt="Whisper Paddles Soundproofed" style="max-width:100%; height:auto;">
</div>

<h2 style="font-size: 20px; color: #111; margin-top: 30px;">What’s really happening on a noisy court?</h2>
<p>Studies show that pickleball’s sharp, repetitive sound isn’t just background noise.</p>
<p>Your brain is constantly working to:</p>
<ul style="padding-left: 20px;">
  <li>Filter sound</li>
  <li>Process instruction</li>
  <li>Track the ball</li>
  <li>Maintain focus</li>
</ul>
<p>When noise increases, so does the mental effort required to keep up.</p>
<p>That added load leads to: <strong>Slower reaction times</strong>, <strong>Reduced focus</strong>, and <strong>Lower-quality decision making</strong>.</p>

<h2 style="font-size: 20px; color: #111; margin-top: 30px;">For players: it impacts how fast you improve</h2>
<p>Skill development depends on clarity. When you can’t clearly hear instructions or stay mentally locked in it becomes harder to:</p>
<ul style="padding-left: 20px;">
  <li>Dial in technique</li>
  <li>Build consistency</li>
  <li>Acquire new skills</li>
</ul>
<p><strong>Less noise = faster learning.</strong></p>

<h2 style="font-size: 20px; color: #111; margin-top: 30px;">For coaches: it changes how you teach</h2>
<p>In loud environments, coaching becomes repetitive, physically taxing, and less precise. Your instructions are not being heard as your clientele cannot process through the noise. Over time, that impacts your energy and positive outcomes.</p>

<h2 style="font-size: 20px; color: #111; margin-top: 30px;">Why quieter environments work better</h2>
<p>When you reduce noise at the source by using quiet paddles:</p>
<ul style="padding-left: 20px;">
  <li>Players process feedback faster</li>
  <li>Communication becomes effortless</li>
  <li>Sessions feel smoother and more productive</li>
  <li>Players feel more successful</li>
</ul>
<p>It’s the difference between working harder and learning smarter.</p>

<h2 style="font-size: 20px; color: #111; margin-top: 30px;">What are the best USAP Approved paddles that reduce cognitive load?</h2>
<p><strong>Whisper Paddles 👈</strong> Voted best quiet paddle of 2025 by Pickleheads, these are designed to reduce decibel and pitch levels at the source—without changing how the game is played.</p>

<div style="background: #fff5f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ff6b6b; margin: 30px 0;">
  <p style="margin: 0;"><strong>USAP Ambassadors:</strong> Use Code <strong>USAPAFREE</strong> for free shipping on our Demo Kits built for Real-World Demos.</p>
</div>

<div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
  <p style="margin: 0;"><strong>Andy Carlson</strong><br>Analyst<br>Whisper Paddles Corp.</p>
  <p style="margin: 5px 0; font-size: 14px; color: #666;">
    📱 (+1) 236-988-7853<br>
    ✉️ <a href="mailto:andy@whisperpaddles.com" style="color: #ff6b6b;">andy@whisperpaddles.com</a><br>
    🌐 <a href="https://www.whisperpaddles.com" style="color: #ff6b6b;">www.whisperpaddles.com</a><br>
    🔗 <a href="https://www.linkedin.com/in/kennyweinstein/" style="color: #ff6b6b;">LinkedIn Profile</a>
  </p>
  <p style="margin: 15px 0 0; font-size: 12px; color: #999;">
    Manufactured in USA | USAP Tournament and Quiet Approved | Voted #1 Quiet Paddle for 2025 by Pickleheads
  </p>
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

export default function WhisperCampaignPage() {
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
        const res = await fetch(`${API_BASE_URL}/whisper-campaign/stats`, {
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
      const res = await fetch(`${API_BASE_URL}/whisper-campaign/test-connection`, {
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

  // CSV/Excel parsing (reuse patterns from CsvUploader)
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

    // Auto-detect email column by scanning data if not found by header
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

        // Dedup by email
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
      const res = await fetch(`${API_BASE_URL}/whisper-campaign/send-emails`, {
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
      await fetch(`${API_BASE_URL}/whisper-campaign/stop`, {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/offerings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
              <Mail className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Email Campaign for Whisper Paddles</h1>
              <p className="text-xs text-muted-foreground">Send professional emails from your own email account</p>
            </div>
          </div>
          <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Beta</Badge>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Row 1: SMTP + Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SMTP Config */}
          <Card className="shadow-lg border-blue-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Lock className="h-5 w-5 text-blue-500" /> SMTP Configuration</CardTitle>
              <CardDescription>Enter your email credentials to send from your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sender-name">Sender Name (optional)</Label>
                <Input id="sender-name" placeholder="Whisper Paddles" value={senderName} onChange={e => setSenderName(e.target.value)} />
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
              <Button onClick={testConnection} disabled={isTestingConnection} variant="outline" className="w-full">
                {isTestingConnection ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Testing...</> : connectionStatus === "success" ? <><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Connected!</> : connectionStatus === "error" ? <><AlertCircle className="h-4 w-4 mr-2 text-red-500" /> Retry Connection</> : <><Zap className="h-4 w-4 mr-2" /> Test Connection</>}
              </Button>
            </CardContent>
          </Card>

          {/* CSV Upload */}
          <Card className="shadow-lg border-green-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><FileSpreadsheet className="h-5 w-5 text-green-500" /> Upload Recipients</CardTitle>
              <CardDescription>Upload CSV or Excel file with name and email columns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={e => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById('whisper-file-input')?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Drop CSV/Excel here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .csv, .xlsx, .xls</p>
                <input id="whisper-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
              </div>
              {fileName && (
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">{fileName}</span>
                    <Badge variant="secondary">{contacts.length} contacts</Badge>
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
        <Card className="shadow-lg border-purple-500/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-5 w-5 text-purple-500" /> Email Template</CardTitle>
                <CardDescription>Professional Whisper Paddles email template. Use {'{{name}}'}, {'{{email}}'}, {'{{domainName}}'} as placeholders.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                {showPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject Line</Label>
              <Input id="email-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject..." />
            </div>
            {showPreview ? (
              <div className="border rounded-xl overflow-hidden bg-white">
                <iframe srcDoc={body.replace(/\{\{name\}\}/gi, 'John').replace(/\{\{email\}\}/gi, 'john@example.com').replace(/\{\{domainName\}\}/gi, 'example.com')} className="w-full h-[500px] border-0" title="Email Preview" />
              </div>
            ) : (
              <Textarea value={body} onChange={e => setBody(e.target.value)} className="min-h-[300px] font-mono text-xs" placeholder="HTML email body..." />
            )}
          </CardContent>
        </Card>

        {/* Row 3: Send */}
        <Card className="shadow-lg border-orange-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Send className="h-5 w-5 text-orange-500" /> Send Campaign</CardTitle>
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
              <Button onClick={sendEmails} disabled={isSending || contacts.length === 0 || !senderEmail || !senderPassword} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
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
