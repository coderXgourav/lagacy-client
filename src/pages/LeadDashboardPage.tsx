import { useState, useEffect } from "react";
import {
  Users,
  Phone,
  Mail,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  DollarSign,
  Zap,
  Target,
  Bot,
  LayoutDashboard,
  BarChart3,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface Lead {
  _id: string;
  name: string;
  phone: string;
  email: string;
  businessType: string;
  packageInterested: string;
  leadSource: string;
  status: string;
  assignedTo: string;
  aiCallStatus: string;
  createdAt: string;
  tags: string[];
}

interface Stats {
  totalLeads: number;
  todayLeads: number;
  byStatus: Record<string, number>;
  byPackage: Record<string, number>;
  bySource: Record<string, number>;
  byAssignee: Record<string, number>;
  speed: { avgResponseTime: number };
  ai: { totalCalls: number; completedCalls: number; answerRate: number };
  sales: { qualifiedRate: number; closeRate: number; meetingRate: number };
  revenue: Record<string, number>;
}

export default function LeadDashboardPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [packageFilter, setPackageFilter] = useState("all");

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lead-capture/stats`);
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      let url = `${API_BASE_URL}/lead-capture?limit=100`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;
      if (packageFilter !== "all") url += `&packageInterested=${packageFilter}`;

      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setLeads(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLeads();
  }, [statusFilter, packageFilter]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "text-blue-500 bg-blue-500/10",
      contacted: "text-yellow-500 bg-yellow-500/10",
      qualified: "text-emerald-500 bg-emerald-500/10",
      meeting_booked: "text-purple-500 bg-purple-500/10",
      proposal_sent: "text-indigo-500 bg-indigo-500/10",
      won: "text-indigo-600 bg-indigo-600/10 font-bold",
      lost: "text-red-500 bg-red-500/10",
    };
    return colors[status] || "text-gray-500 bg-gray-500/10";
  };

  const getPackageColor = (pkg: string) => {
    const colors: Record<string, string> = {
      starter: "bg-emerald-500/10 text-emerald-600",
      growth: "bg-blue-500/10 text-blue-600",
      scale: "bg-indigo-500/10 text-indigo-600",
      enterprise: "bg-amber-500/10 text-amber-600",
    };
    return colors[pkg] || "bg-gray-500/10 text-gray-600";
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      meta: "bg-blue-600",
      google: "bg-rose-500",
      organic: "bg-emerald-600",
      direct: "bg-indigo-600",
    };
    return colors[source] || "bg-slate-400";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-600/20">
                <BarChart3 className="h-7 w-7 text-white" />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-xs font-semibold tracking-wide uppercase">
                Intelligence
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Conversion Hub
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Monitor lead generation performance, AI response latency, and acquisition channel efficiency in real-time.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button
              onClick={() => { fetchStats(); fetchLeads(); }}
              variant="outline"
              className="h-12 gap-2 bg-card/50 backdrop-blur-sm border-border hover:bg-muted/50 transition-all font-semibold"
            >
              <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Refresh Intelligence
            </Button>
          </div>
        </div>
      </div>

      {stats && (
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <TabsList className="bg-transparent h-auto p-0 gap-8">
              {["overview", "acquisition", "speed", "sales", "ai"].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="bg-transparent border-b-2 border-transparent rounded-none px-0 py-3 text-sm font-semibold text-muted-foreground data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 data-[state=active]:shadow-none transition-all uppercase tracking-wider"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Total Propects", value: stats.totalLeads, icon: Users, color: "indigo", sub: "All time" },
                { label: "Today's Intake", value: stats.todayLeads, icon: TrendingUp, color: "emerald", sub: "New since midnight" },
                { label: "Qualified Hub", value: stats.byStatus?.qualified || 0, icon: CheckCircle, color: "blue", sub: "Ready for sales" },
                { label: "Active Meetings", value: stats.byStatus?.meeting_booked || 0, icon: Clock, color: "amber", sub: "Scheduled" }
              ].map((s, idx) => (
                <Card key={idx} className="border-border bg-card/30 backdrop-blur-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all">
                  <div className={`absolute top-0 left-0 w-1 h-full bg-${s.color}-500`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription className="font-semibold text-xs uppercase tracking-wider">{s.label}</CardDescription>
                      <s.icon className={`h-4 w-4 text-${s.color}-500`} />
                    </div>
                    <CardTitle className="text-3xl font-bold">{s.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                      {s.sub}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20" />
              <CardHeader className="py-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <LayoutDashboard className="w-5 h-5 text-indigo-600" />
                      Live Prospect Stream
                    </CardTitle>
                    <CardDescription>Real-time feed of captured leads</CardDescription>
                  </div>
                  <div className="flex gap-4">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40 bg-background/50 h-10">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="new">New Intake</SelectItem>
                        <SelectItem value="contacted">Contacted</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
                    <p className="text-muted-foreground font-medium">Retrieving lead data...</p>
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-center py-24 bg-muted/5">
                    <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">No prospects found matching targets.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                          <TableHead className="py-4 font-bold text-xs uppercase tracking-wider">Prospect Identity</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Package Target</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Pipeline Status</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">AI Voice Status</TableHead>
                          <TableHead className="font-bold text-xs uppercase tracking-wider">Intake Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leads.slice(0, 15).map((lead) => (
                          <TableRow key={lead._id} className="hover:bg-indigo-500/[0.02] border-border/50 transition-colors group">
                            <TableCell className="py-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-tight">{lead.name}</span>
                                <span className="text-xs text-muted-foreground font-medium">{lead.phone}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPackageColor(lead.packageInterested)} variant="outline">
                                {lead.packageInterested || 'General'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-current/20 ${getStatusColor(lead.status)}`}>
                                {lead.status?.replace("_", " ")}
                              </div>
                            </TableCell>
                            <TableCell>
                              {lead.aiCallStatus === "completed" ? (
                                <div className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Answered
                                </div>
                              ) : lead.aiCallStatus === "failed" ? (
                                <div className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase">
                                  <XCircle className="h-3.5 w-3.5" />
                                  Abandoned
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase">
                                  <Smartphone className="h-3.5 w-3.5" />
                                  {lead.aiCallStatus || 'Pending'}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">{formatDate(lead.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACQUISITION TAB */}
          <TabsContent value="acquisition" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border bg-card/30 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">Channel Alpha</CardTitle>
                    <TrendingUp className="h-4 w-4 text-indigo-600" />
                  </div>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Revenue by Source</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(stats.revenue || {}).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl">
                      <p className="text-xs text-muted-foreground font-medium">Awaiting first conversion data...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(stats.bySource || {}).map(([source, count], idx) => (
                        <div key={source} className="group/row">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-bold capitalize flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${getSourceColor(source)}`} />
                              {source}
                            </span>
                            <span className="text-xs font-mono font-bold">{count} Leads</span>
                          </div>
                          <Progress value={(count / stats.totalLeads) * 100} className="h-1.5 bg-muted group-hover/row:h-2 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card/30 backdrop-blur-sm group">
                <CardHeader className="pb-2 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all">
                    <DollarSign className="h-6 w-6 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">Unified Ads API</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">Platform Spend Analytics</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Centralize Meta Pixel and Google GTAG cost data to calculate real-time ROAS.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-600/20 font-bold text-[10px] tracking-widest uppercase py-6">
                    Integrate Ad Console
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/30 backdrop-blur-sm group">
                <CardHeader className="pb-2 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all">
                    <Target className="h-6 w-6 text-emerald-600 transition-all duration-300 transform group-hover:rotate-12" />
                  </div>
                  <CardTitle className="text-lg">Target Performance</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">CPL Performance Target</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    Benchmark acquisition costs against industry standards.
                  </p>
                  <Button variant="secondary" size="sm" className="w-full bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-600/20 font-bold text-[10px] tracking-widest uppercase py-6">
                    Define Cost KPIs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SPEED METRICS TAB */}
          <TabsContent value="speed" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-border bg-card/30 backdrop-blur-sm p-8 text-center relative group">
                <div className="absolute inset-0 bg-indigo-600/[0.02] pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center space-y-6">
                  <div className="p-4 rounded-3xl bg-indigo-600/10 shadow-inner">
                    <Clock className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div className="space-y-2">
                    <CardDescription className="font-bold uppercase tracking-[0.2em] text-[10px]">Avg Contact Velocity</CardDescription>
                    <div className="text-7xl font-bold tracking-tighter text-foreground tabular-nums">
                      {stats.speed?.avgResponseTime || 0}<span className="text-xl font-normal text-muted-foreground ml-2">min</span>
                    </div>
                  </div>
                  <div className="w-full max-w-[200px]">
                    <Progress value={Math.max(100 - (stats.speed?.avgResponseTime || 0), 10)} className="h-2 bg-muted/50" />
                    <p className="text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-widest">Efficiency Threshold: 5m</p>
                  </div>
                </div>
              </Card>

              <Card className="border-border bg-card/30 backdrop-blur-sm p-8 text-center relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-indigo-600/20 transition-all duration-700" />
                <div className="relative z-10 flex flex-col items-center space-y-6">
                  <div className="p-4 rounded-3xl bg-emerald-600/10 shadow-inner">
                    <Zap className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <CardDescription className="font-bold uppercase tracking-[0.2em] text-[10px]">AI Signal Latency</CardDescription>
                    <div className="text-7xl font-bold tracking-tighter text-foreground tabular-nums">
                      30<span className="text-xl font-normal text-muted-foreground ml-2">sec</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                    <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase tracking-wider">High Frequency Response Path</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* SALES METRICS TAB */}
          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Qualified Pipeline", value: stats.sales?.qualifiedRate, color: "indigo", desc: "Conversion to SQL" },
                { label: "Discovery Meetings", value: stats.sales?.meetingRate, color: "emerald", desc: "Meeting Booking Velocity" },
                { label: "Deal Closure", value: stats.sales?.closeRate, color: "indigo", desc: "Won Revenue Ratio" }
              ].map((m, idx) => (
                <Card key={idx} className="border-border bg-card/30 backdrop-blur-sm p-6 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-${m.color}-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-all duration-700`} />
                  <CardHeader className="p-0 mb-6">
                    <CardTitle className="text-lg font-bold">{m.label}</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{m.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-4xl font-bold tabular-nums">{m.value}%</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase opacity-50">Target: {(m.value || 0) + 5}%</span>
                    </div>
                    <Progress value={m.value} className={`h-2 bg-${m.color}-500/10`} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* AI PERFORMANCE TAB */}
          <TabsContent value="ai" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border bg-card/30 backdrop-blur-sm p-6 relative group overflow-hidden">
                <CardHeader className="p-0 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Bot className="h-5 w-5 text-indigo-500" />
                        Voice Accuracy
                      </CardTitle>
                      <CardDescription className="text-xs font-bold uppercase tracking-widest mt-1">Answer Pickup Rate</CardDescription>
                    </div>
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 font-mono text-xl font-bold">
                      {stats.ai?.answerRate}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 space-y-6">
                  <Progress value={stats.ai?.answerRate} className="h-3 bg-indigo-500/10" />
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50">
                    <div className="flex justify-between items-center text-xs font-bold mb-1">
                      <span className="text-muted-foreground uppercase tracking-wider">Answered Calls</span>
                      <span className="text-foreground">{stats.ai?.completedCalls}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-muted-foreground uppercase tracking-wider">Attempts Made</span>
                      <span className="text-foreground">{stats.ai?.totalCalls}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="col-span-2 border-border bg-card/30 backdrop-blur-sm p-6 relative group">
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-emerald-500" />
                    Voice Outcome Analysis
                  </CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest mt-1">Categorized Dialing Results</CardDescription>
                </CardHeader>
                <CardContent className="p-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col justify-center">
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1.5 opacity-70">Successful Interconnect</div>
                    <div className="text-4xl font-bold tabular-nums">{stats.ai?.completedCalls}</div>
                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">Leads engaged by AI Voice within target latency.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 flex flex-col justify-center">
                    <div className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1.5 opacity-70">Bounced / Abandoned</div>
                    <div className="text-4xl font-bold tabular-nums">{(stats.ai?.totalCalls || 0) - (stats.ai?.completedCalls || 0)}</div>
                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">Failed connection or manual hangup detected.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
