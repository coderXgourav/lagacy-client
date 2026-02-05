import { useState, useEffect } from "react";
import { ArrowLeft, Users, Phone, Mail, TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, DollarSign, Zap, Target, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface LeadDashboardPageProps {
  isEmbedded?: boolean;
}

export default function LeadDashboardPage({ isEmbedded = false }: LeadDashboardPageProps) {
  const navigate = useNavigate();
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
      new: "bg-blue-500",
      contacted: "bg-yellow-500",
      qualified: "bg-green-500",
      meeting_booked: "bg-purple-500",
      proposal_sent: "bg-indigo-500",
      won: "bg-emerald-500",
      lost: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPackageColor = (pkg: string) => {
    const colors: Record<string, string> = {
      starter: "bg-green-100 text-green-800",
      growth: "bg-blue-100 text-blue-800",
      scale: "bg-purple-100 text-purple-800",
      enterprise: "bg-orange-100 text-orange-800",
    };
    return colors[pkg] || "bg-gray-100 text-gray-800";
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      meta: "bg-blue-600",
      google: "bg-red-500",
      organic: "bg-green-600",
      direct: "bg-gray-500",
    };
    return colors[source] || "bg-gray-400";
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
    <div className={`min-h-screen ${isEmbedded ? '' : 'bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6'}`}>
      <div className={`${isEmbedded ? 'w-full' : 'container mx-auto max-w-7xl'}`}>
        
        {/* Headers */}
        {!isEmbedded && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/offerings")}
                className="gap-2 pl-0"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Lead Dashboard</h1>
                <p className="text-muted-foreground text-sm">
                  Track and manage captured leads
                </p>
              </div>
            </div>
            <Button onClick={() => { fetchStats(); fetchLeads(); }} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}
        
        {isEmbedded && (
          <div className="flex items-center justify-between mb-6">
             <div>
              <h1 className="text-3xl font-bold tracking-tight">Lead Dashboard</h1>
              <p className="text-muted-foreground">Track performance and manage incoming leads</p>
            </div>
            <Button onClick={() => { fetchStats(); fetchLeads(); }} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        )}

        {/* Main Content Tabs */}
        {stats && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
              <TabsTrigger value="speed">Speed Metrics</TabsTrigger>
              <TabsTrigger value="sales">Sales Metrics</TabsTrigger>
              <TabsTrigger value="ai">AI Performance</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total Leads</CardDescription>
                    <CardTitle className="text-3xl">{stats.totalLeads}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      All time
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Today's Leads</CardDescription>
                    <CardTitle className="text-3xl text-green-600">{stats.todayLeads}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      New today
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Qualified</CardDescription>
                    <CardTitle className="text-3xl text-purple-600">
                      {stats.byStatus?.qualified || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4" />
                      Ready to close
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Meetings Booked</CardDescription>
                    <CardTitle className="text-3xl text-blue-600">
                      {stats.byStatus?.meeting_booked || 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Scheduled
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Leads Table */}
              <Card className="col-span-3">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent Leads</CardTitle>
                      <CardDescription>{leads.length} leads found</CardDescription>
                    </div>
                    <div className="flex gap-2">
                       <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                  ) : leads.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No leads found. Start capturing leads from the form!
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Package</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>AI Call</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leads.slice(0, 10).map((lead) => (
                          <TableRow key={lead._id}>
                            <TableCell className="font-medium">
                              {lead.name}
                              <div className="text-xs text-muted-foreground">{lead.phone}</div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPackageColor(lead.packageInterested)}>{lead.packageInterested || 'None'}</Badge>
                            </TableCell>
                             <TableCell>
                              <Badge variant="outline" className={`capitalize ${getStatusColor(lead.status).replace('bg-', 'text-')}`}>
                                {lead.status?.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {lead.aiCallStatus === "completed" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : lead.aiCallStatus === "failed" ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <span className="text-muted-foreground text-xs uppercase">{lead.aiCallStatus}</span>
                              )}
                            </TableCell>
                             <TableCell className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACQUISITION TAB */}
            <TabsContent value="acquisition" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Revenue per Channel</CardTitle>
                    <CardDescription>Based on Deal Value</CardDescription>
                  </CardHeader>
                  <CardContent>
                     {Object.keys(stats.revenue || {}).length === 0 ? (
                        <div className="text-sm text-muted-foreground">No revenue data recorded yet.</div>
                     ) : (
                        <div className="space-y-2">
                          {Object.entries(stats.revenue).map(([source, amount]) => (
                            <div key={source} className="flex justify-between items-center text-sm">
                              <span className="capitalize flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${getSourceColor(source)}`} />
                                {source}
                              </span>
                              <span className="font-mono font-medium">${amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                     )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Spend by Platform</CardTitle>
                    <CardDescription>Requires Ads API Integration</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                    <DollarSign className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground mb-4 text-sm">Connect Meta/Google Ads to view spend.</p>
                    <Button variant="outline" size="sm">Connect Ads API</Button>
                  </CardContent>
                </Card>

                <Card>
                   <CardHeader className="pb-2">
                    <CardTitle className="text-lg">CPL by Campaign</CardTitle>
                     <CardDescription>Cost Per Lead Analysis</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                    <Target className="h-8 w-8 text-muted-foreground mb-2" />
                     <p className="text-muted-foreground mb-4 text-sm">Requires Spend data to calculate CPL.</p>
                     <Button variant="outline" size="sm">Configure Integration</Button>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Source Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="flex flex-wrap gap-4">
                    {Object.entries(stats.bySource || {}).map(([source, count]) => (
                      <div key={source} className="flex items-center gap-2 border p-3 rounded-lg min-w-[150px]">
                        <div className={`p-2 rounded-full ${getSourceColor(source).replace('bg-', 'bg-opacity-20 bg-')} text-white`}>
                           <div className={`w-3 h-3 rounded-full ${getSourceColor(source)}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{source}</p>
                          <p className="text-2xl font-bold">{count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SPEED METRICS TAB */}
            <TabsContent value="speed" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Speed to First Contact
                    </CardTitle>
                    <CardDescription>Average time from form submit to AI/Email contact</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-bold mb-2">
                      {stats.speed?.avgResponseTime || 0}<span className="text-xl font-normal text-muted-foreground"> min</span>
                    </div>
                    <Progress value={Math.max(100 - (stats.speed?.avgResponseTime || 0), 10)} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">Target: &lt; 5 mins. Lower is better.</p>
                  </CardContent>
                </Card>
                
                 <Card>
                  <CardHeader>
                    <CardTitle>AI Call Latency</CardTitle>
                    <CardDescription>System processing speed</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="text-5xl font-bold mb-2">
                      30<span className="text-xl font-normal text-muted-foreground"> sec</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Fixed delay configured in backend.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* SALES METRICS TAB */}
            <TabsContent value="sales" className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Qualified Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{stats.sales?.qualifiedRate}%</div>
                    <Progress value={stats.sales?.qualifiedRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">% of leads marked Qualified</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Meeting Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold mb-2">{stats.sales?.meetingRate}%</div>
                    <Progress value={stats.sales?.meetingRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">% of leads booking meetings</p>
                  </CardContent>
                </Card>
                 <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Close Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold mb-2">{stats.sales?.closeRate}%</div>
                    <Progress value={stats.sales?.closeRate} className="h-2" />
                     <p className="text-xs text-muted-foreground mt-2">% of leads Won</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI PERFORMANCE TAB */}
            <TabsContent value="ai" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5" /> Answer Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="text-3xl font-bold mb-2">{stats.ai?.answerRate}%</div>
                     <Progress value={stats.ai?.answerRate} className="h-2" />
                     <p className="text-xs text-muted-foreground mt-2">{stats.ai?.completedCalls} answered / {stats.ai?.totalCalls} attempts</p>
                  </CardContent>
                </Card>

                <Card className="col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Call Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Using real data in future, placeholder for now based on statuses */}
                      <div className="flex justify-between items-center bg-muted/20 p-3 rounded text-sm">
                        <span>Completed (Talked)</span>
                        <span className="font-bold">{stats.ai?.completedCalls}</span>
                      </div>
                      <div className="flex justify-between items-center bg-muted/20 p-3 rounded text-sm">
                         <span>Failed / No Answer</span>
                        <span className="font-bold">{(stats.ai?.totalCalls || 0) - (stats.ai?.completedCalls || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </Tabs>
        )}
      </div>
    </div>
  );
}
