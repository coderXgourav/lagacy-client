import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Globe, Target, CheckCircle2, Download, MapPin, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NoWebsitePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [formData, setFormData] = useState({
    city: '',
    state: '',
    country: 'United States',
    radius: 10000,
    niche: 'restaurants',
    leadCap: 50
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setResults(null);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Coming Soon!",
        description: "This feature is under development",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Scan failed",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {isSearching && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-primary/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">Scanning for Businesses...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
        <div className="container mx-auto max-w-7xl space-y-8 animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate("/offerings")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offerings
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Business Without Website Finder
                  </h1>
                  <p className="text-muted-foreground mt-1">Discover businesses without websites + Auto outreach</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Search Configuration</CardTitle>
                  <CardDescription className="mt-1">
                    Enter location and niche to find businesses without websites
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                    <Label htmlFor="city" className="text-base font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      City *
                    </Label>
                    <Input
                      id="city"
                      placeholder="San Francisco"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      required
                      disabled={isSearching}
                    />
                  </div>

                  <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                    <Label htmlFor="state" className="text-base font-semibold">State/Province</Label>
                    <Input
                      id="state"
                      placeholder="California"
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      disabled={isSearching}
                    />
                  </div>

                  <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                    <Label htmlFor="country" className="text-base font-semibold">Country *</Label>
                    <Input
                      id="country"
                      placeholder="United States"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      required
                      disabled={isSearching}
                    />
                  </div>

                  <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                    <Label htmlFor="radius" className="text-base font-semibold">Search Radius *</Label>
                    <Select
                      value={formData.radius.toString()}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, radius: parseInt(value) }))}
                      disabled={isSearching}
                      required
                    >
                      <SelectTrigger id="radius">
                        <SelectValue placeholder="Select radius" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1000">1 km</SelectItem>
                        <SelectItem value="5000">5 km</SelectItem>
                        <SelectItem value="10000">10 km</SelectItem>
                        <SelectItem value="25000">25 km</SelectItem>
                        <SelectItem value="50000">50 km</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                    <Label htmlFor="niche" className="text-base font-semibold">Business Niche/Keywords</Label>
                    <Input
                      id="niche"
                      placeholder="dentist, spa, restaurant"
                      value={formData.niche}
                      onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                      disabled={isSearching}
                    />
                  </div>

                  <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                    <Label htmlFor="leadCap" className="text-base font-semibold">Lead Cap (1-200)</Label>
                    <Input
                      id="leadCap"
                      type="number"
                      min="1"
                      max="200"
                      value={formData.leadCap}
                      onChange={(e) => setFormData(prev => ({ ...prev, leadCap: parseInt(e.target.value) || 50 }))}
                      disabled={isSearching}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-5 border border-primary/10">
                  <h4 className="font-semibold text-base text-foreground flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    AI Agent Workflow
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Discover businesses from Google, Yelp, Foursquare, OpenStreetMap</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Verify no website presence via Bing Web Search</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Enrich with owner name, email, phone, Facebook page</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Find 5 local competitors for each business</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Auto-send personalized $399 website pitch email</span>
                    </li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full gap-2 shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold py-6 text-lg"
                  size="lg"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Globe className="w-5 h-5" />
                      Start Discovery
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
