import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Target, CheckCircle2, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { newBusinessApi } from "@/services/api";

const statusMessages = [
  "Initializing search...",
  "Querying OpenStreetMap...",
  "Finding new businesses...",
  "Extracting business details...",
  "Enriching contact information...",
  "Finalizing results..."
];

export default function NewBusinessSearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);
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
    daysBack: 30,
    leads: 100
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
    setResults([]);
    setSearchId(null);
    setCurrentSearchId(null);

    try {
      console.log('🔍 Sending search request:', formData);
      
      const response = await newBusinessApi.scan({
        city: formData.city,
        state: formData.state,
        country: formData.country,
        radius: formData.radius,
        niche: formData.niche,
        daysBack: formData.daysBack,
        leads: formData.leads
      });

      console.log('✅ Search response:', response);

      if (response.success && response.data) {
        setResults(response.data);
        setSearchId(response.searchId);
        if (response.searchId) {
          setCurrentSearchId(response.searchId);
        }
        toast({
          title: "Search Complete",
          description: `Found ${response.count || response.data.length} businesses`,
        });
      } else {
        toast({
          title: "No Results",
          description: "No businesses found matching your criteria",
        });
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      toast({
        title: "Error",
        description: error.message || "Search failed",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
      setCurrentSearchId(null);
    }
  };

  const handleCancel = async () => {
    if (currentSearchId) {
      try {
        await newBusinessApi.cancelSearch(currentSearchId);
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
    if (!searchId || results.length === 0) return;
    try {
      await newBusinessApi.downloadSearchExcel(searchId, results);
      toast({
        title: "Download Started",
        description: "Your Excel file is being downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
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
                <p className="text-lg font-semibold text-foreground">Searching for New Businesses</p>
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
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">New Search</h1>
        <p className="text-muted-foreground">Find newly registered businesses</p>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Search Configuration</CardTitle>
              <CardDescription>Set your search criteria</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="city">City *</Label>
                <Input 
                  id="city" 
                  placeholder="San Francisco" 
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required 
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="state">State/Province</Label>
                <Input 
                  id="state" 
                  placeholder="California" 
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="country">Country *</Label>
                <Input 
                  id="country" 
                  placeholder="United States" 
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  required 
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="radius">Search Radius *</Label>
                <Select 
                  value={formData.radius.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, radius: parseInt(value) }))}
                  disabled={isSearching}
                >
                  <SelectTrigger id="radius">
                    <SelectValue />
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

              <div className="space-y-3">
                <Label htmlFor="niche">Business Category</Label>
                <Input 
                  id="niche" 
                  placeholder="restaurants, retail, services" 
                  value={formData.niche}
                  onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="daysBack">Time Filter *</Label>
                <Select 
                  value={formData.daysBack.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, daysBack: parseInt(value) }))}
                  disabled={isSearching}
                >
                  <SelectTrigger id="daysBack">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="60">Last 60 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="leads">Max Leads (1-500)</Label>
                <Input 
                  id="leads" 
                  type="number"
                  min="1"
                  max="500"
                  value={formData.leads}
                  onChange={(e) => setFormData(prev => ({ ...prev, leads: parseInt(e.target.value) || 100 }))}
                  disabled={isSearching}
                />
              </div>
            </div>



            <div className="bg-muted rounded-lg p-5">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                What You'll Get
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Owner name and contact details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Business name, phone, email, and address</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Facebook page and social media links</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Export to Google Sheets for outreach</span>
                </li>
              </ul>
            </div>

            <Button 
              type="submit" 
              disabled={isSearching}
              className="w-full gap-2"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Search
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>Found {results.length} businesses</CardDescription>
              </div>
              <Button onClick={handleDownload} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Registration Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((business, index) => (
                    <TableRow key={business._id || index}>
                      <TableCell className="font-medium">{business.businessName || 'N/A'}</TableCell>
                      <TableCell>{business.ownerName || 'N/A'}</TableCell>
                      <TableCell>{business.phone || 'N/A'}</TableCell>
                      <TableCell>{business.email || 'N/A'}</TableCell>
                      <TableCell>{business.address || 'N/A'}</TableCell>
                      <TableCell>{business.niche || 'N/A'}</TableCell>
                      <TableCell>
                        {business.registrationDate 
                          ? new Date(business.registrationDate).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}
