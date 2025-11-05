import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Database, Calendar, TrendingUp, Download, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { domainScraperApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function DomainScraperDashboard() {
  const [stats, setStats] = useState({
    totalDomains: 0,
    dateStats: [] as Array<{ date: string; count: number }>
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await domainScraperApi.getDashboardStats();
      setStats({
        totalDomains: data.totalDomains || 0,
        dateStats: data.dateStats || []
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDomainsByDate = async (date: string, pageNum: number) => {
    try {
      setLoadingDomains(true);
      const data = await domainScraperApi.getDomainsByDate(date, pageNum);
      setDomains(data.domains || []);
      setPagination(data.pagination);
    } catch (error: any) {
      console.error('Failed to fetch domains:', error);
      toast({
        title: "Error",
        description: "Failed to load domains",
        variant: "destructive"
      });
    } finally {
      setLoadingDomains(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDomainsByDate(selectedDate, page);
    }
  }, [selectedDate, page]);

  const handleDownload = async () => {
    try {
      await domainScraperApi.downloadAllDomains();
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

  const handleTriggerScrape = async () => {
    try {
      setTriggering(true);
      await domainScraperApi.triggerScrape();
      toast({
        title: "Scraping Started",
        description: "Domain scraping has been triggered in the background",
      });
      // Refresh dashboard after a delay
      setTimeout(() => {
        fetchDashboardData();
      }, 5000);
    } catch (error: any) {
      toast({
        title: "Failed to Start Scraping",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Auto-scraped domain leads</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleTriggerScrape} 
            disabled={triggering}
            variant="outline"
            className="gap-2"
          >
            <Play className="w-4 h-4" />
            {triggering ? "Starting..." : "Run Scraper"}
          </Button>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            Download All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{loading ? "..." : stats.totalDomains.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">All scraped domains</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Domains by Date</CardTitle>
              <CardDescription>Click a date to view domains</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : stats.dateStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No domains scraped yet</p>
              <p className="text-sm mt-2">Check settings to trigger scraping</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {stats.dateStats.map((stat) => (
                <Card
                  key={stat.date}
                  className={`cursor-pointer hover:shadow-lg transition-all ${
                    selectedDate === stat.date ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedDate(stat.date);
                    setPage(1);
                  }}
                >
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-semibold mb-1">{stat.date}</p>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-xs text-muted-foreground">domains</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Domains for {selectedDate}</CardTitle>
                  <CardDescription>
                    {pagination ? `${pagination.total} total domains` : 'Loading...'}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDomains ? (
              <div className="text-center py-8 text-muted-foreground">Loading domains...</div>
            ) : domains.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No domains found</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain Name</TableHead>
                        <TableHead>TLD</TableHead>
                        <TableHead>Registration Date</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {domains.map((domain, index) => (
                        <TableRow key={domain._id || index}>
                          <TableCell className="font-medium">{domain.domainName || 'N/A'}</TableCell>
                          <TableCell>{domain.tld || 'N/A'}</TableCell>
                          <TableCell>
                            {domain.registrationDate 
                              ? new Date(domain.registrationDate).toLocaleDateString()
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-1 rounded bg-primary/10">
                              {domain.enrichmentSource || 'CSV'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
