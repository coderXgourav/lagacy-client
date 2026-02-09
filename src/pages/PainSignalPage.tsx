import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Activity,
  ArrowLeft,
  Search,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Mail,
  Building,
  TrendingUp,
  Clock,
  Filter,
  MoreHorizontal,
  Archive,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

interface PainSignal {
  _id: string;
  source: string;
  sourceUrl: string;
  author: string;
  title: string;
  text: string;
  painType: string;
  intentStrength: number;
  businessLikelihood: number;
  finalScore: number;
  status: string;
  companyGuess: string;
  websiteGuess: string;
  enrichedEmails: string[];
  enrichedDomain: string;
  createdAt: string;
  topicTags: string[];
}

interface Stats {
  overview: {
    total: number;
    qualified: number;
    enriched: number;
    contacted: number;
    todayNew: number;
    avgScore: number;
  };
  bySource: Record<string, number>;
  byPainType: Record<string, number>;
  scheduler: {
    isRunning: boolean;
    isSchedulerActive: boolean;
    lastRunTime: string | null;
  };
}

export default function PainSignalPage() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState<PainSignal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<PainSignal | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [minScore, setMinScore] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [enrichingBulk, setEnrichingBulk] = useState(false);

  // Platform Selection
  const [selectedPlatform, setSelectedPlatform] = useState("reddit");

  // Apify Configuration - Reddit
  const [apifySearchQueries, setApifySearchQueries] = useState<string[]>(["website is not working"]);
  const [newSearchQuery, setNewSearchQuery] = useState("");
  const [apifySortBy, setApifySortBy] = useState("relevance");
  const [apifyTimeFrame, setApifyTimeFrame] = useState("all");
  const [apifySubreddit, setApifySubreddit] = useState("");
  const [apifyMaxPosts, setApifyMaxPosts] = useState(50);

  // Apify Configuration - Twitter
  const [twitterSearchQueries, setTwitterSearchQueries] = useState<string[]>(["need a developer", "website down"]);
  const [newTwitterQuery, setNewTwitterQuery] = useState("");
  const [twitterSortBy, setTwitterSortBy] = useState("Latest");
  const [twitterMaxTweets, setTwitterMaxTweets] = useState(50);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/pain-signals/stats`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        setPipelineRunning(data.data.scheduler?.isRunning || false);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sourceFilter !== "all") params.append("source", sourceFilter);
      if (minScore) params.append("minScore", minScore);
      params.append("sortBy", "finalScore");
      params.append("sortOrder", "desc");
      params.append("limit", "50");

      const response = await fetch(`${API_URL}/pain-signals?${params}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setSignals(data.data);
      }
    } catch (error) {
      console.error("Error fetching signals:", error);
      toast.error("Failed to fetch signals");
    } finally {
      setLoading(false);
    }
  };

  const addSearchQuery = () => {
    if (newSearchQuery.trim() && !apifySearchQueries.includes(newSearchQuery.trim())) {
      setApifySearchQueries([...apifySearchQueries, newSearchQuery.trim()]);
      setNewSearchQuery("");
    }
  };

  const removeSearchQuery = (index: number) => {
    setApifySearchQueries(apifySearchQueries.filter((_, i) => i !== index));
  };

  const addTwitterQuery = () => {
    if (newTwitterQuery.trim() && !twitterSearchQueries.includes(newTwitterQuery.trim())) {
      setTwitterSearchQueries([...twitterSearchQueries, newTwitterQuery.trim()]);
      setNewTwitterQuery("");
    }
  };

  const removeTwitterQuery = (index: number) => {
    setTwitterSearchQueries(twitterSearchQueries.filter((_, i) => i !== index));
  };

  const runPipeline = async () => {
    try {
      setPipelineRunning(true);
      
      const payload: any = {};
      
      if (selectedPlatform === 'reddit') {
        payload.searchQueries = apifySearchQueries;
        payload.sort = apifySortBy;
        payload.timeRange = apifyTimeFrame;
        payload.subreddit = apifySubreddit;
        payload.maxPosts = apifyMaxPosts;
      } else if (selectedPlatform === 'twitter') {
        payload.twitterConfig = {
          searchQueries: twitterSearchQueries,
          sort: twitterSortBy,
          maxItems: twitterMaxTweets
        };
      }

      const response = await fetch(`${API_URL}/pain-signals/run`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Pipeline started for ${selectedPlatform === 'reddit' ? 'Reddit' : 'Twitter'}`);
        setShowConfigPanel(false);
        
        // Poll for completion
        const pollInterval = setInterval(async () => {
          await fetchStats();
          await fetchSignals();
        }, 10000);
        
        // Stop polling after 3 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setPipelineRunning(false);
          fetchStats();
          fetchSignals();
        }, 180000);
      } else {
        toast.error(data.error || "Failed to start pipeline");
        setPipelineRunning(false);
      }
    } catch (error) {
      console.error("Error running pipeline:", error);
      toast.error("Failed to start pipeline");
      setPipelineRunning(false);
    }
  };

  const updateSignalStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/pain-signals/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Status updated to ${status}`);
        fetchSignals();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const enrichSignal = async (id: string) => {
    try {
      toast.info("Enriching signal...");
      const response = await fetch(`${API_URL}/pain-signals/${id}/enrich`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Signal enriched!");
        fetchSignals();
      }
    } catch (error) {
      toast.error("Failed to enrich signal");
    }
  };

  const bulkEnrich = async () => {
    if (selectedIds.length === 0) return;
    try {
      setEnrichingBulk(true);
      toast.info(`Enriching ${selectedIds.length} signals...`);
      const response = await fetch(`${API_URL}/pain-signals/bulk/enrich`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully enriched ${data.count} signals`);
        setSelectedIds([]);
        fetchSignals();
        fetchStats();
      }
    } catch (error) {
      toast.error("Bulk enrichment failed");
    } finally {
      setEnrichingBulk(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === signals.length && signals.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(signals.map(s => s._id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const bulkArchive = async () => {
    if (selectedIds.length === 0) return;
    try {
      toast.info(`Archiving ${selectedIds.length} signals...`);
      const response = await fetch(`${API_URL}/pain-signals/bulk/archive`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setSelectedIds([]);
        fetchSignals();
        fetchStats();
      }
    } catch (error) {
      toast.error("Bulk archive failed");
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} signals?`)) return;
    
    try {
      toast.info(`Deleting ${selectedIds.length} signals...`);
      const response = await fetch(`${API_URL}/pain-signals/bulk`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setSelectedIds([]);
        fetchSignals();
        fetchStats();
      }
    } catch (error) {
      toast.error("Bulk delete failed");
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSignals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSignals();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, sourceFilter, minScore]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      qualified: "bg-green-100 text-green-700",
      enriched: "bg-purple-100 text-purple-700",
      contacted: "bg-amber-100 text-amber-700",
      archived: "bg-gray-100 text-gray-700",
    };
    return variants[status] || "bg-gray-100 text-gray-700";
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "reddit":
        return "🔴";
      case "twitter":
        return "𝕏";
      case "producthunt":
        return "🔶";
      default:
        return "🌐";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/offerings")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="h-8 w-8 text-primary" />
                Pain Signal Detection
              </h1>
              <p className="text-muted-foreground">
                AI-powered buying intent signals from social media
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showConfigPanel ? "Hide Config" : "Configure"}
            </Button>
            <Button
              onClick={runPipeline}
              disabled={pipelineRunning}
              className="gap-2"
            >
              {pipelineRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Pipeline
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Apify Configuration Panel */}
        {showConfigPanel && (
          <Card className="mb-6 border-2 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                🔴 Signal Sources Configuration
              </CardTitle>
              <CardDescription>
                Configure search queries and filters for your data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="reddit" value={selectedPlatform} onValueChange={setSelectedPlatform} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="reddit">Reddit Scraper</TabsTrigger>
                  <TabsTrigger value="twitter">Twitter Scraper</TabsTrigger>
                </TabsList>

                {/* Reddit Tab */}
                <TabsContent value="reddit" className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Search Queries</label>
                    <div className="space-y-2">
                      {apifySearchQueries.map((query, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                          <Input
                            value={query}
                            onChange={(e) => {
                              const newQueries = [...apifySearchQueries];
                              newQueries[index] = e.target.value;
                              setApifySearchQueries(newQueries);
                            }}
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSearchQuery(index)}
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add new search query..."
                        value={newSearchQuery}
                        onChange={(e) => setNewSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSearchQuery()}
                        className="flex-1"
                      />
                      <Button onClick={addSearchQuery} variant="secondary" className="gap-1">
                        + Add
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sort by</label>
                      <Select value={apifySortBy} onValueChange={setApifySortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="relevance">Relevance</SelectItem>
                          <SelectItem value="hot">Hot | trending posts</SelectItem>
                          <SelectItem value="new">New | latest posts</SelectItem>
                          <SelectItem value="top">Top | highest rated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time range</label>
                      <Select value={apifyTimeFrame} onValueChange={setApifyTimeFrame}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All time</SelectItem>
                          <SelectItem value="hour">Past hour</SelectItem>
                          <SelectItem value="day">Past 24 hours</SelectItem>
                          <SelectItem value="week">Past week</SelectItem>
                          <SelectItem value="month">Past month</SelectItem>
                          <SelectItem value="year">Past year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Posts</label>
                      <Input
                        type="number"
                        min="10"
                        max="500"
                        value={apifyMaxPosts}
                        onChange={(e) => setApifyMaxPosts(parseInt(e.target.value) || 50)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Subreddit (optional)</label>
                    <Input
                      placeholder="e.g., entrepreneur, smallbusiness"
                      value={apifySubreddit}
                      onChange={(e) => setApifySubreddit(e.target.value)}
                    />
                  </div>
                </TabsContent>

                {/* Twitter Tab */}
                <TabsContent value="twitter" className="space-y-6">
                  <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm border border-blue-200 flex items-center gap-2">
                    <span>ℹ️ Using Apify Actor: <strong>Twitter Scraper (nfp1fpt5gUlBwPcor)</strong></span>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Search Terms</label>
                    <div className="space-y-2">
                      {twitterSearchQueries.map((query, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                          <Input
                            value={query}
                            onChange={(e) => {
                              const newQueries = [...twitterSearchQueries];
                              newQueries[index] = e.target.value;
                              setTwitterSearchQueries(newQueries);
                            }}
                            className="flex-1 border-blue-200 focus-visible:ring-blue-400"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTwitterQuery(index)}
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. need a developer, website down"
                        value={newTwitterQuery}
                        onChange={(e) => setNewTwitterQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTwitterQuery()}
                        className="flex-1"
                      />
                      <Button onClick={addTwitterQuery} variant="secondary" className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                        + Add
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sort by</label>
                      <Select value={twitterSortBy} onValueChange={setTwitterSortBy}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Latest">Latest</SelectItem>
                          <SelectItem value="Top">Top</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Tweets</label>
                      <Input
                        type="number"
                        min="10"
                        max="1000"
                        value={twitterMaxTweets}
                        onChange={(e) => setTwitterMaxTweets(parseInt(e.target.value) || 50)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Signals</div>
              <div className="text-2xl font-bold">{stats?.overview.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Qualified</div>
              <div className="text-2xl font-bold text-green-600">
                {stats?.overview.qualified || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Enriched</div>
              <div className="text-2xl font-bold text-purple-600">
                {stats?.overview.enriched || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Contacted</div>
              <div className="text-2xl font-bold text-amber-600">
                {stats?.overview.contacted || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Today</div>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.overview.todayNew || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Avg Score</div>
              <div className="text-2xl font-bold">{stats?.overview.avgScore || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search signals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="enriched">Enriched</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="reddit">Reddit</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                  <SelectItem value="producthunt">ProductHunt</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Min Score"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                className="w-[120px]"
              />
              <Button variant="outline" onClick={fetchSignals}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Signals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pain Signals</CardTitle>
            <CardDescription>
              Detected buying intent signals sorted by score
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Loading signals...</p>
              </div>
            ) : signals.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No signals found</p>
                <p className="text-sm text-muted-foreground">
                  Run the pipeline to start detecting pain signals
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox 
                        checked={selectedIds.length === signals.length && signals.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[60px]">Score</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="max-w-[300px]">Signal</TableHead>
                    <TableHead>Pain Type</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signals.map((signal) => (
                    <TableRow 
                      key={signal._id} 
                      className={`cursor-pointer hover:bg-muted/50 ${selectedIds.includes(signal._id) ? 'bg-muted/50' : ''}`}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox 
                          checked={selectedIds.includes(signal._id)}
                          onCheckedChange={() => toggleSelect(signal._id)}
                        />
                      </TableCell>
                      <TableCell onClick={() => setSelectedSignal(signal)}>
                        <div
                          className={`${getScoreColor(signal.finalScore)} text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-sm`}
                        >
                          {signal.finalScore}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-lg" title={signal.source}>
                          {getSourceIcon(signal.source)}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="space-y-1">
                          <div className="font-medium truncate">
                            {signal.title || signal.text.slice(0, 60)}...
                          </div>
                          <div className="text-xs text-muted-foreground">
                            by {signal.author}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {signal.painType || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {signal.companyGuess || "-"}
                          </div>
                          {signal.enrichedEmails?.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Mail className="h-3 w-3" />
                              {signal.enrichedEmails.length} emails
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(signal.status)}>
                          {signal.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedSignal(signal)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(signal.sourceUrl, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Source
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => enrichSignal(signal._id)}>
                              <Building className="h-4 w-4 mr-2" />
                              Enrich
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateSignalStatus(signal._id, "contacted")}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Mark Contacted
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateSignalStatus(signal._id, "archived")}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Floating Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-sm font-medium">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                {selectedIds.length}
              </span>
              Selected
            </div>
            <div className="h-6 w-[1px] bg-border" />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                onClick={bulkEnrich}
                disabled={enrichingBulk}
              >
                {enrichingBulk ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Building className="h-4 w-4" />}
                Enrich Leads
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={bulkArchive}
              >
                <Archive className="h-4 w-4" />
                Archive
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={bulkDelete}
              >
                <RefreshCw className="h-4 w-4" />
                Delete
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Cancel
            </Button>
          </div>
        )}


        {/* Signal Detail Dialog */}
        <Dialog open={!!selectedSignal} onOpenChange={() => setSelectedSignal(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedSignal && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-lg">{getSourceIcon(selectedSignal.source)}</span>
                    {selectedSignal.title || "Signal Details"}
                  </DialogTitle>
                  <DialogDescription>
                    Score: {selectedSignal.finalScore} | Status: {selectedSignal.status}
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="content">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="enrichment">Enrichment</TabsTrigger>
                  </TabsList>
                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Full Text</h4>
                      <p className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
                        {selectedSignal.text}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Author:</span>
                        <p className="font-medium">{selectedSignal.author}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Posted:</span>
                        <p className="font-medium">
                          {new Date(selectedSignal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedSignal.sourceUrl, "_blank")}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original Post
                    </Button>
                  </TabsContent>
                  <TabsContent value="analysis" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">Intent Strength</div>
                          <div className="text-2xl font-bold">
                            {selectedSignal.intentStrength}%
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm text-muted-foreground">
                            Business Likelihood
                          </div>
                          <div className="text-2xl font-bold">
                            {selectedSignal.businessLikelihood}%
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Pain Type</h4>
                      <Badge variant="outline" className="text-lg">
                        {selectedSignal.painType || "Unknown"}
                      </Badge>
                    </div>
                    {selectedSignal.topicTags?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Topic Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedSignal.topicTags.map((tag, i) => (
                            <Badge key={i} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="enrichment" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-tight">Company Detection</h4>
                        <p className="font-medium">{selectedSignal.companyGuess || "Not detected"}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-tight">Website Detection</h4>
                        <p className="font-medium">{selectedSignal.websiteGuess || "Not detected"}</p>
                      </div>
                    </div>

                    {selectedSignal.enrichedCompany && (
                      <div className="bg-muted/30 p-4 rounded-xl space-y-3 border">
                        <h4 className="font-bold text-primary flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Company Profile
                        </h4>
                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                          {selectedSignal.enrichedCompany.name && (
                            <div>
                              <span className="text-muted-foreground">Legal Name:</span>
                              <p className="font-medium">{selectedSignal.enrichedCompany.name}</p>
                            </div>
                          )}
                          {selectedSignal.enrichedDomain && (
                            <div>
                              <span className="text-muted-foreground">Domain:</span>
                              <p className="font-medium text-blue-600">{selectedSignal.enrichedDomain}</p>
                            </div>
                          )}
                          {selectedSignal.enrichedCompany.industry && (
                            <div>
                              <span className="text-muted-foreground">Industry:</span>
                              <p className="font-medium">{selectedSignal.enrichedCompany.industry}</p>
                            </div>
                          )}
                          {selectedSignal.enrichedCompany.location && (
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <p className="font-medium">{selectedSignal.enrichedCompany.location}</p>
                            </div>
                          )}
                        </div>
                        {selectedSignal.enrichedCompany.description && (
                          <div className="pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Description:</span>
                            <p className="text-xs line-clamp-3">{selectedSignal.enrichedCompany.description}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {selectedSignal.enrichedEmails?.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-600" />
                          Contact Emails ({selectedSignal.enrichedEmails.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedSignal.enrichedEmails.map((email, i) => (
                            <Badge key={i} variant="secondary" className="font-mono py-1 px-3">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSignal.techStack?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-600" />
                          Technology Stack
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedSignal.techStack.map((tech, i) => (
                            <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {!selectedSignal.enrichedDomain && (
                      <Button 
                        onClick={() => enrichSignal(selectedSignal._id)} 
                        className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Run Enrichment Pipeline
                      </Button>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
