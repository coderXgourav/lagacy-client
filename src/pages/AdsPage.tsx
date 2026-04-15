import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Loader2, Search, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

type NichePreset = "Marketing Ads" | "Plumbing Ads" | "Blockchain Ads" | "Custom";

function guessTitle(item: any) {
  return (
    item?.pageName ||
    item?.page_name ||
    item?.advertiserName ||
    item?.advertiser_name ||
    item?.adLibraryPageName ||
    item?.adLibraryPage?.name ||
    item?.snapshot?.page_name ||
    "Unknown advertiser"
  );
}

function guessBody(item: any) {
  return (
    item?.adCreativeBody ||
    item?.body ||
    item?.text ||
    item?.message ||
    item?.adCreativeBodyText ||
    item?.snapshot?.body ||
    ""
  );
}

function guessUrl(item: any) {
  return (
    item?.adSnapshotUrl ||
    item?.snapshotUrl ||
    item?.snapshot_url ||
    item?.url ||
    item?.adLibraryUrl ||
    item?.adUrl ||
    ""
  );
}

export default function AdsPage() {
  const { toast } = useToast();
  const [preset, setPreset] = useState<NichePreset>("Marketing Ads");
  const [country, setCountry] = useState("US");
  const [limit, setLimit] = useState(30);
  const [customKeyword, setCustomKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ actorId?: string; startUrl?: string; datasetId?: string } | null>(null);

  const keyword = useMemo(() => {
    if (preset === "Custom") return customKeyword.trim();
    if (preset === "Marketing Ads") return "marketing agency";
    if (preset === "Plumbing Ads") return "plumbing";
    if (preset === "Blockchain Ads") return "blockchain";
    return customKeyword.trim();
  }, [preset, customKeyword]);

  const runSearch = async () => {
    setLoading(true);
    setResults([]);
    setMeta(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/ads/facebook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          niche: preset,
          keyword,
          country,
          limit,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        const extra =
          data?.code === "APIFY_USAGE_LIMIT"
            ? " (Apify credits/plan limit hit)"
            : "";
        throw new Error(`${data?.message || "Failed to fetch ads"}${extra}`);
      }

      setResults(Array.isArray(data.items) ? data.items : []);
      setMeta({ actorId: data.actorId, startUrl: data.startUrl, datasetId: data.datasetId });
      toast({
        title: "Ads fetched",
        description: `Found ${(data.items || []).length} ads for "${keyword || preset}"`,
      });
    } catch (e: any) {
      toast({
        title: "Failed to fetch ads",
        description: e?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex-1 h-full py-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <TrendingUp className="h-7 w-7 text-primary" />
            Ads Intelligence
            <Badge variant="secondary">Beta</Badge>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Pull live ads data via Apify and list companies actively running ads by niche.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <a href="https://kyptronix.us" target="_blank" rel="noreferrer">
            Visit kyptronix.us
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search niches
          </CardTitle>
          <CardDescription>
            Choose a niche and fetch live ads. (Uses Apify actor on backend.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Niche</Label>
              <div className="flex gap-2 flex-wrap">
                {(["Marketing Ads", "Plumbing Ads", "Blockchain Ads", "Custom"] as NichePreset[]).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={preset === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreset(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="US"
              />
              <p className="text-xs text-muted-foreground">2-letter code (US, GB, IN, etc.)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Limit</Label>
              <Input
                id="limit"
                value={String(limit)}
                onChange={(e) => setLimit(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                placeholder="30"
              />
              <p className="text-xs text-muted-foreground">Max 100 (safe)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyword">Keyword</Label>
              <Input
                id="keyword"
                value={preset === "Custom" ? customKeyword : keyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder='e.g. "plumbing", "dentist", "web design"'
                disabled={preset !== "Custom"}
              />
              <p className="text-xs text-muted-foreground">
                {preset === "Custom" ? "Custom keyword" : "Preset keyword"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={runSearch} disabled={loading || (preset === "Custom" && !customKeyword.trim())}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Fetch Ads
                </>
              )}
            </Button>
            {meta?.startUrl && (
              <Button asChild variant="outline">
                <a href={meta.startUrl} target="_blank" rel="noreferrer">
                  Open library query
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
            {meta?.datasetId && (
              <span className="text-xs text-muted-foreground">
                Dataset: <span className="font-mono">{meta.datasetId}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Showing advertisers + ad snapshots pulled via Apify.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {results.length === 0 && !loading ? (
            <div className="text-sm text-muted-foreground">
              No results yet. Choose a niche and click <b>Fetch Ads</b>.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {results.map((item, idx) => {
                const title = guessTitle(item);
                const body = guessBody(item);
                const url = guessUrl(item);
                return (
                  <Card key={idx} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {body || "No ad text found"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        {item?.adArchiveId || item?.archive_id || item?.id || ""}
                      </div>
                      {url ? (
                        <Button asChild size="sm" variant="outline">
                          <a href={url} target="_blank" rel="noreferrer">
                            View
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="secondary">No link</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

