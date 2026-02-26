

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, Share2, PlusCircle, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function SocialMediaDashboard() {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    try {
      console.log('📊 Fetching dashboard data from:', `${API_URL}/social/dashboard`);
      const res = await axios.get(`${API_URL}/social/dashboard`);
      console.log('✅ Dashboard data received:', res.data);
      setData(res.data);
    } catch (error) {
      console.error("❌ Failed to fetch dashboard data", error);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Upload endpoint
      await axios.post(`${API_URL}/social/upload-csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Content Calendar uploaded & synced successfully!");
      setSelectedFile(null); // Reset
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload content calendar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTriggerPublisher = async () => {
    try {
      console.log('🚀 Manually triggering publisher...');
      await axios.post(`${API_URL}/social/trigger-publisher`);
      toast.success("Publisher triggered! Check backend logs for results.");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Failed to trigger publisher", error);
      toast.error("Failed to trigger publisher.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="container mx-auto max-w-[1600px] space-y-6">

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12 mb-2">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
                <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-500 border border-indigo-500/30 text-xs font-semibold tracking-wide uppercase">
                  Content Publishing
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                Social Media Automation
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Upload your content calendar, schedule posts, and track publishing performance across all connected platforms automatically.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                onClick={handleTriggerPublisher}
                size="lg"
                className="gap-2 shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <TrendingUp className="h-4 w-4" />
                Trigger Publisher
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="mb-8 border-dashed border-2 border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="p-4 rounded-full bg-indigo-500/10">
              <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">Upload Content Calendar</h3>
              <p className="text-sm text-slate-400">Upload your CSV or Excel file to sync upcoming posts.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>{selectedFile ? selectedFile.name : "Select File"}</span>
                </Button>
              </label>

              {selectedFile && (
                <Button onClick={handleUpload} disabled={isUploading} className="bg-indigo-600 hover:bg-indigo-700">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload & Sync
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { title: "Total Posts", value: data?.stats?.total || 0, icon: FileSpreadsheet, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500" },
            { title: "Pending", value: data?.stats?.pending || 0, icon: PlusCircle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500" },
            { title: "Posted", value: data?.stats?.posted || 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500" },
            { title: "Failed", value: data?.stats?.failed || 0, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500" }
          ].map((stat) => (
            <Card
              key={stat.title}
              className={`shadow-md hover:shadow-lg transition-all duration-300 border-0 border-l-4 ${stat.border} hover:scale-105 cursor-pointer bg-card`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center shadow-inner`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Content Calendar */}
          <Card className="h-full shadow-md border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Content Calendar</CardTitle>
              <CardDescription>Upcoming scheduled posts</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.calendar?.length ? (
                <p className="text-muted-foreground text-sm">No upcoming posts scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {data.calendar.map((post: any) => (
                    <div key={post._id} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors">
                      <div className="min-w-[4rem] text-center bg-muted/50 rounded-lg p-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase">
                          {new Date(post.postDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-indigo-500 font-bold mt-1">{post.postTime || "Batch"}</div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-medium text-foreground" title={post.caption}>{post.caption}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.platforms.map((p: string) => (
                            <span key={p} className="text-[10px] uppercase font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 px-2 py-0.5 rounded-full">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Post Queue / Recent Activity */}
          <Card className="h-full shadow-md border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Status of recent processing & failed items</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.queue?.length ? (
                <p className="text-muted-foreground text-sm">No recent activity.</p>
              ) : (
                <div className="space-y-4">
                  {data.queue.map((post: any) => (
                    <div key={post._id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground line-clamp-2">{post.caption}</p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                          <span className="bg-muted px-2 py-0.5 rounded text-foreground/70">Attempt: {post.attemptCount}</span>
                          <span>•</span>
                          <span>Last: {post.lastProcessedAt ? new Date(post.lastProcessedAt).toLocaleTimeString() : 'N/A'}</span>
                        </p>
                      </div>
                      <div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap border ${post.status === 'POSTED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            post.status === 'FAILED' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                              'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
