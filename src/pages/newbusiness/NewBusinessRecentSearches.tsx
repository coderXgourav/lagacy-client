import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { newBusinessApi } from "@/services/api";
import { Search, Eye, Trash2, RefreshCw, MapPin, Calendar, Building2 } from "lucide-react";

interface SearchHistory {
  _id: string;
  city?: string;
  state?: string;
  country?: string;
  niche?: string;
  resultsCount: number;
  status: string;
  createdAt: string;
}

interface BusinessResult {
  _id: string;
  businessName: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  niche?: string;
  registrationDate?: string;
}

export default function NewBusinessRecentSearches() {
  const [searches, setSearches] = useState<SearchHistory[]>([]);
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [selectedSearch, setSelectedSearch] = useState<SearchHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

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
      const response = await newBusinessApi.getRecentSearches(limit, page);
      setSearches(response.searches || response.data || []);
      if (response.pagination) {
        setTotalPages(response.pagination.pages);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load recent searches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (searchId: string) => {
    setResultsLoading(true);
    try {
      const response = await newBusinessApi.getSearchResults(searchId);
      setResults(response.data?.results || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load search results",
        variant: "destructive"
      });
    } finally {
      setResultsLoading(false);
    }
  };

  const handleViewResults = async (search: SearchHistory) => {
    setSelectedSearch(search);
    setShowResultsDialog(true);
    await fetchResults(search._id);
  };

  const handleDeleteSearch = async (id: string) => {
    if (!confirm("Delete this search?")) return;
    try {
      await newBusinessApi.deleteSearch(id);
      toast({ title: "Success", description: "Search deleted successfully" });
      fetchSearches();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete search",
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
                New Business History
              </h1>
              <p className="text-muted-foreground mt-1">View your past newly registered business scans</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchSearches} disabled={loading} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Search className="h-5 w-5 text-primary" />
            Recent Searches
          </CardTitle>
          <CardDescription>Track and review your business discovery tasks</CardDescription>
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
                          {search.city || 'N/A'}, {search.country || 'N/A'}
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
                            onClick={() => handleViewResults(search)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
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

      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Search Results: {selectedSearch?.city}, {selectedSearch?.country}</DialogTitle>
            <DialogDescription>
              Found {selectedSearch?.resultsCount} new businesses
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {resultsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((business) => (
                  <Card key={business._id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {business.businessName}
                        </h4>
                        {business.registrationDate && (
                          <span className="text-xs text-muted-foreground">
                            Reg: {new Date(business.registrationDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {business.phone && <p>Phone: {business.phone}</p>}
                        {business.website && <p>Website: {business.website}</p>}
                        {business.address && <p>Address: {business.address}</p>}
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
}
