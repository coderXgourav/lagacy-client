import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Search, TrendingUp, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import { newDomainApi } from "@/services/api";
import { calculateAvgResponseTime, formatResponseTime } from "@/utils/dashboardHelpers";

export default function NewDomainDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSearches: 0, domainsFound: 0, avgTime: '--' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await newDomainApi.getRecentSearches(10);
      const searches = response.searches || response.data || [];

      if (searches.length > 0) {
        const avgTime = calculateAvgResponseTime(searches);
        setStats({
          totalSearches: searches.length,
          domainsFound: searches.reduce((sum: number, s: any) => sum + (s.resultsCount || 0), 0),
          avgTime: formatResponseTime(avgTime)
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  return (
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          New Domain Registration Tracker
        </h1>
        <p className="text-muted-foreground text-lg">
          Track newly registered domains and reach out to new businesses early
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Searches</p>
                <p className="text-3xl font-bold mt-2">{stats.totalSearches}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Search className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Domains Found</p>
                <p className="text-3xl font-bold mt-2">{stats.domainsFound}</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold mt-2">{stats.avgTime}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>Track newly registered domains</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Start tracking newly registered domains to find businesses at the perfect time - right when they're setting up their online presence.
              </p>
              <Button onClick={() => navigate("/new-domain/search")} className="w-full gap-2">
                <Search className="h-4 w-4" />
                Start New Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Quick Start Guide</CardTitle>
                <CardDescription>How to use this tool</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Set your search criteria (keywords, TLDs, date range)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Track domains registered in the last 30 days</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Get contact information for domain owners</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Download results and start outreach campaigns</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}