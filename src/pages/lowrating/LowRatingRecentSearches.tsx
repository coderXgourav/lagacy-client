import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, Trash2, RefreshCw, Users, Download, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { lowRatingApi } from "@/services/api";

interface SearchHistory {
  _id: string;
  city?: string;
  state?: string;
  country?: string;
  radius?: number;
  niche?: string;
  maxRating?: number;
  leads?: number;
  resultsCount: number;
  status: string;
  createdAt: string;
}

interface Business {
  _id?: string;
  businessName?: string;
  name: string;
  rating?: number;
  totalReviews?: number;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  niche?: string;
}

const LowRatingRecentSearches = () => {
  const [searches, setSearches] = useState<SearchHistory[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedSearch, setSelectedSearch] = useState<SearchHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [showBusinessesDialog, setShowBusinessesDialog] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const { toast } = useToast();

  useEffect(() => {
    fetchSearches();
  }, [page]);

  const fetchSearches = async () => {
    setLoading(true);
    try {
      const response = await lowRatingApi.getRecentSearches(limit, page);
      console.log('Recent searches response:', response);
      const searchesData = response.searches || response.data || [];
      setSearches(searchesData);

      if (response.pagination) {
        setTotalPages(response.pagination.pages);
      }
    } catch (error: any) {
      console.error('Fetch searches error:', error);
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
      const response = await lowRatingApi.getSearchResults(searchId);
      console.log('=== FETCH BUSINESSES DEBUG ===');
      console.log('Full response:', JSON.stringify(response, null, 2));

      let businessesData = [];
      if (Array.isArray(response.businesses)) {
        businessesData = response.businesses;
        console.log('Using response.businesses');
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        businessesData = response.data.results;
        console.log('Using response.data.results');
      } else if (response.data?.businesses && Array.isArray(response.data.businesses)) {
        businessesData = response.data.businesses;
        console.log('Using response.data.businesses');
      } else if (Array.isArray(response.data)) {
        businessesData = response.data;
        console.log('Using response.data as array');
      } else {
        console.error('Could not find businesses array in response');
      }

      console.log('Final businesses array:', businessesData);
      console.log('Businesses count:', businessesData.length);
      setBusinesses(businessesData);
    } catch (error: any) {
      console.error('Fetch businesses error:', error);
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
      await lowRatingApi.deleteSearch(id);
      toast({
        title: "Success",
        description: "Search deleted successfully"
      });
      fetchSearches();
    } catch (error: any) {
      console.error('Delete search error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete search",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    try {
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
      const response = await lowRatingApi.getSearchResults(searchId);
      console.log('=== DOWNLOAD DEBUG ===');
      console.log('Full response:', JSON.stringify(response, null, 2));

      let businessesData = [];
      if (Array.isArray(response.businesses)) {
        businessesData = response.businesses;
        console.log('Using response.businesses');
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        businessesData = response.data.results;
        console.log('Using response.data.results');
      } else if (response.data?.businesses && Array.isArray(response.data.businesses)) {
        businessesData = response.data.businesses;
        console.log('Using response.data.businesses');
      } else if (Array.isArray(response.data)) {
        businessesData = response.data;
        console.log('Using response.data as array');
      } else {
        console.error('Could not find businesses array in response');
      }

      console.log('Businesses to download:', businessesData.length);

      if (!businessesData || businessesData.length === 0) {
        toast({
          title: "No Data",
          description: "No businesses to download",
          variant: "destructive"
        });
        return;
      }

      await lowRatingApi.downloadSearchExcel(searchId, businessesData);
      toast({
        title: "Success",
        description: `Downloaded ${businessesData.length} businesses`
      });
    } catch (error: any) {
      console.error('Download error:', error);
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
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Radius</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Max Rating</TableHead>
                    <TableHead>Leads</TableHead>
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
                      <TableCell>{search.country || 'N/A'}</TableCell>
                      <TableCell>{search.state || 'N/A'}</TableCell>
                      <TableCell>{search.city || 'N/A'}</TableCell>
                      <TableCell>{search.radius ? `${search.radius / 1000}km` : 'N/A'}</TableCell>
                      <TableCell>{search.niche || 'All'}</TableCell>
                      <TableCell>⭐ {search.maxRating || '< 3.0'}</TableCell>
                      <TableCell>{search.leads || 200}</TableCell>
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
              <div className="flex items-center justify-end space-x-2 py-4 border-t mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </>
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
                <p className="mt-2 text-muted-foreground">Loading businesses...</p>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">No businesses found</p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {businesses.map((business, idx) => (
                  <Card key={business._id || idx}>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-lg">{business.businessName || business.name}</h4>
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

export default LowRatingRecentSearches;
