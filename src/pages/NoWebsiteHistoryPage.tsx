import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { noWebsiteApi } from "@/services/api";
import { History, Download, Trash2, Globe, MapPin, Calendar, Users } from "lucide-react";

export default function NoWebsiteHistoryPage() {
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    try {
      const data = await noWebsiteApi.getHistory();
      setSearches(data.searches || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load search history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (searchId: string, searchName: string) => {
    try {
      await noWebsiteApi.downloadSearchFromBackend(searchId, searchName);
      toast({
        title: "Success",
        description: "Download started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Download failed",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (searchId: string) => {
    try {
      await noWebsiteApi.deleteSearch(searchId);
      setSearches(searches.filter(s => s._id !== searchId));
      toast({
        title: "Success",
        description: "Search deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
              <History className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                No Website History
              </h1>
              <p className="text-muted-foreground mt-1">View and manage your previous searches</p>
            </div>
          </div>
        </div>
      </div>

      {searches.length === 0 ? (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50">
          <CardContent className="p-12 text-center">
            <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No searches yet</h3>
            <p className="text-muted-foreground">Start your first no-website search to see results here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {searches.map((search) => (
            <Card key={search._id} className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="border-b bg-gradient-to-r from-orange-500/5 via-orange-500/3 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Globe className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{search.name || `Search ${search._id.slice(-6)}`}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(search.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {search.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {search.resultsCount || 0} results
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={search.status === 'completed' ? 'default' : search.status === 'failed' ? 'destructive' : 'secondary'}>
                      {search.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span><strong>Keywords:</strong> {search.keywords || 'All'}</span>
                      <span><strong>Radius:</strong> {search.radius/1000}km</span>
                      <span><strong>Lead Cap:</strong> {search.leadCap}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {search.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(search._id, search.name || 'search')}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(search._id)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}