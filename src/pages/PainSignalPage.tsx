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
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [minScore, setMinScore] = useState("");

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

  const runPipeline = async () => {
    try {
      setPipelineRunning(true);
      const response = await fetch(`${API_URL}/pain-signals/run`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Pipeline started!");
        // Poll for completion
        setTimeout(() => {
          fetchStats();
          fetchSignals();
        }, 5000);
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

  useEffect(() => {
    fetchStats();
    fetchSignals();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSignals();
    }, 300);
    return () => clearTimeout(timer);
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
                    <TableRow key={signal._id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
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
                        <h4 className="font-semibold mb-2">Company Guess</h4>
                        <p>{selectedSignal.companyGuess || "Not detected"}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Website Guess</h4>
                        <p>{selectedSignal.websiteGuess || "Not detected"}</p>
                      </div>
                    </div>
                    {selectedSignal.enrichedDomain && (
                      <div>
                        <h4 className="font-semibold mb-2">Enriched Domain</h4>
                        <p>{selectedSignal.enrichedDomain}</p>
                      </div>
                    )}
                    {selectedSignal.enrichedEmails?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">
                          Emails ({selectedSignal.enrichedEmails.length})
                        </h4>
                        <div className="space-y-1">
                          {selectedSignal.enrichedEmails.map((email, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm">{email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {!selectedSignal.enrichedDomain && (
                      <Button onClick={() => enrichSignal(selectedSignal._id)} className="w-full">
                        <Building className="h-4 w-4 mr-2" />
                        Enrich This Signal
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
