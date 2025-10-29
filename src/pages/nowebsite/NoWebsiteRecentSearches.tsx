import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { noWebsiteApi } from "@/services/api";
import { Search, Eye, Trash2, RefreshCw, Users, Download, MapPin, Calendar, CheckCircle2 } from "lucide-react";

interface SearchHistory {
  _id: string;
  city?: string;
  state?: string;
  country?: string;
  radius?: number;
  niche?: string;
  leads?: number;
  resultsCount: number;
  status: string;
  createdAt: string;
}

interface Business {
  _id?: string;
  businessName?: string;
  name: string;
  category?: string;
  phone?: string;
  email?: string;
  ownerName?: string;
  facebookPage?: string;
  rating?: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  niche?: string;
}

const NoWebsiteRecentSearches = () => {
  const [searches, setSearches] = useState<SearchHistory[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedSearch, setSelectedSearch] = useState<SearchHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [showBusinessesDialog, setShowBusinessesDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    setLoading(true);
    try {
      const response = await noWebsiteApi.getRecentSearches(20);
      setSearches(response.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load search history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async (searchId: string) => {
    setBusinessesLoading(true);
    try {
      const response = await noWebsiteApi.getSearchResults(searchId);
      setBusinesses(response.data?.results || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load businesses",
        variant: "destructive"
      });
    } finally {
      setBusinessesLoading(false);
    }
  };

  const handleViewBusinesses = async (search: SearchHistory) => {
    setSelectedSearch(search);
    setShowBusinessesDialog(true);
    await fetchBusinesses(search._id);
  };

  const handleDeleteSearch = async (id: string) => {
    if (!confirm("Delete this search?")) return;
    
    try {
      await noWebsiteApi.deleteSearch(id);
      toast({
        title: "Success",
        description: "Search deleted successfully"
      });
      fetchSearches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete search",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    try {
      // Download all searches combined
      const allBusinesses: Business[] = [];
      for (const search of searches) {
        const response = await noWebsiteApi.getSearchResults(search._id);
        allBusinesses.push(...(response.data?.results || []));
      }
      await noWebsiteApi.downloadSearchExcel('all', allBusinesses);
      toast({
        title: "Success",
        description: "Excel file downloaded"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Download failed",
        variant: "destructive"
      });
    }
  };

  const handleDownloadSearch = async (searchId: string) => {
    try {
      const response = await noWebsiteApi.getSearchResults(searchId);
      const results = response.data?.results || [];
      
      if (results.length === 0) {
        toast({
          title: "No Data",
          description: "No results found for this search",
          variant: "destructive"
        });
        return;
      }
      
      await noWebsiteApi.downloadSearchExcel(searchId, results);
      toast({
        title: "Success",
        description: "Search results downloaded"
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
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Search History
              </h1>
              <p className="text-muted-foreground mt-1">View and manage your past searches</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download All
          </Button>
          <Button onClick={fetchSearches} disabled={loading} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Searches</p>
                <p className="text-3xl font-bold mt-2">{searches.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Search className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold mt-2">
                  {searches.reduce((acc, s) => acc + s.resultsCount, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">
                  {searches.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <CheckCircle2 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            Search History
          </CardTitle>
          <CardDescription className="mt-2">Track and manage all your searches</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Loading...</p>
            </div>
          ) : searches.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No searches yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Niche</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searches.map((search) => (
                  <TableRow key={search._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(search.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {search.city || 'N/A'}{search.state && `, ${search.state}`}, {search.country || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>{search.niche || 'All'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{search.resultsCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={search.status === 'completed' ? 'default' : 'destructive'}>
                        {search.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewBusinesses(search)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadSearch(search._id)}
                          className="gap-1"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSearch(search._id)}
                          className="gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBusinessesDialog} onOpenChange={setShowBusinessesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Search Results</DialogTitle>
            <DialogDescription>
              {selectedSearch && `${selectedSearch.city}, ${selectedSearch.country} - ${selectedSearch.resultsCount} results`}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {businessesLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {businesses.map((business) => (
                  <Card key={business._id}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-lg">{business.name || business.businessName}</h4>
                      {business.category && <p className="text-sm text-muted-foreground">{business.category}</p>}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NoWebsiteRecentSearches;
