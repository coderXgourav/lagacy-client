import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, History as HistoryIcon, Clock, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function HistoryPage() {
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/search/all`);
      if (response.data.success) {
        setSearches(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      completed: "default",
      processing: "secondary",
      pending: "secondary",
      failed: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };
  return (
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <HistoryIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Search History
              </h1>
              <p className="text-muted-foreground mt-1">Review all your past search operations</p>
            </div>
          </div>
        </div>
        <Button onClick={fetchSearches} variant="outline" className="gap-2">
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">All Searches</CardTitle>
              <CardDescription className="mt-1">Complete history of your lead discovery operations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="text-muted-foreground font-medium">Loading search history...</p>
            </div>
          ) : searches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="p-4 rounded-full bg-muted/50">
                <HistoryIcon className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-muted-foreground">No search history</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Start your first search to see your history here
                </p>
              </div>
              <Link to="/search">
                <Button className="gap-2 mt-4">
                  <Eye className="h-4 w-4" />
                  Create First Search
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-bold">Search Query</TableHead>
                    <TableHead className="font-bold">Location</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold text-center">Leads Found</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searches.map((search) => (
                    <TableRow key={search._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          {search.query}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {search.filters?.city}, {search.filters?.state}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {search.filters?.category || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-bold">
                          {search.resultsCount}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(search.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(search.executedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to="/recent-searches">
                            <Button size="sm" variant="default" className="gap-2">
                              <Eye className="w-4 w-4" />
                              View Leads
                            </Button>
                          </Link>
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
  );
}
