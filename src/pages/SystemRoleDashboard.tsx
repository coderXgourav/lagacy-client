import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Activity, Users, FileText, Youtube, Search, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/system-role` : "http://localhost:5000/api/system-role";

export default function SystemRoleDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/dashboard`);
      setData(res.data.data);
    } catch (error) {
      console.error("Error fetching data", error);
      toast({
        title: "Error fetching data",
        description: "Could not load system role data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTriggerPipeline = async () => {
    try {
      setTriggering(true);
      await axios.post(`${API_BASE_URL}/trigger-pipeline`);
      toast({
        title: "Pipeline Started",
        description: "The daily workflow has been triggered. Check logs in a few moments.",
      });
      // Poll for updates (simple approach)
      setTimeout(fetchData, 5000);
    } catch (error) {
      toast({
        title: "Error triggering pipeline",
        description: "Could not start the pipeline.",
        variant: "destructive",
      });
    } finally {
      setTriggering(false);
    }
  };

  const statsList = [
    { title: "Problems Found", value: data?.problems?.length || 0, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-l-blue-500" },
    { title: "Content Generated", value: data?.content?.length || 0, icon: FileText, color: "text-green-500", bg: "bg-green-500/10", border: "border-l-green-500" },
    { title: "Videos Analyzed", value: data?.youtube?.length || 0, icon: Youtube, color: "text-red-500", bg: "bg-red-500/10", border: "border-l-red-500" },
    { title: "Prospects Extracted", value: data?.prospects?.length || 0, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-l-purple-500" },
  ];

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <Activity className="w-8 h-8 animate-spin text-primary opacity-50" />
        <p className="text-muted-foreground mt-4">Loading agent data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Activity className="h-7 w-7 text-white" />
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">Autonomous</Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Growth Intelligence Agent
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              System Role autonomous pipeline. Automate lead generation, market research, and content creation.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button size="lg" className="gap-2 shadow-lg" onClick={handleTriggerPipeline} disabled={triggering}>
                {triggering ? <Activity className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                {triggering ? "Running..." : "Trigger Pipeline Now"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsList.map((stat) => (
          <Card
            key={stat.title}
            className={`shadow-lg hover:shadow-xl transition-all duration-300 border-0 border-l-4 ${stat.border} hover:scale-105 cursor-pointer`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {stat.title}
              </CardTitle>
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shadow-inner`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-4xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="logs" className="rounded-lg">Execution Logs</TabsTrigger>
          <TabsTrigger value="problems" className="rounded-lg">Founder Problems</TabsTrigger>
          <TabsTrigger value="prospects" className="rounded-lg">Prospects</TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg">Generated Content</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle>Recent Pipeline Logs</CardTitle>
              <CardDescription>Live output from the autonomous workflow.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.logs?.map((log: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-primary/10 rounded-xl bg-card hover:bg-muted/30 transition-colors shadow-sm">
                    <Badge variant={log.status === "Success" ? "default" : log.status === "Failed" ? "destructive" : "secondary"}>
                      {log.step}
                    </Badge>
                    <span className="text-sm font-semibold w-24 text-foreground/80">{log.status}</span>
                    <span className="text-sm text-muted-foreground flex-1">{log.details}</span>
                    <span className="text-xs text-muted-foreground ml-auto bg-muted px-2 py-1 rounded-md">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {(!data?.logs || data.logs.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="p-4 rounded-full bg-muted/50">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">No logs found. Run the pipeline first.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problems" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle>Top Scraped Problems</CardTitle>
              <CardDescription>Problems identified from community discussions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.problems?.map((prob: any, i: number) => (
                  <div key={i} className="p-5 border border-primary/10 rounded-xl space-y-4 bg-gradient-to-br from-card to-muted/20 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-lg leading-tight">{prob.title}</h4>
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                        Score: {prob.aiScore}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10 dark:bg-black/5 dark:border-black/10">
                      "{prob.content}"
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground border-t border-border pt-3">
                      <span className="flex items-center gap-1"><Search className="w-3 h-3" /> Source: {prob.source}</span>
                      <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Upvotes: {prob.upvotes}</span>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10">
                      <p className="text-xs font-semibold text-primary mb-1">AI Analysis</p>
                      <p className="text-sm italic text-foreground/80">{prob.aiAnalysis}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prospects" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle>Extracted Leads & Target Prospects</CardTitle>
              <CardDescription>Companies identified as potential users.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.prospects?.map((prospect: any, i: number) => (
                  <div key={i} className="p-5 border border-primary/10 rounded-xl space-y-3 bg-card shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg text-foreground">{prospect.companyName}</h4>
                      <Badge variant={prospect.status === 'Ready' ? 'default' : 'outline'}>{prospect.status}</Badge>
                    </div>
                    <div className="flex flex-col gap-1 text-sm font-mono text-muted-foreground bg-muted/40 p-2 rounded-md">
                      <span>{prospect.website}</span>
                      <span>{prospect.publicEmail}</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1">Trigger Event</p>
                      <p className="text-sm text-foreground/90">{prospect.triggerEvent}</p>
                    </div>
                    <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border-l-2 border-primary mt-2">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Outreach Angle</p>
                      <p className="text-sm">{prospect.outreachAngle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2">
          <Card className="shadow-lg border-primary/10">
            <CardHeader>
              <CardTitle>AI Content Engine Results</CardTitle>
              <CardDescription>Generated marketing assets from identified problems.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data?.content?.map((c: any, i: number) => (
                  <div key={i} className="p-6 border border-primary/10 rounded-2xl space-y-5 bg-card shadow-sm">
                    <div className="flex border-b border-border pb-3">
                      <Badge variant="outline" className="font-mono text-xs text-muted-foreground">ID: {c.problemId}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-500 font-semibold mb-2">
                          <Youtube className="w-5 h-5" /> YouTube Hook
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border leading-relaxed">
                          {c.youtubeScript}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-blue-500 font-semibold mb-2">
                          <Activity className="w-5 h-5" /> LinkedIn Post
                        </div>
                        <p className="text-sm text-muted-foreground bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 leading-relaxed">
                          {c.linkedinPost}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-purple-500 font-semibold mb-2 mt-2">
                        <Play className="w-5 h-5" /> Reel Script
                      </div>
                      <p className="text-sm text-foreground/80 bg-purple-500/5 p-4 rounded-xl border border-purple-500/10 leading-relaxed italic">
                        {c.reelScript}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
