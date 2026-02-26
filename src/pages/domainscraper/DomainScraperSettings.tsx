import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RefreshCw,
  Settings,
  Key,
  Save,
  Database,
  Globe,
  ShieldCheck,
  Zap,
  ChevronRight,
  Terminal,
  Eye,
  EyeOff
} from "lucide-react";
import { domainScraperApi, settingsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function DomainScraperSettings() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    whoisFreaks: '',
    whoisXml: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getSettings();
      const settings = response.data || response;
      setApiKeys({
        whoisFreaks: settings.apiKeys?.whoisfreaks || '',
        whoisXml: settings.apiKeys?.whoisxml || ''
      });
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSaveApiKeys = async () => {
    setIsSaving(true);
    try {
      await settingsApi.updateApiKeys({
        whoisfreaks: apiKeys.whoisFreaks,
        whoisxml: apiKeys.whoisXml
      });
      toast({
        title: "Settings Saved",
        description: "API keys have been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await domainScraperApi.triggerScrape();
      toast({
        title: "Scraping Started",
        description: response.message || "Domain scraping has been triggered",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to trigger scraping",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container mx-auto space-y-8 p-6 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-600/20">
                <Settings className="h-7 w-7 text-white" />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-xs font-semibold tracking-wide uppercase">
                Configuration
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Scraper Protocol
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Configure advanced enrichment vectors, API authentication, and automated crawling parameters.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Scraper Control */}
          <Card className="border-border bg-card/30 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <CardHeader className="py-8 bg-muted/20 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <Database className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Vector Command</CardTitle>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest mt-0.5">Automated Intelligence Trigger</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="bg-muted/30 p-8 rounded-2xl border border-border/50 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Terminal className="w-24 h-24 text-indigo-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-600" />
                    Crawler Logic Flow
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    The intelligence engine autonomously targets secondary registry CSV streams to extract unique domain leads without manual intervention.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Newly Registered Discovery",
                    "Real-time CSV Propagation",
                    "Automated Record Deduplication",
                    "Registrant Intel Extraction"
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-background/50 p-3 rounded-xl border border-border/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-8 rounded-2xl border border-indigo-500/10 bg-gradient-to-r from-indigo-500/5 to-transparent">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold uppercase tracking-widest">Manual Inception</h4>
                  <p className="text-xs text-muted-foreground font-medium">Trigger an immediate registry propagation scan</p>
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-12 px-8 gap-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-all font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-indigo-600/20"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'CRAWLING...' : 'TRIGGER SCAN'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card className="border-border bg-card/30 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <CardHeader className="py-8 bg-muted/20 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Key className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Authentication Vault</CardTitle>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest mt-0.5">Enrichment Provider Credentials</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeys(!showKeys)}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-indigo-600"
                >
                  {showKeys ? <><EyeOff className="w-3.5 h-3.5 mr-2" /> Hide Intel</> : <><Eye className="w-3.5 h-3.5 mr-2" /> Show Intel</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="whoisFreaks" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">WhoisFreaks Vector</Label>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase bg-background">Primary Fallback</Badge>
                  </div>
                  <div className="relative">
                    <Input
                      id="whoisFreaks"
                      type={showKeys ? "text" : "password"}
                      placeholder="Enter secure provider key"
                      value={apiKeys.whoisFreaks}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, whoisFreaks: e.target.value }))}
                      className="h-12 bg-background/50 border-border rounded-xl px-4 text-xs font-mono group-focus-within:ring-2 group-focus-within:ring-indigo-500/20 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-40 pointer-events-none">
                      <Key className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">High-fidelity backup enrichment vector when RDAP fails.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="whoisXml" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">WhoisXML Registry</Label>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase bg-background">Deep Scan Vector</Badge>
                  </div>
                  <div className="relative">
                    <Input
                      id="whoisXml"
                      type={showKeys ? "text" : "password"}
                      placeholder="Enter secure registry key"
                      value={apiKeys.whoisXml}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, whoisXml: e.target.value }))}
                      className="h-12 bg-background/50 border-border rounded-xl px-4 text-xs font-mono"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium italic opacity-60">Tertiary intelligence vector for exhaustive data recovery.</p>
                </div>
              </div>

              <Button
                onClick={handleSaveApiKeys}
                disabled={isSaving}
                className="w-full h-14 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-bold text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'ENCRYPTING...' : 'COMMIT VAULT CHANGES'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Enrichment Strategy Info */}
          <Card className="border-border bg-card/30 backdrop-blur-sm p-8 space-y-6">
            <div className="space-y-2 mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Escalation Matrix
              </h3>
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase tracking-wider">Priority Domain Hydration Strategy</p>
            </div>

            <div className="space-y-4">
              {[
                { step: "RDAP PROTOCOL", desc: "Open-source baseline propagation check", status: "Enabled", color: "indigo" },
                { step: "WHOISFREAKS", desc: "Premium fallback record enrichment", status: "Priority 2", color: "emerald" },
                { step: "WHOISXML API", desc: "Exhaustive deep-scan registry recovery", status: "Security Net", color: "blue" }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/10 flex items-center justify-center border border-${item.color}-500/20 group-hover:scale-110 transition-transform`}>
                      <span className={`text-[10px] font-bold text-${item.color}-600`}>{i + 1}</span>
                    </div>
                    {i < 2 && <div className="w-0.5 h-10 bg-border/50" />}
                  </div>
                  <div className="space-y-1 pt-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest">{item.step}</h4>
                      <span className={`text-[8px] font-bold uppercase tracking-widest opacity-60`}>{item.status}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-border flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                <p className="text-[9px] text-muted-foreground font-bold leading-relaxed uppercase tracking-widest">
                  Enrichment persists all discovered attributes to MongoDB for real-time lead processing.
                </p>
              </div>
            </div>
          </Card>

          {/* Status Indicator */}
          <Card className="border-indigo-500/20 bg-indigo-500/5 p-6 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-5 animate-pulse">
              <Globe className="w-12 h-12 text-indigo-500" />
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
            <div className="space-y-0.5 relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Vector Status: ACTIVE</p>
              <p className="text-[9px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">Awaiting registry trigger... 2.4s latency</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
