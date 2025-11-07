import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, CheckCircle2, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { newDomainApi } from "@/services/api";

const TLD_OPTIONS = ['.com', '.net', '.org', '.io', '.co', '.ai', '.app', '.dev', '.tech', '.store'];

const statusMessages = [
  "Initializing search...",
  "Querying domain registries...",
  "Fetching WHOIS data...",
  "Extracting registrant information...",
  "Processing domain records...",
  "Finalizing results..."
];

export default function NewDomainSearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const [formData, setFormData] = useState({
    keywords: '',
    tlds: ['.com'] as string[],
    daysBack: 7,
    leads: 100
  });

  const addTLD = (tld: string) => {
    if (!formData.tlds.includes(tld)) {
      setFormData(prev => ({ ...prev, tlds: [...prev.tlds, tld] }));
    }
  };

  const removeTLD = (tld: string) => {
    setFormData(prev => ({ ...prev, tlds: prev.tlds.filter(t => t !== tld) }));
  };

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
    
    if (formData.tlds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one TLD",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    setResults([]);
    setSearchId(null);
    setCurrentSearchId(null);

    try {
      const payload: any = {
        tlds: formData.tlds,
        daysBack: formData.daysBack,
        leads: formData.leads
      };
      
      if (formData.keywords?.trim()) {
        payload.keywords = formData.keywords.trim();
      }

      const response = await newDomainApi.scan(payload);

      if (response.success && response.data) {
        setResults(response.data);
        setSearchId(response.searchId);
        if (response.searchId) {
          setCurrentSearchId(response.searchId);
        }
        toast({
          title: "Search Complete! 🎉",
          description: `Found ${response.count || 0} newly registered domains`,
        });
      } else {
        toast({
          title: "No Results",
          description: "No domains found matching your criteria",
        });
      }
    } catch (error: any) {
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
        await newDomainApi.cancelSearch(currentSearchId);
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
      await newDomainApi.downloadSearchExcel(searchId, results);
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
                <p className="text-lg font-semibold text-foreground">Searching for New Domains</p>
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
        <p className="text-muted-foreground">Track newly registered domains</p>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <CardTitle>Search Configuration</CardTitle>
          <CardDescription>Set your domain tracking criteria</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="keywords">Keywords (Optional)</Label>
                <Input 
                  id="keywords" 
                  placeholder="Leave empty to search all new domains by TLD" 
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  disabled={isSearching}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="tld">Top-Level Domains *</Label>
                <Select 
                  onValueChange={addTLD}
                  disabled={isSearching}
                >
                  <SelectTrigger id="tld">
                    <SelectValue placeholder="Select TLDs" />
                  </SelectTrigger>
                  <SelectContent>
                    {TLD_OPTIONS.map(tld => (
                      <SelectItem key={tld} value={tld}>{tld}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {formData.tlds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tlds.map(tld => (
                      <Badge key={tld} variant="secondary" className="gap-1">
                        {tld}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-destructive" 
                          onClick={() => removeTLD(tld)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="daysBack">Days Back *</Label>
                <Select 
                  value={formData.daysBack.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, daysBack: parseInt(value) }))}
                  disabled={isSearching}
                >
                  <SelectTrigger id="daysBack">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="leads">Max Results (1-1000)</Label>
                <Input 
                  id="leads" 
                  type="number"
                  min="1"
                  max="1000"
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
                  <span>Domain name and registration date</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>WHOIS data including registrant information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Contact details (email, phone if available)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Export to Excel for outreach campaigns</span>
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
                <CardDescription>Found {results.length} domains</CardDescription>
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
                    <TableHead>Domain Name</TableHead>
                    <TableHead>TLD</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Registrant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((domain, index) => (
                    <TableRow key={domain._id || index}>
                      <TableCell className="font-medium">{domain.domainName || 'N/A'}</TableCell>
                      <TableCell>{domain.tld || 'N/A'}</TableCell>
                      <TableCell>
                        {domain.registrationDate 
                          ? new Date(domain.registrationDate).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>{domain.registrant?.name || 'N/A'}</TableCell>
                      <TableCell>{domain.registrant?.email || 'N/A'}</TableCell>
                      <TableCell>{domain.registrant?.organization || 'N/A'}</TableCell>
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
