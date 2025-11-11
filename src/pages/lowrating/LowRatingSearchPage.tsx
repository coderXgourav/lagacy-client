import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Sparkles, MapPin, Target, CheckCircle2, Download, X, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { lowRatingApi } from "@/services/api";
import LocationMap from "@/components/LocationMap";

const statusMessages = [
  "Initializing search...",
  "Searching Google Places...",
  "Finding businesses in your area...",
  "Checking business ratings...",
  "Filtering low-rated businesses...",
  "Extracting contact information...",
  "Finalizing results..."
];

export default function LowRatingSearchPage() {
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
    radius: 5000, // Fixed at 5km
    niche: '',
    maxRating: 3.0,
    useHunter: true, // Enable Hunter.io email lookup
    lat: null as number | null,
    lng: null as number | null,
  });
  const [useMapLocation, setUseMapLocation] = useState(false);

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
      // Prepare search data
      const searchData: any = {
        city: formData.city,
        state: formData.state,
        country: formData.country,
        radius: formData.radius,
        niche: formData.niche,
        maxRating: formData.maxRating,
        useHunter: formData.useHunter
      };
      
      // Only add lat/lng if they're actually set
      if (formData.lat && formData.lng) {
        searchData.lat = formData.lat;
        searchData.lng = formData.lng;
      }
      
      console.log('Sending search data:', searchData);
      
      const data = await lowRatingApi.scan(searchData);
      
      if (data.searchId) {
        setCurrentSearchId(data.searchId);
      }
      
      if (data.data && data.data.length > 0) {
        setResults(data);
        setIsSearching(false);
        setCurrentSearchId(null);
        toast({
          title: "Scan Complete! 🎉",
          description: `Found ${data.count} businesses with low ratings`,
        });
      } else if (data.searchId) {
        const pollInterval = setInterval(async () => {
          try {
            const results = await lowRatingApi.getSearchResults(data.searchId);
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
                description: `Found ${businessData.length} businesses with low ratings`,
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
    console.log('Cancel clicked, currentSearchId:', currentSearchId);
    if (currentSearchId) {
      try {
        console.log('Calling cancelSearch API with searchId:', currentSearchId);
        const result = await lowRatingApi.cancelSearch(currentSearchId);
        console.log('Cancel API result:', result);
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
      console.log('No searchId available, just stopping UI');
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address?: { city: string; state: string; country: string }) => {
    console.log('🗺️ Location selected:', { lat, lng, address });
    
    // Update form data with coordinates and address in one call
    if (address) {
      console.log('📍 Updating with address:', address);
      setFormData(prev => ({ 
        ...prev, 
        lat, 
        lng,
        city: address.city || prev.city,
        state: address.state || prev.state,
        country: address.country || prev.country
      }));
      
      const addressParts = [address.city, address.state, address.country].filter(Boolean);
      
      toast({
        title: "Location Selected",
        description: addressParts.length > 0 ? addressParts.join(', ') : 'Coordinates updated',
      });
    } else {
      console.log('📍 Updating coordinates only (no address)');
      setFormData(prev => ({ ...prev, lat, lng }));
      
      toast({
        title: "Location Selected",
        description: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      });
    }
  };

  const handleDownload = async () => {
    if (!results || !results.data) return;
    try {
      await lowRatingApi.downloadSearchExcel(results.searchId || 'results', results.data);
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
                <p className="text-lg font-semibold text-foreground">Scanning for Low Ratings</p>
                <div className="min-h-[40px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground animate-pulse">{statusMessages[statusIndex]}</p>
                </div>
                <p className="text-xs text-muted-foreground">This may take 3-4 minutes</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log('🔴 CANCEL BUTTON CLICKED!');
                  handleCancel();
                }}
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
              <p className="text-muted-foreground mt-1">Find businesses with low ratings</p>
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
                Enter location and rating threshold to find businesses
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-6">
            {useMapLocation && (
              <div className="animate-fade-in relative z-0">
                <LocationMap
                  onLocationSelect={handleLocationSelect}
                  radius={5000}
                />
              </div>
            )}

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

              <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-muted/10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="useMapLocation" className="text-base font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      Use Map Location
                    </Label>
                    <p className="text-xs text-muted-foreground">Pinpoint exact location on map (5km radius)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="useMapLocation"
                      checked={useMapLocation}
                      onChange={(e) => setUseMapLocation(e.target.checked)}
                      disabled={isSearching}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
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
                <Label htmlFor="maxRating" className="text-base font-semibold">Maximum Rating (1.0-5.0)</Label>
                <Input 
                  id="maxRating" 
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={formData.maxRating}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxRating: parseFloat(e.target.value) || 3.0 }))}
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-muted/10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="useHunter" className="text-base font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4 text-purple-500" />
                      Hunter.io Email Lookup
                    </Label>
                    <p className="text-xs text-muted-foreground">Find email addresses for businesses</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="useHunter"
                      checked={formData.useHunter}
                      onChange={(e) => setFormData(prev => ({ ...prev, useHunter: e.target.checked }))}
                      disabled={isSearching}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
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
                  <span>Filter businesses with ratings below threshold</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Extract contact information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Prepare for reputation improvement outreach</span>
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
                  <CardTitle className="text-xl">Found {results.count} Businesses with Low Ratings</CardTitle>
                  <CardDescription>{results.message}</CardDescription>
                </div>
              </div>
              {results.data && results.data.length > 0 && (
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Excel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {results.data && results.data.length > 0 ? (
              <div className="space-y-4">
                {results.data.map((business: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-semibold text-lg">{business.businessName || business.name}</h4>
                    {business.niche && <p className="text-sm text-muted-foreground">{business.niche}</p>}
                    <div className="mt-2 space-y-1 text-sm">
                      {business.rating && <p><strong>Rating:</strong> ⭐ {business.rating}</p>}
                      {business.totalReviews && <p><strong>Total Reviews:</strong> {business.totalReviews}</p>}
                      {business.phone && <p><strong>Phone:</strong> {business.phone}</p>}
                      {business.email && <p><strong>Email:</strong> {business.email}</p>}
                      {business.website && (
                        <p><strong>Website:</strong> <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{business.website}</a></p>
                      )}
                      {business.address && <p><strong>Address:</strong> {business.address}</p>}
                      {(business.city || business.state || business.country) && (
                        <p><strong>Location:</strong> {[business.city, business.state, business.country].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No businesses found matching your criteria.</p>
                <p className="text-sm mt-2">Try adjusting your search parameters or increasing the search radius.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
