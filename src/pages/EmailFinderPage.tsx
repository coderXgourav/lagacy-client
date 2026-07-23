import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, ArrowLeft, Play, Loader2, Download, Building2, History } from "lucide-react";

const API = `${(import.meta as any).env.VITE_API_URL ?? "http://localhost:8000/api"}/revenue-intelligence`;

interface ResultRow {
  company: string;
  website: string;
  domain: string | null;
  country: string;
  contactName: string | null;
  title: string | null;
  email: string | null;
  source: string | null;
}

export default function EmailFinderPage() {
  const navigate = useNavigate();

  const [niche, setNiche] = useState("");
  const [countriesInput, setCountriesInput] = useState("");
  const [city, setCity] = useState("");
  const [target, setTarget] = useState("25");

  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loadingStage, setLoadingStage] = useState("");
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const runSearch = async () => {
    const countryList = countriesInput.split(",").map(c => c.trim()).filter(Boolean);
    if (!niche.trim() || countryList.length === 0) {
      toast({ title: "Niche and at least one Country are required", variant: "destructive" });
      return;
    }

    setRunning(true);
    setLog([]);
    setResults([]);
    setProcessedCount(0);
    setTotalToProcess(0);
    setLoadingStage(`Searching Google Maps for "${niche}"...`);

    const perCountryLimit = Math.min(parseInt(target) || 25, 2000);
    addLog(`🔍 Searching Google Maps for "${niche}" across ${countryList.length} location(s): ${countryList.join(", ")}...`);

    // Real coverage, not a padded number — each country gets its own real Google Maps search
    // (capped at 50 per call), combined and deduped by domain. If the true total across every
    // location searched is less than a requested target, that's the honest ceiling, not a bug.
    const seenDomains = new Set<string>();
    const allCompanies: { company_name: string; website: string | null; domain: string | null; country: string }[] = [];

    for (const countryName of countryList) {
      addLog(`  📍 ${countryName}${city ? `, ${city}` : ""}...`);
      try {
        const compRes = await fetch(`${API}/apollo-company-search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ industry: niche, country: countryName, state: city || undefined, perPage: perCountryLimit }),
        });
        const compData = await compRes.json();
        if (!compRes.ok) {
          addLog(`  ⚠️ ${countryName} search failed: ${compData.error || "unknown error"}`);
          continue;
        }
        const companies: { company_name: string; website: string | null; domain: string | null }[] = compData.companies || [];
        let added = 0;
        for (const c of companies) {
          const key = c.domain || c.company_name.toLowerCase();
          if (seenDomains.has(key)) continue;
          seenDomains.add(key);
          allCompanies.push({ ...c, country: countryName });
          added++;
        }
        const filteredMsg = compData.filteredIrrelevantCount > 0 ? ` (${compData.filteredIrrelevantCount} filtered as not actually matching "${niche}")` : "";
        addLog(`  ✅ ${countryName}: ${companies.length} genuine match(es) found${filteredMsg}, ${added} new after dedup.`);
      } catch (err: any) {
        addLog(`  ⚠️ ${countryName} search failed: ${err.message || "request error"}`);
      }
    }

    addLog(`✅ Combined total across all locations: ${allCompanies.length} unique businesses.`);

    if (allCompanies.length === 0) {
      addLog("⚠ No businesses found in any of the searched locations — try a broader niche.");
      setRunning(false);
      setLoadingStage("");
      return;
    }

    try {
      const companies = allCompanies;
      addLog(`📧 Looking up emails — free website crawl first, then Hunter.io, then Prospeo...`);
      setTotalToProcess(companies.length);

      const collected: ResultRow[] = [];

      for (const company of companies) {
        setLoadingStage(`Looking up email for ${company.company_name}...`);
        let contact: { name: string | null; title: string | null; email: string | null; source: string | null } = {
          name: null, title: null, email: null, source: null,
        };

        // 1. Free — crawl the business's own website for a real posted email (mailto: links,
        // page text). No API credits consumed, so this always runs regardless of Hunter.io/
        // Prospeo account status, and is usually the fastest hit for any site that lists one.
        if (company.website) {
          try {
            const scrapeRes = await fetch(`${API}/scrape-website-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ website: company.website }),
            });
            const scrapeData = await scrapeRes.json();
            if (scrapeData.emails?.[0]) {
              contact = { name: null, title: null, email: scrapeData.emails[0], source: "Website" };
            }
          } catch { /* fall through to Hunter.io below */ }
        }

        // 2. Hunter.io — paid, real contact-database lookup, often finds a named decision-maker.
        if (!contact.email) {
          try {
            const dmRes = await fetch(`${API}/apollo-people-search`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ companyName: company.company_name, domain: company.domain || undefined, maxContacts: 1 }),
            });
            const dmData = await dmRes.json();
            const found = dmData.contacts?.[0];
            if (found) {
              contact = { name: found.name || null, title: found.title || null, email: found.email || null, source: found.source || "Hunter.io" };
            }
          } catch { /* fall through to Prospeo below */ }
        }

        // 3. Prospeo — paid, last resort.
        if (!contact.email) {
          try {
            const prospeoRes = await fetch(`${API}/prospeo-company-search`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ companyName: company.company_name, website: company.website || undefined }),
            });
            const prospeoData = await prospeoRes.json();
            const found = prospeoData.contacts?.[0];
            if (found) {
              contact = { name: found.name || null, title: found.title || null, email: found.email || null, source: "Prospeo" };
            }
          } catch { /* no email found from any source — honest blank, not fabricated */ }
        }

        collected.push({
          company: company.company_name,
          website: company.website || "",
          domain: company.domain,
          country: company.country,
          contactName: contact.name,
          title: contact.title,
          email: contact.email,
          source: contact.source,
        });

        if (contact.email) addLog(`   ✔️ ${company.company_name}: ${contact.email} [${contact.source}]`);
        else addLog(`   — ${company.company_name}: no email found`);

        setProcessedCount(prev => prev + 1);

        await new Promise(r => setTimeout(r, 200));
      }

      setResults(collected);
      const withEmail = collected.filter(r => r.email).length;
      addLog(`✅ Done — ${withEmail}/${collected.length} businesses with a real email found.`);

      // Save a snapshot so this run stays browsable as history after a refresh/close — the
      // whole run happens client-side, so this is the only point the results reach the backend.
      try {
        await fetch(`${API}/email-finder-history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ niche, countries: countriesInput, city, results: collected }),
        });
      } catch (err) {
        console.error("Failed to save history snapshot:", err);
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message || "Request failed"}`);
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setRunning(false);
      setLoadingStage("");
    }
  };

  // ── History (past runs) ────────────────────────────────────────────────────
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API}/email-finder-history`);
      const data = await res.json();
      if (data?.success) setHistoryList(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryRun = async (id: string) => {
    setShowHistory(false);
    try {
      const res = await fetch(`${API}/email-finder-history/${id}`);
      const data = await res.json();
      if (data?.success && data.data) {
        const run = data.data;
        setNiche(run.niche || "");
        setCountriesInput(run.countries || "");
        setCity(run.city || "");
        setResults(run.results || []);
        setLog([]);
      }
    } catch (err) {
      console.error("Failed to load that run:", err);
      toast({ title: "Failed to load that run.", variant: "destructive" });
    }
  };

  const downloadCSV = () => {
    if (!results.length) return;
    const headers = ["Company", "Country", "Website", "Contact Name", "Title", "Email", "Source"];
    const rows = results.map(r => [r.company, r.country, r.website, r.contactName || "", r.title || "", r.email || "", r.source || ""]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-finder-${niche || "results"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const emailCount = results.filter(r => r.email).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/offerings')} className="h-9 w-9 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                <Mail className="h-6 w-6" /> Email Finder
              </h1>
              <p className="text-slate-400 text-sm">Niche + Country(s) + City → real businesses via Google Maps, real emails via free website crawl / Hunter.io / Prospeo</p>
            </div>
          </div>
          <div className="relative">
            <Button
              variant="outline" size="sm"
              onClick={() => { const next = !showHistory; setShowHistory(next); if (next) loadHistory(); }}
              className="gap-2 border-slate-700 text-slate-300"
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
                    <div className="font-semibold text-slate-200">{h.niche || "(untitled)"} — {h.countries}</div>
                    <div className="text-slate-500 mt-0.5">{new Date(h.createdAt).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-200 text-base">Search</CardTitle>
            <CardDescription className="text-slate-500 text-xs">Same real data sources as B2B Campaign Intelligence — no fabricated results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Niche *</Label>
                <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. Dentists, Plumbers" className="bg-slate-950 border-slate-700" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-slate-300">Countries * (comma-separated for multiple)</Label>
                <Input value={countriesInput} onChange={e => setCountriesInput(e.target.value)} placeholder="e.g. United Arab Emirates, Greece, Italy, Spain, United States" className="bg-slate-950 border-slate-700" />
                <p className="text-[10px] text-slate-500">Each country is searched separately and results are combined + deduplicated — real coverage, not padded to a target number.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">City (optional)</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Austin" className="bg-slate-950 border-slate-700" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Target Count (per country)</Label>
                <Input type="number" value={target} onChange={e => setTarget(e.target.value)} className="bg-slate-950 border-slate-700" />
                <p className="text-[10px] text-slate-500">Max 2000 per country — large values can exhaust your Apify budget in one search</p>
              </div>
            </div>
            <Button onClick={runSearch} disabled={running} className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? "Searching…" : "Find Businesses & Emails"}
            </Button>
          </CardContent>
        </Card>

        {running && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="py-10 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-slate-200 font-medium">
                {totalToProcess > 0 ? `Checking ${processedCount} / ${totalToProcess} businesses…` : (loadingStage || "Searching…")}
              </p>
              {totalToProcess > 0 && (
                <p className="text-slate-500 text-xs max-w-md">{loadingStage}</p>
              )}
              <p className="text-slate-500 text-xs max-w-md">Each business gets a real Google Maps lookup, then a free website crawl, Hunter.io, and Prospeo check for a real email — this can take a while for larger searches.</p>
            </CardContent>
          </Card>
        )}

        {log.length > 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200 text-base">Execution Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 h-[220px] overflow-y-auto font-mono text-xs space-y-1">
                {log.map((l, i) => <div key={i} className="text-slate-400">{l}</div>)}
              </div>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-slate-200 text-base flex items-center gap-2"><Building2 className="h-4 w-4 text-cyan-400" /> Results</CardTitle>
                <CardDescription className="text-slate-500 text-xs">{results.length} businesses · {emailCount} with a real email found</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={downloadCSV} className="border-slate-700 text-slate-300 gap-1.5">
                <Download className="h-3.5 w-3.5" /> Download CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Company</TableHead>
                    <TableHead className="text-slate-400">Country</TableHead>
                    <TableHead className="text-slate-400">Website</TableHead>
                    <TableHead className="text-slate-400">Contact</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r, i) => (
                    <TableRow key={i} className="border-slate-800">
                      <TableCell className="text-slate-200 font-medium">{r.company}</TableCell>
                      <TableCell className="text-slate-400 text-xs">{r.country}</TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {r.website ? <a href={r.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{r.website}</a> : "—"}
                      </TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        {r.contactName ? `${r.contactName}${r.title ? ` (${r.title})` : ""}` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.email ? <span className="text-emerald-400">{r.email}</span> : <span className="text-slate-600">Not found</span>}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">{r.source || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
