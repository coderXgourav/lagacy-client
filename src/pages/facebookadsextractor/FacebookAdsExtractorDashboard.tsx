import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";
import {
  Facebook,
  Search,
  Mail,
  Phone,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  XCircle,
  Download,
  Loader2,
  Play,
  Sparkles,
  Globe,
  Activity,
  Users
} from "lucide-react";

export default function FacebookAdsExtractorDashboard() {
  const { toast } = useToast();
  const [niche, setNiche] = useState("nike");
  const [country, setCountry] = useState("US");
  const [activeStatus, setActiveStatus] = useState("active");
  const [contactType, setContactType] = useState("email");
  const [limit, setLimit] = useState("5");
  const [loading, setLoading] = useState(false);

  const [searches, setSearches] = useState<any[]>([]);
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const [activeSearch, setActiveSearch] = useState<any | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Poll active search if it is processing or pending
  const [pollTrigger, setPollTrigger] = useState(0);

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  useEffect(() => {
    if (selectedSearchId) {
      fetchSearchResults(selectedSearchId);
    }
  }, [selectedSearchId, pollTrigger]);

  // Periodic polling for active processing searches
  useEffect(() => {
    const hasActiveSearch = searches.some(
      (s) => s.status === "processing" || s.status === "pending"
    );

    if (hasActiveSearch || (activeSearch && (activeSearch.status === "processing" || activeSearch.status === "pending"))) {
      const interval = setInterval(() => {
        setPollTrigger((prev) => prev + 1);
        fetchRecentSearches(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [searches, activeSearch]);

  const fetchRecentSearches = async (silent = false) => {
    try {
      const response = await api.facebookAdsExtractor.getRecentSearches(1, 20);
      const searchList = response.searches || response.data || [];
      setSearches(searchList);
      
      // If no search is selected, auto-select the latest one
      if (!selectedSearchId && searchList.length > 0) {
        setSelectedSearchId(searchList[0]._id);
      }
    } catch (error: any) {
      if (!silent) {
        toast({
          variant: "destructive",
          title: "Failed to fetch search history",
          description: error.message || "An error occurred",
        });
      }
    }
  };

  const fetchSearchResults = async (searchId: string) => {
    setLoadingLeads(true);
    try {
      const response = await api.facebookAdsExtractor.getSearchResults(searchId);
      if (response.success && response.data) {
        setActiveSearch(response.data.search);
        setLeads(response.data.results || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch search results:", error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !country) {
      toast({
        variant: "destructive",
        title: "Required Fields",
        description: "Please specify both niche and country.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.facebookAdsExtractor.scan({
        niche,
        country,
        activeStatus,
        contactType,
        limit: parseInt(limit) || 5,
      });

      if (response.success && response.searchId) {
        toast({
          title: "Scan Initiated",
          description: "Scraping pipeline is running in the background.",
        });
        setSelectedSearchId(response.searchId);
        await fetchRecentSearches();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to trigger scan",
        description: error.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = async (searchId: string) => {
    try {
      const response = await api.facebookAdsExtractor.cancelSearch(searchId);
      if (response.success) {
        toast({
          title: "Scan Cancelled",
          description: "The pipeline has been requested to stop.",
        });
        fetchRecentSearches();
        if (selectedSearchId === searchId) {
          fetchSearchResults(searchId);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel running search",
      });
    }
  };

  const handleDeleteScan = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this scan and all of its leads?")) return;

    try {
      const response = await api.facebookAdsExtractor.deleteSearch(searchId);
      if (response.success) {
        toast({
          title: "Scan Deleted",
          description: "Search scan history and leads cleared.",
        });
        if (selectedSearchId === searchId) {
          setSelectedSearchId(null);
          setActiveSearch(null);
          setLeads([]);
        }
        fetchRecentSearches();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "An error occurred",
      });
    }
  };

  const handleExportExcel = async () => {
    if (leads.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Empty",
        description: "No leads available to export.",
      });
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const dataToExport = leads.map((l) => ({
        "Page Name": l.pageName || "N/A",
        "Ad Archive ID": l.adArchiveID || "N/A",
        "Page Category": l.pageCategory || "N/A",
        "Ad Status": l.adStatus || "N/A",
        "Likes": l.likes || l.pageLikes || 0,
        "Followers": l.followers || 0,
        "Facebook URL": l.facebookUrl || "N/A",
        "Website": l.website || "N/A",
        "Intro": l.intro || "N/A",
        "Page Email": l.email || "N/A",
        "Scraped Emails": l.scrapedEmails ? l.scrapedEmails.join(", ") : "N/A",
        "Scraped Phones": l.scrapedPhones ? l.scrapedPhones.join(", ") : "N/A",
        "Ad Library URL": l.adLibraryURL || "N/A",
        "Ad Text": l.adText || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Facebook Ads Leads");
      XLSX.writeFile(
        workbook,
        `fb-ads-leads-${activeSearch?.niche}-${activeSearch?.country}-${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast({
        title: "Export Success",
        description: "Lead entries downloaded as Excel spreadsheet.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message || "Failed to generate Excel file",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Completed</Badge>;
      case "processing":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1 flex items-center w-fit">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing
          </Badge>
        );
      case "pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Pending</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeadStatusBadge = (status: string) => {
    switch (status) {
      case "enriched":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Enriched</Badge>;
      case "fb_details_found":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">FB Details Scraped</Badge>;
      case "discovered":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Ad Scraped</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeScansCount = searches.filter(
    (s) => s.status === "processing" || s.status === "pending"
  ).length;

  const totalLeadsCount = leads.length;
  const enrichedLeadsCount = leads.filter((l) => l.status === "enriched").length;

  return (
    <div className="container mx-auto space-y-6 p-6 max-w-7xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
            <Facebook className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            Facebook Ads Lead Extractor
          </h1>
          <p className="text-muted-foreground text-md mt-1">
            Autonomously extract leads: Meta Ads Library &rarr; Facebook Page Metadata &rarr; Website Contacts.
          </p>
        </div>
        {activeSearch && (
          <Button
            onClick={handleExportExcel}
            className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md gap-2"
          >
            <Download className="w-4 h-4" /> Export Excel
          </Button>
        )}
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card via-card to-indigo-50/10 dark:to-indigo-950/10 border-indigo-200/50 dark:border-indigo-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Scans</p>
              <p className="text-3xl font-extrabold mt-1">{searches.length}</p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full">
              <Search className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-amber-50/10 dark:to-amber-950/10 border-amber-200/50 dark:border-amber-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Scans</p>
              <p className="text-3xl font-extrabold mt-1 text-amber-600 dark:text-amber-500">{activeScansCount}</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-500 rounded-full">
              <Activity className={`w-5 h-5 ${activeScansCount > 0 ? "animate-pulse" : ""}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-blue-50/10 dark:to-blue-950/10 border-blue-200/50 dark:border-blue-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Found</p>
              <p className="text-3xl font-extrabold mt-1 text-blue-600 dark:text-blue-500">{totalLeadsCount}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-emerald-50/10 dark:to-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enriched Leads</p>
              <p className="text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-500">{enrichedLeadsCount}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Extractor controls & Search history */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg border border-border bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-500" />
                Run Extractor Scan
              </CardTitle>
              <CardDescription>Configure search params and launch.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartScan} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Niche Keyword</label>
                  <Input
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. nike, dental, lawyer"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Country Code (ISO)</label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="US, GB, CA, AU"
                    className="h-9 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Active Status</label>
                  <Select value={activeStatus} onValueChange={setActiveStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="all">All Ads</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Contact Preference</label>
                  <Select value={contactType} onValueChange={setContactType}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone Number">Phone Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Results limit</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="h-9"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-md gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {loading ? "Launching..." : "Collect Ads Leads"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search History */}
          <Card className="shadow-lg border border-border h-[320px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Search Log History</span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {searches.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-2">
              {searches.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-12">
                  No scan history found.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {searches.map((s) => (
                    <div
                      key={s._id}
                      onClick={() => setSelectedSearchId(s._id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col gap-1 transition-all duration-200 ${
                        selectedSearchId === s._id
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800"
                          : "hover:bg-muted border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="capitalize text-foreground truncate max-w-[120px]">
                          {s.niche} ({s.country})
                        </span>
                        <div className="flex items-center gap-1">
                          {s.status === "processing" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 text-red-500 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelScan(s._id);
                              }}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 text-muted-foreground hover:text-red-500"
                            onClick={(e) => handleDeleteScan(s._id, e)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Limit: {s.limit}</span>
                        {getStatusBadge(s.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leads Details Panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-lg border border-border min-h-[500px] flex flex-col">
            <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Processed Lead Details
                </CardTitle>
                {activeSearch && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>
                      Showing results for keyword{" "}
                      <span className="font-bold text-foreground">
                        "{activeSearch.niche}"
                      </span>{" "}
                      in{" "}
                      <span className="font-bold text-foreground">
                        {activeSearch.country}
                      </span>
                    </span>
                    {getStatusBadge(activeSearch.status)}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              {loadingLeads && leads.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-sm text-muted-foreground">Retrieving scraped leads...</span>
                  </div>
                </div>
              ) : leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-[400px] p-6">
                  <Facebook className="w-16 h-16 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-semibold">No Leads Available</p>
                  <p className="text-xs max-w-sm mt-1">
                    Select a scan run from search history on the left, or input query parameters to kick off a new collection run.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[220px]">Company Name</TableHead>
                        <TableHead className="w-[180px]">Facebook Page</TableHead>
                        <TableHead className="w-[200px]">Website</TableHead>
                        <TableHead className="w-[200px]">Scraped Contacts</TableHead>
                        <TableHead className="w-[120px]">Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead._id} className="hover:bg-muted/30">
                          <TableCell className="align-top py-4">
                            <div className="font-bold text-foreground">{lead.pageName}</div>
                            {lead.pageCategory && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {lead.pageCategory}
                              </div>
                            )}
                            {lead.adArchiveID && (
                              <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono mt-1">
                                Ad ID: {lead.adArchiveID}
                              </div>
                            )}
                            {lead.adText && (
                              <div className="text-[10px] text-muted-foreground mt-2 line-clamp-2 italic bg-muted/40 p-1.5 rounded border">
                                "{lead.adText}"
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="align-top py-4">
                            <div className="space-y-1">
                              {(lead.likes > 0 || lead.pageLikes > 0) && (
                                <div className="text-xs text-foreground font-semibold">
                                  Likes: {(lead.likes || lead.pageLikes).toLocaleString()}
                                </div>
                              )}
                              {lead.followers > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Followers: {lead.followers.toLocaleString()}
                                </div>
                              )}
                              {lead.facebookUrl ? (
                                <a
                                  href={lead.facebookUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-500 hover:underline flex items-center gap-1 mt-1 font-semibold"
                                >
                                  <Facebook className="w-3.5 h-3.5" /> View FB Page
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No Page Url</span>
                              )}
                              {lead.adLibraryURL && (
                                <a
                                  href={lead.adLibraryURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1 font-semibold mt-1"
                                >
                                  <Globe className="w-3 h-3" /> View Ad Library
                                </a>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="align-top py-4">
                            {lead.website ? (
                              <div className="space-y-1.5">
                                <a
                                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-500 hover:underline font-bold break-all flex items-center gap-1"
                                >
                                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                                  {lead.website}
                                </a>
                                {lead.email && (
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 break-all">
                                    <Mail className="w-3 h-3 flex-shrink-0 text-muted-foreground/70" />
                                    {lead.email}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No website URL</span>
                            )}
                          </TableCell>

                          <TableCell className="align-top py-4">
                            <div className="space-y-1.5">
                              {/* Scraped Emails */}
                              {lead.scrapedEmails && lead.scrapedEmails.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Scraped Emails:
                                  </div>
                                  <div className="flex flex-col gap-1 pl-1">
                                    {lead.scrapedEmails.map((email: string, idx: number) => (
                                      <span key={idx} className="text-xs font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40 w-fit break-all">
                                        {email}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {/* Scraped Phones */}
                              {lead.scrapedPhones && lead.scrapedPhones.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Scraped Phones:
                                  </div>
                                  <div className="flex flex-col gap-1 pl-1">
                                    {lead.scrapedPhones.map((phone: string, idx: number) => (
                                      <span key={idx} className="text-xs font-mono bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/40 w-fit">
                                        {phone}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {/* Fallbacks */}
                              {(!lead.scrapedEmails || lead.scrapedEmails.length === 0) &&
                               (!lead.scrapedPhones || lead.scrapedPhones.length === 0) && (
                                <div className="text-xs text-muted-foreground italic">
                                  {lead.status === "enriched"
                                    ? "No direct contact found on website"
                                    : "Scraping pending..."}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="align-top py-4">
                            <div className="flex flex-col gap-2">
                              {getLeadStatusBadge(lead.status)}
                              
                              {/* Small visual pipeline steps representation */}
                              <div className="flex items-center gap-1 mt-1 bg-muted/20 p-1.5 rounded border w-fit">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    lead.status === "discovered" ||
                                    lead.status === "fb_details_found" ||
                                    lead.status === "enriched"
                                      ? "bg-amber-500"
                                      : "bg-muted"
                                  }`}
                                  title="Ad Discovered"
                                />
                                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    lead.status === "fb_details_found" || lead.status === "enriched"
                                      ? "bg-blue-500"
                                      : "bg-muted"
                                  }`}
                                  title="FB Info Fetched"
                                />
                                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    lead.status === "enriched" ? "bg-emerald-500" : "bg-muted"
                                  }`}
                                  title="Website Contacts Scraped"
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
