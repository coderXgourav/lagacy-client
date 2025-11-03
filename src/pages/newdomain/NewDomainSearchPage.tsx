import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, CheckCircle2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { newDomainApi } from "@/services/api";

const TLD_OPTIONS = ['.com', '.net', '.org', '.io', '.co', '.ai', '.app', '.dev', '.tech', '.store'];

export default function NewDomainSearchPage() {
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

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

    try {
      const response = await newDomainApi.scan({
        keywords: formData.keywords,
        tlds: formData.tlds,
        daysBack: formData.daysBack,
        leads: formData.leads
      });

      toast({
        title: "Search Complete! 🎉",
        description: `Found ${response.count || 0} newly registered domains`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Search failed",
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
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold">Searching for new domains...</p>
        </div>
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
                <Label htmlFor="keywords">Keywords *</Label>
                <Input 
                  id="keywords" 
                  placeholder="e.g., tech, shop, consulting" 
                  value={formData.keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                  required 
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
                <Label htmlFor="leads">Max Results (1-500)</Label>
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
    </div>
    </>
  );
}
