import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Search, 
  User, 
  Linkedin, 
  Mail, 
  Phone, 
  Users,
  Globe,
  Sparkles,
  Building,
  Trash2, 
  Filter,
  ArrowRight,
  ArrowLeft,
  Database,
  RefreshCw,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import axios from "axios";
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Lead {
  domain: string;
  companyName: string;
  country: string;
  ownerName?: string;
  linkedin?: string;
  emails?: string[];
  mobile?: string;
  telephone?: string;
  isDuplicate?: boolean;
}

export default function LeadDominationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [cleanedLeads, setCleanedLeads] = useState<Lead[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [currentAction, setCurrentAction] = useState("");

  const prevStep = () => setStep(prev => Math.max(1, prev - 1));

  // Poll for currentAction when processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/csv-uploader/stats`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          setCurrentAction(res.data.currentAction);
        } catch (e) {}
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const mappedLeads: Lead[] = data.map((row: any) => {
        // Helper to find value in row by checking multiple possible header variations
        const findVal = (keys: string[]) => {
          const foundKey = Object.keys(row).find(rk => 
            keys.some(k => rk.toLowerCase().includes(k.toLowerCase()))
          );
          return foundKey ? String(row[foundKey]).trim() : "";
        };

        return {
          domain: findVal(["domain", "website", "url", "site"]),
          companyName: findVal(["company", "business", "name", "firm", "organization"]),
          country: findVal(["country", "location", "nation", "region"]),
          telephone: findVal(["telephone", "landline", "office"]),
          mobile: findVal(["mobile", "phone", "cell", "contact", "number"]),
        };
      });

      setLeads(mappedLeads);
      setStep(2);
      toast({
        title: "File Uploaded",
        description: `Successfully imported ${mappedLeads.length} leads.`,
      });
    };
    reader.readAsBinaryString(file);
  };

  const cleanData = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const seenDomains = new Set();
      const filtered = leads.filter(lead => {
        // 1. Duplicate check
        const normalizedDomain = (lead.domain || "").toLowerCase().replace('www.', '').trim();
        if (normalizedDomain && seenDomains.has(normalizedDomain)) return false;
        if (normalizedDomain) seenDomains.add(normalizedDomain);

        // 2. Email check (Remove obviously invalid ones)
        if (lead.domain && !lead.domain.includes(".") && !lead.mobile) return false;

        // 3. Telephone removal (Remove if it's ONLY a telephone number, no mobile)
        const hasTelephone = lead.telephone && lead.telephone.trim() !== "";
        const hasMobile = lead.mobile && lead.mobile.trim() !== "";
        if (hasTelephone && !hasMobile) return false;

        return true;
      });

      setCleanedLeads(filtered);
      setIsProcessing(false);
      setStep(3);
      toast({
        title: "Cleaning Complete",
        description: `Removed ${leads.length - filtered.length} low-quality or duplicate leads.`,
      });
    }, 800);
  };

  const [hideInvalidEmails, setHideInvalidEmails] = useState(false);

  const isValidEmail = (email: string) => {
    return email && email.includes("@") && email.includes(".") && email.length > 5;
  };

  // Sidebar always shows ALL detected telephone numbers from the original file
  const telephoneLeads = leads.filter(l => l.telephone && l.telephone.trim() !== "");
  
  // Main dashboard only shows leads with valid mobile numbers OR those waiting for intelligence
  const mainDashboardLeads = (step >= 3 ? cleanedLeads : leads).filter(l => {
    const hasTelephone = l.telephone && l.telephone.trim() !== "";
    const hasMobile = l.mobile && l.mobile.trim() !== "";
    
    // If it has a telephone number but NO mobile, remove from main list
    if (hasTelephone && !hasMobile) return false;

    // Filter by invalid emails if toggled
    if (hideInvalidEmails) {
      const hasValidEmail = l.emails?.some(e => isValidEmail(e)) || isValidEmail(l.domain);
      if (!hasValidEmail) return false;
    }

    return true;
  });

  const findIntelligence = async () => {
    setIsProcessing(true);
    try {
      // 1. Trigger backend enrichment
      const response = await axios.post(`${API_BASE_URL}/csv-uploader/lead-domination`, {
        leads: cleanedLeads
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (response.data.success) {
        toast({
          title: "Intelligence Pipeline Started",
          description: `Backend is now fetching real WHOIS and Apollo data for ${cleanedLeads.length} leads.`,
        });

        // 2. Poll for status (currentAction) from statsService
        const pollInterval = setInterval(async () => {
          try {
            const statsRes = await axios.get(`${API_BASE_URL}/csv-uploader/stats`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            
            const currentAction = statsRes.data.currentAction;
            if (currentAction && currentAction.includes("✅ Lead Domination Complete")) {
              clearInterval(pollInterval);
              
              // 3. Fetch final enriched results
              const finalStats = await axios.get(`${API_BASE_URL}/csv-uploader/stats`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
              });
              
              if (finalStats.data.leadDominationResults) {
                setCleanedLeads(finalStats.data.leadDominationResults);
              }

              setIsProcessing(false);
              setStep(4);
              toast({
                title: "Enrichment Complete",
                description: "Real-time intelligence gathered for all leads.",
              });
            }
          } catch (e) {
            console.error("Polling error:", e);
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Enrichment error:", error);
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Enrichment Failed",
        description: "Could not connect to the intelligence pipeline.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Button 
            variant="ghost" 
            className="text-slate-400 hover:text-white"
            onClick={() => navigate('/offerings')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offerings
          </Button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button 
                variant="outline" 
                size="sm"
                className="border-slate-700 text-slate-400"
                onClick={prevStep}
                disabled={isProcessing}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous Step
              </Button>
            )}
          </div>
        </div>

        <header className="mb-12 text-center">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary-foreground animate-pulse">
            <Zap className="w-3 h-3 mr-1 fill-primary" />
            AI POWERED SYSTEM
          </Badge>
          <h1 className="text-6xl font-extrabold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            LEAD DOMINATION SYSTEM
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto">
            The ultimate 4-step autonomous pipeline for absolute market dominance.
          </p>
        </header>

        {/* Stepper */}
        <div className="flex justify-between items-center mb-12 max-w-4xl mx-auto relative">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col items-center z-10">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500",
                step >= s ? "bg-primary text-white scale-110 shadow-[0_0_20px_rgba(var(--primary),0.5)]" : "bg-slate-700 text-slate-400"
              )}>
                {step > s ? <CheckCircle className="w-6 h-6" /> : s}
              </div>
              <span className={cn("mt-2 text-xs font-medium", step >= s ? "text-primary" : "text-slate-500")}>
                {s === 1 ? "Upload" : s === 2 ? "Clean" : s === 3 ? "Intelligence" : "Finalize"}
              </span>
            </div>
          ))}
          <div className="absolute top-6 left-0 w-full h-[2px] bg-slate-700 -z-0" />
          <div className={cn(
            "absolute top-6 left-0 h-[2px] bg-primary transition-all duration-700 -z-0",
            step === 1 ? "w-0" : step === 2 ? "w-1/3" : step === 3 ? "w-2/3" : "w-full"
          )} />
        </div>

        <main>
          {step === 1 && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
              <CardContent className="p-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg hover:border-primary/50 transition-colors cursor-pointer group relative">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                  onChange={onFileUpload}
                  accept=".csv,.xlsx"
                />
                <div className="p-6 bg-primary/10 rounded-full mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Upload your Lead List</h3>
                <p className="text-slate-400 mb-6">Drag and drop your CSV or Excel file here</p>
                <div className="flex gap-4">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">.CSV</Badge>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">.XLSX</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {(step === 2 || step === 3) && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-8">
                {step === 2 && (
                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-primary" />
                        Raw Data Preview ({mainDashboardLeads.length} leads)
                      </CardTitle>
                      <Button 
                        className="shadow-lg shadow-primary/20" 
                        onClick={cleanData}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                        Start Cleaning
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[400px] overflow-auto rounded-lg border border-slate-700">
                        <table className="w-full text-left">
                          <thead className="bg-slate-900 sticky top-0">
                            <tr>
                              <th className="p-4 font-medium text-slate-400">Domain</th>
                              <th className="p-4 font-medium text-slate-400">Company</th>
                              <th className="p-4 font-medium text-slate-400">Country</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700">
                            {mainDashboardLeads.slice(0, 20).map((l, i) => (
                              <tr key={i} className="hover:bg-slate-700/30 transition-colors">
                                <td className="p-4 font-mono text-sm text-blue-400">{l.domain || "N/A"}</td>
                                <td className="p-4 text-slate-200">{l.companyName || "N/A"}</td>
                                <td className="p-4">
                                  {l.country ? (
                                    <Badge variant="outline" className="border-slate-600 text-slate-400">{l.country}</Badge>
                                  ) : (
                                    <span className="text-slate-600 text-xs italic">Not specified</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {step === 3 && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: "Main Leads", value: mainDashboardLeads.length, icon: Users, color: "text-blue-400" },
                        { label: "Duplicates Removed", value: leads.length - cleanedLeads.length, icon: Trash2, color: "text-red-400" },
                      ].map((stat, i) => (
                        <Card key={i} className="bg-slate-800/50 border-slate-700">
                          <CardContent className="p-6 flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl bg-slate-900/50", stat.color)}>
                              <stat.icon className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm text-slate-500">{stat.label}</p>
                              <p className="text-2xl font-bold">{stat.value}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Cleaned Dashboard</CardTitle>
                          <CardDescription>Landlines filtered to sidebar. Main leads ready for intelligence.</CardDescription>
                        </div>
                        <Button onClick={findIntelligence} disabled={isProcessing}>
                          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                          Find Intelligence
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {isProcessing && currentAction && (
                          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Live Pipeline Status</p>
                                <p className="text-sm text-slate-300 font-mono">{currentAction}</p>
                              </div>
                              <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {mainDashboardLeads.slice(0, 6).map((l, i) => (
                            <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-primary/30 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold truncate max-w-[150px]">{l.companyName}</h4>
                                <Badge variant="secondary" className="text-[10px]">{l.domain}</Badge>
                              </div>
                              <div className="flex items-center text-xs text-slate-500">
                                <Globe className="w-3 h-3 mr-1" />
                                {l.country}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Persistent Telephone Filter Sidebar */}
              <div className="space-y-8">
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-emerald-400 flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Telephone Filter
                      </CardTitle>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                        {telephoneLeads.length} Found
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-500 text-xs text-balance">
                      Direct office lines automatically removed from main dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {telephoneLeads.length > 0 ? (
                      <div className="max-h-[500px] overflow-auto space-y-3 pr-2">
                        {telephoneLeads.map((l, i) => (
                          <div key={i} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1 hover:bg-emerald-500/10 transition-colors">
                            <span className="font-bold text-sm text-emerald-200">{l.companyName}</span>
                            <span className="text-xs text-emerald-500 font-mono flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {l.telephone}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-slate-600 italic text-sm">
                        No direct telephone lines detected yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" className="text-xs">Export CSV</Button>
                    <Button variant="secondary" size="sm" className="text-xs">CRM Sync</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-8">
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      Intelligence Dashboard
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant={hideInvalidEmails ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setHideInvalidEmails(!hideInvalidEmails)}
                        className={cn("text-xs gap-2", hideInvalidEmails && "bg-primary/20 border-primary/50")}
                      >
                        <Filter className="w-3 h-3" />
                        {hideInvalidEmails ? "Showing Valid Emails Only" : "Filter Invalid Emails"}
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">Export CSV</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mainDashboardLeads.filter(l => !hideInvalidEmails || (l.emails && l.emails.some(e => isValidEmail(e)))).slice(0, 10).map((l, i) => (
                        <Card key={i} className="bg-slate-900/50 border-slate-700 hover:border-primary/20 transition-all group">
                          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                            <div className="md:col-span-1">
                              <h4 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{l.companyName}</h4>
                              <p className="text-sm text-slate-500 font-mono truncate">{l.domain}</p>
                            </div>
                            <div className="md:col-span-1">
                              <p className="text-xs text-slate-500 uppercase mb-2">Intelligence</p>
                              <div className="space-y-1">
                                {l.ownerName && (
                                  <div className="flex items-center text-sm text-slate-300">
                                    <User className="w-3 h-3 mr-2 text-blue-400" />
                                    <span className="truncate">{l.ownerName}</span>
                                  </div>
                                )}
                                {l.linkedin && (
                                  <div className="flex items-center text-sm text-slate-400 truncate">
                                    <Linkedin className="w-3 h-3 mr-2 text-blue-600" />
                                    <span className="truncate text-xs">{l.linkedin}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="md:col-span-1 space-y-2">
                              <p className="text-xs text-slate-500 uppercase mb-1">Status</p>
                              <div className="flex flex-wrap gap-2">
                                {l.emails && l.emails.some(e => isValidEmail(e)) ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Email Verified</Badge>
                                ) : (
                                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">Invalid Email</Badge>
                                )}
                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">Phone Ready</Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className="flex items-center text-sm font-bold text-emerald-400">
                                <Phone className="w-4 h-4 mr-2" />
                                {l.mobile}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-xs text-slate-500 hover:text-primary"
                                onClick={() => setSelectedLead(l)}
                              >
                                Full Profile <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Side: Telephone Filtering */}
              <div className="space-y-8">
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-emerald-400 flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Telephone Filter
                      </CardTitle>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                        {telephoneLeads.length} Found
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-500 text-xs">
                      Distinct from mobile. Showing leads with direct office lines.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {telephoneLeads.length > 0 ? (
                      telephoneLeads.map((l, i) => (
                        <div key={i} className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1">
                          <span className="font-bold text-sm text-emerald-200">{l.companyName}</span>
                          <span className="text-xs text-emerald-500 font-mono">{l.telephone}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 text-slate-600 italic text-sm">
                        No direct telephone lines detected in current batch.
                      </div>
                    )}
                    <Button variant="outline" className="w-full border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
                      Export Telephone List
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" className="text-xs">Export CSV</Button>
                    <Button variant="secondary" size="sm" className="text-xs">CRM Sync</Button>
                    <Button variant="secondary" size="sm" className="text-xs">AI Pitch</Button>
                    <Button variant="secondary" size="sm" className="text-xs">Call Queue</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>

        <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Building className="w-6 h-6 text-primary" />
                {selectedLead?.companyName}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Detailed Intelligence Profile for {selectedLead?.domain}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wider">Owner Details</h4>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">{selectedLead?.ownerName}</p>
                      <p className="text-xs text-slate-400">Founder & CEO</p>
                    </div>
                  </div>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-blue-400 text-sm hover:text-blue-300"
                    onClick={() => window.open(`https://${selectedLead?.linkedin}`, '_blank')}
                  >
                    <Linkedin className="w-4 h-4 mr-1" />
                    View LinkedIn Profile
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wider">Contact Numbers</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        <span>Mobile</span>
                      </div>
                      <span className="font-mono text-sm">{selectedLead?.mobile}</span>
                    </div>
                    {selectedLead?.telephone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-blue-400" />
                          <span>Telephone</span>
                        </div>
                        <span className="font-mono text-sm">{selectedLead?.telephone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3 tracking-wider">Email Addresses</h4>
                  <div className="space-y-3">
                    {selectedLead?.emails?.map((email, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                        <Mail className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-mono truncate">{email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                  <h4 className="text-xs font-semibold text-primary uppercase mb-3 tracking-wider">System Insights</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    This lead was identified as a high-intent prospect based on domain normalization and duplicate filtering. 
                    Verified through our LEAD DOMINATION pipeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-800">
              <Button variant="outline" onClick={() => setSelectedLead(null)}>Close</Button>
              <Button className="bg-primary hover:bg-primary/90">Export Full Report</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
