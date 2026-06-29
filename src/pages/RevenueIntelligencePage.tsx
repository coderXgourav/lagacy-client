import { useState, useRef, useEffect } from "react";
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
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  Twitter
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
  source?: string;
}

interface CompanySocials {
  linkedin?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
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
  companyLinkedinUrl?: string;
  socials?: CompanySocials;
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

  // API key live status (fetched from backend on mount)
  const [apiKeys, setApiKeys] = useState<Record<string, boolean>>({});

  // Run state
  const [tab, setTab] = useState<TabKey>("search");
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const companiesRef = useRef<Company[]>([]);
  // Sync ref when state changes (e.g. after scoreLeads / initial search)
  useEffect(() => { companiesRef.current = companies; }, [companies]);
  // Use this instead of setCompanies in enrichment chain — updates ref immediately
  // so the next step in the chain always reads the latest data, not the stale closure
  const updateCompanies = (arr: Company[]) => { companiesRef.current = arr; setCompanies(arr); };
  const [scoredLeads, setScoredLeads] = useState<Company[]>([]);

  // Enrichment state
  // const [verifyingPhones, setVerifyingPhones] = useState(false); // commented out with verify-phones feature
  const [auditing, setAuditing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [enrichingEmail, setEnrichingEmail] = useState(false);
  const [enrichingFunding, setEnrichingFunding] = useState(false);
  const [findingDM, setFindingDM] = useState(false);
  const [enrichingMobile, setEnrichingMobile] = useState(false);
  const [searchingSignalHire, setSearchingSignalHire] = useState(false);
  const [scrapingWebsites, setScrapingWebsites] = useState(false);
  const [enrichLog, setEnrichLog] = useState<string[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch live API key status from backend on mount
  useEffect(() => {
    fetch(`${API}/check-api-keys`)
      .then(r => r.json())
      .then(data => setApiKeys(data))
      .catch(() => {});
  }, []);

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
      const items: Company[] = (data.items || []).map((item: any) => ({
        ...item,
        companyLinkedinUrl: item.linkedin || item.linkedinUrl || item.socials?.linkedin || item.companyLinkedinUrl || null,
        socials: {
          linkedin: item.linkedin || item.linkedinUrl || item.socials?.linkedin || item.companyLinkedinUrl || null,
          facebook: item.facebook || item.socials?.facebook || null,
          instagram: item.instagram || item.socials?.instagram || null,
          twitter: item.twitter || item.socials?.twitter || null,
          youtube: item.youtube || item.socials?.youtube || null,
        }
      }));
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
          body: JSON.stringify({ companyName: company.title, website: company.website }),
        });
        const data = await res.json();
        if (res.ok && data.decisionMakers?.length) {
          const idx = updated.findIndex(c => c.title === company.title);
          if (idx !== -1) {
            updated[idx] = { 
              ...updated[idx], 
              decisionMakers: data.decisionMakers, 
              hiringSignal: data.hiringSignal ?? true,
              companyLinkedinUrl: data.companyLinkedinUrl || updated[idx].companyLinkedinUrl,
              socials: {
                ...updated[idx].socials,
                linkedin: data.companyLinkedinUrl || updated[idx].companyLinkedinUrl
              }
            };
          }
          found++;
          setEnrichLog(prev => [...prev, `✅ ${company.title} — ${data.decisionMakers.length} person(s) found`]);
        } else if (data.code === 'API_KEY_MISSING') {
          setEnrichLog(['❌ APOLLO_API_KEY not configured in .env']); break;
        } else if (data.code === 'PLAN_UPGRADE_REQUIRED') {
          setEnrichLog(['❌ Apollo free plan — upgrade at app.apollo.io to unlock people search']); break;
        } else {
          setEnrichLog(prev => [...prev, `— ${company.title}: not in Apollo DB`]);
        }
      } catch (e) {
        setEnrichLog(prev => [...prev, `⚠ ${company.title}: request failed — restart server if Apollo header error`]);
      }
    }
    setCompanies(updated);
    setFindingDM(false);
    setEnrichLog(prev => [...prev, `Done — ${found} companies with decision makers found.`]);
  };

  // ── Step 4: Prospeo — search by company name → email + mobile + LinkedIn ──
  const enrichMobileNumbers = async () => {
    if (!companiesRef.current.length) return;
    setEnrichingMobile(true);
    const snapshot = [...companiesRef.current];
    setEnrichLog([`Searching ${snapshot.length} companies on Prospeo for decision maker mobile + email...`]);
    const updated = [...snapshot];
    let found = 0;

    for (const company of snapshot) {
      setEnrichLog(prev => [...prev, `🔍 ${company.title}...`]);
      try {
        const res = await fetch(`${API}/prospeo-company-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName: company.title, website: company.website }),
        });
        const data = await res.json();

        if (res.ok && data.contacts?.length) {
          const idx = updated.findIndex(c => c.title === company.title);
          if (idx !== -1) {
            let newDMs: DecisionMaker[] = data.contacts.map((c: {
              name: string; title: string; email?: string;
              phone?: string; linkedinUrl?: string; mobileVerified?: boolean;
            }) => ({
              name: c.name, title: c.title,
              email: c.email || null,
              phone: c.phone || null,
              linkedinUrl: c.linkedinUrl || null,
              mobileVerified: !!c.phone,
              source: 'Prospeo',
            }));

            // For DMs without email, try Hunter.io email-finder (uses name + domain)
            if (company.website) {
              let domain = '';
              try { domain = new URL(company.website).hostname.replace(/^www\./, ''); } catch {}
              if (domain) {
                newDMs = await Promise.all(newDMs.map(async dm => {
                  if (dm.email) return dm; // already has email
                  const nameParts = dm.name.trim().split(/\s+/);
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';
                  if (!firstName || !lastName) return dm;
                  try {
                    const hRes = await fetch(`${API}/hunter-email-finder`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ firstName, lastName, domain }),
                    });
                    const hData = await hRes.json();
                    if (hRes.ok && hData.email) {
                      return { ...dm, email: hData.email, source: 'Prospeo+Hunter' };
                    }
                  } catch {}
                  return dm;
                }));
              }
            }

            // Merge with existing DMs — don't overwrite SignalHire data if better
            const existing = updated[idx].decisionMakers || [];
            const merged = newDMs.map(nd => {
              const match = existing.find(e => e.name === nd.name);
              return match ? { ...match, ...nd, phone: nd.phone || match.phone, email: nd.email || match.email } : nd;
            });
            updated[idx] = { ...updated[idx], decisionMakers: merged.length ? merged : existing, hiringSignal: true };
            found++;
            const hasPhone = newDMs.some(d => d.phone);
            const hasEmail = newDMs.some(d => d.email);
            const hasLinkedIn = newDMs.some(d => d.linkedinUrl);
            setEnrichLog(prev => [...prev,
              `✅ ${company.title} — ${newDMs.length} person(s) | mobile: ${hasPhone ? '✓' : '—'} | email: ${hasEmail ? '✓' : '—'} | LinkedIn: ${hasLinkedIn ? '✓' : '—'}`
            ]);
          }
        } else if (data.code === 'API_KEY_MISSING' || data.code === 'INVALID_API_KEY') {
          setEnrichLog(prev => [...prev, '❌ Prospeo API key invalid — check .env']); break;
        } else if (data.code === 'NO_CREDITS' || data.code === 'PROSPEO_ERROR') {
          setEnrichLog(prev => [...prev, `❌ Prospeo credits exhausted after ${found} companies`]); break;
        } else {
          setEnrichLog(prev => [...prev, `— ${company.title}: not found in Prospeo DB`]);
        }
      } catch {
        setEnrichLog(prev => [...prev, `⚠ ${company.title}: request failed`]);
      }
      await new Promise(r => setTimeout(r, 600));
    }

    updateCompanies(updated);
    setEnrichingMobile(false);
    setEnrichLog(prev => [...prev, `Done — Prospeo found contacts at ${found} / ${snapshot.length} companies.`]);

    // Auto-rescore so Score tab shows Prospeo emails + mobiles immediately
    if (found > 0) {
      try {
        const res = await fetch(`${API}/score-leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leads: updated }),
        });
        const scoreData = await res.json();
        setScoredLeads(scoreData.leads || []);
        setEnrichLog(prev => [...prev, `✅ Score tab updated with Prospeo contacts.`]);
      } catch {
        setEnrichLog(prev => [...prev, `⚠ Auto-rescore failed — click "Rescore" in Score tab manually.`]);
      }
    }
  };

  // ── Contact Discovery: SignalHire — one company at a time ───────────────
  const searchSignalHire = async () => {
    if (!companiesRef.current.length) return;
    setSearchingSignalHire(true);
    const snapshot = [...companiesRef.current];
    const updated = [...snapshot];
    let found = 0;

    setEnrichLog([`Searching ${snapshot.length} companies on SignalHire — sending one by one...`]);

    for (const company of snapshot) {
      setEnrichLog(prev => [...prev, `🔍 ${company.title}...`]);

      try {
        const res = await fetch(`${API}/signalhire-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyName: company.title }),
        });
        const data = await res.json();

        if (res.ok && data.contacts?.length) {
          const idx = updated.findIndex(c => c.title === company.title);
          if (idx !== -1) {
            const newDMs: DecisionMaker[] = data.contacts.map((c: {
              name: string; title: string;
              email?: string; phone?: string; linkedinUrl?: string;
            }) => ({
              name: c.name,
              title: c.title,
              email: c.email || null,
              phone: c.phone || null,
              linkedinUrl: c.linkedinUrl || null,
              mobileVerified: !!c.phone,
              source: 'SignalHire',
            }));
            updated[idx] = { ...updated[idx], decisionMakers: newDMs, hiringSignal: true };
            found++;
            const hasEmail = newDMs.some(d => d.email);
            const hasLinkedIn = newDMs.some(d => d.linkedinUrl);
            setEnrichLog(prev => [...prev,
              `✅ ${company.title} — ${newDMs.length} contact(s) | email: ${hasEmail ? '✓' : '—'} | LinkedIn: ${hasLinkedIn ? '✓' : '—'}`
            ]);
          }
        } else if (data.code === 'API_KEY_MISSING') {
          setEnrichLog(prev => [...prev, '❌ SIGNALHIRE_API_KEY not set in .env']); break;
        } else if (data.code === 'INVALID_API_KEY') {
          setEnrichLog(prev => [...prev, '❌ Invalid SignalHire API key — check .env']); break;
        } else if (data.code === 'NO_CREDITS' || data.code === 'QUOTA_EXCEEDED') {
          setEnrichLog(prev => [...prev, `⚠ SignalHire credits/quota used up after ${found} companies. Get a new key to continue.`]); break;
        } else if (res.ok && (!data.contacts || data.contacts.length === 0)) {
          setEnrichLog(prev => [...prev, `— ${company.title}: not found on SignalHire`]);
        } else {
          setEnrichLog(prev => [...prev, `— ${company.title}: ${data.error || 'no data returned'}`]);
        }
      } catch {
        setEnrichLog(prev => [...prev, `⚠ ${company.title}: network error`]);
      }

      // 600ms gap between requests — respects SignalHire rate limits
      await new Promise(r => setTimeout(r, 600));
    }

    updateCompanies(updated);
    setSearchingSignalHire(false);
    setEnrichLog(prev => [...prev, `Done — SignalHire found contacts at ${found} / ${snapshot.length} companies.`]);
  };

  // ── Step 5: Email discovery via Hunter.io ────────────────────────────────
  const enrichEmails = async () => {
    // Only search companies that have a website but no Hunter.io emails yet
    // (Companies may have DM emails from SignalHire/Prospeo — those are separate)
    const withSite = companiesRef.current.filter((c) => c.website && !c.emails?.length);
    const noSite = companiesRef.current.filter((c) => !c.website);
    if (!withSite.length) {
      setEnrichLog([
        noSite.length
          ? `⚠ ${noSite.length} companies have no website — Hunter.io skipped (needs domain). Already have emails from other sources.`
          : "Hunter.io: all companies already have emails."
      ]);
      return;
    }
    setEnrichingEmail(true);
    setEnrichLog([
      `Hunter.io finds EMAILS only (not LinkedIn). Searching ${withSite.length} company domains...`,
      noSite.length ? `⚠ ${noSite.length} companies skipped — no website URL` : '',
    ].filter(Boolean));

    const updated = [...companiesRef.current];
    let done = 0;
    for (const company of withSite) {
      try {
        const domain = new URL(company.website!).hostname.replace(/^www\./, '');
        setEnrichLog((prev) => [...prev, `🔍 Searching domain: ${domain}...`]);

        // Run domain-search + company-find in parallel
        const [res, companyRes] = await Promise.all([
          fetch(`${API}/enrich-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          }),
          fetch(`${API}/hunter-company-find`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain }),
          }),
        ]);
        const data = await res.json();
        const companyData = companyRes.ok ? await companyRes.json() : null;

        if (res.ok && data.emails?.length) {
          const idx = updated.findIndex((c) => c.title === company.title);
          if (idx !== -1) {
            // Also create DM entries so emails show in Score tab Email column
            const hunterDMs: DecisionMaker[] = data.emails.map((e: {
              email: string; firstName?: string; lastName?: string; position?: string;
            }) => ({
              name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Contact',
              title: e.position || '',
              email: e.email,
              phone: null,
              linkedinUrl: null,
              mobileVerified: false,
              source: 'Hunter.io',
            }));
            const existing = updated[idx].decisionMakers || [];
            const existingEmails = new Set(existing.map((d: DecisionMaker) => d.email).filter(Boolean));
            const freshDMs = hunterDMs.filter(nd => !existingEmails.has(nd.email));
            // Merge company enrichment data from Hunter.io companies/find
            const companyEnrich = companyData?.name ? {
              employeeCount: companyData.employeeCount,
              industry: companyData.industry,
              description: companyData.description,
              foundedYear: companyData.foundedYear,
              hunterLinkedin: companyData.linkedinUrl,
              companyLinkedinUrl: companyData.linkedinUrl || updated[idx].companyLinkedinUrl,
              socials: {
                ...updated[idx].socials,
                linkedin: companyData.linkedinUrl || updated[idx].companyLinkedinUrl,
                twitter: companyData.twitterUrl || updated[idx].socials?.twitter,
                facebook: companyData.facebookUrl || updated[idx].socials?.facebook,
              }
            } : {};
            updated[idx] = {
              ...updated[idx],
              ...companyEnrich,
              emails: data.emails,
              decisionMakers: [...existing, ...freshDMs],
            };
          }
          done++;
          setEnrichLog((prev) => [...prev, `✅ ${company.title} — ${data.emails.length} email(s): ${data.emails.map((e: { email: string }) => e.email).join(', ')}`]);
        } else if (data.code === "API_KEY_MISSING" || data.code === "INVALID_API_KEY") {
          setEnrichLog(["❌ Hunter.io API key invalid — check .env HUNTER_API_KEY"]);
          break;
        } else if (data.code === "QUOTA_EXCEEDED" || data.code === "PLAN_LIMIT") {
          setEnrichLog(prev => [...prev, `⚠ Hunter.io monthly limit reached after ${done} companies. Wait for reset or upgrade plan.`]);
          break;
        } else {
          // Hunter.io found nothing — fallback: scrape email directly from the business website
          setEnrichLog((prev) => [...prev, `— ${company.title}: not in Hunter.io DB, scraping website...`]);
          try {
            const scrapeRes = await fetch(`${API}/scrape-website-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ website: company.website }),
            });
            const scrapeData = await scrapeRes.json();
            if (scrapeRes.ok && scrapeData.emails?.length) {
              const idx = updated.findIndex((c) => c.title === company.title);
              if (idx !== -1) {
                const scrapedDMs: DecisionMaker[] = scrapeData.emails.map((email: string) => ({
                  name: company.title,
                  title: 'Business Contact',
                  email,
                  phone: null,
                  linkedinUrl: null,
                  mobileVerified: false,
                  source: 'Website',
                }));
                const existing = updated[idx].decisionMakers || [];
                const existingEmails = new Set(existing.map((d: DecisionMaker) => d.email).filter(Boolean));
                const freshDMs = scrapedDMs.filter(d => !existingEmails.has(d.email));
                updated[idx] = {
                  ...updated[idx],
                  emails: scrapeData.emails.map((e: string) => ({ email: e })),
                  decisionMakers: [...existing, ...freshDMs],
                  companyLinkedinUrl: scrapeData.linkedinUrl || updated[idx].companyLinkedinUrl,
                  socials: {
                    ...updated[idx].socials,
                    ...scrapeData.socials
                  }
                };
              }
              done++;
              setEnrichLog((prev) => [...prev, `✅ ${company.title} — scraped from website: ${scrapeData.emails.join(', ')}`]);
            } else {
              setEnrichLog((prev) => [...prev, `— ${company.title}: no email found on website either`]);
            }
          } catch {
            setEnrichLog((prev) => [...prev, `— ${company.title}: website scrape failed`]);
          }
        }
      } catch (err) {
        setEnrichLog((prev) => [...prev, `⚠ ${company.title}: network error`]);
        console.error('Hunter.io fetch error:', err);
      }
    }

    updateCompanies(updated);
    setEnrichingEmail(false);
    setEnrichLog((prev) => [...prev, `Done — ${done}/${withSite.length} companies got emails.`]);

    // Always rescore when emails found so Score tab shows them immediately
    if (done > 0) {
      try {
        const res = await fetch(`${API}/score-leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leads: updated }),
        });
        const scoreData = await res.json();
        setScoredLeads(scoreData.leads || []);
        setEnrichLog((prev) => [...prev, `✅ Score tab updated with emails.`]);
      } catch {
        setEnrichLog((prev) => [...prev, `⚠ Auto-rescore failed — click "Rescore" in the Score tab manually.`]);
      }
    }
  };

  // ── Website email scraper — works for local businesses not in any DB ─────────
  const scrapeWebsiteEmails = async () => {
    const withSite = companiesRef.current.filter(c => c.website && !c.decisionMakers?.some(d => d.email));
    if (!withSite.length) {
      setEnrichLog(['All companies with websites already have emails, or no websites found.']); return;
    }
    setScrapingWebsites(true);
    setEnrichLog([`Scraping emails from ${withSite.length} company websites...`]);
    const updated = [...companiesRef.current];
    let done = 0;

    for (const company of withSite) {
      setEnrichLog(prev => [...prev, `🌐 Scanning ${company.website}...`]);
      try {
        const res = await fetch(`${API}/scrape-website-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website: company.website }),
        });
        const data = await res.json();
        if (res.ok && data.emails?.length) {
          const idx = updated.findIndex(c => c.title === company.title);
          if (idx !== -1) {
            const scrapedDMs: DecisionMaker[] = data.emails.map((email: string) => ({
              name: company.title,
              title: 'Business Contact',
              email,
              phone: null,
              linkedinUrl: null,
              mobileVerified: false,
              source: 'Website',
            }));
            const existing = updated[idx].decisionMakers || [];
            const existingEmails = new Set(existing.map((d: DecisionMaker) => d.email).filter(Boolean));
            const freshDMs = scrapedDMs.filter(d => !existingEmails.has(d.email));
            updated[idx] = {
              ...updated[idx],
              emails: data.emails.map((e: string) => ({ email: e })),
              decisionMakers: [...existing, ...freshDMs],
              companyLinkedinUrl: data.linkedinUrl || updated[idx].companyLinkedinUrl,
              socials: {
                ...updated[idx].socials,
                ...data.socials
              }
            };
            done++;
            setEnrichLog(prev => [...prev, `✅ ${company.title} — ${data.emails.join(', ')}`]);
          }
        } else {
          setEnrichLog(prev => [...prev, `— ${company.title}: no email on website`]);
        }
      } catch {
        setEnrichLog(prev => [...prev, `⚠ ${company.title}: website unreachable`]);
      }
      await new Promise(r => setTimeout(r, 500));
    }

    updateCompanies(updated);
    setScrapingWebsites(false);
    setEnrichLog(prev => [...prev, `Done — found emails at ${done}/${withSite.length} websites.`]);

    if (done > 0) {
      try {
        const res = await fetch(`${API}/score-leads`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leads: updated }),
        });
        const scoreData = await res.json();
        setScoredLeads(scoreData.leads || []);
        setEnrichLog(prev => [...prev, '✅ Score tab updated.']);
      } catch {
        setEnrichLog(prev => [...prev, '⚠ Rescore failed — click Rescore manually.']);
      }
    }
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
        body: JSON.stringify({ leads: companiesRef.current }),
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

    const headers = ["Name", "Category", "Phone", "Phone Type", "Website", "Company LinkedIn", "Facebook", "Instagram", "Twitter", "YouTube", "Rating", "Reviews", "Score", "Qualification", "Signals", "Address", "Google Maps", "DM Name", "DM Title", "DM Email", "DM Mobile", "DM LinkedIn"];
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
          `"${c.companyLinkedinUrl || ""}"`,
          `"${c.socials?.facebook || ""}"`,
          `"${c.socials?.instagram || ""}"`,
          `"${c.socials?.twitter || ""}"`,
          `"${c.socials?.youtube || ""}"`,
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

        {/* API Status Bar — live from backend */}
        <div className="flex flex-wrap gap-2 mb-5">
          <span className="text-xs text-muted-foreground self-center font-medium">APIs:</span>
          {[
            { key: 'twilio',     label: 'Twilio Lookup' },
            { key: 'apify',      label: 'Apify Google Maps' },
            { key: 'vapi',       label: 'Vapi/Twilio Calls' },
            { key: 'ses',        label: 'Amazon SES' },
            { key: 'prospeo',    label: 'Prospeo' },
            { key: 'hunter',     label: 'Hunter.io' },
            { key: 'crunchbase', label: 'Crunchbase' },
            { key: 'pagespeed',  label: 'Google PageSpeed' },
            { key: 'signalhire', label: 'SignalHire' },
          ].map(({ key, label }) => (
            <Badge key={key} className={`text-xs ${
              Object.keys(apiKeys).length === 0
                ? 'bg-gray-100 text-gray-500'
                : apiKeys[key]
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {Object.keys(apiKeys).length === 0 ? '…' : apiKeys[key] ? '✅' : '❌'} {label}
            </Badge>
          ))}
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

            {/* Right — Live API status panel */}
            <div className="space-y-3">
              {/* APIs that are missing */}
              {API_NEEDED.filter(a => Object.keys(apiKeys).length > 0 && !apiKeys[a.key]).length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" /> APIs Not Configured
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {API_NEEDED.filter(a => !apiKeys[a.key]).map((a) => (
                      <div key={a.key} className="text-xs">
                        <div className="font-semibold text-amber-700 dark:text-amber-400">❌ {a.step}</div>
                        <div className="text-muted-foreground">Add <code className="bg-muted px-1 rounded">{a.env}</code> to .env and restart server</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" /> Ready to Use
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1.5">
                  {[
                    { key: 'apify',      label: 'Step 1-2: Company discovery (Apify)' },
                    { key: 'twilio',     label: 'Step 3: Phone type check (Twilio)' },
                    { key: 'prospeo',    label: 'Step 4: Mobile + email + LinkedIn (Prospeo)' },
                    { key: 'hunter',     label: 'Step 5: Email discovery (Hunter.io)' },
                    { key: 'crunchbase', label: 'Step 6: Funding signals (Crunchbase)' },
                    { key: 'pagespeed',  label: 'Step 7: Website audit (PageSpeed)' },
                    { key: 'signalhire', label: 'Step 3b: Decision maker contacts (SignalHire)' },
                  ].filter(s => Object.keys(apiKeys).length === 0 || apiKeys[s.key]).map(s => (
                    <div key={s.key} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                      {s.label}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1 border-t mt-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    Step 5b: Scrape website emails (free, always on)
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                    Step 8-9: Scoring & qualification (always on)
                  </div>
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
                          <TableHead>Socials</TableHead>
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
                              <div className="flex items-center gap-2">
                                {c.companyLinkedinUrl && (
                                  <a href={c.companyLinkedinUrl} target="_blank" rel="noreferrer" title="LinkedIn" className="text-indigo-600 hover:text-indigo-700">
                                    <Linkedin className="h-4 w-4" />
                                  </a>
                                )}
                                {c.socials?.facebook && (
                                  <a href={c.socials.facebook} target="_blank" rel="noreferrer" title="Facebook" className="text-blue-600 hover:text-blue-700">
                                    <Facebook className="h-4 w-4" />
                                  </a>
                                )}
                                {c.socials?.instagram && (
                                  <a href={c.socials.instagram} target="_blank" rel="noreferrer" title="Instagram" className="text-pink-600 hover:text-pink-700">
                                    <Instagram className="h-4 w-4" />
                                  </a>
                                )}
                                {c.socials?.twitter && (
                                  <a href={c.socials.twitter} target="_blank" rel="noreferrer" title="Twitter/X" className="text-sky-600 hover:text-sky-700">
                                    <Twitter className="h-4 w-4" />
                                  </a>
                                )}
                                {c.socials?.youtube && (
                                  <a href={c.socials.youtube} target="_blank" rel="noreferrer" title="YouTube" className="text-red-600 hover:text-red-700">
                                    <Youtube className="h-4 w-4" />
                                  </a>
                                )}
                                {!c.companyLinkedinUrl && !c.socials?.facebook && !c.socials?.instagram && !c.socials?.twitter && !c.socials?.youtube && (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </div>
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

                {/* SignalHire — Decision Maker Discovery */}
                <Card className="border-indigo-200 dark:border-indigo-900/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-indigo-600" /> SignalHire — Contact Discovery
                    </CardTitle>
                    <CardDescription>
                      Searches SignalHire by company name and returns decision maker emails,
                      mobile numbers, and LinkedIn profiles directly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Companies to search</span>
                      <Badge variant="outline">{companies.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contacts found</span>
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                        {companies.filter(c => c.decisionMakers?.some(dm => dm.email || dm.phone)).length}
                      </Badge>
                    </div>
                    <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={searchSignalHire} disabled={searchingSignalHire}>
                      {searchingSignalHire
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching SignalHire...</>
                        : <><Zap className="h-4 w-4" /> Search SignalHire</>}
                    </Button>
                  </CardContent>
                </Card>

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
                      Finds decision makers, mobile numbers, and emails directly by company name — no LinkedIn URLs needed.
                      Uses Prospeo two-step search + enrich flow.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Companies to search</span>
                      <Badge variant="outline">{companies.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mobiles found</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {companies.flatMap(c => c.decisionMakers || []).filter(dm => dm.mobileVerified).length}
                      </Badge>
                    </div>
                    <Button className="w-full gap-2" variant="outline" onClick={enrichMobileNumbers} disabled={enrichingMobile || !companies.length}>
                      {enrichingMobile ? <><Loader2 className="h-4 w-4 animate-spin" /> Searching Prospeo...</> : <><Phone className="h-4 w-4" /> Find Mobiles + Emails (Prospeo)</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Step 5 — Email Discovery */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" /> Step 5 — Email Discovery (Hunter.io)
                    </CardTitle>
                    <CardDescription>
                      Finds verified <strong>work emails</strong> by company website domain.
                      <span className="text-amber-600 font-medium"> Note: emails only — LinkedIn requires SignalHire.</span>
                      Requires a company website. Companies with no website are skipped.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Companies with website</span>
                      <Badge variant="outline">{companies.filter(c => c.website).length} / {companies.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Emails found so far</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {companies.filter(c => c.emails?.length).length} companies · {companies.flatMap(c => c.emails || []).length} emails
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">No website (skipped)</span>
                      <Badge variant="outline" className="bg-red-50 text-red-600">{companies.filter(c => !c.website).length}</Badge>
                    </div>
                    <Button className="w-full gap-2" onClick={enrichEmails} disabled={enrichingEmail}>
                      {enrichingEmail ? <><Loader2 className="h-4 w-4 animate-spin" /> Finding emails...</> : <><Mail className="h-4 w-4" /> Find Emails (Hunter.io)</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Step 5b — Website Email Scraper */}
                <Card className="border-green-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-600" /> Step 5b — Scrape Website Emails
                    </CardTitle>
                    <CardDescription>
                      Scans each company's own website for contact emails. Works for <strong>local businesses</strong> (salons, restaurants, clinics) that are not in Hunter.io or Prospeo databases.
                      Checks homepage, /contact, and /about pages automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Companies with website</span>
                      <Badge variant="outline">{companies.filter(c => c.website).length} / {companies.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Without website (skipped)</span>
                      <Badge variant="outline" className="bg-red-50 text-red-600">{companies.filter(c => !c.website).length}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Emails found via website</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {companies.filter(c => c.decisionMakers?.some(d => d.source === 'Website' && d.email)).length} companies
                      </Badge>
                    </div>
                    <Button className="w-full gap-2 border-green-300 text-green-700 hover:bg-green-50" variant="outline"
                      onClick={scrapeWebsiteEmails} disabled={scrapingWebsites || !companies.filter(c => c.website).length}>
                      {scrapingWebsites
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Scraping websites...</>
                        : <><Globe className="h-4 w-4" /> Scrape Website Emails (Free)</>}
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

                {/* Contact discovery panel — always visible, shows live log while running */}
                <Card className="border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/10">
                  <CardContent className="py-3 space-y-3">
                    <div className="flex flex-wrap gap-4 items-center">
                      <Zap className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                          {scoredLeads.every(c => !c.decisionMakers?.length)
                            ? 'No emails / contacts yet — click to auto-discover'
                            : `${scoredLeads.filter(c => c.decisionMakers?.some(d => d.email)).length} companies have emails · click to find more`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tries SignalHire → Hunter.io (domain search + email-finder) → Prospeo → Website scraper
                        </div>
                      </div>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                        onClick={async () => {
                          setEnrichLog([]);
                          await searchSignalHire();
                          await enrichEmails();
                          await enrichMobileNumbers();
                          await scrapeWebsiteEmails();
                          // Guaranteed final rescore — runs even if no individual step found data
                          // Uses ref so it always has the latest merged state from all steps
                          if (companiesRef.current.length > 0) {
                            setEnrichLog(prev => [...prev, '🔄 Updating score table...']);
                            try {
                              const finalRes = await fetch(`${API}/score-leads`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ leads: companiesRef.current }),
                              });
                              const finalScored = await finalRes.json();
                              setScoredLeads(finalScored.leads || []);
                              setEnrichLog(prev => [...prev, '✅ Score table updated — check Email column below.']);
                            } catch {
                              setEnrichLog(prev => [...prev, '⚠ Final rescore failed.']);
                            }
                          }
                        }}
                        disabled={searchingSignalHire || enrichingEmail || enrichingMobile || scrapingWebsites || scoring}>
                        {(searchingSignalHire || enrichingEmail || enrichingMobile || scrapingWebsites)
                          ? <><Loader2 className="h-3 w-3 animate-spin" /> Discovering...</>
                          : <><Zap className="h-3 w-3" /> Discover Contacts + Rescore</>}
                      </Button>
                    </div>

                    {/* Live log — visible while running OR when there's output */}
                    {enrichLog.length > 0 && (
                      <div className="bg-black/80 rounded-md p-3 max-h-48 overflow-y-auto space-y-0.5">
                        {enrichLog.filter(Boolean).map((line, i) => (
                          <div key={i} className={`text-xs font-mono ${
                            line.startsWith('✅') ? 'text-green-400' :
                            line.startsWith('❌') ? 'text-red-400' :
                            line.startsWith('⚠') ? 'text-amber-400' :
                            line.startsWith('🔍') || line.startsWith('🌐') ? 'text-blue-300' :
                            'text-gray-300'
                          }`}>{line}</div>
                        ))}
                        {(searchingSignalHire || enrichingEmail || enrichingMobile || scrapingWebsites) && (
                          <div className="text-xs font-mono text-indigo-400 animate-pulse">● running...</div>
                        )}
                      </div>
                    )}

                    {/* Summary: companies without website can't be emailed */}
                    {!searchingSignalHire && !enrichingEmail && !enrichingMobile && !scrapingWebsites && companies.filter(c => !c.website).length > 0 && (
                      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                        ⚠ {companies.filter(c => !c.website).length} companies have <strong>no website</strong> — email cannot be found for them automatically.
                        Use the phone number to contact them directly.
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                            <TableHead>Decision Maker</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Socials</TableHead>
                            <TableHead className="text-center">Score</TableHead>
                            <TableHead>Qualification</TableHead>
                            <TableHead>Signals</TableHead>
                            <TableHead>Maps</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scoredLeads.map((c, i) => {
                            const dm = (c.decisionMakers || [])[0];
                            const email = dm?.email || (c.emails || [])[0]?.email || null;
                            const allDMs = c.decisionMakers || [];
                            return (
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
                              <TableCell>
                                {allDMs.length > 0 ? (
                                  <div className="space-y-1">
                                    {allDMs.map((d, di) => (
                                      <div key={di} className={di > 0 ? "pt-1 border-t border-dashed" : ""}>
                                        <div className="text-xs font-medium">{d.name}</div>
                                        <div className="text-xs text-muted-foreground">{d.title}</div>
                                        {d.phone && (
                                          <div className="text-xs text-green-600 flex items-center gap-1">
                                            <Phone className="h-3 w-3" />{d.phone}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                {email ? (
                                  <a href={`mailto:${email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    <Mail className="h-3 w-3" />{email}
                                  </a>
                                ) : (c.emails || []).length > 1 ? (
                                  <div className="space-y-1">
                                    {(c.emails || []).map((e, ei) => (
                                      <a key={ei} href={`mailto:${e.email}`} className="block text-xs text-blue-600 hover:underline">
                                        {e.email}
                                      </a>
                                    ))}
                                  </div>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1.5">
                                  {(c.companyLinkedinUrl || c.socials?.facebook || c.socials?.instagram || c.socials?.twitter || c.socials?.youtube) && (
                                    <div className="flex items-center gap-1.5 flex-wrap border-b pb-1.5 mb-1.5">
                                      {c.companyLinkedinUrl && (
                                        <a href={c.companyLinkedinUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="text-indigo-600 hover:text-indigo-700">
                                          <Linkedin className="h-4 w-4" />
                                        </a>
                                      )}
                                      {c.socials?.facebook && (
                                        <a href={c.socials.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" className="text-blue-600 hover:text-blue-700">
                                          <Facebook className="h-4 w-4" />
                                        </a>
                                      )}
                                      {c.socials?.instagram && (
                                        <a href={c.socials.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="text-pink-600 hover:text-pink-700">
                                          <Instagram className="h-4 w-4" />
                                        </a>
                                      )}
                                      {c.socials?.twitter && (
                                        <a href={c.socials.twitter} target="_blank" rel="noopener noreferrer" title="Twitter/X" className="text-sky-600 hover:text-sky-700">
                                          <Twitter className="h-4 w-4" />
                                        </a>
                                      )}
                                      {c.socials?.youtube && (
                                        <a href={c.socials.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" className="text-red-600 hover:text-red-700">
                                          <Youtube className="h-4 w-4" />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {allDMs.filter(d => d.linkedinUrl).map((d, di) => (
                                    <a key={di} href={d.linkedinUrl!} target="_blank" rel="noopener noreferrer" className="block text-xs text-blue-600 hover:underline">
                                      👤 {d.name || "View Profile"}
                                    </a>
                                  ))}
                                  {!c.companyLinkedinUrl && !c.socials?.facebook && !c.socials?.instagram && !c.socials?.twitter && !c.socials?.youtube && allDMs.filter(d => d.linkedinUrl).length === 0 && (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </div>
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
                            );
                          })}
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
