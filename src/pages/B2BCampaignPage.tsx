import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Loader2, Play, Download, ChevronRight,
  Users, Mail, Phone,
  CheckCircle2, XCircle, AlertCircle, Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const API = `${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api"}/revenue-intelligence`;

const DECISION_ROLES = [
  "Owner", "Founder", "CEO", "COO", "Managing Partner",
  "Marketing Director", "IT Director", "VP of Marketing", "Head of Operations",
];

type StepStatus = "idle" | "running" | "done" | "error" | "skipped";

interface PipelineStep {
  id: string;
  label: string;
  tool: string;
  status: StepStatus;
  count?: number;
  message?: string;
}

interface Lead {
  company_name: string;
  contact_name?: string | null;
  job_title?: string | null;
  email?: string | null;
  email_status?: "valid" | "risky" | "invalid" | null;
  phone?: string | null;
  phone_source?: "SignalHire" | "Lusha" | null;
  linkedin_url?: string | null;
  website?: string | null;
  domain?: string | null;
  industry?: string | null;
  country?: string | null;
  state?: string | null;
  employee_count?: number | string | null;
  founded_year?: number | null;
  company_description?: string | null;
  company_linkedin?: string | null;
  lead_score?: number | null;
  status?: "qualified" | "review" | "skipped";
  skip_reason?: string | null;
  source?: string | null;
  // Website audit
  ssl?: boolean | null;
  pagespeed_mobile?: number | null;
  pagespeed_desktop?: number | null;
  accessibility_mobile?: number | null;
  accessibility_desktop?: number | null;
  best_practices_mobile?: number | null;
  best_practices_desktop?: number | null;
  seo_score?: number | null;
  seo_desktop?: number | null;
  has_chatbot?: boolean | null;
  has_booking?: boolean | null;
  has_analytics?: boolean | null;
  has_meta_pixel?: boolean | null;
  has_cta?: boolean | null;
  website_audit_score?: number | null;
  // Social audit
  facebook_url?: string | null;
  instagram_url?: string | null;
  social_score?: number | null;
  // Facebook Ads Library check (on-demand, real data)
  fb_ads_checking?: boolean;
  fb_ads_checked?: boolean;
  fb_has_ads?: boolean | null;
  fb_ad_count?: number | null;
  fb_ads_confidence?: "high" | "low" | null;
  fb_ads_list?: { ad_text: string | null; start_date: string | null; end_date: string | null; status: string | null; platforms: string[] }[] | null;
  fb_oldest_ad_start_date?: string | null;
  fb_ads_error?: string | null;
  // WhatsApp outreach via Baileys (custom AI pitch text, self-hosted number)
  baileys_sending?: boolean;
  baileys_sent?: boolean;
  baileys_error?: string | null;
  // Tech stack
  tech_detected?: string[] | null;
  cms?: string | null;
  crm_tool?: string | null;
  // AI opportunity
  ai_summary?: string | null;
  ai_best_angle?: string | null;
  ai_top_gap?: string | null;
  ai_opportunity_score?: number | null;
  ai_best_service?: string | null;
  ai_pain_points?: string[] | null;
  ai_priority?: "hot" | "warm" | "cold" | null;
  ai_first_line?: string | null;
  ai_email_subject?: string | null;
  ai_email_body?: string | null;
  ai_linkedin_message?: string | null;
  ai_whatsapp_message?: string | null;
  ai_error?: string | null;
}

const INITIAL_STEPS: PipelineStep[] = [
  { id: "validate",      label: "Validate Campaign",           tool: "Form validation",         status: "idle" },
  { id: "discover",      label: "Company + Contact Discovery", tool: "Lusha Discovery + Hunter.io",  status: "idle" },
  { id: "dedup",         label: "Deduplicate",                 tool: "By email / name",          status: "idle" },
  { id: "lusha",         label: "Lusha Enrichment",            tool: "Lusha v2",                 status: "idle" },
  { id: "email_verify",  label: "Email Verification",          tool: "Apify Verifier",           status: "idle" },
  { id: "website_audit", label: "Website Audit",               tool: "PageSpeed + SSL + HTML",   status: "idle" },
  { id: "social_audit",  label: "Social Audit",                tool: "LI · FB · IG",             status: "idle" },
  { id: "tech_stack",    label: "Tech Stack Detection",        tool: "HTML Analysis",            status: "idle" },
  { id: "ai_analysis",   label: "AI Opportunity Analysis",     tool: "Gemini AI",                status: "idle" },
  { id: "score",         label: "Score & Qualify",             tool: "Algorithm",                status: "idle" },
];

function SingleTestResult({ result }: { result: Record<string, unknown> }) {
  const techList = result.tech_detected as string[] | undefined;
  const oppScore = typeof result.ai_opportunity_score === "number" ? result.ai_opportunity_score : null;
  const link = (url: unknown, cls: string, label: string) =>
    typeof url === "string" && url
      ? <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>
      : <span className="text-slate-300">—</span>;

  if (result.error) return (
    <p className="mt-2 text-xs text-red-500 font-medium">Error: {String(result.error)}</p>
  );

  return (
    <div className="mt-2 space-y-2 text-xs">
      {result.groq_error && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-amber-700">
          <span className="font-semibold">Groq error:</span> {String(result.groq_error)}
        </div>
      )}
      {result.site_title && (
        <div className="bg-slate-100 rounded px-3 py-1.5 text-[11px] font-medium text-slate-600 truncate">
          {String(result.site_title)}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="bg-white border border-slate-200 rounded-md p-3 space-y-1">
          <p className="font-semibold text-slate-500 uppercase text-[10px] tracking-wide">Contact</p>
          <p><span className="text-slate-400">Email:</span> <span className="font-medium text-slate-700">{String(result.contact_email ?? "—")}</span></p>
          <p><span className="text-slate-400">Phone:</span> <span className="font-medium text-slate-700">{String(result.phone ?? "—")}</span></p>
          <p><span className="text-slate-400">LinkedIn:</span> {link(result.linkedin_url, "text-blue-600 underline", "Link")}</p>
          <p><span className="text-slate-400">Facebook:</span> {link(result.facebook_url, "text-indigo-600 underline", "Link")}</p>
          <p><span className="text-slate-400">Instagram:</span> {link(result.instagram_url, "text-pink-600 underline", "Link")}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-md p-3 space-y-1">
          <p className="font-semibold text-slate-500 uppercase text-[10px] tracking-wide">Tech Stack (Apify)</p>
          <p><span className="text-slate-400">SSL:</span> {result.ssl ? "✅ Yes" : "❌ No"}</p>
          <p><span className="text-slate-400">Server:</span> {String(result.server ?? "—")}</p>
          <p><span className="text-slate-400">CMS:</span> {String(result.cms ?? "—")}</p>
          <p><span className="text-slate-400">CRM:</span> {String(result.crm ?? "—")}</p>
          {result.verdict && <p><span className="text-slate-400">Verdict:</span> {String(result.verdict)}</p>}
          <div className="pt-1 flex flex-wrap gap-1">
            {techList && techList.length > 0
              ? techList.map((t, i) => <span key={i} className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-medium">{t}</span>)
              : <span className="text-slate-300">none detected</span>}
          </div>
        </div>
        <div className="bg-white border border-violet-200 rounded-md p-3 space-y-1 sm:col-span-2">
          <p className="font-semibold text-violet-500 uppercase text-[10px] tracking-wide flex items-center gap-1">
            🎯 AI Opportunity (Groq)
            {oppScore !== null && (
              <span className={`ml-auto font-bold ${oppScore >= 70 ? "text-green-600" : oppScore >= 50 ? "text-amber-500" : "text-slate-400"}`}>
                {oppScore}/100
              </span>
            )}
          </p>
          <p><span className="text-slate-400">Best angle:</span> {String(result.ai_best_angle ?? "—")}</p>
          <p><span className="text-slate-400">Top gap:</span> {String(result.ai_top_gap ?? "—")}</p>
          <p><span className="text-slate-400">Automation gap:</span> {String(result.ai_automation_gap ?? "—")}</p>
          <p><span className="text-slate-400">Marketing gap:</span> {String(result.ai_marketing_gap ?? "—")}</p>
          <p><span className="text-slate-400">Website gap:</span> {String(result.ai_website_gap ?? "—")}</p>
          <p><span className="text-slate-400">CRM gap:</span> {String(result.ai_crm_gap ?? "—")}</p>
        </div>
      </div>
    </div>
  );
}

export default function B2BCampaignPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [campaignName,     setCampaignName]     = useState("");
  const [industry,         setIndustry]         = useState("");
  const [country,          setCountry]          = useState("");
  const [state,            setState_]           = useState("");
  const [employeesMin,     setEmployeesMin]     = useState("");
  const [employeesMax,     setEmployeesMax]     = useState("");
  const [selectedRoles,    setSelectedRoles]    = useState<string[]>(["Owner", "Founder", "CEO", "COO"]);
  const [service,          setService]          = useState("");
  const [dailyTarget,      setDailyTarget]      = useState("25");
  const [minScore,         setMinScore]         = useState("60");
  const [crmPipeline,      setCrmPipeline]      = useState("");
  const [instantlyCampaign,setInstantlyCampaign]= useState("");

  // ── Pipeline state ──────────────────────────────────────────────────────────
  const [steps,   setSteps]   = useState<PipelineStep[]>(INITIAL_STEPS);
  const [leads,   setLeads]   = useState<Lead[]>([]);
  const [log,     setLog]     = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [expandedPitch, setExpandedPitch] = useState<Record<number, boolean>>({});
  const [expandedFbAds, setExpandedFbAds] = useState<Record<number, boolean>>({});
  const [expandedPageSpeed, setExpandedPageSpeed] = useState<Record<number, boolean>>({});

  // ── History (past runs) ──────────────────────────────────────────────────────
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API}/campaign-history`).then(r => r.json());
      if (res.success) setHistoryList(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryRun = async (id: string) => {
    setShowHistory(false);
    try {
      const res = await fetch(`${API}/campaign-history/${id}`).then(r => r.json());
      if (res.success && res.data) {
        const run = res.data;
        setCampaignName(run.campaignName || "");
        setLeads(run.leads || []);
        setLog(run.logs || []);
        if (run.config) {
          setIndustry(run.config.industry || "");
          setService(run.config.service || "");
          setCountry(run.config.country || "");
          setState_(run.config.state || "");
          setEmployeesMin(run.config.employeesMin || "");
          setEmployeesMax(run.config.employeesMax || "");
          setDailyTarget(run.config.dailyTarget || "25");
          setMinScore(run.config.minScore || "60");
          if (run.config.selectedRoles) setSelectedRoles(run.config.selectedRoles);
        }
      }
    } catch (err) {
      console.error("Failed to load that run:", err);
    }
  };

  // ── WhatsApp (Baileys) connection state ──────────────────────────────────────
  const [showWhatsappPanel, setShowWhatsappPanel] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<string | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState<string | null>(null);
  const [whatsappQr, setWhatsappQr] = useState<string | null>(null);
  const [whatsappError, setWhatsappError] = useState<string | null>(null);
  const [notOnWhatsapp, setNotOnWhatsapp] = useState<Set<string>>(new Set());
  const prevWhatsappStatusRef = useRef<string | null>(null);

  const refreshWhatsappStatus = async () => {
    try {
      const r = await fetch(`${API}/baileys-status`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setWhatsappStatus(data.status);
      setWhatsappPhone(data.phone || null);
      setWhatsappError(null);
      if (data.status === "qr_ready") {
        const qrRes = await fetch(`${API}/baileys-qr`);
        const qrData = await qrRes.json();
        if (qrRes.ok) setWhatsappQr(qrData.qrCode || null);
      } else {
        setWhatsappQr(null);
      }
      if (data.status === "connected" && prevWhatsappStatusRef.current !== "connected") {
        toast({
          title: "WhatsApp Linked",
          description: data.phone ? `Connected as ${data.phone}` : "Device linked successfully",
        });
      }
      prevWhatsappStatusRef.current = data.status;
    } catch (e: unknown) {
      setWhatsappError(e instanceof Error ? e.message : "Failed to check WhatsApp status");
    }
  };

  const restartWhatsappSession = async () => {
    setWhatsappError(null);
    try {
      const r = await fetch(`${API}/baileys-restart`, { method: "POST" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setTimeout(refreshWhatsappStatus, 2000);
    } catch (e: unknown) {
      setWhatsappError(e instanceof Error ? e.message : "Failed to restart session");
    }
  };

  useEffect(() => {
    if (!showWhatsappPanel) return;
    refreshWhatsappStatus();
    const interval = setInterval(refreshWhatsappStatus, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWhatsappPanel]);

  // ── Test Single state ───────────────────────────────────────────────────────
  const [testUrl,      setTestUrl]      = useState("");
  const [testCompany,  setTestCompany]  = useState("");
  const [testRunning,  setTestRunning]  = useState(false);
  const [testResult,   setTestResult]   = useState<Record<string, unknown> | null>(null);
  const [showTestPanel,setShowTestPanel]= useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLog(prev => {
      const next = [...prev, msg];
      setTimeout(() => logRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 30);
      return next;
    });
  };

  const setStep = (id: string, patch: Partial<PipelineStep>) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!campaignName.trim()) errs.campaignName = "Campaign name is required";
    if (!industry.trim()) errs.industry = "Industry is required";
    if (!country.trim())  errs.country  = "Country is required";
    if (!service.trim())  errs.service  = "Service is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toggleRole = (role: string) =>
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);

  // ── Test Single website via Groq ────────────────────────────────────────────
  const runTestSingle = async () => {
    if (!testUrl.trim()) return;
    setTestRunning(true);
    setTestResult(null);
    try {
      const url = testUrl.trim().startsWith("http") ? testUrl.trim() : `https://${testUrl.trim()}`;
      const r = await fetch(`${API}/groq-single`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website:     url,
          companyName: testCompany.trim() || undefined,
          industry:    industry || undefined,
          service:     service  || undefined,
        }),
      });
      if (r.ok) setTestResult(await r.json());
      else      setTestResult({ error: `HTTP ${r.status}` });
    } catch (e: unknown) {
      setTestResult({ error: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setTestRunning(false);
    }
  };

  // ── On-demand real Facebook Ads Library check for a single lead row ────────
  const checkFacebookAds = async (index: number) => {
    const target = leads[index];
    if (!target || target.fb_ads_checking) return;

    setLeads(prev => prev.map((l, i) => i === index ? { ...l, fb_ads_checking: true, fb_ads_error: null } : l));
    try {
      const r = await fetch(`${API}/facebook-ads-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: target.company_name,
          facebookUrl: target.facebook_url || undefined,
          country: target.country || undefined,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setLeads(prev => prev.map((l, i) => i === index ? {
        ...l,
        fb_ads_checking: false,
        fb_ads_checked:  true,
        fb_has_ads:      data.has_active_ads,
        fb_ad_count:     data.ad_count,
        fb_ads_confidence: data.confidence,
        fb_ads_list:     data.ads || null,
        fb_oldest_ad_start_date: data.oldest_ad_start_date || null,
      } : l));
    } catch (e: unknown) {
      setLeads(prev => prev.map((l, i) => i === index ? {
        ...l,
        fb_ads_checking: false,
        fb_ads_error: e instanceof Error ? e.message : "Check failed",
      } : l));
    }
  };

  // ── Send WhatsApp via Baileys (self-hosted number, custom AI pitch text) ────
  // Only safe for leads who've already messaged +916291317019 first — using it
  // for cold outreach risks that number getting banned, since WhatsApp restricts
  // free-form business-initiated messages.
  const sendViaBaileys = async (index: number) => {
    const target = leads[index];
    if (!target?.phone || target.baileys_sending) return;
    const text = target.ai_whatsapp_message || target.ai_first_line;
    if (!text) return;

    setLeads(prev => prev.map((l, i) => i === index ? { ...l, baileys_sending: true, baileys_error: null } : l));
    try {
      const r = await fetch(`${API}/baileys-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: target.phone, text }),
      });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || `HTTP ${r.status}`);
      setLeads(prev => prev.map((l, i) => i === index ? { ...l, baileys_sending: false, baileys_sent: true } : l));
    } catch (e: unknown) {
      setLeads(prev => prev.map((l, i) => i === index ? {
        ...l,
        baileys_sending: false,
        baileys_error: e instanceof Error ? e.message : "Send failed",
      } : l));
    }
  };

  // ── Proactively check WhatsApp reachability for a finished campaign's leads ──
  // Fired ONCE, right after the campaign's lead list is final — never on every
  // incremental setLeads() update while a campaign is streaming in results,
  // and never one query per lead. Both would look like automated enumeration
  // to WhatsApp's abuse detection, which has already banned a session here.
  const checkWhatsappReachability = async (finalLeads: Lead[]) => {
    const phones = Array.from(new Set(
      finalLeads.filter(l => l.phone && (l.ai_whatsapp_message || l.ai_first_line)).map(l => l.phone as string)
    ));
    if (!phones.length) return;
    try {
      const statusRes = await fetch(`${API}/baileys-status`);
      const statusData = await statusRes.json();
      if (statusData.status !== "connected") return;
      const r = await fetch(`${API}/baileys-check-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phones }),
      });
      if (!r.ok) return;
      const data = await r.json();
      const notReachable = new Set<string>(
        (data.results as { phone: string; exists: boolean }[]).filter(x => !x.exists).map(x => x.phone)
      );
      setNotOnWhatsapp(notReachable);
    } catch {
      // best-effort UI hint only — the click-time check inside sendViaBaileys still guards actual sends
    }
  };

  // ── Main pipeline ───────────────────────────────────────────────────────────
  const runCampaign = async () => {
    if (!validate()) return;
    setRunning(true);
    setLeads([]);
    setLog([]);
    setSteps(INITIAL_STEPS);
    setNotOnWhatsapp(new Set());

    const target         = Math.min(parseInt(dailyTarget) || 25, 50);
    const scoreThreshold = parseInt(minScore) || 60;

    // ── STEP 1: Validate ────────────────────────────────────────────────────
    setStep("validate", { status: "running" });
    addLog(`🚀 Campaign: "${campaignName}" | ${industry} | ${country}${state ? `, ${state}` : ""}`);
    addLog(`   Roles: ${selectedRoles.join(", ")}`);
    addLog(`   Target: ${target} leads | Min score: ${scoreThreshold}`);
    await new Promise(r => setTimeout(r, 300));
    setStep("validate", { status: "done", message: "Parameters ready" });

    // ── STEP 2: Lusha company discovery + Hunter.io contact search ────────
    setStep("discover", { status: "running" });
    addLog(`🔍 Searching Lusha Directory for "${industry}" in ${country}${state ? `, ${state}` : ""}...`);

    let rawLeads: Lead[] = [];
    try {
      // 2a: find companies via Lusha discovery engine
      const compRes = await fetch(`${API}/apollo-company-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry, country, state: state || undefined, perPage: target,
          employeesMin: employeesMin || undefined, employeesMax: employeesMax || undefined,
        }),
      });
      const compData = await compRes.json();
      if (!compRes.ok) throw new Error(compData.error || "Lusha company search failed");
      if (compData.employeeFilterApplied) {
        addLog(`   👥 Employee range ${employeesMin || "-"}-${employeesMax || "-"} (informational only, nothing excluded): ${compData.inRangeCount} in range, ${compData.outOfRangeCount} out of range, ${compData.unknownHeadcountCount} unknown headcount — all ${compData.discoveredBeforeEmployeeFilter} companies still included below.`);
      }

      type CompanyResult = {
        company_name: string;
        domain: string | null;
        phone: string | null;
        industry: string;
        website: string | null;
      };
      const companies: CompanyResult[] = compData.companies || [];
      addLog(`✅ Lusha found ${companies.length} companies`);

      if (!companies.length) {
        addLog("⚠ No companies found — try a different industry or location");
        setRunning(false);
        return;
      }

      // 2b: for each company, search Hunter.io → fallback Prospeo for decision-maker contacts
      addLog(`🔍 Searching Hunter.io + Prospeo for contacts at ${Math.min(companies.length, target)} companies...`);
      const perCompanyLimit = Math.max(1, Math.ceil(target / companies.length));
      type ContactResult = { name: string; title: string; email: string | null; phone: string | null; linkedinUrl: string | null; source?: string };

      for (const company of companies.slice(0, target)) {
        if (rawLeads.length >= target) break;
        let contacts: ContactResult[] = [];
        try {
          // First: Hunter.io domain search
          const dmRes = await fetch(`${API}/apollo-people-search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companyName:  company.company_name,
              domain:       company.domain || undefined,
              roles:        selectedRoles,
              maxContacts:  perCompanyLimit,
            }),
          });
          const dmData = await dmRes.json();
          contacts = dmData.contacts || [];
          if (contacts.length > 0) {
            addLog(`   • ${company.company_name}: ${contacts.length} contact(s) [Hunter.io]`);
          }
        } catch { /* ignore, try Prospeo below */ }

        // Fallback: Prospeo search-person + enrich-person (returns name + email + phone + LinkedIn)
        if (contacts.length === 0) {
          try {
            const prospeoRes = await fetch(`${API}/prospeo-company-search`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                companyName: company.company_name,
                website:     company.website || undefined,
              }),
            });
            const prospeoData = await prospeoRes.json();
            if (prospeoRes.ok && !prospeoData.code) {
              contacts = (prospeoData.contacts || []).slice(0, 2);
              if (contacts.length > 0) {
                addLog(`   • ${company.company_name}: ${contacts.length} contact(s) [Prospeo]`);
              }
            } else if (prospeoData.code === "NO_CREDITS") {
              addLog(`⚠ Prospeo credits exhausted`);
            }
          } catch { /* ignore */ }
        }

        if (contacts.length > 0) {
          const newLeads: Lead[] = contacts.map(c => ({
            company_name: company.company_name,
            contact_name: c.name        || null,
            job_title:    c.title       || null,
            email:        c.email       || null,
            phone:        c.phone       || company.phone || null,
            linkedin_url: c.linkedinUrl || null,
            website:      company.website || null,
            domain:       company.domain  || null,
            industry:     company.industry || industry,
            country,
            state:        state || null,
            source:       c.source || "Hunter.io",
          }));
          rawLeads = [...rawLeads, ...newLeads];
        } else if (company.phone) {
          // No contacts from either source — keep company-level entry with Lusha phone
          rawLeads.push({
            company_name: company.company_name,
            contact_name: null,
            phone:        company.phone,
            website:      company.website || null,
            domain:       company.domain  || null,
            industry:     company.industry || industry,
            country,
            state:        state || null,
            source:       "Lusha",
          });
        }
        await new Promise(r => setTimeout(r, 150));
      }

      setStep("discover", { status: "done", count: rawLeads.length });
      addLog(`✅ Discovery: ${rawLeads.length} leads from ${companies.length} companies`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStep("discover", { status: "error", message: msg });
      addLog(`❌ Discovery failed: ${msg}`);
      setRunning(false);
      return;
    }

    if (!rawLeads.length) {
      addLog("⚠ No prospects found — try different industry/location");
      setRunning(false);
      return;
    }

    // ── STEP 3: Dedup by email, then by company+name ────────────────────────
    setStep("dedup", { status: "running" });
    await new Promise(r => setTimeout(r, 200));
    const seen    = new Set<string>();
    const deduped = rawLeads.filter(l => {
      const key = l.email
        ? l.email.toLowerCase().trim()
        : `${(l.company_name || "").toLowerCase().trim()}::${(l.contact_name || "").toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const dupCount = rawLeads.length - deduped.length;
    setStep("dedup", { status: "done", count: deduped.length, message: `${dupCount} duplicates removed` });
    addLog(`✅ ${deduped.length} unique leads after dedup (${dupCount} removed)`);

    // ── STEP 4: Lusha Enrichment — ALL contacts with a name ─────────────────
    setStep("lusha", { status: "running" });
    const needEnrich = deduped.filter(l => l.contact_name);
    addLog(`🔑 Lusha enriching ${needEnrich.length} contacts (email + phone)...`);
    const enriched = [...deduped];
    let lushaCount = 0;

    for (let i = 0; i < enriched.length; i++) {
      const lead = enriched[i];
      if (!lead.contact_name) continue;

      const parts     = (lead.contact_name || "").trim().split(/\s+/);
      const firstName = parts[0] || "";
      const lastName  = parts.slice(1).join(" ") || "";
      if (!firstName || !lastName) continue;

      try {
        const res = await fetch(`${API}/lusha-enrich`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            company: lead.company_name,
            ...(lead.linkedin_url ? { linkedinUrl: lead.linkedin_url } : {}),
          }),
        });
        const data = await res.json();
        if (data.code === "NO_CREDITS" || data.code === "QUOTA_EXCEEDED") {
          addLog(`⚠ Lusha credits exhausted after ${lushaCount} contacts`);
          break;
        }
        if (data.code === "INVALID_API_KEY") { addLog("❌ Lusha API key invalid"); break; }
        if (res.ok && (data.email || data.phone)) {
          enriched[i] = {
            ...lead,
            email:        data.email        || lead.email,
            phone:        data.phone        || lead.phone,
            linkedin_url: data.linkedinUrl  || lead.linkedin_url,
            phone_source: data.phone ? "Lusha" : lead.phone_source,
            source:       data.email ? "Lusha" : lead.source,
          };
          lushaCount++;
          addLog(`✅ Lusha: ${lead.contact_name} → ${data.email || "(no email)"}${data.phone ? ` | ${data.phone}` : ""}`);
        } else {
          addLog(`— Lusha: ${lead.contact_name} @ ${lead.company_name}: no data`);
        }
      } catch {
        addLog(`⚠ Lusha failed for ${lead.contact_name}`);
      }
      await new Promise(r => setTimeout(r, 400));
    }

    setStep("lusha", { status: "done", count: lushaCount, message: `${lushaCount} contacts enriched` });
    addLog(`✅ Lusha enriched ${lushaCount} / ${needEnrich.length} contacts`);

    // ── STEP 5: Email Verification (Apify) ──────────────────────────────────
    setStep("email_verify", { status: "running" });
    const withEmail = enriched.filter(l => l.email);
    addLog(`📧 Verifying ${withEmail.length} emails with Apify...`);
    let validCount = 0, riskyCount = 0, invalidCount = 0;
    const verified = [...enriched];

    for (let i = 0; i < verified.length; i++) {
      const lead = verified[i];
      if (!lead.email) { verified[i] = { ...lead, email_status: null }; continue; }
      try {
        const res = await fetch(`${API}/verify-email-apify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: lead.email }),
        });
        const data = await res.json();
        if (data.code === "API_KEY_MISSING") {
          addLog("⚠ Apify token missing — skipping verification");
          verified[i] = { ...lead, email_status: "valid" };
          validCount++;
          continue;
        }
        const st = data.status as "valid" | "risky" | "invalid";
        verified[i] = { ...lead, email_status: st };
        if (st === "valid")   { validCount++;   addLog(`✅ ${lead.email} — valid`); }
        else if (st === "risky")  { riskyCount++;  addLog(`⚠ ${lead.email} — risky`); }
        else                 { invalidCount++; addLog(`❌ ${lead.email} — invalid`); }
      } catch {
        verified[i] = { ...lead, email_status: "valid" };
        validCount++;
      }
      await new Promise(r => setTimeout(r, 200));
    }

    setStep("email_verify", {
      status: "done",
      message: `${validCount} valid · ${riskyCount} risky · ${invalidCount} invalid`,
    });
    addLog(`✅ Email verify: ${validCount} valid, ${riskyCount} risky, ${invalidCount} invalid`);

    // ── STEP 6: Website Audit (PageSpeed + SSL + HTML features) ────────────────
    setStep("website_audit", { status: "running" });
    const leadsWithSite = verified.filter(l => l.website);
    addLog(`🌐 Auditing ${leadsWithSite.length} websites (PageSpeed · SSL · features)...`);

    // Collect unique websites (one audit per domain, shared across contacts)
    const uniqueSites = Array.from(new Set(leadsWithSite.map(l => l.website!)));
    const auditMap = new Map<string, Record<string, unknown>>();

    for (let i = 0; i < uniqueSites.length; i += 3) {
      const batch = uniqueSites.slice(i, i + 3);
      await Promise.all(batch.map(async site => {
        try {
              // Find a lead for this site to pass company context to Groq
          const siteLeadCtx = leadsWithSite.find(l => l.website === site);
          const r = await fetch(`${API}/website-full-audit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              website:      site,
              companyName:  siteLeadCtx?.company_name || "",
              industry:     siteLeadCtx?.industry || industry,
              service,
            }),
          });
          if (r.ok) auditMap.set(site, await r.json());
        } catch { /* skip */ }
      }));
      addLog(`   Audited ${Math.min((i + 3), uniqueSites.length)}/${uniqueSites.length} sites...`);
    }

    const audited: Lead[] = verified.map(lead => {
      if (!lead.website) return lead;
      const a = auditMap.get(lead.website);
      if (!a) return lead;
      return {
        ...lead,
        ssl:                 a.ssl as boolean,
        pagespeed_mobile:    a.pagespeed_mobile as number | null,
        pagespeed_desktop:   a.pagespeed_desktop as number | null,
        accessibility_mobile:  a.accessibility_mobile as number | null,
        accessibility_desktop: a.accessibility_desktop as number | null,
        best_practices_mobile: a.best_practices_mobile as number | null,
        best_practices_desktop:a.best_practices_desktop as number | null,
        seo_score:           a.seo_score as number | null,
        seo_desktop:         a.seo_desktop as number | null,
        employee_count:      lead.employee_count ?? (a.employee_count as number | string | null),
        founded_year:        a.founded_year as number | null,
        company_description: a.company_description as string | null,
        has_chatbot:         a.has_chatbot as boolean,
        has_booking:         a.has_booking as boolean,
        has_analytics:       a.has_analytics as boolean,
        has_meta_pixel:      a.has_meta_pixel as boolean,
        has_cta:             a.has_cta as boolean,
        website_audit_score: a.website_audit_score as number,
        social_score:        a.social_score as number,
        tech_detected:       a.tech_detected as string[],
        cms:                 a.cms as string | null,
        crm_tool:            a.crm as string | null,
        // Fill email: Apify structured data > regex > existing
        email:               lead.email || (a.contact_email as string | null),
        // Fill phone from Apify structured data
        phone:               lead.phone || (a.phone as string | null),
        // Fill social from Apify structured data (Apify wins, fall back to existing)
        linkedin_url:        lead.linkedin_url || (a.linkedin_url as string | null),
        facebook_url:        (a.facebook_url  as string | null) || lead.facebook_url,
        instagram_url:       (a.instagram_url as string | null) || lead.instagram_url,
        // AI opportunity from Groq (populated during audit)
        ai_summary:           (a.ai_summary           as string | null) || null,
        ai_best_angle:        (a.ai_best_angle        as string | null) || null,
        ai_top_gap:           (a.ai_top_gap           as string | null) || null,
        ai_opportunity_score: (a.ai_opportunity_score as number | null) ?? null,
        ai_best_service:      (a.ai_best_service      as string | null) || null,
        ai_pain_points:       (a.ai_pain_points        as string[] | null) || null,
        ai_priority:          (a.ai_priority          as "hot" | "warm" | "cold" | null) || null,
        ai_first_line:        (a.ai_first_line        as string | null) || null,
        ai_email_subject:     (a.ai_email_subject     as string | null) || null,
        ai_email_body:        (a.ai_email_body        as string | null) || null,
        ai_linkedin_message:  (a.ai_linkedin_message  as string | null) || null,
        ai_whatsapp_message:  (a.ai_whatsapp_message  as string | null) || null,
        ai_error:             (a.groq_error           as string | null) || null,
      };
    });

    setStep("website_audit", { status: "done", count: auditMap.size, message: `${auditMap.size} sites audited` });
    addLog(`✅ Website audit done: ${auditMap.size} sites`);

    // ── STEP 7: Social Audit (data already in audited results) ──────────────────
    setStep("social_audit", { status: "running" });
    await new Promise(r => setTimeout(r, 300));
    const liCount = audited.filter(l => l.linkedin_url).length;
    const fbCount = audited.filter(l => l.facebook_url).length;
    const igCount = audited.filter(l => l.instagram_url).length;
    setStep("social_audit", { status: "done", message: `LI:${liCount} · FB:${fbCount} · IG:${igCount}` });
    addLog(`✅ Social audit: LinkedIn ${liCount} · Facebook ${fbCount} · Instagram ${igCount}`);

    // ── STEP 8: Tech Stack Detection (data already in audited results) ──────────
    setStep("tech_stack", { status: "running" });
    await new Promise(r => setTimeout(r, 300));
    const wpCount    = audited.filter(l => l.cms === "WordPress").length;
    const shopCount  = audited.filter(l => l.cms === "Shopify").length;
    const crmCount   = audited.filter(l => l.crm_tool).length;
    const ga4Count   = audited.filter(l => l.tech_detected?.includes("GA4")).length;
    const pixCount   = audited.filter(l => l.tech_detected?.includes("Meta Pixel")).length;
    const techSites  = audited.filter(l => l.tech_detected && l.tech_detected.length > 0).length;
    setStep("tech_stack", { status: "done", count: techSites, message: `WP:${wpCount} Shopify:${shopCount} CRM:${crmCount}` });
    addLog(`✅ Tech stacks: WordPress:${wpCount} · Shopify:${shopCount} · CRM:${crmCount} · GA4:${ga4Count} · Pixel:${pixCount}`);

    // ── STEP 9: AI Opportunity Analysis (Groq — already done during website audit) ─
    setStep("ai_analysis", { status: "running" });
    await new Promise(r => setTimeout(r, 200));
    const aiHit  = audited.filter(l => l.ai_best_angle || l.ai_opportunity_score != null);
    const aiMiss = audited.filter(l => !l.ai_best_angle && l.ai_opportunity_score == null && l.website);
    addLog(`🧠 Groq AI analysis: ${aiHit.length} companies enriched, ${aiMiss.length} skipped (no website)`);
    aiHit.slice(0, 5).forEach(l => {
      if (l.ai_best_angle) addLog(`   🎯 ${l.company_name}: ${l.ai_best_angle}`);
    });
    setStep("ai_analysis", { status: "done", count: aiHit.length, message: `${aiHit.length} analysed via Groq` });
    addLog(`✅ AI analysis: ${aiHit.length} opportunity reports from Groq`);

    const aiEnriched: Lead[] = audited; // AI data already merged during audit step

    // ── STEP 10: Score & Qualify ─────────────────────────────────────────────────
    setStep("score", { status: "running" });
    await new Promise(r => setTimeout(r, 300));
    addLog(`🤖 Scoring leads (threshold: ${scoreThreshold}/100)...`);

    const finalLeads: Lead[] = aiEnriched.map(lead => {
      let score = 0;

      // 1. Company & Website Presence (25 pts)
      if (lead.company_name)               score += 5;
      if (lead.domain || lead.website)     score += 10;
      if (lead.industry)                   score += 5;
      if (lead.country)                    score += 5;

      // 2. Phone & Contact Person (25 pts)
      if (lead.phone)                      score += 15;
      if (lead.contact_name)              score += 10;
      if (lead.job_title)                  score += 5;

      // 3. Email & Verification (25 pts)
      if (lead.email) {
        score += 10;
        if (lead.email_status === "valid")    score += 15;
        else if (lead.email_status === "risky") score += 8;
        else score += 5; // Present but unverified
      }

      // 4. Digital Footprint & Website Audit Signals (20 pts)
      // Incorporates SSL (+5), Analytics/Pixel (+5), Mobile Speed/Audit Score (+5), Social channels (+5)
      if (lead.ssl) score += 5;
      if (lead.has_analytics || lead.has_meta_pixel) score += 5;
      if ((lead.website_audit_score ?? 0) >= 50) score += 5;
      else if (lead.has_cta || lead.has_chatbot || lead.has_booking) score += 3;
      
      const socialCount = [lead.linkedin_url, lead.facebook_url, lead.instagram_url].filter(Boolean).length;
      score += Math.min(socialCount * 5, 10); // Up to 10 pts for social channels
      if (lead.cms || lead.crm_tool || (lead.tech_detected && lead.tech_detected.length > 0)) score += 5;

      // 5. Source Reliability & AI Buying Intent (10 pts)
      if (["Lusha", "Hunter.io", "Prospeo"].includes(lead.source || "")) score += 5;
      if ((lead.ai_opportunity_score ?? 0) >= 50) score += 5;

      // Cap at 100 max
      score = Math.min(score, 100);

      // Status Qualification Decision
      const hasReachability = !!(lead.email || lead.phone);
      let status: Lead["status"] = "skipped";
      
      if (!lead.company_name || !hasReachability) {
        status = "skipped";
      } else if (score >= scoreThreshold || (lead.email && lead.phone) || (lead.email_status === "valid")) {
        status = "qualified";
      } else if (score >= Math.max(scoreThreshold - 25, 40) || lead.phone || lead.email) {
        status = "review";
      } else {
        status = "skipped";
      }

      return { ...lead, lead_score: score, status };
    });

    const qCount = finalLeads.filter(l => l.status === "qualified").length;
    const rCount = finalLeads.filter(l => l.status === "review").length;
    const sCount = finalLeads.filter(l => l.status === "skipped").length;

    setStep("score", { status: "done", count: qCount, message: `${qCount} qualified · ${rCount} review` });
    addLog(`✅ Done — ${qCount} qualified · ${rCount} review · ${sCount} skipped`);

    setLeads(finalLeads);
    checkWhatsappReachability(finalLeads);
    setRunning(false);

    // Save a snapshot so this run stays browsable as history after a refresh/close — the whole
    // campaign runs client-side, so this is the only point a completed run's data reaches the
    // backend at all.
    try {
      await fetch(`${API}/campaign-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          config: { industry, service, country, state, employeesMin, employeesMax, dailyTarget, minScore, selectedRoles },
          logs: log,
          leads: finalLeads,
          qualifiedCount: qCount,
          reviewCount: rCount,
          skippedCount: sCount,
        }),
      });
    } catch (err) {
      console.error("Failed to save campaign history snapshot:", err);
    }
  };

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const downloadCSV = () => {
    if (!leads.length) return;
    const headers = [
      "Status", "Score", "Company", "Domain", "Industry", "Country",
      "Contact", "Title", "Email", "Email Status", "Phone",
      "LinkedIn", "Facebook", "Instagram",
      "SSL", "Mobile PageSpeed", "Has Chatbot", "Has Booking", "Has Analytics", "Has Meta Pixel",
      "Website Score", "CMS", "CRM Tool", "Tech Stack",
      "AI Best Angle", "AI Top Gap", "AI Opportunity Score", "Source",
    ];
    const rows = leads.map(l => [
      l.status || "",             l.lead_score ?? "",         l.company_name || "",
      l.domain || "",             l.industry || "",           l.country || "",
      l.contact_name || "",       l.job_title || "",          l.email || "",
      l.email_status || "",       l.phone || "",
      l.linkedin_url || "",       l.facebook_url || "",       l.instagram_url || "",
      l.ssl ? "Yes" : "No",       l.pagespeed_mobile ?? "",
      l.has_chatbot ? "Yes" : "", l.has_booking ? "Yes" : "", l.has_analytics ? "Yes" : "", l.has_meta_pixel ? "Yes" : "",
      l.website_audit_score ?? "", l.cms || "",               l.crm_tool || "",
      (l.tech_detected || []).join("; "),
      l.ai_best_angle || "",      l.ai_top_gap || "",         l.ai_opportunity_score ?? "",
      l.source || "",
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `b2b-campaign-${campaignName || "results"}.csv`;
    a.click();
  };

  const qualifiedCount = leads.filter(l => l.status === "qualified").length;
  const reviewCount    = leads.filter(l => l.status === "review").length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
            ← Back
          </button>
          <div className="w-px h-4 bg-slate-700" />
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">Kyptronix LLP</div>
            <div className="font-semibold text-base">B2B Campaign Intelligence</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400">Lusha v2 · Hunter.io · Prospeo · PageSpeed · Gemini AI</div>
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { const next = !showHistory; setShowHistory(next); if (next) loadHistory(); }}
              className="h-7 text-xs bg-transparent border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              🕘 History
            </Button>
            {showHistory && (
              <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 text-slate-900">
                {loadingHistory && <p className="text-xs text-slate-500 p-2">Loading past runs…</p>}
                {!loadingHistory && historyList.length === 0 && (
                  <p className="text-xs text-slate-500 p-2">No past runs yet.</p>
                )}
                {historyList.map((h) => (
                  <button
                    key={h._id}
                    onClick={() => openHistoryRun(h._id)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 text-xs border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{h.campaignName || "(untitled)"}</span>
                      <span className="text-emerald-600 font-medium">{h.qualifiedCount} qualified</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">{new Date(h.createdAt).toLocaleString()} · {h.config?.industry || ""}{h.config?.country ? ` · ${h.config.country}` : ""}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowWhatsappPanel(true)}
            className="h-7 text-xs bg-transparent border-slate-600 text-slate-200 hover:bg-slate-800"
          >
            💬 WhatsApp
          </Button>
        </div>
      </div>

      {showWhatsappPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowWhatsappPanel(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">WhatsApp Connection</h3>
              <button onClick={() => setShowWhatsappPanel(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            {whatsappError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded p-2 mb-3">{whatsappError}</div>
            )}

            {whatsappStatus === "connected" ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-sm font-semibold text-emerald-700">Connected</div>
                {whatsappPhone && <div className="text-xs text-slate-500 mt-1">{whatsappPhone}</div>}
              </div>
            ) : whatsappQr ? (
              <div className="text-center">
                <img src={whatsappQr} alt="WhatsApp QR Code" className="mx-auto w-56 h-56 border border-slate-200 rounded" />
                <p className="text-xs text-slate-500 mt-3">
                  Open WhatsApp on your phone → Settings → Linked Devices → Link a Device, then scan this code.
                </p>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Waiting for scan — refreshes every 5s…
                </p>
              </div>
            ) : (!whatsappStatus || whatsappStatus === "connecting") ? (
              <div className="text-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500 mx-auto mb-3" />
                <div className="text-sm text-slate-500">
                  {whatsappStatus === "connecting" ? "Linking device…" : "Checking connection…"}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-sm text-slate-500 mb-3">Status: {whatsappStatus}</div>
                <Button size="sm" onClick={restartWhatsappSession} className="text-xs">
                  Generate QR Code
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* Campaign Form */}
        <Card className="border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Campaign Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Campaign Name <span className="text-red-500">*</span>
                </Label>
                <Input value={campaignName} onChange={e => { setCampaignName(e.target.value); setErrors(p => ({ ...p, campaignName: "" })); }}
                  placeholder="Q3 UAE SMB Outreach"
                  className={`h-9 text-sm ${errors.campaignName ? "border-red-400" : ""}`} />
                {errors.campaignName && <p className="text-xs text-red-500">{errors.campaignName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Industry <span className="text-red-500">*</span>
                </Label>
                <Input value={industry} onChange={e => { setIndustry(e.target.value); setErrors(p => ({ ...p, industry: "" })); }}
                  placeholder="e.g. beauty salon, restaurant, retail"
                  className={`h-9 text-sm ${errors.industry ? "border-red-400" : ""}`} />
                {errors.industry && <p className="text-xs text-red-500">{errors.industry}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Service Offered <span className="text-red-500">*</span>
                </Label>
                <Input value={service} onChange={e => { setService(e.target.value); setErrors(p => ({ ...p, service: "" })); }}
                  placeholder="e.g. website redesign, SEO, CRM"
                  className={`h-9 text-sm ${errors.service ? "border-red-400" : ""}`} />
                {errors.service && <p className="text-xs text-red-500">{errors.service}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Input value={country} onChange={e => { setCountry(e.target.value); setErrors(p => ({ ...p, country: "" })); }}
                  placeholder="e.g. United Arab Emirates, United Kingdom"
                  className={`h-9 text-sm ${errors.country ? "border-red-400" : ""}`} />
                {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">State / Region</Label>
                <Input value={state} onChange={e => setState_(e.target.value)}
                  placeholder="e.g. Dubai, London" className="h-9 text-sm" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Employee Range</Label>
                <div className="flex gap-2 items-center">
                  <Input value={employeesMin} onChange={e => setEmployeesMin(e.target.value)}
                    placeholder="Min" type="number" className="h-9 text-sm w-24" />
                  <span className="text-slate-400 text-sm">–</span>
                  <Input value={employeesMax} onChange={e => setEmployeesMax(e.target.value)}
                    placeholder="Max" type="number" className="h-9 text-sm w-24" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Target Leads</Label>
                <Input value={dailyTarget} onChange={e => setDailyTarget(e.target.value)}
                  type="number" placeholder="25" className="h-9 text-sm" />
                <p className="text-xs text-slate-400">Max 50 per run</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Min Qualify Score</Label>
                <Input value={minScore} onChange={e => setMinScore(e.target.value)}
                  type="number" placeholder="60" className="h-9 text-sm" />
                <p className="text-xs text-slate-400">Out of 100</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">CRM Pipeline</Label>
                <Input value={crmPipeline} onChange={e => setCrmPipeline(e.target.value)}
                  placeholder="e.g. New Leads" className="h-9 text-sm" />
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Instantly Campaign ID</Label>
                <Input value={instantlyCampaign} onChange={e => setInstantlyCampaign(e.target.value)}
                  placeholder="Paste your Instantly campaign ID" className="h-9 text-sm" />
              </div>
            </div>

            {/* Decision Roles */}
            <div className="mt-5 space-y-2">
              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Target Decision Roles
              </Label>
              <div className="flex flex-wrap gap-2">
                {DECISION_ROLES.map(role => (
                  <label key={role}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-xs font-medium transition-colors select-none ${
                      selectedRoles.includes(role)
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}>
                    <Checkbox
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                      className="h-3 w-3"
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>

            {/* Run button */}
            <div className="mt-6 flex gap-3 flex-wrap">
              <Button onClick={runCampaign} disabled={running}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                {running
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Running Pipeline...</>
                  : <><Play className="h-4 w-4" />Run Campaign</>}
              </Button>
              {leads.length > 0 && (
                <Button variant="outline" onClick={downloadCSV} className="gap-2">
                  <Download className="h-4 w-4" />Export CSV
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowTestPanel(p => !p)} className="gap-2 ml-auto text-slate-600">
                🔬 {showTestPanel ? "Hide" : "Test Single"}
              </Button>
            </div>

            {/* ── Test Single Panel ── */}
            {showTestPanel && (
              <div className="mt-4 border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Test Single Website via Groq</p>
                <div className="flex gap-2 flex-wrap">
                  <Input
                    placeholder="https://example.com"
                    value={testUrl}
                    onChange={e => setTestUrl(e.target.value)}
                    className="flex-1 min-w-[200px] text-sm h-8"
                  />
                  <Input
                    placeholder="Company name (optional)"
                    value={testCompany}
                    onChange={e => setTestCompany(e.target.value)}
                    className="flex-1 min-w-[160px] text-sm h-8"
                  />
                  <Button size="sm" onClick={runTestSingle} disabled={testRunning || !testUrl.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 h-8">
                    {testRunning ? <><Loader2 className="h-3 w-3 animate-spin" />Analysing...</> : <>🔬 Analyse</>}
                  </Button>
                </div>

                {testResult !== null && (
                  <SingleTestResult result={testResult} />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active campaign banner */}
        {(running || leads.length > 0) && campaignName && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <span className="font-semibold">Campaign:</span>
            <span>{campaignName}</span>
            <span className="text-blue-400">·</span>
            <span className="text-blue-600">{industry} · {country}{state ? `, ${state}` : ""}</span>
            {leads.length > 0 && <span className="ml-auto text-xs text-blue-500">{leads.filter(l=>l.status==="qualified").length} qualified / {leads.length} total</span>}
          </div>
        )}

        {/* Pipeline Progress + Log */}
        {(running || leads.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Steps */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Pipeline Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-1">
                {steps.map((step, idx) => (
                  <div key={step.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      step.status === "running" ? "bg-blue-50" :
                      step.status === "done"    ? "bg-green-50" :
                      step.status === "error"   ? "bg-red-50"   : ""
                    }`}>
                    <div className="flex-shrink-0 w-5">
                      {step.status === "running" && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                      {step.status === "done"    && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {step.status === "error"   && <XCircle className="h-4 w-4 text-red-500" />}
                      {step.status === "skipped" && <ChevronRight className="h-4 w-4 text-slate-300" />}
                      {step.status === "idle"    && (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-200 flex items-center justify-center">
                          <span className="text-[9px] text-slate-400 font-bold">{idx + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-xs ${
                        step.status === "running" ? "text-blue-700" :
                        step.status === "done"    ? "text-green-700" :
                        step.status === "error"   ? "text-red-700"   :
                        "text-slate-500"
                      }`}>{step.label}</div>
                      {step.message && <div className="text-xs text-slate-400 truncate">{step.message}</div>}
                    </div>
                    {step.count != null && (
                      <Badge className="text-xs bg-slate-100 text-slate-600 font-mono">{step.count}</Badge>
                    )}
                    <div className="text-xs text-slate-300 hidden sm:block">{step.tool}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Log */}
            <Card className="border-slate-200">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Live Log</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div ref={logRef} className="bg-slate-950 rounded-b-lg h-80 overflow-y-auto p-3 space-y-0.5">
                  {log.map((line, i) => (
                    <div key={i} className={`text-xs font-mono ${
                      line.startsWith("✅") ? "text-green-400" :
                      line.startsWith("❌") ? "text-red-400" :
                      line.startsWith("⚠")  ? "text-amber-400" :
                      line.startsWith("🎯") || line.startsWith("🔑") || line.startsWith("📧") || line.startsWith("🤖")
                        ? "text-blue-300" : "text-slate-400"
                    }`}>{line}</div>
                  ))}
                  {running && <div className="text-xs font-mono text-indigo-400 animate-pulse">● running...</div>}
                  {!running && !log.length && (
                    <div className="text-xs font-mono text-slate-600">Waiting for campaign to start...</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary chips */}
        {leads.length > 0 && !running && (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> {qualifiedCount} Qualified
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" /> {reviewCount} Review
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500">
              <Clock className="h-3.5 w-3.5" /> {leads.length - qualifiedCount - reviewCount} Skipped
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500">
              <Mail className="h-3.5 w-3.5" /> {leads.filter(l => l.email).length} with email
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500">
              <Phone className="h-3.5 w-3.5" /> {leads.filter(l => l.phone).length} with phone
            </div>
          </div>
        )}

        {/* Results table */}
        {leads.length > 0 && (
          <Card className="bg-white border-slate-200 shadow-sm text-slate-900 rounded-xl overflow-hidden">
            <CardHeader className="bg-white pb-3 border-b border-slate-200 text-slate-900">
              <CardTitle className="text-sm font-semibold flex items-center justify-between text-slate-900">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  {campaignName} — {leads.length} prospects found
                </span>
                <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-1 h-7 text-xs bg-white text-slate-700 hover:bg-slate-100 border-slate-300">
                  <Download className="h-3 w-3" />CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="overflow-x-auto bg-white">
                <Table className="bg-white">
                  <TableHeader className="bg-slate-100/90">
                    <TableRow className="bg-slate-100/90 border-b border-slate-200">
                      <TableHead className="text-xs text-slate-800 font-bold uppercase tracking-wider">Status</TableHead>
                      <TableHead className="text-xs text-slate-800 font-bold uppercase tracking-wider">Score</TableHead>
                      <TableHead className="text-xs text-slate-800 font-bold uppercase tracking-wider">Company</TableHead>
                      <TableHead className="text-xs text-slate-800 font-bold uppercase tracking-wider">Email</TableHead>
                      <TableHead className="text-xs text-slate-800 font-bold uppercase tracking-wider">Phone</TableHead>
                      <TableHead className="text-xs text-slate-800 font-bold uppercase tracking-wider">Social</TableHead>
                      <TableHead className="text-xs text-slate-800 font-bold uppercase tracking-wider">Tech Stack</TableHead>
                      <TableHead className="text-xs text-slate-800 font-bold uppercase tracking-wider">AI Opportunity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white divide-y divide-slate-200">
                    {leads.map((lead, i) => (
                      <TableRow key={i} className={`transition-colors border-b border-slate-100 ${
                        lead.status === "qualified" ? "bg-emerald-50/50 hover:bg-emerald-50" :
                        lead.status === "review"    ? "bg-amber-50/40 hover:bg-amber-50/70" :
                        "bg-white hover:bg-slate-50"
                      }`}>
                        <TableCell className="bg-transparent">
                          {lead.status === "qualified" && <Badge className="text-xs bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">Qualified</Badge>}
                          {lead.status === "review"    && <Badge className="text-xs bg-amber-100 text-amber-800 font-semibold border border-amber-300">Review</Badge>}
                          {lead.status === "skipped"   && <Badge className="text-xs bg-slate-100 text-slate-600 border border-slate-300">Skipped</Badge>}
                        </TableCell>

                        <TableCell className="bg-transparent">
                          <span className={`text-xs font-bold font-mono ${
                            (lead.lead_score ?? 0) >= 75 ? "text-emerald-700 font-extrabold" :
                            (lead.lead_score ?? 0) >= 50 ? "text-amber-700 font-extrabold" : "text-slate-500 font-medium"
                          }`}>{lead.lead_score ?? "—"}</span>
                        </TableCell>

                        <TableCell className="bg-transparent">
                          <div className="font-semibold text-xs text-slate-900">{lead.company_name}</div>
                          {lead.domain && <div className="text-xs text-blue-600 font-medium">{lead.domain}</div>}
                          {lead.website_audit_score != null && (
                            <div className={`text-[10px] font-bold ${
                              lead.website_audit_score >= 70 ? "text-emerald-700" :
                              lead.website_audit_score >= 40 ? "text-amber-700" : "text-rose-600"
                            }`}>Site: {lead.website_audit_score}/100{lead.ssl ? " 🔒" : " ⚠"}</div>
                          )}
                          {lead.seo_score != null && (
                            <div className={`text-[10px] font-bold ${
                              lead.seo_score >= 70 ? "text-emerald-700" :
                              lead.seo_score >= 40 ? "text-amber-700" : "text-rose-600"
                            }`}>SEO: {lead.seo_score}/100 (mobile)</div>
                          )}
                          {(lead.pagespeed_mobile != null || lead.pagespeed_desktop != null) && (
                            <button
                              onClick={() => setExpandedPageSpeed(prev => ({ ...prev, [i]: !prev[i] }))}
                              className="text-[9px] text-blue-600 hover:underline font-semibold"
                            >
                              {expandedPageSpeed[i] ? "▴ Hide PageSpeed" : "▾ Full PageSpeed report"}
                            </button>
                          )}
                          {expandedPageSpeed[i] && (
                            <div className="text-[9px] text-slate-600 grid grid-cols-3 gap-x-2 gap-y-0.5 border border-slate-200 rounded p-1.5 my-1 bg-slate-50 w-fit">
                              <div></div>
                              <div className="font-bold text-slate-500">Mobile</div>
                              <div className="font-bold text-slate-500">Desktop</div>
                              <div className="font-semibold">Performance</div>
                              <div>{lead.pagespeed_mobile ?? "—"}</div>
                              <div>{lead.pagespeed_desktop ?? "—"}</div>
                              <div className="font-semibold">Accessibility</div>
                              <div>{lead.accessibility_mobile ?? "—"}</div>
                              <div>{lead.accessibility_desktop ?? "—"}</div>
                              <div className="font-semibold">Best Practices</div>
                              <div>{lead.best_practices_mobile ?? "—"}</div>
                              <div>{lead.best_practices_desktop ?? "—"}</div>
                              <div className="font-semibold">SEO</div>
                              <div>{lead.seo_score ?? "—"}</div>
                              <div>{lead.seo_desktop ?? "—"}</div>
                            </div>
                          )}
                          {(lead.employee_count != null || lead.founded_year != null) && (
                            <div className="text-[10px] text-slate-500 font-medium">
                              {[
                                lead.employee_count != null ? `${lead.employee_count} employees` : null,
                                lead.founded_year != null ? `est. ${lead.founded_year}` : null,
                              ].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          <div className="text-xs text-slate-500">{[lead.industry, lead.country].filter(Boolean).join(" · ")}</div>
                        </TableCell>

                        <TableCell className="bg-transparent">
                          {lead.email ? (
                            <div className="max-w-[190px]">
                              <div className="text-xs text-slate-800 font-medium flex items-start gap-1">
                                <Mail className="h-3 w-3 text-slate-500 mt-0.5 shrink-0" />
                                <span className="break-all" title={lead.email}>{lead.email}</span>
                              </div>
                              {lead.email_status && (
                                <Badge className={`text-[10px] mt-0.5 ${
                                  lead.email_status === "valid"   ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                                  lead.email_status === "risky"   ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                  "bg-rose-100 text-rose-700 border border-rose-300"
                                }`}>{lead.email_status}</Badge>
                              )}
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </TableCell>

                        <TableCell className="bg-transparent">
                          {lead.phone ? (
                            <div>
                              <div className="text-xs text-slate-800 font-medium flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-500" /> {lead.phone}
                              </div>
                              {(lead.ai_whatsapp_message || lead.ai_first_line) && !lead.baileys_sent && !lead.baileys_error && (
                                lead.phone && notOnWhatsapp.has(lead.phone) ? (
                                  <span className="text-[9px] text-slate-400 block">Not on WhatsApp</span>
                                ) : (
                                  <button
                                    onClick={() => sendViaBaileys(i)}
                                    disabled={lead.baileys_sending}
                                    className="text-[9px] text-violet-600 hover:underline font-semibold disabled:text-slate-400 mt-0.5 block"
                                    title="Sends the AI's custom pitch text via your Baileys-connected number. Only safe if this lead has messaged you first."
                                  >
                                    {lead.baileys_sending ? "Sending…" : "Send via Baileys"}
                                  </button>
                                )
                              )}
                              {lead.baileys_sent && (
                                <div className="text-[9px] text-violet-700 font-bold mt-0.5">✅ Baileys sent</div>
                              )}
                              {lead.baileys_error && (
                                <span className="text-[9px] text-rose-500 block" title={lead.baileys_error}>
                                  {/not registered on WhatsApp/i.test(lead.baileys_error) ? "Not on WhatsApp" : "Baileys failed"}
                                </span>
                              )}
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </TableCell>

                        {/* Social */}
                        <TableCell className="bg-transparent">
                          <div className="flex flex-col gap-0.5">
                            {lead.linkedin_url && (
                              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-blue-600 hover:underline font-semibold">LinkedIn</a>
                            )}
                            {lead.facebook_url && (
                              <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-indigo-600 hover:underline font-semibold">Facebook</a>
                            )}
                            {lead.instagram_url && (
                              <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-pink-600 hover:underline font-semibold">Instagram</a>
                            )}
                            {!lead.linkedin_url && !lead.facebook_url && !lead.instagram_url && (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                            <div className="pt-1 border-t border-slate-100 mt-0.5">
                              {!lead.fb_ads_checked && !lead.fb_ads_error && (
                                <button
                                  onClick={() => checkFacebookAds(i)}
                                  disabled={lead.fb_ads_checking}
                                  className="text-[9px] text-violet-600 hover:underline font-semibold disabled:text-slate-400"
                                >
                                  {lead.fb_ads_checking ? "Checking FB ads…" : "Check FB Ads"}
                                </button>
                              )}
                              {lead.fb_ads_checked && (
                                <div className={`text-[9px] font-bold ${lead.fb_has_ads ? "text-emerald-700" : "text-slate-500"}`}
                                  title={lead.fb_ads_confidence === "low" ? "No known Facebook Page ID — matched by keyword search, less reliable" : "Matched via known Facebook Page ID"}>
                                  {lead.fb_has_ads ? `🟢 ${lead.fb_ad_count} active FB ad${lead.fb_ad_count === 1 ? "" : "s"}` : "⚪ No active FB ads"}
                                  {lead.fb_ads_confidence === "low" && <span className="text-amber-600"> (low confidence)</span>}
                                </div>
                              )}
                              {lead.fb_oldest_ad_start_date && (
                                <div className="text-[9px] text-slate-500">Running since {lead.fb_oldest_ad_start_date}</div>
                              )}
                              {lead.fb_has_ads && lead.fb_ads_list && lead.fb_ads_list.length > 0 && (
                                <button
                                  onClick={() => setExpandedFbAds(prev => ({ ...prev, [i]: !prev[i] }))}
                                  className="text-[9px] text-violet-600 hover:underline font-semibold"
                                >
                                  {expandedFbAds[i] ? "▴ Hide ads" : "▾ View ads"}
                                </button>
                              )}
                              {expandedFbAds[i] && lead.fb_ads_list && (
                                <div className="mt-1 pt-1 border-t border-slate-100 space-y-1 max-w-[220px]">
                                  {lead.fb_ads_list.map((ad, ai) => (
                                    <div key={ai} className="text-[9px] text-slate-600 leading-snug">
                                      <div className="font-semibold text-slate-500">
                                        {ad.start_date ? `Since ${ad.start_date}` : "Start date unknown"} · {ad.status || "—"}
                                      </div>
                                      {ad.ad_text && <div className="line-clamp-2" title={ad.ad_text}>{ad.ad_text}</div>}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {lead.fb_ads_error && (
                                <span className="text-[9px] text-rose-500" title={lead.fb_ads_error}>FB check failed</span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Tech Stack */}
                        <TableCell className="bg-transparent">
                          {lead.tech_detected && lead.tech_detected.length > 0 ? (
                            <div className="flex flex-col gap-1 max-w-[220px]">
                              {lead.cms && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 inline-block w-fit">{lead.cms}</span>
                              )}
                              {lead.crm_tool && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200 inline-block w-fit">{lead.crm_tool}</span>
                              )}
                              <div className="flex flex-wrap gap-1">
                                {lead.tech_detected.filter(t => t !== lead.cms && t !== lead.crm_tool).map(t => (
                                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold border border-slate-200">{t}</span>
                                ))}
                              </div>
                            </div>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </TableCell>

                        {/* AI Opportunity */}
                        <TableCell className="bg-transparent align-top">
                          {lead.ai_summary || lead.ai_best_angle || lead.ai_top_gap ? (
                            <div className="max-w-[340px] space-y-1.5">
                              {lead.ai_summary && (
                                <div className="text-[13px] text-slate-700 leading-snug font-normal" title={lead.ai_summary}>
                                  {lead.ai_summary}
                                </div>
                              )}
                              {!lead.ai_summary && lead.ai_best_angle && (
                                <div className="text-[13px] text-slate-700 leading-snug font-normal" title={lead.ai_best_angle}>
                                  {lead.ai_best_angle}
                                </div>
                              )}
                              <div className="flex items-center gap-2 flex-wrap">
                                {lead.ai_opportunity_score != null && (
                                  <span className={`text-[13px] font-bold ${
                                    lead.ai_opportunity_score >= 70 ? "text-emerald-700 font-extrabold" :
                                    lead.ai_opportunity_score >= 50 ? "text-amber-700 font-extrabold" : "text-slate-500 font-medium"
                                  }`}>Score: {lead.ai_opportunity_score}/100</span>
                                )}
                                {lead.ai_priority && (
                                  <span className={`text-[11px] px-2 py-0.5 rounded font-bold uppercase border ${
                                    lead.ai_priority === "hot"  ? "bg-rose-50 text-rose-700 border-rose-300" :
                                    lead.ai_priority === "warm" ? "bg-amber-50 text-amber-700 border-amber-300" :
                                    "bg-slate-50 text-slate-500 border-slate-300"
                                  }`}>{lead.ai_priority}</span>
                                )}
                              </div>
                              {lead.ai_top_gap && (
                                <div className="text-[12px] text-rose-600 font-medium leading-snug" title={lead.ai_top_gap}>
                                  Gap: {lead.ai_top_gap}
                                </div>
                              )}
                              {lead.ai_best_service && (
                                <div className="text-[12px] text-violet-700 font-semibold leading-snug">
                                  Best fit: {lead.ai_best_service}
                                </div>
                              )}

                              {(lead.ai_pain_points?.length || lead.ai_email_body || lead.ai_first_line) && (
                                <button
                                  onClick={() => setExpandedPitch(prev => ({ ...prev, [i]: !prev[i] }))}
                                  className="text-[12px] text-blue-600 hover:underline font-semibold pt-0.5"
                                >
                                  {expandedPitch[i] ? "▴ Hide pitch" : "▾ View pitch"}
                                </button>
                              )}

                              {expandedPitch[i] && (
                                <div className="mt-1 pt-1.5 border-t border-slate-200 space-y-2">
                                  {lead.ai_pain_points && lead.ai_pain_points.length > 0 && (
                                    <ul className="text-[12px] text-slate-600 list-disc pl-4 space-y-1">
                                      {lead.ai_pain_points.map((p, pi) => <li key={pi}>{p}</li>)}
                                    </ul>
                                  )}
                                  {lead.ai_first_line && (
                                    <div className="text-[12px] text-slate-700 leading-snug"><span className="font-semibold text-slate-500">Opener:</span> {lead.ai_first_line}</div>
                                  )}
                                  {lead.ai_email_subject && (
                                    <div className="text-[12px] text-slate-700 leading-snug"><span className="font-semibold text-slate-500">Subject:</span> {lead.ai_email_subject}</div>
                                  )}
                                  {lead.ai_email_body && (
                                    <div className="text-[12px] text-slate-700 leading-snug"><span className="font-semibold text-slate-500">Email:</span> {lead.ai_email_body}</div>
                                  )}
                                  {lead.ai_linkedin_message && (
                                    <div className="text-[12px] text-slate-700 leading-snug"><span className="font-semibold text-slate-500">LinkedIn:</span> {lead.ai_linkedin_message}</div>
                                  )}
                                  {lead.ai_whatsapp_message && (
                                    <div className="text-[12px] text-slate-700 leading-snug"><span className="font-semibold text-slate-500">WhatsApp:</span> {lead.ai_whatsapp_message}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : lead.ai_error ? (
                            <span className="text-[11px] text-rose-500 font-medium" title={lead.ai_error}>⚠ AI analysis failed</span>
                          ) : <span className="text-xs text-slate-400">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
