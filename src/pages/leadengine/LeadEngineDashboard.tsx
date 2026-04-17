import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/services/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Play, Activity, Flame, Clock, Inbox } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LeadEngineDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tierFilter, setTierFilter] = useState("all");
  const [niche, setNiche] = useState("marketing");
  const [country, setCountry] = useState("US");
  const [limit, setLimit] = useState("10");

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["leadEngineStats"],
    queryFn: () => api.leadEngine.getStats(),
    refetchInterval: 10000,
  });

  const { data: leadsData, isLoading: loadingLeads } = useQuery({
    queryKey: ["leadEngineLeads", tierFilter, niche, country],
    queryFn: () => api.leadEngine.getLeads(tierFilter, niche, country, 1, 50),
    refetchInterval: 10000,
  });

  const triggerMutation = useMutation({
    mutationFn: (params: { niche: string; country: string; limit: number }) =>
      api.leadEngine.triggerCampaign(params),
    onSuccess: (data) => {
      toast({
        title: "Campaign Initiated",
        description: `Successfully processed ${data.count || 0} leads.`,
      });
      queryClient.invalidateQueries({ queryKey: ["leadEngineStats"] });
      queryClient.invalidateQueries({ queryKey: ["leadEngineLeads"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Campaign Failed",
        description: error.message || "An error occurred",
      });
    },
  });

  const handleTrigger = () => {
    triggerMutation.mutate({ niche, country, limit: parseInt(limit) || 10 });
  };

  const stats = statsData?.stats || { hot: 0, nurture: 0, cold: 0, total: 0 };
  const leads = leadsData?.leads || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lead Engine Orchestrator</h1>
        <p className="text-muted-foreground mt-2">
          10-Step Autonomous Pipeline: Collects ad signals, enriches contacts, audits funnels, and generates AI sales packets.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-card via-card to-orange-50/10 dark:to-orange-950/10 border-orange-200/50 dark:border-orange-900/50">
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Hot Leads</p>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-500">{stats.hot}</div>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-500">
              <Flame className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card via-card to-blue-50/10 dark:to-blue-950/10 border-blue-200/50 dark:border-blue-900/50">
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Nurture</p>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">{stats.nurture}</div>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-slate-50/10 dark:to-slate-900/10 border-slate-200/50 dark:border-slate-800/50">
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Archived (Cold)</p>
              <div className="text-3xl font-bold text-slate-600 dark:text-slate-400">{stats.cold}</div>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
              <Inbox className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Processed</p>
              <div className="text-3xl font-bold">{stats.total}</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Trigger Controls */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Run Engine</CardTitle>
            <CardDescription>Manually trigger a campaign collection run.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Niche</label>
              <Input 
                value={niche} 
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. marketing, dental..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Country (ISO)</label>
              <Input 
                value={country} 
                onChange={(e) => setCountry(e.target.value)}
                placeholder="US"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Batch Limit</label>
              <Input 
                type="number"
                value={limit} 
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
            <Button 
              className="w-full gap-2" 
              onClick={handleTrigger}
              disabled={triggerMutation.isPending}
            >
              {triggerMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {triggerMutation.isPending ? "Running..." : "Collect Signals"}
            </Button>
          </CardContent>
        </Card>

        {/* Lead Table */}
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Processed Leads</CardTitle>
              <CardDescription>Directory of all analyzed domain signals.</CardDescription>
            </div>
            <div className="w-[180px]">
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="hot">🔥 Hot (&gt;= 80)</SelectItem>
                  <SelectItem value="nurture">🟡 Nurture (&gt;= 65)</SelectItem>
                  <SelectItem value="cold">🧊 Cold (&lt; 65)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border h-[500px] overflow-auto">
              {loadingLeads ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : leads.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No leads found in this tier.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Funnel</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="w-[300px]">AI Sales Pitch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead: any) => (
                      <TableRow key={lead._id}>
                        <TableCell>
                          <div className="font-medium">{lead.name || lead.domain}</div>
                          <div className="text-xs text-muted-foreground hover:underline cursor-pointer">
                            {lead.domain}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {lead.meta && <Badge variant="outline" className="text-[10px] px-1 h-4">Meta</Badge>}
                            {lead.google && <Badge variant="outline" className="text-[10px] px-1 h-4">Google</Badge>}
                            {lead.tiktok && <Badge variant="outline" className="text-[10px] px-1 h-4">TikTok</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xl font-bold">{lead.score}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              lead.tier === "hot" ? "default" :
                              lead.tier === "nurture" ? "secondary" : "outline"
                            }
                            className={
                              lead.tier === "hot" ? "bg-orange-500 hover:bg-orange-600 text-white" :
                              lead.tier === "nurture" ? "bg-blue-500/20 text-blue-700 hover:bg-blue-500/30" : ""
                            }
                          >
                            {lead.tier.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className={lead.has_cta ? "text-green-600" : "text-red-500"}>
                              {lead.has_cta ? "✓" : "✗"} CTA
                            </div>
                            <div className={lead.has_form ? "text-green-600" : "text-red-500"}>
                              {lead.has_form ? "✓" : "✗"} Form
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {lead.email ? <div>{lead.email}</div> : <div className="text-muted-foreground italic">No email</div>}
                            {lead.phone ? <div>{lead.phone}</div> : <div className="text-muted-foreground italic">No phone</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.opener && (
                            <div className="p-2 bg-muted/50 rounded-md text-xs space-y-2 border">
                              <div><span className="font-semibold text-primary">Opener:</span> {lead.opener}</div>
                              <div><span className="font-semibold text-primary">Pitch:</span> {lead.pitch}</div>
                              <div><span className="font-semibold text-primary">CTA:</span> {lead.cta}</div>
                            </div>
                          )}
                          {!lead.opener && <span className="text-muted-foreground text-xs italic">No AI packet generated</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
