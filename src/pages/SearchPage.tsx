import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Sparkles, MapPin, Target, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { legacyFinderApi } from "@/services/api";

export default function SearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    city: '',
    state: '',
    country: 'United States',
    radius: 5000,
    businessCategory: 'restaurants',
    leadCap: 50,
    domainYear: '',
    filterMode: 'before' // 'before' or 'after'
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setResults(null);

    try {
      const data = await legacyFinderApi.scan(formData);
      setResults(data);
      
      toast({
        title: "Scan Complete! 🎉",
        description: `Found ${data.count} legacy websites`,
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

  const handleDownload = async () => {
    if (!results || !results.data) return;
    try {
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(results.data.map((b: any) => ({
        'Business Name': b.businessName || b.name || 'N/A',
        'Owner Name': b.ownerName || 'N/A',
        'Category': b.category || 'N/A',
        'Website': b.website || 'N/A',
        'Domain Created': b.domainCreationDate ? new Date(b.domainCreationDate).toLocaleDateString() : 'N/A',
        'Phone': b.phone || 'N/A',
        'Emails': b.emails?.join(', ') || b.email || 'N/A',
        'Address': b.address || 'N/A',
        'City': b.location?.city || b.city || 'N/A',
        'State': b.location?.state || b.state || 'N/A',
        'Country': b.location?.country || b.country || 'N/A',
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Businesses');
      XLSX.writeFile(workbook, 'search-results.xlsx');
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
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-primary/50 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1s'}}></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">Scanning for Legacy Websites...</p>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </div>
        </div>
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
              <p className="text-muted-foreground mt-1">Discover leads with legacy websites</p>
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
                Enter location and category to find businesses with legacy websites
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
                <Label htmlFor="businessCategory" className="text-base font-semibold">Business Category</Label>
                <Input 
                  id="businessCategory" 
                  placeholder="restaurants, hotels, lawyers" 
                  value={formData.businessCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessCategory: e.target.value }))}
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                <Label htmlFor="leadCap" className="text-base font-semibold">Lead Cap (1-100)</Label>
                <Input 
                  id="leadCap" 
                  type="number"
                  min="1"
                  max="100"
                  value={formData.leadCap}
                  onChange={(e) => setFormData(prev => ({ ...prev, leadCap: parseInt(e.target.value) || 50 }))}
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                <div className="flex items-center justify-between">
                  <Label htmlFor="domainYear" className="text-base font-semibold">Domain Created Year</Label>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${formData.filterMode === 'before' ? 'text-primary' : 'text-muted-foreground'}`}>Before</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.filterMode === 'after'}
                        onChange={(e) => setFormData(prev => ({ ...prev, filterMode: e.target.checked ? 'after' : 'before' }))}
                        disabled={isSearching}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <span className={`text-sm font-medium ${formData.filterMode === 'after' ? 'text-primary' : 'text-muted-foreground'}`}>After</span>
                  </div>
                </div>
                <Input 
                  id="domainYear" 
                  type="number"
                  placeholder="e.g., 2020" 
                  min="1990"
                  max={formData.filterMode === 'before' ? new Date().getFullYear() : new Date().getFullYear() - 1}
                  value={formData.domainYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, domainYear: e.target.value }))}
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
                  <span>Check domain registration dates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Filter legacy websites (older domains)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Extract contact emails from websites</span>
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
                  <CardTitle className="text-xl">Found {results.count} Legacy Websites</CardTitle>
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
              {results.data.map((business: any) => (
                <div key={business._id} className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-semibold text-lg">{business.businessName}</h4>
                  <p className="text-sm text-muted-foreground">{business.category}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Website:</strong> <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{business.website}</a></p>
                    <p><strong>Domain Created:</strong> {new Date(business.domainCreationDate).toLocaleDateString()}</p>
                    <p><strong>Phone:</strong> {business.phone}</p>
                    <p><strong>Address:</strong> {business.address}</p>
                    {business.emails.length > 0 && (
                      <p><strong>Emails:</strong> {business.emails.join(', ')}</p>
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
