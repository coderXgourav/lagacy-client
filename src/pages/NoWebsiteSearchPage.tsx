import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, MapPin, Target, CheckCircle2, Download, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { noWebsiteApi } from "@/services/api";

export default function NoWebsiteSearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    location: '',
    radius: 10000,
    keywords: '',
    leadCap: 50
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setResults(null);

    try {
      const data = await noWebsiteApi.scan(formData);
      setResults(data);

      toast({
        title: "Campaign Started! 🚀",
        description: `Campaign ${data.campaignId} is running`,
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
        'Phone': b.phone || 'N/A',
        'Address': b.address || 'N/A',
        'City': b.location?.city || b.city || 'N/A',
        'State': b.location?.state || b.state || 'N/A',
        'Country': b.location?.country || b.country || 'N/A',
        'Category': b.category || 'N/A',
        'Rating': b.rating || 'N/A',
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'No Website Businesses');
      XLSX.writeFile(workbook, 'no-website-results.xlsx');
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
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-primary/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">Finding Businesses Without Websites...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto space-y-8 animate-fade-in p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                <Globe className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  No Website Search
                </h1>
                <p className="text-muted-foreground mt-1">Find businesses without websites</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50">
          <CardHeader className="border-b bg-gradient-to-r from-orange-500/5 via-orange-500/3 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">Search Configuration</CardTitle>
                <CardDescription className="mt-1">
                  Find businesses without websites in your target area
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10">
                  <Label htmlFor="location" className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    Location *
                  </Label>
                  <Input
                    id="location"
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
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
                  <Label htmlFor="keywords" className="text-base font-semibold">Niche/Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="restaurants, plumbers, dentists"
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
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
              </div>

              <div className="bg-gradient-to-br from-orange-500/5 to-accent/5 rounded-xl p-5 border border-orange-500/10">
                <h4 className="font-semibold text-base text-foreground flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-orange-500" />
                  Discovery Process
                </h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Search for businesses in your target location</span>
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
                    <span>Identify high-potential prospects</span>
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={isSearching}
                className="w-full gap-2 shadow-lg bg-gradient-to-r from-orange-500 to-orange-500/80 hover:from-orange-500/90 hover:to-orange-500/70 text-white font-bold py-6 text-lg"
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
                {results.data?.map((business: any) => (
                  <div key={business._id} className="p-4 rounded-lg border bg-muted/30">
                    <h4 className="font-semibold text-lg">{business.businessName}</h4>
                    <p className="text-sm text-muted-foreground">{business.category}</p>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><strong>Phone:</strong> {business.phone}</p>
                      <p><strong>Address:</strong> {business.address}</p>
                      <p><strong>Rating:</strong> {business.rating}/5</p>
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