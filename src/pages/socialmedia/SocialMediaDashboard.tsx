

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => navigate("/offerings")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Offerings
        </Button>
        <h1 className="text-3xl font-bold">Social Media Automation</h1>
        <Button 
          onClick={handleTriggerPublisher} 
          variant="outline"
          className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          🚀 Trigger Publisher Now
        </Button>
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
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data?.stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-400">{data?.stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Posted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{data?.stats?.posted || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">{data?.stats?.failed || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Content Calendar */}
        <Card className="h-full">
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
                  <div key={post._id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/30">
                     <div className="min-w-[4rem] text-center">
                        <div className="text-xs font-semibold text-slate-400">
                          {new Date(post.postDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-indigo-400 font-bold">{post.postTime || "Batch"}</div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate" title={post.caption}>{post.caption}</p>
                        <div className="flex gap-2 mt-2">
                          {post.platforms.map((p: string) => (
                            <span key={p} className="text-[10px] uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-300">
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
        <Card className="h-full">
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
                  <div key={post._id} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/30">
                     <div className="flex-1 min-w-0 mr-4">
                        <p className="text-sm font-medium text-white truncate">{post.caption.substring(0, 40)}...</p>
                        <p className="text-xs text-slate-500">
                           Attempt: {post.attemptCount} • Last: {post.lastProcessedAt ? new Date(post.lastProcessedAt).toLocaleTimeString() : 'N/A'}
                        </p>
                     </div>
                     <div>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          post.status === 'POSTED' ? 'bg-emerald-500/10 text-emerald-500' :
                          post.status === 'FAILED' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-amber-500/10 text-amber-500'
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
  );
}
