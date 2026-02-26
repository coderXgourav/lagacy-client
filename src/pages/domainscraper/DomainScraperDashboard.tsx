import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sparkles,
  Database,
  Calendar,
  TrendingUp,
  Download,
  Play,
  Zap,
  ChevronRight,
  Globe,
  Search,
  RefreshCw,
  BarChart3,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { domainScraperApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function DomainScraperDashboard() {
  const [stats, setStats] = useState({
    totalDomains: 0,
    dateStats: [] as Array<{ date: string; count: number }>
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'date' | 'all'>('date');
  const [domains, setDomains] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await domainScraperApi.getDashboardStats();
      setStats({
        totalDomains: data.totalDomains || 0,
        dateStats: data.dateStats || []
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      setLoadingDomains(true);
      let data;
      if (viewMode === 'all') {
        data = await domainScraperApi.getDomains(page, 10);
      } else if (selectedDate) {
        data = await domainScraperApi.getDomainsByDate(selectedDate, page, 10);
      } else {
        return;
      }

      setDomains(data.domains || []);
      setPagination({
        ...data.pagination,
        totalPages: data.pages || data.pagination?.pages || 1
      });
    } catch (error: any) {
      console.error('Failed to fetch domains:', error);
      toast({
        title: "Error",
        description: "Failed to load domains",
        variant: "destructive"
      });
    } finally {
      setLoadingDomains(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (viewMode === 'all' || selectedDate) {
      fetchDomains();
    }
  }, [selectedDate, page, viewMode]);

  const handleDownload = async () => {
    try {
      await domainScraperApi.downloadAllDomains();
      toast({
        title: "Download Started",
        description: "Your Excel file is being downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleTriggerScrape = async () => {
    try {
      setTriggering(true);
      await domainScraperApi.triggerScrape();
      toast({
        title: "Scraping Started",
        description: "Domain scraping has been triggered in the background",
      });
      setTimeout(() => {
        fetchDashboardData();
        if (viewMode === 'all') fetchDomains();
      }, 5000);
    } catch (error: any) {
      toast({
        title: "Failed to Start Scraping",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="container mx-auto space-y-8 p-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-600/20">
                <Globe className="h-7 w-7 text-white" />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-xs font-semibold tracking-wide uppercase">
                Intelligence Hub
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Domain Scraper Intelligence
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Monitor newly registered domains, enrich lead data, and manage your scraping vector performance.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button
              onClick={handleTriggerScrape}
              disabled={triggering}
              className="h-12 gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-600/20 px-6 rounded-xl"
            >
              <Play className={triggering ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {triggering ? "Scraping Vector..." : "Run Vector Scan"}
            </Button>
            <Button onClick={handleDownload} variant="outline" className="h-12 gap-2 bg-card/50 backdrop-blur-sm border-border hover:bg-muted/50 transition-all font-semibold px-6 rounded-xl">
              <Download className="w-4 h-4" />
              Export All
            </Button>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border bg-card/30 backdrop-blur-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all p-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-semibold text-[10px] uppercase tracking-wider">Total Domains Crawled</CardDescription>
              <Database className="h-4 w-4 text-indigo-500" />
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight">{loading ? "..." : stats.totalDomains.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              Lifetime database records
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/30 backdrop-blur-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all p-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-semibold text-[10px] uppercase tracking-wider">Enrichment Source</CardDescription>
              <Zap className="h-4 w-4 text-emerald-500" />
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Multi-source enrichment enabled</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/30 backdrop-blur-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all p-1 col-span-2">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40" />
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="font-semibold text-[10px] uppercase tracking-wider">Scrape Performance</CardDescription>
              <BarChart3 className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="flex items-end gap-4 mt-1">
              <div className="h-10 w-2 bg-indigo-600/20 rounded-full animate-pulse transition-all" />
              <div className="h-14 w-2 bg-indigo-600/40 rounded-full transition-all" />
              <div className="h-8 w-2 bg-indigo-600/20 rounded-full transition-all" />
              <div className="h-16 w-2 bg-indigo-600/60 rounded-full transition-all" />
              <div className="h-12 w-2 bg-indigo-600/30 rounded-full transition-all" />
              <CardTitle className="text-3xl font-extrabold tracking-tight ml-4">Optimized</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Real-time CSV streaming active</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters/Calendar */}
      <Card className="border-border bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20" />
        <CardHeader className="py-8 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-indigo-600" />
                Scrape Timeline
              </CardTitle>
              <CardDescription className="text-sm font-medium">Select a capture vector to review discovered domains</CardDescription>
            </div>
            <Button
              onClick={() => {
                setViewMode('all');
                setSelectedDate(null);
                setPage(1);
              }}
              variant={viewMode === 'all' ? "default" : "outline"}
              className="gap-2 rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-widest"
            >
              <Database className="w-4 h-4" />
              Full Registry
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
              <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Syncing vector dates...</p>
            </div>
          ) : stats.dateStats.length === 0 ? (
            <div className="text-center py-24 bg-muted/5 rounded-2xl border border-dashed border-border flex flex-col items-center">
              <Globe className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-lg font-medium">No domain scans recorded yet.</p>
              <p className="text-sm text-muted-foreground/60 mt-1 uppercase tracking-widest font-bold">Trigger a scan to begin intel gathering</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats.dateStats.map((stat) => (
                <Card
                  key={stat.date}
                  className={`cursor-pointer group hover:shadow-2xl hover:scale-105 transition-all duration-300 relative overflow-hidden backdrop-blur-md border-border ${selectedDate === stat.date
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20'
                      : 'bg-card/40 hover:bg-card/60'
                    }`}
                  onClick={() => {
                    setSelectedDate(stat.date);
                    setViewMode('date');
                    setPage(1);
                  }}
                >
                  <CardContent className="pt-8 pb-6 text-center space-y-2">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedDate === stat.date ? 'text-white/70' : 'text-muted-foreground'}`}>{stat.date}</p>
                    <p className="text-3xl font-extrabold tracking-tighter tabular-nums">{stat.count}</p>
                    <p className={`text-[9px] font-bold uppercase tracking-widest opacity-60`}>Domains</p>
                    {selectedDate === stat.date && (
                      <div className="absolute top-2 right-2">
                        <Sparkles className="h-3 w-3 text-white/50 animate-pulse" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Table */}
      {(selectedDate || viewMode === 'all') && (
        <Card className="border-border bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20" />
          <CardHeader className="py-8 bg-muted/10 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold flex items-center gap-2 leading-none">
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                  {viewMode === 'all' ? 'Universal Domain Feed' : `Intelligence Filter: ${selectedDate}`}
                </CardTitle>
                <CardDescription className="text-sm font-medium">Real-time registry propagation results</CardDescription>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Filter results..."
                  className="pl-10 pr-4 py-2 bg-background/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 transition-all"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingDomains ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
                <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest animate-pulse tracking-widest">Hydrating domain registry...</p>
              </div>
            ) : domains.length === 0 ? (
              <div className="text-center py-32 bg-muted/5">
                <Database className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
                <p className="text-muted-foreground text-xl font-medium tracking-tight">Zero propagation matches found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="px-6 py-5 font-extrabold text-[10px] uppercase tracking-widest text-muted-foreground">Domain Identity</TableHead>
                      <th className="px-6 py-5 font-extrabold text-[10px] uppercase tracking-widest text-muted-foreground text-center">Protocol Extension (TLD)</th>
                      <th className="px-6 py-5 font-extrabold text-[10px] uppercase tracking-widest text-muted-foreground text-center">Registration Vector</th>
                      <th className="px-6 py-5 font-extrabold text-[10px] uppercase tracking-widest text-muted-foreground text-right border-r-0">Source Attribution</th>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/50">
                    {domains.map((domain, index) => (
                      <TableRow key={domain._id || index} className="group hover:bg-indigo-500/[0.02] border-border/50 transition-colors cursor-default">
                        <TableCell className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="font-extrabold text-foreground group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-tight">{domain.domainName || 'N/A'}</span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1">
                              <Search className="w-2.5 h-2.5" /> Discovery Active
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-center">
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                            .{domain.tld || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-foreground tabular-nums">
                              {domain.registrationDate ? new Date(domain.registrationDate).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">Registry Timestamp</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5 text-right">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border group-hover:border-indigo-500/30 transition-all`}>
                            <Database className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] font-bold text-foreground uppercase tracking-widest">{domain.enrichmentSource || 'Discovery CSV'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-8 py-6 bg-muted/20 border-t border-border/50 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Sub-propagation Intel page <span className="text-foreground">{page}</span> of <span className="text-foreground">{pagination.totalPages}</span>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="rounded-xl border-border bg-background/50 h-9 px-6 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Vector Back
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  className="rounded-xl border-border bg-background/50 h-9 px-6 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-muted"
                >
                  Vector Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <RefreshCw className={cn("animate-spin", className)} />
);
