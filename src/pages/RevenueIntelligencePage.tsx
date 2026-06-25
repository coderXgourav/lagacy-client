import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  ArrowLeft,
  Search,
  TrendingUp,
  Phone,
  Globe,
  Star,
  BarChart3,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  MapPin,
  Mail,
  Building2,
  Target,
  RefreshCw,
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/revenue-intelligence`;

interface DecisionMaker {
  name: string;
  title: string;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  city?: string;
  state?: string;
  mobileVerified?: boolean;
}

interface Company {
  title: string;
  categoryName?: string;
  phone?: string;
  website?: string;
  totalScore?: number;
  reviewsCount?: number;
  address?: string;
  url?: string;
  // enriched
  phoneType?: string;
  phoneCarrier?: string;
  techNeedScore?: number;
  audit?: { performance: number; seo: number };
  emails?: { email: string; position?: string }[];
  decisionMakers?: DecisionMaker[];
  hiringSignal?: boolean;
  fundingSignal?: boolean;
  fundingTotal?: number;
  // scored
  score?: number;
  signals?: string[];
  qualification?: string;
  qualLabel?: string;
}

type TabKey = "search" | "companies" | "enrich" | "score";

const QUAL_COLOR: Record<string, string> = {
  immediate: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warm: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  reject: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

const API_NEEDED: { key: string; label: string; env: string; step: string }[] = [
  { key: "prospeo", label: "Prospeo", env: "PROSPEO_API_KEY", step: "Step 4 — Mobile discovery" },
  { key: "hunter", label: "Hunter.io", env: "HUNTER_API_KEY", step: "Step 5 — Email discovery" },
  { key: "crunchbase", label: "Crunchbase", env: "CRUNCHBASE_API_KEY", step: "Step 6 — Funding signals" },
  { key: "pagespeed", label: "Google PageSpeed", env: "GOOGLE_PAGESPEED_API_KEY", step: "Step 7 — Website audit (free)" },
];

export default function RevenueIntelligencePage() {
  const navigate = useNavigate();

  // Search form
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [maxPlaces, setMaxPlaces] = useState("50");
  const [skipClosed, setSkipClosed] = useState(true);

  // Run state
  const [tab, setTab] = useState<TabKey>("search");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [scoredLeads, setScoredLeads] = useState<Company[]>([]);

  // Enrichment state
  // const [verifyingPhones, setVerifyingPhones] = useState(false); // commented out with verify-phones feature
  const [auditing, setAuditing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [enrichingEmail, setEnrichingEmail] = useState(false);
  const [enrichingFunding, setEnrichingFunding] = useState(false);
  const [findingDM, setFindingDM] = useState(false);
  const [enrichingMobile, setEnrichingMobile] = useState(false);
  const [enrichLog, setEnrichLog] = useState<string[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Step 7: Website audit — parallel batches of 5 ───────────────────────
  const runAudit = async (items: Company[]) => {
    const withSite = items.filter((c) => c.website);
    if (!withSite.length) {
      setStatusMsg(`Found ${items.length} companies. No websites to audit.`);
      return;
    }
    setAuditing(true);
    setStatusMsg(`Auditing ${withSite.length} websites...`);

    const auditOne = async (company: Company) => {
      try {
        const res = await fetch(`${API}/audit-website`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: company.website }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return { title: company.title, audit: data.audit, techNeedScore: data.techNeedScore };
      } catch {
        return null;
      }
    };

    const BATCH = 5;
    const allResults: ({ title: string; audit: unknown; techNeedScore: number } | null)[] = [];
    for (let i = 0; i < withSite.length; i += BATCH) {
      const batch = withSite.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(auditOne));
      allResults.push(...results);
      setStatusMsg(`Audited ${Math.min(i + BATCH, withSite.length)} / ${withSite.length} websites...`);
    }

    setCompanies((prev) => {
      const updated = [...prev];
      allResults.forEach((r) => {
        if (!r) return;
        const idx = updated.findIndex((c) => c.title === r.title);
        if (idx !== -1) updated[idx] = { ...updated[idx], audit: r.audit as Company["audit"], techNeedScore: r.techNeedScore };
      });
      return updated;
    });

    setAuditing(false);
    setStatusMsg(`Done — ${items.length} companies found, ${withSite.length} websites audited.`);
  };

  // Manual re-audit (uses current companies state)
  const auditWebsites = () => runAudit(companies);

  // ── Fetch Apify dataset results then auto-audit ───────────────────────────
  const fetchResults = async (datasetId: string) => {
    try {
      const res = await fetch(`${API}/results/${datasetId}`);
      const data = await res.json();
      const items: Company[] = data.items || [];
      setCompanies(items);
      setStatus("done");
      setStatusMsg(`Found ${items.length} companies. Auditing websites...`);
      await runAudit(items);
    } catch {
      setStatus("error");
      setStatusMsg("Failed to fetch results.");
    }
  };

  // ── Poll Apify run status ─────────────────────────────────────────────────
  const pollStatus = (runId: string, datasetId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/status/${runId}`);
        const data = await res.json();
        setStatusMsg(`Scraping... status: ${data.status} | found: ${data.stats?.crawledPlacesCount ?? 0}`);

        if (data.status === "SUCCEEDED" || data.status === "FAILED" || data.status === "ABORTED") {
          clearInterval(pollRef.current!);
          if (data.status === "SUCCEEDED") {
            fetchResults(data.defaultDatasetId || datasetId);
          } else {
            setStatus("error");
            setStatusMsg("Apify run failed: " + data.status);
          }
        }
      } catch {
        // keep polling
      }
    }, 5000);
  };

  // ── Step 1+2: Start discovery ─────────────────────────────────────────────
  const startDiscovery = async () => {
    if (!niche.trim() || !location.trim()) {
      setStatusMsg("Enter niche and location first.");
      return;
    }
    setStatus("running");
    setStatusMsg("Starting company discovery via Google Maps...");
    setCompanies([]);
    setScoredLeads([]);
    setTab("companies");

    try {
      const res = await fetch(`${API}/start-discovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, location, maxPlaces, skipClosed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");
      pollStatus(data.runId, data.defaultDatasetId);
    } catch (err: unknown) {
      setStatus("error");
      setStatusMsg(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // ── Step 4: Verify phones via Twilio — commented out, uncomment to enable ──
  /* const verifyPhones = async () => {
    const withPhone = companies.filter((c) => c.phone);
    if (!withPhone.length) return;
    setVerifyingPhones(true);
    try {
      const res = await fetch(`${API}/verify-phones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phones: withPhone.map((c) => ({ phone: c.phone })) }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        const map: Record<string, { type: string; carrier: string }> = {};
        data.results.forEach((r: { phone: string; type: string; carrier: string }) => {
          map[r.phone] = { type: r.type, carrier: r.carrier };
        });
        setCompanies((prev) =>
          prev.map((c) =>
            c.phone && map[c.phone]
              ? { ...c, phoneType: map[c.phone].type, phoneCarrier: map[c.phone].carrier }
              : c
          )
        );
      }
    } finally {
      setVerifyingPhones(false);
    }
  }; */

  // ── Step 3: Decision Maker Discovery via Apollo.io ───────────────────────
  const findDecisionMakers = async () => {
    if (!companies.length) return;
    setFindingDM(true);
    setEnrichLog([`Finding decision makers for ${companies.length} companies via Apollo.io...`]);
    const updated = [...companies];
    let found = 0;
    for (const company of companies) {
      try {
        const res = await fetch(`${API}/find-decision-makers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName: company.title }),
        });
        const data = await res.json();
        if (res.ok && data.decisionMakers?.length) {
          const idx = updated.findIndex(c => c.title === company.title);
          if (idx !== -1) updated[idx] = { ...updated[idx], decisionMakers: data.decisionMakers, hiringSignal: data.hiringSignal ?? true };
          found++;
          setEnrichLog(prev => [...prev, `✅ ${company.title} — ${data.decisionMakers.length} person(s) found`]);
        } else if (data.code === 'API_KEY_MISSING') {
          setEnrichLog(['❌ APOLLO_API_KEY not configured in .env']); break;
        } else {
          setEnrichLog(prev => [...prev, `— ${company.title}: not in Apollo DB (local/small business — Apollo covers mostly B2B/tech companies)`]);
        }
      } catch (e) {
        setEnrichLog(prev => [...prev, `⚠ ${company.title}: request failed — restart server if Apollo header error`]);
      }
    }
    setCompanies(updated);
    setFindingDM(false);
    setEnrichLog(prev => [...prev, `Done — ${found} companies with decision makers found.`]);
  };

  // ── Step 4: Mobile enrichment via Prospeo ────────────────────────────────
  const enrichMobileNumbers = async () => {
    const contacts = companies.flatMap(c =>
      (c.decisionMakers || [])
        .filter(dm => dm.linkedinUrl && !dm.mobileVerified)
        .map(dm => ({ name: dm.name, linkedinUrl: dm.linkedinUrl, companyTitle: c.title }))
    );
    if (!contacts.length) {
      setEnrichLog(['No LinkedIn profiles yet. Run Decision Maker Discovery first.']);
      return;
    }
    setEnrichingMobile(true);
    setEnrichLog([`Enriching ${contacts.length} contacts via Prospeo...`]);
    try {
      const res = await fetch(`${API}/enrich-contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        const phoneMap: Record<string, { email: string | null; phone: string | null }> = {};
        data.results.forEach((r: { name: string; email: string | null; phone: string | null }) => {
          phoneMap[r.name] = { email: r.email, phone: r.phone };
        });
        setCompanies(prev => prev.map(c => ({
          ...c,
          decisionMakers: (c.decisionMakers || []).map(dm => ({
            ...dm,
            phone: phoneMap[dm.name]?.phone || dm.phone,
            email: phoneMap[dm.name]?.email || dm.email,
            mobileVerified: !!(phoneMap[dm.name]?.phone),
          })),
        })));
        const found = Object.values(phoneMap).filter(v => v.phone).length;
        setEnrichLog(prev => [...prev, `Done — ${found} mobile numbers found.`]);
      } else if (data.code === 'API_KEY_MISSING') {
        setEnrichLog(['❌ PROSPEO_API_KEY not configured in .env']);
      }
    } finally {
      setEnrichingMobile(false);
    }
  };

  // ── Step 5: Email discovery via Hunter.io ────────────────────────────────
  const enrichEmails = async () => {
    const withSite = companies.filter((c) => c.website && !c.emails?.length);
    if (!withSite.length) { setEnrichLog(["No companies with websites to enrich."]); return; }
    setEnrichingEmail(true);
    setEnrichLog([`Finding emails for ${withSite.length} companies...`]);

    const updated = [...companies];
    let done = 0;
    for (const company of withSite) {
      try {
        const domain = new URL(company.website!).hostname.replace(/^www\./, '');
        const res = await fetch(`${API}/enrich-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
        const data = await res.json();
        if (res.ok && data.emails?.length) {
          const idx = updated.findIndex((c) => c.title === company.title);
          if (idx !== -1) updated[idx] = { ...updated[idx], emails: data.emails };
          done++;
          setEnrichLog((prev) => [...prev, `✅ ${company.title} — ${data.emails.length} email(s) found`]);
        } else if (data.code === "API_KEY_MISSING") {
          setEnrichLog(["❌ Hunter.io API key not configured in .env"]);
          break;
        } else {
          setEnrichLog((prev) => [...prev, `— ${company.title}: no emails found`]);
        }
      } catch {
        setEnrichLog((prev) => [...prev, `⚠ ${company.title}: error`]);
      }
    }

    setCompanies(updated);
    setEnrichingEmail(false);
    setEnrichLog((prev) => [...prev, `Done — ${done} companies enriched with emails.`]);
  };

  // ── Step 6: Funding signals via Crunchbase ────────────────────────────────
  const enrichFunding = async () => {
    if (!companies.length) return;
    setEnrichingFunding(true);
    setEnrichLog([`Fetching funding signals for ${companies.length} companies...`]);

    const updated = [...companies];
    let funded = 0;
    for (const company of companies) {
      try {
        const res = await fetch(`${API}/funding-signals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyName: company.title }),
        });
        const data = await res.json();
        if (res.ok) {
          const idx = updated.findIndex((c) => c.title === company.title);
          if (idx !== -1) {
            (updated[idx] as Company & { fundingSignal?: boolean; fundingTotal?: number }).fundingSignal = data.hasRecentFunding;
            (updated[idx] as Company & { fundingTotal?: number }).fundingTotal = data.fundingTotal;
          }
          if (data.hasRecentFunding) { funded++; setEnrichLog((prev) => [...prev, `💰 ${company.title} — recently funded!`]); }
          else setEnrichLog((prev) => [...prev, `— ${company.title}: no recent funding`]);
        } else if (data.code === "API_KEY_MISSING") {
          setEnrichLog(["❌ Crunchbase API key not configured in .env"]); break;
        }
      } catch {
        setEnrichLog((prev) => [...prev, `⚠ ${company.title}: not found on Crunchbase`]);
      }
    }

    setCompanies(updated);
    setEnrichingFunding(false);
    setEnrichLog((prev) => [...prev, `Done — ${funded} recently funded companies found.`]);
  };

  // ── Step 8+9: Score leads ─────────────────────────────────────────────────
  const scoreLeads = async () => {
    setScoring(true);
    try {
      const res = await fetch(`${API}/score-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: companies }),
      });
      const data = await res.json();
      setScoredLeads(data.leads || []);
      setTab("score");
    } finally {
      setScoring(false);
    }
  };

  // ── Download CSV ───────────────────────────────────────────────────────────
  const downloadCSV = () => {
    const rows = scoredLeads.length ? scoredLeads : companies;
    if (!rows.length) return;

    const headers = ["Name", "Category", "Phone", "Phone Type", "Website", "Rating", "Reviews", "Score", "Qualification", "Signals", "Address", "Google Maps", "DM Name", "DM Title", "DM Email", "DM Mobile", "DM LinkedIn"];
    const csv = [
      headers.join(","),
      ...rows.map((c) => {
        const dm = (c.decisionMakers || [])[0];
        return [
          `"${c.title || ""}"`,
          `"${c.categoryName || ""}"`,
          `"${c.phone || ""}"`,
          `"${c.phoneType || ""}"`,
          `"${c.website || ""}"`,
          c.totalScore ?? "",
          c.reviewsCount ?? "",
          c.score ?? "",
          `"${c.qualLabel || ""}"`,
          `"${(c.signals || []).join("; ")}"`,
          `"${c.address || ""}"`,
          `"${c.url || ""}"`,
          `"${dm?.name || ""}"`,
          `"${dm?.title || ""}"`,
          `"${dm?.email || ""}"`,
          `"${dm?.phone || ""}"`,
          `"${dm?.linkedinUrl || ""}"`,
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-intelligence-${niche.replace(/\s+/g, "-")}-${location.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "search", label: "1. Search", icon: <Search className="h-4 w-4" /> },
    { key: "companies", label: `2. Companies ${companies.length ? `(${companies.length})` : ""}`, icon: <Building2 className="h-4 w-4" /> },
    { key: "enrich", label: "3. Enrich & Discover", icon: <Zap className="h-4 w-4" /> },
    { key: "score", label: `4. Score & Qualify ${scoredLeads.length ? `(${scoredLeads.length})` : ""}`, icon: <Target className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/offerings")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Revenue Intelligence & Lead Generation</h1>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Beta</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">Goal: 20 qualified meetings per day — full-cycle automated discovery</p>
          </div>
          {(companies.length > 0 || scoredLeads.length > 0) && (
            <Button variant="outline" onClick={downloadCSV} className="gap-2">
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          )}
        </div>

        {/* API Status Bar */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs text-muted-foreground self-center font-medium">APIs:</span>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">✅ Twilio Lookup</Badge>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">✅ Apify Google Maps</Badge>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">✅ Vapi/Twilio Calls</Badge>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">✅ Amazon SES</Badge>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">✅ Prospeo</Badge>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">✅ Hunter.io</Badge>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">✅ Crunchbase</Badge>
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">✅ Google PageSpeed</Badge>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6 gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: Search ─────────────────────────────────────────────────── */}
        {tab === "search" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search className="h-4 w-4" /> Step 1 — Admin Search Portal
                  </CardTitle>
                  <CardDescription>Define your target market and kick off company discovery</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Niche / Industry *</Label>
                      <Input placeholder="e.g. beauty salon, plumber, gym" value={niche} onChange={(e) => setNiche(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Location *</Label>
                      <Input placeholder="e.g. London UK, New York USA" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Max Companies to Find</Label>
                      <Select value={maxPlaces} onValueChange={setMaxPlaces}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Skip Closed Places</Label>
                      <div className="flex items-center gap-2 h-10">
                        <Switch checked={skipClosed} onCheckedChange={setSkipClosed} />
                        <span className="text-sm text-muted-foreground">{skipClosed ? "On" : "Off"}</span>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full mt-2" size="lg" onClick={startDiscovery} disabled={status === "running"}>
                    {status === "running" ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Discovering...</> : <><Search className="h-4 w-4 mr-2" /> Start Discovery</>}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right — What's needed for steps 3-6 */}
            <div className="space-y-3">
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" /> APIs Still Needed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {API_NEEDED.map((a) => (
                    <div key={a.key} className="text-xs">
                      <div className="font-semibold text-amber-700 dark:text-amber-400">{a.step}</div>
                      <div className="text-muted-foreground">Add <code className="bg-muted px-1 rounded">{a.env}</code> to your .env</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> Ready to Use
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1.5">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Step 1-2: Company discovery (Apify)</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Step 4: Phone type check (Twilio)</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Step 7: Website audit (PageSpeed)</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Step 8-9: Scoring & qualification</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── TAB 2: Companies ──────────────────────────────────────────────── */}
        {tab === "companies" && (
          <div className="space-y-4">
            {/* Status banner */}
            {status === "running" && (
              <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
                <CardContent className="flex items-center gap-3 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">{statusMsg}</span>
                </CardContent>
              </Card>
            )}
            {status === "error" && (
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="flex items-center gap-3 py-4">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-700">{statusMsg}</span>
                </CardContent>
              </Card>
            )}
            {status === "done" && (
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                    <CheckCircle2 className="h-5 w-5" /> {statusMsg}
                  </div>
                  <div className="flex gap-2">
                    {/* Verify Phones (Twilio) — removed, uncomment verifyPhones fn in code to re-enable */}
                    <Button size="sm" variant="outline" onClick={auditWebsites} disabled={auditing} className="gap-1.5">
                      {auditing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                      Audit Websites
                    </Button>
                    <Button size="sm" onClick={scoreLeads} disabled={scoring} className="gap-1.5">
                      {scoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      Score & Qualify →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {companies.length > 0 && (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Website</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Reviews</TableHead>
                          <TableHead>Perf</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <div className="font-medium text-sm">{c.title}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[180px]">{c.address}</div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{c.categoryName || "—"}</TableCell>
                            <TableCell>
                              <div className="text-xs">{c.phone || "—"}</div>
                              {c.phoneType && (
                                <Badge className={`text-xs mt-0.5 ${c.phoneType === "mobile" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                  {c.phoneType}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {c.website ? (
                                <a href={c.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                  <Globe className="h-3 w-3" /> Site
                                </a>
                              ) : (
                                <span className="text-xs text-red-500 font-medium">No website</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {c.totalScore ? (
                                <div className="flex items-center gap-1 text-xs">
                                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> {c.totalScore}
                                </div>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-xs">{c.reviewsCount ?? "—"}</TableCell>
                            <TableCell>
                              {c.audit ? (
                                <div className="text-xs">
                                  <span className={c.audit.performance < 50 ? "text-red-500 font-bold" : c.audit.performance < 80 ? "text-amber-500" : "text-green-500"}>
                                    {c.audit.performance}
                                  </span>
                                  <span className="text-muted-foreground">/100</span>
                                </div>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {companies.length === 0 && status !== "running" && (
              <div className="text-center py-16 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No companies yet. Fill out the Search tab and click Start Discovery.</p>
                <Button variant="link" onClick={() => setTab("search")}>Go to Search →</Button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: Enrich ────────────────────────────────────────────────── */}
        {tab === "enrich" && (
          <div className="space-y-4">
            {companies.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Run discovery first to get companies to enrich.</p>
                <Button variant="link" onClick={() => setTab("search")}>Go to Search →</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Step 3 — Decision Maker Discovery */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-500" /> Step 3 — Decision Maker Discovery
                    </CardTitle>
                    <CardDescription>
                      Finds CEO / Founder / Owner contacts for each company via Apollo.io.
                      Returns name, title, LinkedIn URL, and email where available.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Companies</span>
                      <Badge variant="outline">{companies.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">DMs found</span>
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                        {companies.filter(c => c.decisionMakers?.length).length}
                      </Badge>
                    </div>
                    <Button className="w-full gap-2" onClick={findDecisionMakers} disabled={findingDM}>
                      {findingDM ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching Apollo...</> : <><Target className="h-4 w-4" /> Find Decision Makers (Apollo)</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Step 4 — Mobile Enrichment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" /> Step 4 — Mobile Discovery
                    </CardTitle>
                    <CardDescription>
                      Enriches decision maker LinkedIn profiles with mobile numbers via Prospeo.
                      Run Decision Maker Discovery first to get LinkedIn URLs.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contacts with LinkedIn</span>
                      <Badge variant="outline">
                        {companies.flatMap(c => c.decisionMakers || []).filter(dm => dm.linkedinUrl).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mobiles found</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {companies.flatMap(c => c.decisionMakers || []).filter(dm => dm.mobileVerified).length}
                      </Badge>
                    </div>
                    <Button className="w-full gap-2" variant="outline" onClick={enrichMobileNumbers} disabled={enrichingMobile}>
                      {enrichingMobile ? <><Loader2 className="h-4 w-4 animate-spin" /> Enriching...</> : <><Phone className="h-4 w-4" /> Enrich Mobiles (Prospeo)</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Step 5 — Email Discovery */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" /> Step 5 — Email Discovery
                    </CardTitle>
                    <CardDescription>
                      Finds verified business emails for each company using Hunter.io domain search.
                      Rejects free email providers (Gmail, Yahoo etc).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Companies with website</span>
                      <Badge variant="outline">{companies.filter(c => c.website).length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Already enriched</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">{companies.filter(c => c.emails?.length).length}</Badge>
                    </div>
                    <Button className="w-full gap-2" onClick={enrichEmails} disabled={enrichingEmail}>
                      {enrichingEmail ? <><Loader2 className="h-4 w-4 animate-spin" /> Finding emails...</> : <><Mail className="h-4 w-4" /> Find Emails (Hunter.io)</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Step 6 — Funding Signals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" /> Step 6 — Funding Signals
                    </CardTitle>
                    <CardDescription>
                      Checks Crunchbase for recent funding rounds. Recently funded companies
                      get +20 pts to their lead score (high investment intent).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Companies to check</span>
                      <Badge variant="outline">{companies.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Recently funded found</span>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        {companies.filter(c => (c as Company & { fundingSignal?: boolean }).fundingSignal).length}
                      </Badge>
                    </div>
                    <Button className="w-full gap-2" variant="outline" onClick={enrichFunding} disabled={enrichingFunding}>
                      {enrichingFunding ? <><Loader2 className="h-4 w-4 animate-spin" /> Fetching signals...</> : <><BarChart3 className="h-4 w-4" /> Get Funding Signals (Crunchbase)</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Step 7 — Website Audit status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-orange-500" /> Step 7 — Website Audit
                    </CardTitle>
                    <CardDescription>
                      Google PageSpeed Insights audit — runs automatically after discovery.
                      Low performance score = high technology need = more lead score points.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Audited</span>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">{companies.filter(c => c.audit).length} / {companies.filter(c => c.website).length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">No website (auto 15pts)</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">{companies.filter(c => !c.website).length}</Badge>
                    </div>
                    <Button className="w-full gap-2" variant="outline" onClick={auditWebsites} disabled={auditing}>
                      {auditing ? <><Loader2 className="h-4 w-4 animate-spin" /> Auditing...</> : <><Globe className="h-4 w-4" /> Re-run Website Audit</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Enrich log */}
                {enrichLog.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Enrichment Log
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {enrichLog.map((line, i) => (
                          <div key={i} className="text-xs font-mono text-muted-foreground">{line}</div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>
            )}

            {/* Results preview — website audit scores */}
            {companies.some(c => c.audit) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-orange-500" /> Website Audit Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Website</TableHead>
                          <TableHead>Performance</TableHead>
                          <TableHead>SEO</TableHead>
                          <TableHead>Tech Need Pts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium">{c.title}</TableCell>
                            <TableCell className="text-xs text-blue-600 max-w-[160px] truncate">
                              {c.website ? (
                                <a href={c.website} target="_blank" rel="noreferrer" className="hover:underline">{c.website.replace(/^https?:\/\//, '')}</a>
                              ) : (
                                <span className="text-red-500 font-medium">No website</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {c.audit ? (
                                <span className={`text-sm font-bold ${c.audit.performance < 50 ? 'text-red-500' : c.audit.performance < 80 ? 'text-amber-500' : 'text-green-600'}`}>
                                  {c.audit.performance}/100
                                </span>
                              ) : !c.website ? (
                                <span className="text-xs text-muted-foreground">No site</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Pending</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {c.audit ? (
                                <span className={`text-sm font-bold ${c.audit.seo < 50 ? 'text-red-500' : c.audit.seo < 80 ? 'text-amber-500' : 'text-green-600'}`}>
                                  {c.audit.seo}/100
                                </span>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              {!c.website ? (
                                <Badge className="bg-red-100 text-red-700 text-xs">+15 pts (no site)</Badge>
                              ) : c.techNeedScore ? (
                                <Badge className={`text-xs ${c.techNeedScore >= 12 ? 'bg-red-100 text-red-700' : c.techNeedScore >= 8 ? 'bg-amber-100 text-amber-700' : c.techNeedScore >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                  +{c.techNeedScore} pts
                                </Badge>
                              ) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results preview — emails found */}
            {companies.some(c => c.emails?.length) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Emails Found</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.filter(c => c.emails?.length).flatMap(c =>
                          (c.emails || []).map((e, i) => (
                            <TableRow key={`${c.title}-${i}`}>
                              <TableCell className="text-sm font-medium">{c.title}</TableCell>
                              <TableCell className="text-sm text-blue-600">{e.email}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{e.position || "—"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results preview — decision makers found */}
            {companies.some(c => c.decisionMakers?.length) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-indigo-500" /> Decision Makers Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>LinkedIn</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.filter(c => c.decisionMakers?.length).flatMap(c =>
                          (c.decisionMakers || []).map((dm, i) => (
                            <TableRow key={`${c.title}-dm-${i}`}>
                              <TableCell className="text-sm font-medium">{c.title}</TableCell>
                              <TableCell className="text-sm">{dm.name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{dm.title}</TableCell>
                              <TableCell className="text-xs text-blue-600">{dm.email || "—"}</TableCell>
                              <TableCell className="text-xs">
                                {dm.phone
                                  ? <span className="text-green-600 flex items-center gap-1"><Phone className="h-3 w-3" />{dm.phone}</span>
                                  : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className="text-xs">
                                {dm.linkedinUrl
                                  ? <a href={dm.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">View</a>
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setTab("score")} className="gap-2">
                <Target className="h-4 w-4" /> Continue to Score & Qualify →
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 4: Score & Qualify ────────────────────────────────────────── */}
        {tab === "score" && (
          <div className="space-y-4">
            {scoredLeads.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No scored leads yet. Go to Companies tab and click "Score & Qualify".</p>
                <Button variant="link" onClick={() => setTab("companies")}>Go to Companies →</Button>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3">
                  {["immediate", "warm", "reject"].map((q) => {
                    const count = scoredLeads.filter((l) => l.qualification === q).length;
                    const label = q === "immediate" ? "Immediate Outreach" : q === "warm" ? "Warm Queue" : "Rejected";
                    const color = q === "immediate" ? "text-green-600" : q === "warm" ? "text-amber-600" : "text-red-500";
                    return (
                      <Card key={q} className="text-center">
                        <CardContent className="pt-4 pb-3">
                          <div className={`text-3xl font-bold ${color}`}>{count}</div>
                          <div className="text-xs text-muted-foreground mt-1">{label}</div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Needs connecting */}
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10">
                  <CardContent className="py-3 flex flex-wrap gap-4 items-center">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Unlock full 100-pt scoring:</span>
                    <span className="text-xs text-muted-foreground">🔑 Prospeo (mobile) · 🔑 Hunter.io (email) · 🔑 Crunchbase (funding+hiring signals)</span>
                    <div className="flex gap-2 ml-auto">
                      <Button size="sm" variant="outline" onClick={scoreLeads} className="gap-1">
                        <RefreshCw className="h-3 w-3" /> Rescore
                      </Button>
                      <Button size="sm" onClick={downloadCSV} className="gap-1">
                        <Download className="h-3 w-3" /> Download CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Website</TableHead>
                            <TableHead className="text-center">Score</TableHead>
                            <TableHead>Qualification</TableHead>
                            <TableHead>Signals</TableHead>
                            <TableHead>Maps</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scoredLeads.map((c, i) => (
                            <TableRow key={i} className={c.qualification === "immediate" ? "bg-green-50/30 dark:bg-green-950/10" : c.qualification === "warm" ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}>
                              <TableCell>
                                <div className="font-medium text-sm">{c.title}</div>
                                <div className="text-xs text-muted-foreground">{c.categoryName}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs">{c.phone || "—"}</div>
                                {c.phoneType && (
                                  <Badge className={`text-xs ${c.phoneType === "mobile" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                    {c.phoneType}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {c.website ? (
                                  <div className="text-xs">
                                    <a href={c.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                      <Globe className="h-3 w-3" /> Site
                                    </a>
                                    {c.audit && (
                                      <span className={`${c.audit.performance < 50 ? "text-red-500" : c.audit.performance < 80 ? "text-amber-500" : "text-green-500"}`}>
                                        {c.audit.performance}/100
                                      </span>
                                    )}
                                  </div>
                                ) : <span className="text-xs text-red-500 font-medium">No website</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className={`text-lg font-bold ${(c.score ?? 0) >= 90 ? "text-green-600" : (c.score ?? 0) >= 80 ? "text-amber-600" : "text-muted-foreground"}`}>
                                  {c.score}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${QUAL_COLOR[c.qualification || "reject"]}`}>
                                  {c.qualLabel}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(c.signals || []).map((s, si) => (
                                    <Badge key={si} variant="outline" className="text-xs">{s}</Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {c.url ? (
                                  <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Maps
                                  </a>
                                ) : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* API placeholders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Card className="border-dashed opacity-70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> Step 4 — Mobile Discovery</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      Add <code className="bg-muted px-1 rounded">PROSPEO_API_KEY</code> to .env to enrich decision maker mobile numbers via Prospeo.
                    </CardContent>
                  </Card>
                  <Card className="border-dashed opacity-70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> Step 5 — Email Discovery</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      Add <code className="bg-muted px-1 rounded">HUNTER_API_KEY</code> to .env to discover verified business emails via Hunter.io.
                    </CardContent>
                  </Card>
                  <Card className="border-dashed opacity-70">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-muted-foreground" /> Step 6 — Funding Signals</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground">
                      Add <code className="bg-muted px-1 rounded">CRUNCHBASE_API_KEY</code> to .env to pull hiring and funding signals (+45 pts to score).
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
