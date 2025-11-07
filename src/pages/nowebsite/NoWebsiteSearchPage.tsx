import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Sparkles, MapPin, Target, CheckCircle2, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { noWebsiteApi } from "@/services/api";

const statusMessages = [
  "Initializing search...",
  "Searching Google Places...",
  "Finding businesses in your area...",
  "Filtering businesses without websites...",
  "Checking social media presence...",
  "Extracting contact information...",
  "Finalizing results..."
];

export default function NoWebsiteSearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [formData, setFormData] = useState({
    city: '',
    state: '',
    country: 'United States',
    radius: 5000,
    niche: '',
    leads: 50
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      setStatusIndex(0);
      interval = setInterval(() => {
        setStatusIndex(prev => (prev + 1) % statusMessages.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setResults(null);

    try {
      const data = await noWebsiteApi.scan(formData);
      
      if (data.searchId) {
        setCurrentSearchId(data.searchId);
      }
      
      if (data.data && data.data.length > 0) {
        setResults(data);
        setIsSearching(false);
        setCurrentSearchId(null);
        toast({
          title: "Scan Complete! 🎉",
          description: `Found ${data.count} businesses without websites`,
        });
      } else if (data.searchId) {
        const pollInterval = setInterval(async () => {
          try {
            const results = await noWebsiteApi.getSearchResults(data.searchId);
            const status = results.data?.search?.status;
            
            if (status === 'completed') {
              clearInterval(pollInterval);
              const businessData = results.data?.results || [];
              setResults({
                count: businessData.length,
                message: 'Scan complete',
                data: businessData
              });
              setIsSearching(false);
              setCurrentSearchId(null);
              toast({
                title: "Scan Complete! 🎉",
                description: `Found ${businessData.length} businesses without websites`,
              });
            } else if (status === 'cancelled' || status === 'failed') {
              clearInterval(pollInterval);
              setIsSearching(false);
              setCurrentSearchId(null);
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        }, 3000);
      }
    } catch (error: any) {
      setIsSearching(false);
      setCurrentSearchId(null);
      toast({
        title: "Error",
        description: error.message || "Scan failed",
        variant: "destructive"
      });
    }
  };

  const handleCancel = async () => {
    if (currentSearchId) {
      try {
        await noWebsiteApi.cancelSearch(currentSearchId);
        setIsSearching(false);
        setCurrentSearchId(null);
        toast({
          title: "Search Cancelled",
          description: "The search was cancelled by user",
        });
      } catch (error: any) {
        console.error('Cancel error:', error);
        toast({
          title: "Error",
          description: "Failed to cancel search",
          variant: "destructive"
        });
      }
    } else {
      setIsSearching(false);
    }
  };

  const handleDownload = async () => {
    if (!results || !results.data) return;
    try {
      await noWebsiteApi.downloadSearchExcel('current', results.data);
      toast({
        title: "Success",
        description: "Excel file downloaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Download failed",
        variant: "destructive"
      });
    }
  };

  return (
    <>
    {isSearching && (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-[400px] shadow-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-primary/50 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
              </div>
              <div className="text-center space-y-3 w-full">
                <p className="text-lg font-semibold text-foreground">Scanning for Businesses</p>
                <div className="min-h-[40px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground animate-pulse">{statusMessages[statusIndex]}</p>
                </div>
                <p className="text-xs text-muted-foreground">This may take 3-4 minutes</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                Cancel Search
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                New Search
              </h1>
              <p className="text-muted-foreground mt-1">Find businesses without websites and their social media pages (Facebook, Zomato, Instagram, etc.)</p>
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
                <Label htmlFor="niche" className="text-base font-semibold">Niche/Type of Business</Label>
                <Input 
                  id="niche" 
                  placeholder="restaurants, hotels, lawyers" 
                  value={formData.niche}
                  onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                <Label htmlFor="leads" className="text-base font-semibold">Leads (1-1000)</Label>
                <Input 
                  id="leads" 
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.leads}
                  onChange={(e) => setFormData(prev => ({ ...prev, leads: parseInt(e.target.value) || 50 }))}
                  disabled={isSearching}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-5 border border-primary/10">
              <h4 className="font-semibold text-base text-foreground flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                Discovery Process
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Search Google Places for businesses in your location</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Filter businesses without websites</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Extract contact information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Prepare for outreach campaigns</span>
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
                  <Search className="w-5 h-5" />
                  Start Scan
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results && (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50 animate-fade-in">
          <CardHeader className="border-b bg-gradient-to-r from-green-500/5 via-green-500/3 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Found {results.count} Businesses Without Websites</CardTitle>
                  <CardDescription>{results.message}</CardDescription>
                </div>
              </div>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="w-4 h-4" />
                Download Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {results.data.map((business: any, idx: number) => (
                <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-semibold text-lg">{business.businessName || business.name}</h4>
                  {business.niche && <p className="text-sm text-muted-foreground">{business.niche}</p>}
                  <div className="mt-2 space-y-1 text-sm">
                    {business.ownerName && <p><strong>Owner:</strong> {business.ownerName}</p>}
                    {business.rating && <p><strong>Rating:</strong> ⭐ {business.rating}</p>}
                    {business.phone && <p><strong>Phone:</strong> {business.phone}</p>}
                    {business.email && <p><strong>Email:</strong> {business.email}</p>}
                    {business.facebookPage && (
                      <p><strong>Social Media:</strong> <a href={business.facebookPage} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View Page</a></p>
                    )}
                    {business.address && <p><strong>Address:</strong> {business.address}</p>}
                    {(business.city || business.state || business.country) && (
                      <p><strong>Location:</strong> {[business.city, business.state, business.country].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
