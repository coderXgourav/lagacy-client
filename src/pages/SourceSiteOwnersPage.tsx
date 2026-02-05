import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Globe, Calendar, MapPin, ExternalLink, Building2, Loader2, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DomainResult {
  D: string; // Domain
  FI: number; // First Indexed (timestamp)
  LI: number; // Last Indexed (timestamp)
  LOS: string[]; // List of Subdomains
  Q: number;
  A: number;
  U: number;
  M: number;
  SKU?: number;
  F?: number;
  E?: number;
  Country?: string;
  FD: number; // First Detected
  LD: number; // Last Detected
  S: number;
  R: number;
}

interface BuiltWithResponse {
  NextOffset: string;
  Results: DomainResult[];
}

const BUILTWITH_API_KEY = "a715412d-69e8-4c14-a31f-4a465f28c8df";

type DateRange = "7days" | "30days" | "90days" | "1year" | "all";
type CountryFilter = "all" | "US" | "CA" | "GB" | "AU" | "IN" | "DE";

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "90days", label: "Last 90 Days" },
  { value: "1year", label: "Last Year" },
  { value: "all", label: "All Time" },
];

const COUNTRY_OPTIONS: { value: CountryFilter; label: string }[] = [
  { value: "all", label: "All Countries" },
  { value: "US", label: "🇺🇸 USA" },
  { value: "CA", label: "🇨🇦 Canada" },
  { value: "GB", label: "🇬🇧 United Kingdom" },
  { value: "AU", label: "🇦🇺 Australia" },
  { value: "IN", label: "🇮🇳 India" },
  { value: "DE", label: "🇩🇪 Germany" },
];

const formatDate = (timestamp: number): string => {
  if (!timestamp) return "N/A";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isInDateRange = (timestamp: number, range: DateRange): boolean => {
  if (range === "all") return true;
  
  const now = Date.now() / 1000;
  const daysMap: Record<DateRange, number> = {
    "7days": 7,
    "30days": 30,
    "90days": 90,
    "1year": 365,
    "all": 0,
  };
  
  const cutoff = now - daysMap[range] * 24 * 60 * 60;
  return timestamp >= cutoff;
};

export default function SourceSiteOwnersPage() {
  const navigate = useNavigate();
  const [selectedTech, setSelectedTech] = useState<"Shopify" | "WordPress">("WordPress");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const { data, isLoading, error } = useQuery<BuiltWithResponse>({
    queryKey: ["builtwith-tech-list", selectedTech],
    queryFn: async () => {
      const response = await fetch(
        `https://api.builtwith.com/lists12/api.json?KEY=${BUILTWITH_API_KEY}&TECH=${selectedTech}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch technology data");
      }
      
      return response.json();
    },
  });

  // Extract unique countries from API data (filter out undefined/null/empty)
  const availableCountries = Array.from(
    new Set(
      data?.Results
        ?.map(d => d.Country)
        .filter((c): c is string => Boolean(c) && c.trim() !== "") || []
    )
  ).sort();

  // Log for debugging
  console.log("Total domains:", data?.Results?.length);
  console.log("Available countries:", availableCountries);

  // Filter domains based on date range and country
  const filteredDomains = data?.Results?.filter((domain) => {
    // Date filter
    const matchesDate = isInDateRange(domain.FD, dateRange);
    
    // Country filter - if "all" or no countries available, show all
    // Only filter by country if user selected a specific country AND the domain has country data
    let matchesCountry = true;
    if (countryFilter !== "all") {
      // Only filter out domains without country if the API has some country data
      matchesCountry = domain.Country === countryFilter;
    }
    
    return matchesDate && matchesCountry;
  }) || [];

  const allDomains = data?.Results || [];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/offerings")}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Offerings
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Source Existing Site Owners</h1>
            <p className="text-muted-foreground mt-2">
              Discover websites built with {selectedTech} and connect with their owners
            </p>
          </div>
        </div>

        <Card className="border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Technology Filter
            </CardTitle>
            <CardDescription>
              Select a technology to find websites built with it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={selectedTech} onValueChange={(v) => setSelectedTech(v as "Shopify" | "WordPress")}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="Shopify">
                  Shopify Sites
                </TabsTrigger>
                <TabsTrigger value="WordPress">
                  WordPress Sites
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Date Range Filter */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filters:</span>
              </div>
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Country Filter - only show if API returns country data */}
              {availableCountries.length > 0 ? (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {availableCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Country filter N/A
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            Error fetching data. Please try again later.
          </div>
        )}

        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading {selectedTech} websites...
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {data?.Results && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">
                  {selectedTech} Websites
                </h2>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {filteredDomains.length} found
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  {allDomains.length} total in database
                </Badge>
              </div>
            </div>

            {filteredDomains.length === 0 && allDomains.length > 0 && (
              <div className="text-center py-8 bg-muted/20 rounded-lg">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No {selectedTech} sites created in the selected date range.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try expanding the date range or selecting "All Time".
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDomains.map((domain, index) => {
                const isRecent = isInDateRange(domain.FD, "7days");
                return (
                  <Card 
                    key={index} 
                    className={`overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                      isRecent ? "border-green-500/30 bg-green-500/5" : ""
                    }`}
                    onClick={() => window.open(`https://${domain.D}`, "_blank")}
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Globe className="h-5 w-5 text-primary shrink-0" />
                            <h3 className="font-semibold text-base truncate" title={domain.D}>
                              {domain.D}
                            </h3>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>

                        {isRecent && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            🆕 New (Last 7 Days)
                          </Badge>
                        )}

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {formatDate(domain.FD)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Last Seen: {formatDate(domain.LD)}</span>
                          </div>
                          {domain.Country && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>Country: {domain.Country}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {domain.SKU && domain.SKU > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {domain.SKU} SKUs
                            </Badge>
                          )}
                          {domain.F && domain.F > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {domain.F.toLocaleString()} followers
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {allDomains.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {selectedTech} websites found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
