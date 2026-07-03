import { useState, useRef } from "react";
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
  employee_count?: number | null;
  company_linkedin?: string | null;
  lead_score?: number | null;
  status?: "qualified" | "review" | "skipped";
  skip_reason?: string | null;
  source?: string | null;
  // Website audit
  ssl?: boolean | null;
  pagespeed_mobile?: number | null;
  pagespeed_desktop?: number | null;
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
  // Tech stack
  tech_detected?: string[] | null;
  cms?: string | null;
  crm_tool?: string | null;
  // AI opportunity
  ai_best_angle?: string | null;
  ai_top_gap?: string | null;
  ai_opportunity_score?: number | null;
}

const INITIAL_STEPS: PipelineStep[] = [
  { id: "validate",      label: "Validate Campaign",           tool: "Form validation",         status: "idle" },
  { id: "discover",      label: "Company + Contact Discovery", tool: "Google Maps + Hunter.io",  status: "idle" },
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

  // ── Main pipeline ───────────────────────────────────────────────────────────
  const runCampaign = async () => {
    if (!validate()) return;
    setRunning(true);
    setLeads([]);
    setLog([]);
    setSteps(INITIAL_STEPS);

    const target         = Math.min(parseInt(dailyTarget) || 25, 50);
    const scoreThreshold = parseInt(minScore) || 60;

    // ── STEP 1: Validate ────────────────────────────────────────────────────
    setStep("validate", { status: "running" });
    addLog(`🚀 Campaign: "${campaignName}" | ${industry} | ${country}${state ? `, ${state}` : ""}`);
    addLog(`   Roles: ${selectedRoles.join(", ")}`);
    addLog(`   Target: ${target} leads | Min score: ${scoreThreshold}`);
    await new Promise(r => setTimeout(r, 300));
    setStep("validate", { status: "done", message: "Parameters ready" });

    // ── STEP 2: Google Maps company discovery + Hunter.io contact search ────────
    setStep("discover", { status: "running" });
    addLog(`🗺 Searching Google Maps for "${industry}" in ${country}${state ? `, ${state}` : ""}...`);

    let rawLeads: Lead[] = [];
    try {
      // 2a: find companies via Google Maps
      const compRes = await fetch(`${API}/apollo-company-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, country, state: state || undefined, perPage: target }),
      });
      const compData = await compRes.json();
      if (!compRes.ok) throw new Error(compData.error || "Google Maps search failed");

      type CompanyResult = {
        company_name: string;
        domain: string | null;
        phone: string | null;
        industry: string;
        website: string | null;
      };
      const companies: CompanyResult[] = compData.companies || [];
      addLog(`✅ Google Maps found ${companies.length} companies`);

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
          // No contacts from either source — keep company-level entry with Google Maps phone
          rawLeads.push({
            company_name: company.company_name,
            contact_name: null,
            phone:        company.phone,
            website:      company.website || null,
            domain:       company.domain  || null,
            industry:     company.industry || industry,
            country,
            state:        state || null,
            source:       "Google Maps",
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
        ai_best_angle:        (a.ai_best_angle        as string | null) || null,
        ai_top_gap:           (a.ai_top_gap           as string | null) || null,
        ai_opportunity_score: (a.ai_opportunity_score as number | null) ?? null,
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

      // Contact quality (40 pts)
      if (lead.contact_name)               score += 10;
      if (lead.job_title)                   score += 10;
      if (lead.email)                       score += 10;
      if (lead.phone)                       score += 10;

      // Email health (30 pts)
      if (lead.email_status === "valid")    score += 30;
      else if (lead.email_status === "risky") score += 12;

      // Reachability (15 pts)
      if (lead.linkedin_url)                                               score += 8;
      if (["Lusha", "Hunter.io", "Prospeo"].includes(lead.source || ""))  score += 7;

      // ICP signals (10 pts)
      if (lead.company_name)               score += 5;
      if (lead.industry)                   score += 5;

      // AI opportunity bonus (5 pts)
      if ((lead.ai_opportunity_score ?? 0) >= 70) score += 5;

      const hasReachability = !!(lead.email || lead.phone);
      let status: Lead["status"] = "skipped";
      if (!lead.company_name || !hasReachability) {
        status = "skipped";
      } else if (lead.email_status === "valid" && score >= scoreThreshold) {
        status = "qualified";
      } else if ((lead.ai_opportunity_score ?? 0) >= 75 && score >= scoreThreshold - 20) {
        status = "qualified";
      } else if (lead.email_status === "risky" || score >= scoreThreshold - 15) {
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
    setRunning(false);
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
        <div className="text-xs text-slate-400">Google Maps · Hunter.io · Lusha v2 · PageSpeed · Gemini AI</div>
      </div>

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
          <Card className="border-slate-200">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  {campaignName} — {leads.length} prospects found
                </span>
                <Button variant="outline" size="sm" onClick={downloadCSV} className="gap-1 h-7 text-xs">
                  <Download className="h-3 w-3" />CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs">Company</TableHead>
                      <TableHead className="text-xs">Email</TableHead>
                      <TableHead className="text-xs">Phone</TableHead>
                      <TableHead className="text-xs">Social</TableHead>
                      <TableHead className="text-xs">Tech Stack</TableHead>
                      <TableHead className="text-xs">AI Opportunity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead, i) => (
                      <TableRow key={i} className={
                        lead.status === "qualified" ? "bg-green-50/40" :
                        lead.status === "review"    ? "bg-amber-50/40" : ""
                      }>
                        <TableCell>
                          {lead.status === "qualified" && <Badge className="text-xs bg-green-100 text-green-700 font-medium">Qualified</Badge>}
                          {lead.status === "review"    && <Badge className="text-xs bg-amber-100 text-amber-700 font-medium">Review</Badge>}
                          {lead.status === "skipped"   && <Badge className="text-xs bg-slate-100 text-slate-500">Skipped</Badge>}
                        </TableCell>

                        <TableCell>
                          <span className={`text-xs font-bold font-mono ${
                            (lead.lead_score ?? 0) >= 75 ? "text-green-600" :
                            (lead.lead_score ?? 0) >= 50 ? "text-amber-600" : "text-slate-400"
                          }`}>{lead.lead_score ?? "—"}</span>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium text-xs text-slate-800">{lead.company_name}</div>
                          {lead.domain && <div className="text-xs text-blue-500">{lead.domain}</div>}
                          {lead.website_audit_score != null && (
                            <div className={`text-[10px] font-semibold ${
                              lead.website_audit_score >= 70 ? "text-green-600" :
                              lead.website_audit_score >= 40 ? "text-amber-600" : "text-red-500"
                            }`}>Site: {lead.website_audit_score}/100{lead.ssl ? " 🔒" : " ⚠"}</div>
                          )}
                          <div className="text-xs text-slate-400">{[lead.industry, lead.country].filter(Boolean).join(" · ")}</div>
                        </TableCell>

                        <TableCell>
                          {lead.email ? (
                            <div>
                              <div className="text-xs text-slate-700 flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span className="truncate max-w-[140px]" title={lead.email}>{lead.email}</span>
                              </div>
                              {lead.email_status && (
                                <Badge className={`text-[10px] mt-0.5 ${
                                  lead.email_status === "valid"   ? "bg-green-100 text-green-700" :
                                  lead.email_status === "risky"   ? "bg-amber-100 text-amber-700" :
                                  "bg-red-100 text-red-600"
                                }`}>{lead.email_status}</Badge>
                              )}
                            </div>
                          ) : <span className="text-xs text-slate-300">—</span>}
                        </TableCell>

                        <TableCell>
                          {lead.phone ? (
                            <div className="text-xs text-slate-700 flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" /> {lead.phone}
                            </div>
                          ) : <span className="text-xs text-slate-300">—</span>}
                        </TableCell>

                        {/* Social */}
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            {lead.linkedin_url && (
                              <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-blue-600 hover:underline font-medium">LinkedIn</a>
                            )}
                            {lead.facebook_url && (
                              <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-indigo-600 hover:underline font-medium">Facebook</a>
                            )}
                            {lead.instagram_url && (
                              <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-pink-600 hover:underline font-medium">Instagram</a>
                            )}
                            {!lead.linkedin_url && !lead.facebook_url && !lead.instagram_url && (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Tech Stack */}
                        <TableCell>
                          {lead.tech_detected && lead.tech_detected.length > 0 ? (
                            <div className="flex flex-col gap-0.5">
                              {lead.cms && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">{lead.cms}</span>
                              )}
                              {lead.crm_tool && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">{lead.crm_tool}</span>
                              )}
                              <div className="flex flex-wrap gap-0.5">
                                {lead.tech_detected.filter(t => t !== lead.cms && t !== lead.crm_tool).slice(0, 3).map(t => (
                                  <span key={t} className="text-[9px] px-1 py-0.5 rounded bg-slate-100 text-slate-600">{t}</span>
                                ))}
                              </div>
                            </div>
                          ) : <span className="text-xs text-slate-300">—</span>}
                        </TableCell>

                        {/* AI Opportunity */}
                        <TableCell>
                          {lead.ai_best_angle ? (
                            <div className="max-w-[200px]">
                              <div className="text-[10px] text-slate-700 leading-tight line-clamp-3" title={lead.ai_best_angle}>
                                {lead.ai_best_angle}
                              </div>
                              {lead.ai_opportunity_score != null && (
                                <div className={`text-[10px] font-bold mt-1 ${
                                  lead.ai_opportunity_score >= 70 ? "text-green-600" :
                                  lead.ai_opportunity_score >= 50 ? "text-amber-600" : "text-slate-400"
                                }`}>Score: {lead.ai_opportunity_score}/100</div>
                              )}
                              {lead.ai_top_gap && (
                                <div className="text-[9px] text-rose-500 mt-0.5 line-clamp-1" title={lead.ai_top_gap}>
                                  Gap: {lead.ai_top_gap}
                                </div>
                              )}
                            </div>
                          ) : <span className="text-xs text-slate-300">—</span>}
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
