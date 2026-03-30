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
import { Play, Activity, Users, FileText, Youtube, Search, CheckCircle2, ArrowRight, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/system-role` : "http://localhost:8000/api/system-role";

export default function SystemRoleDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { toast } = useToast();

  const fetchData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/dashboard`);
      setData(res.data.data);
    } catch (error) {
      console.error("Error fetching data", error);
      if (!isRefresh) {
        toast({
          title: "Error fetching data",
          description: "Could not load system role data.",
          variant: "destructive",
        });
      }
    } finally {
      if (!isRefresh) setLoading(false);
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
      // Active polling for 10 minutes (to see real-time log updates)
      let pollCount = 0;
      const pollInterval = setInterval(() => {
        fetchData(true);
        pollCount++;
        if (pollCount > 60) clearInterval(pollInterval); // Stop after 10 mins
      }, 10000); // Every 10 seconds
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

  const handleSendEmailReport = async () => {
    try {
      setSendingEmail(true);
      const res = await axios.post(`${API_BASE_URL}/send-email-report`);
      toast({
        title: "Email Sent Successfully",
        description: res.data.message || "Your full content report has been delivered to pawankyptronix@gmail.com",
      });
    } catch (error: any) {
      console.error("Error sending email", error);
      toast({
        title: "Email Failed",
        description: error.response?.data?.error || "Could not send the email report. Check server logs.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
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
                    <div className="pt-2">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="w-full gap-2 border-red-500/20 hover:bg-red-500/10 text-red-600 font-semibold"
                         onClick={() => {
                           window.open(`mailto:${prospect.publicEmail}?subject=Regarding ${prospect.companyName}&body=${encodeURIComponent(prospect.outreachAngle)}`);
                         }}
                         disabled={!prospect.publicEmail}
                       >
                         <Mail className="w-4 h-4" /> 
                         {prospect.publicEmail ? 'Contact via Gmail' : 'Email Not Found'}
                       </Button>
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
                {data?.content?.slice().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((c: any, i: number) => (
                  <div key={i} className="p-6 border border-primary/10 rounded-2xl space-y-5 bg-card shadow-sm">
                    <div className="flex border-b border-border pb-3 justify-between items-center">
                      <Badge variant="outline" className="font-mono text-xs text-muted-foreground">ID: {c.problemId}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Generated: {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-500 font-semibold mb-2">
                          <Youtube className="w-5 h-5" /> YouTube Hook
                        </div>
                        {c.videoUrl ? (
                          <div className="mb-4 overflow-hidden rounded-xl border border-border shadow-inner bg-black group relative">
                            {c.videoUrl.includes('heygen.com') ? (
                              <div className="aspect-video flex flex-col items-center justify-center p-6 text-center space-y-4">
                                <Activity className="h-10 w-10 text-primary animate-pulse" />
                                <div className="space-y-1">
                                  <p className="text-sm font-bold text-white uppercase tracking-widest">HeyGen Video Generation Started</p>
                                  <p className="text-[10px] text-white/50">Processing AI Avatar... This usually takes 1-3 minutes.</p>
                                </div>
                                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => window.open(c.videoUrl, '_blank')}>
                                  Open Preview in HeyGen
                                </Button>
                              </div>
                            ) : (
                              <video 
                                src={c.videoUrl.startsWith('/') ? `${API_BASE_URL.replace('/api/system-role', '')}${c.videoUrl}` : c.videoUrl} 
                                controls 
                                className="w-full aspect-video"
                                poster="/placeholder.svg"
                              />
                            )}
                          </div>
                        ) : (
                          // NEW: D-ID / Generic Processing Placeholder
                          // Only show placeholder if the content was created in the last 30 minutes
                          (() => {
                            const isRecent = c.createdAt && (new Date().getTime() - new Date(c.createdAt).getTime() < 12 * 60 * 60 * 1000);
                            const didError = data?.logs?.find(l => l.step?.includes('Step 6') && l.status === 'Error');
                            const isCreditError = didError?.details?.toLowerCase().includes('credit');

                            if (isRecent) {
                              return (
                                <div className={`mb-4 overflow-hidden rounded-xl border border-dashed ${isCreditError ? 'border-primary/50 bg-primary/5' : 'border-primary/30 bg-primary/5'} group relative`}>
                                   <div className="aspect-video flex flex-col items-center justify-center text-center space-y-4">
                                      {isCreditError ? (
                                        <div className="w-full h-full relative group">
                                          <video 
                                            src={`${API_BASE_URL.replace('/api/system-role', '')}/public/videos/strategic_replay.mp4`} 
                                            controls 
                                            autoPlay
                                            muted
                                            loop
                                            className="w-full h-full object-cover rounded-xl shadow-2xl border-2 border-primary/20"
                                          />
                                          <div className="absolute top-4 left-4 bg-primary text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                            Kyptronix Strategy Replay
                                          </div>
                                          <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter shadow-lg">
                                            HIGH AUTHORITY
                                          </div>
                                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[95%] bg-black/80 backdrop-blur-xl text-white px-6 py-4 rounded-2xl text-[11px] leading-relaxed border border-white/10 shadow-3xl text-center">
                                            <b className="text-yellow-400">Live Persona Sync paused (D-ID Credits).</b><br/> 
                                            <span className="opacity-90 italic text-[10px]">Showing High-End Strategic Replay instead. Your unique marketing assets are 100% ready below!</span>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <Play className="h-12 w-12 text-primary animate-pulse opacity-50" />
                                          <div className="space-y-1">
                                            <p className="text-sm font-bold uppercase tracking-widest text-primary">AI Video Processing...</p>
                                            <p className="text-[10px] text-muted-foreground italic">Generating Souvik's Avatar Video via D-ID. This takes 2-5 minutes.</p>
                                          </div>
                                        </>
                                      )}
                                   </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="mb-4 overflow-hidden rounded-xl border border-border bg-muted/20 flex items-center justify-center aspect-video">
                                  <div className="text-center p-6">
                                    <Play className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground uppercase font-medium tracking-tighter">Video Expired / Not Generated</p>
                                    <p className="text-[10px] text-muted-foreground/60 italic">Videos are only available for the latest runs.</p>
                                  </div>
                                </div>
                              );
                            }
                          })()
                        )}
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

                      {/* Gmail Outreach Sequence - HIGHER PRIORITY */}
                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-red-500 font-semibold">
                            <Mail className="w-5 h-5" /> Gmail Outreach Sequence
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 text-[10px] uppercase font-bold border-red-500/20 hover:bg-red-500/10 text-red-600" 
                            onClick={handleSendEmailReport}
                            disabled={sendingEmail}
                          >
                            {sendingEmail ? 'Sending...' : 'Connect & Send to Gmail'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {(c.emailSequence?.split('---') || ["Sequence generating...", "", ""]).map((email, idx) => (
                            <div key={idx} className="text-[11px] text-muted-foreground bg-red-500/5 p-4 rounded-xl border border-red-500/10 min-h-[140px] whitespace-pre-line group relative">
                              <span className="font-extrabold text-red-600 block mb-2 uppercase tracking-widest text-[9px]">Email #{idx + 1} Candidate</span>
                              {email.trim() || "Drafting sequence..."}
                              <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6">
                                <CheckCircle2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <FileText className="w-5 h-5" /> SEO Blog Article
                         </div>
                         <Button variant="outline" size="sm" onClick={() => {
                            const win = window.open("", "_blank");
                            if (win) win.document.write(`<html><head><title>Blog Preview</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:20px;}</style></head><body>${c.seoBlog}</body></html>`);
                         }}>
                            Preview Full Blog
                         </Button>
                      </div>
                      <div 
                        className="text-xs text-muted-foreground bg-muted/20 p-6 rounded-xl border border-border max-h-[500px] overflow-y-auto leading-relaxed space-y-3"
                        dangerouslySetInnerHTML={{ __html: c.seoBlog.substring(0, 1500) + (c.seoBlog.length > 1500 ? "..." : "") }}
                      />
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
