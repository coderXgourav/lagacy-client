import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Sparkles, MapPin, Target, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    city: '',
    state: '',
    country: 'United States',
    radius: '10',
    category: 'restaurant'
  });

  // Poll for search status
  useEffect(() => {
    if (!searchId || !isSearching) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/search/status/${searchId}`);
        const search = response.data.data;
        setSearchStatus(search);

        if (search.status === 'completed') {
          setIsSearching(false);
          toast({
            title: "Search Complete! 🎉",
            description: `Found ${search.resultsCount} leads with domains registered before 2020`,
          });
          setTimeout(() => {
            navigate('/recent-searches');
          }, 2000);
        } else if (search.status === 'failed') {
          setIsSearching(false);
          toast({
            title: "Search Failed",
            description: search.errorMessage || "An error occurred during search",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error checking status:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [searchId, isSearching, navigate, toast]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setSearchStatus(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/search/execute`, formData);
      
      if (response.data.success) {
        setSearchId(response.data.data._id);
        toast({
          title: "Search Started! 🚀",
          description: "AI is discovering leads with legacy websites...",
        });
      }
    } catch (error: any) {
      setIsSearching(false);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start search. Please check your API keys in Settings.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      {/* Header Section */}
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
              <p className="text-muted-foreground mt-1">Discover leads with legacy websites using AI</p>
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
                Enter location and category to find businesses with domains registered before 2020
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
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required 
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                <Label htmlFor="state" className="text-base font-semibold">State/Province *</Label>
                <Input 
                  id="state" 
                  placeholder="California" 
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  required 
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                <Label htmlFor="country" className="text-base font-semibold">Country *</Label>
                <Input 
                  id="country" 
                  placeholder="United States" 
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required 
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                <Label htmlFor="radius" className="text-base font-semibold">Search Radius (km) *</Label>
                <Select 
                  value={formData.radius}
                  onValueChange={(value) => handleInputChange('radius', value)}
                  disabled={isSearching}
                  required
                >
                  <SelectTrigger id="radius">
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 km</SelectItem>
                    <SelectItem value="10">10 km</SelectItem>
                    <SelectItem value="25">25 km</SelectItem>
                    <SelectItem value="50">50 km</SelectItem>
                    <SelectItem value="100">100 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                <Label htmlFor="category" className="text-base font-semibold">Business Category *</Label>
                <Select 
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                  disabled={isSearching}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="cafe">Cafe</SelectItem>
                    <SelectItem value="bar">Bar</SelectItem>
                    <SelectItem value="store">Retail Store</SelectItem>
                    <SelectItem value="gym">Gym / Fitness</SelectItem>
                    <SelectItem value="salon">Salon / Spa</SelectItem>
                    <SelectItem value="dentist">Dentist</SelectItem>
                    <SelectItem value="lawyer">Lawyer</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="plumber">Plumber</SelectItem>
                    <SelectItem value="electrician">Electrician</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select the type of business you want to find</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-5 border border-primary/10">
              <h4 className="font-semibold text-base text-foreground flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Discovery Process
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Search Google Places for businesses in your specified location</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Verify domain registration dates via WhoisXML API</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Filter only domains registered <strong>before 2020</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Find email addresses using Hunter.io API</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Collect name, email, phone, website, and category data</span>
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
                  Searching for Leads...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start AI Lead Discovery
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isSearching && searchStatus && (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50 animate-fade-in">
          <CardHeader className="border-b bg-gradient-to-r from-blue-500/5 via-blue-500/3 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-xl">Search in Progress</CardTitle>
                <CardDescription>AI is discovering leads with legacy websites...</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <div>
                    <p className="font-semibold">Status: {searchStatus.status}</p>
                    <p className="text-sm text-muted-foreground">Processing your search criteria...</p>
                  </div>
                </div>
                {searchStatus.resultsCount > 0 && (
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{searchStatus.resultsCount}</p>
                    <p className="text-xs text-muted-foreground">Leads Found</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Searching Google Places...</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Checking domain ages...</span>
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Finding email addresses...</span>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary/80 animate-pulse" style={{ width: "70%" }} />
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                This may take a few minutes. You'll be redirected when complete.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
