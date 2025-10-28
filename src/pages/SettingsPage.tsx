import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { settingsApi } from "@/services/api";
import { Key, Bell, Download, Palette, Save, CheckCircle2, Settings as SettingsIcon, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiKeys, setApiKeys] = useState({
    whoisxml: "",
    hunter: "",
    googlePlaces: "",
    whoisfreaks: "",
    foursquare: ""
  });
  const [notifications, setNotifications] = useState({
    email: false,
    slack: false
  });
  const [exportSettings, setExportSettings] = useState({
    autoExport: false,
    emailRecipients: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.getSettings();
      if (response.success && response.data) {
        setApiKeys(response.data.apiKeys || {});
        setNotifications(response.data.notifications || {});
        setExportSettings(response.data.exportSettings || {});
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveApiKeys = async () => {
    setSaving(true);
    try {
      const response = await settingsApi.updateApiKeys(apiKeys);
      if (response.success) {
        toast({
          title: "Success",
          description: "API keys saved successfully"
        });
      }
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast({
        title: "Error",
        description: "Failed to save API keys",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      const response = await settingsApi.updateSettings({
        apiKeys,
        notifications,
        exportSettings
      });
      if (response.success) {
        toast({
          title: "Success",
          description: "Settings saved successfully"
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground mt-1">Manage your application preferences and configurations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Card */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50 overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-purple-500/5 via-purple-500/3 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Palette className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Appearance</CardTitle>
              <CardDescription className="mt-1">Customize your interface theme and visual preferences</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <Label htmlFor="theme" className="text-base font-semibold flex items-center gap-2">
                {theme === "dark" ? "🌙" : "☀️"} Dark Mode
              </Label>
              <p className="text-sm text-muted-foreground">Toggle between light and dark theme</p>
            </div>
            <Switch 
              id="theme" 
              checked={theme === "dark"} 
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* API Configuration Card */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50 overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-blue-500/5 via-blue-500/3 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Key className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">API Configuration</CardTitle>
              <CardDescription className="mt-1">Connect your third-party services for powerful lead searches</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="text-muted-foreground font-medium">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                  <Label htmlFor="whois" className="text-base font-semibold">WhoisXML API Key</Label>
                  <Input 
                    id="whois" 
                    type="password" 
                    placeholder="••••••••••••••••" 
                    value={apiKeys.whoisxml}
                    onChange={(e) => setApiKeys({ ...apiKeys, whoisxml: e.target.value })}
                    disabled={loading}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Domain and WHOIS data lookups</p>
                </div>

                <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                  <Label htmlFor="hunter" className="text-base font-semibold">Hunter.io API Key</Label>
                  <Input 
                    id="hunter" 
                    type="password" 
                    placeholder="••••••••••••••••" 
                    value={apiKeys.hunter}
                    onChange={(e) => setApiKeys({ ...apiKeys, hunter: e.target.value })}
                    disabled={loading}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Email finding and verification services</p>
                </div>

                <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                  <Label htmlFor="google" className="text-base font-semibold">Google Places API Key</Label>
                  <Input 
                    id="google" 
                    type="password" 
                    placeholder="••••••••••••••••" 
                    value={apiKeys.googlePlaces}
                    onChange={(e) => setApiKeys({ ...apiKeys, googlePlaces: e.target.value })}
                    disabled={loading}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Location-based business discovery</p>
                </div>

                <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                  <Label htmlFor="whoisfreaks" className="text-base font-semibold">WhoisFreaks API Key</Label>
                  <Input 
                    id="whoisfreaks" 
                    type="password" 
                    placeholder="••••••••••••••••" 
                    value={apiKeys.whoisfreaks}
                    onChange={(e) => setApiKeys({ ...apiKeys, whoisfreaks: e.target.value })}
                    disabled={loading}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Alternative WHOIS data provider</p>
                </div>

                <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                  <Label htmlFor="foursquare" className="text-base font-semibold">Foursquare API Key</Label>
                  <Input 
                    id="foursquare" 
                    type="password" 
                    placeholder="••••••••••••••••" 
                    value={apiKeys.foursquare}
                    onChange={(e) => setApiKeys({ ...apiKeys, foursquare: e.target.value })}
                    disabled={loading}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Location-based business data</p>
                </div>
              </div>

              <Separator />

              <Button 
                className="w-full gap-2 shadow-md" 
                size="lg"
                onClick={saveApiKeys}
                disabled={saving || loading}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save API Keys
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications Card */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50 overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-green-500/5 via-green-500/3 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Bell className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Notifications</CardTitle>
              <CardDescription className="mt-1">Stay updated with real-time alerts and notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <Label htmlFor="email-notif" className="text-base font-semibold flex items-center gap-2">
                📧 Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Receive search completion and summary emails</p>
            </div>
            <Switch 
              id="email-notif" 
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              disabled={loading}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <Label htmlFor="slack-notif" className="text-base font-semibold flex items-center gap-2">
                💬 Slack Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Send search results directly to your Slack channel</p>
            </div>
            <Switch 
              id="slack-notif" 
              checked={notifications.slack}
              onCheckedChange={(checked) => setNotifications({ ...notifications, slack: checked })}
              disabled={loading}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Settings Card */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50 overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-orange-500/5 via-orange-500/3 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Download className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle className="text-2xl">Export Settings</CardTitle>
              <CardDescription className="mt-1">Configure automatic exports and data delivery</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="space-y-1">
              <Label htmlFor="auto-export" className="text-base font-semibold flex items-center gap-2">
                📊 Auto Export
              </Label>
              <p className="text-sm text-muted-foreground">Automatically generate Excel files after each search</p>
            </div>
            <Switch 
              id="auto-export" 
              checked={exportSettings.autoExport}
              onCheckedChange={(checked) => setExportSettings({ ...exportSettings, autoExport: checked })}
              disabled={loading}
              className="data-[state=checked]:bg-orange-500"
            />
          </div>

          <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
            <Label htmlFor="email-to" className="text-base font-semibold">Export Email Recipients</Label>
            <Input 
              id="email-to" 
              type="email" 
              placeholder="admin@company.com, team@company.com" 
              value={exportSettings.emailRecipients}
              onChange={(e) => setExportSettings({ ...exportSettings, emailRecipients: e.target.value })}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
          </div>

          <Separator />

          <Button 
            className="w-full gap-2 shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
            size="lg"
            onClick={saveAllSettings}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving All Settings...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save All Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
