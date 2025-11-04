import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Settings, Key, Save } from "lucide-react";
import { domainScraperApi, settingsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function DomainScraperSettings() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    <div className="container mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure domain scraper</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Scraper Control</CardTitle>
              <CardDescription>Manually trigger domain scraping from WhoisXML</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-6">
            <h3 className="font-semibold mb-2">Auto-Scraping Process</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The system automatically navigates to WhoisXML's newly registered domains page, 
              finds all CSV download links, streams the data, and stores unique domains in MongoDB.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Scrapes from: https://newly-registered-domains.whoisxmlapi.com/</li>
              <li>• Processes CSV files in real-time (no manual downloads)</li>
              <li>• Automatically deduplicates domain records</li>
              <li>• Extracts registrant information and contact details</li>
            </ul>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Manual Refresh</h4>
              <p className="text-sm text-muted-foreground">Trigger scraping process now</p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Scraping...' : 'Refresh Now'}
            </Button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">How It Works</h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Agent navigates to WhoisXML domain list page</li>
              <li>Locates all CSV download links automatically</li>
              <li>Streams CSV data directly (no file downloads)</li>
              <li>Parses domain records in real-time</li>
              <li>Inserts unique domains into MongoDB</li>
              <li>Enriches with RDAP → WhoisFreaks → WhoisXML</li>
              <li>Provides status updates and error reporting</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Configure API keys for domain enrichment</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whoisFreaks">WhoisFreaks API Key</Label>
              <Input
                id="whoisFreaks"
                type="password"
                placeholder="Enter WhoisFreaks API key"
                value={apiKeys.whoisFreaks}
                onChange={(e) => setApiKeys(prev => ({ ...prev, whoisFreaks: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Used as fallback when RDAP fails. Get your key from whoisfreaks.com
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whoisXml">WhoisXML API Key</Label>
              <Input
                id="whoisXml"
                type="password"
                placeholder="Enter WhoisXML API key"
                value={apiKeys.whoisXml}
                onChange={(e) => setApiKeys(prev => ({ ...prev, whoisXml: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Used as final fallback. Get your key from whoisxmlapi.com
              </p>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2">Enrichment Strategy</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Try RDAP (free, no API key needed)</li>
              <li>If RDAP fails → Try WhoisFreaks API</li>
              <li>If WhoisFreaks fails → Try WhoisXML API</li>
              <li>Store enriched domain details in MongoDB</li>
            </ol>
          </div>

          <Button 
            onClick={handleSaveApiKeys} 
            disabled={isSaving}
            className="w-full gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save API Keys'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
