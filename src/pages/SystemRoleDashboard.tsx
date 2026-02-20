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
import { Play, Activity, Users, FileText, Youtube } from "lucide-react";
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

  if (loading) {
    return <div className="p-8 text-center bg-background min-h-screen text-card-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Growth Intelligence Agent</h1>
          <p className="text-muted-foreground mt-2">
            System Role autonomous pipeline dashboard.
          </p>
        </div>
        <Button onClick={handleTriggerPipeline} disabled={triggering} className="gap-2">
          {triggering ? <Activity className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {triggering ? "Running..." : "Trigger Pipeline Now"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problems Found</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.problems?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.content?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos Analyzed</CardTitle>
            <Youtube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.youtube?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects Extracted</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.prospects?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          <TabsTrigger value="problems">Founder Problems</TabsTrigger>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="content">Generated Content</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Pipeline Logs</CardTitle>
              <CardDescription>Live output from the autonomous workflow.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.logs?.map((log: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
                    <Badge variant={log.status === "Success" ? "default" : log.status === "Failed" ? "destructive" : "secondary"}>
                      {log.step}
                    </Badge>
                    <span className="text-sm font-medium w-24">{log.status}</span>
                    <span className="text-sm text-muted-foreground">{log.details}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
                {(!data?.logs || data.logs.length === 0) && (
                  <p className="text-muted-foreground text-sm">No logs found. Run the pipeline first.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problems" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Scraped Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.problems?.map((prob: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2 bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">{prob.title}</h4>
                      <Badge variant="outline">Score: {prob.aiScore}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{prob.content}</p>
                    <p className="text-xs font-mono text-muted-foreground">Source: {prob.source} | Upvotes: {prob.upvotes}</p>
                    <p className="text-sm italic mt-2 text-primary">AI Analysis: {prob.aiAnalysis}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prospects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Leads & Target Prospects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.prospects?.map((prospect: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg space-y-2 bg-card text-card-foreground shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-lg">{prospect.companyName}</h4>
                      <Badge>{prospect.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{prospect.website} | {prospect.publicEmail}</p>
                    <p className="text-sm"><span className="font-semibold">Trigger:</span> {prospect.triggerEvent}</p>
                    <div className="bg-muted p-3 rounded-md mt-2">
                       <p className="text-sm"><span className="font-semibold">Outreach Angle:</span> {prospect.outreachAngle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Content Engine Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.content?.map((c: any, i: number) => (
                  <div key={i} className="p-4 border rounded-lg space-y-3 bg-card text-card-foreground shadow-sm">
                     <h4 className="font-semibold pb-2 border-b">Problem ID: {c.problemId}</h4>
                     
                     <div>
                       <span className="font-semibold text-sm">YouTube Hook:</span>
                       <p className="text-sm text-muted-foreground mt-1">{c.youtubeScript}</p>
                     </div>
                     <div>
                       <span className="font-semibold text-sm">Reel Script:</span>
                       <p className="text-sm text-muted-foreground mt-1">{c.reelScript}</p>
                     </div>
                     <div>
                       <span className="font-semibold text-sm">LinkedIn Post:</span>
                       <p className="text-sm text-muted-foreground mt-1">{c.linkedinPost}</p>
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
