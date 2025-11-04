import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Globe, Sparkles, User, LogOut, Star, Calendar, Building2 } from "lucide-react";

export default function OfferingsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const offerings = [
    {
      id: "legacy-finder",
      title: "Legacy Website Finder",
      description: "Discover businesses with outdated websites and connect with decision-makers",
      icon: Search,
      available: true,
      route: "/legacy"
    },
    {
      id: "no-website",
      title: "Business Without Website Finder + Outreach",
      description: "Find businesses without websites and automated outreach campaigns",
      icon: Globe,
      available: true,
      route: "/no-website"
    },
    {
      id: "low-rating",
      title: "Low Rating Business Finder",
      description: "Find businesses with low ratings and help them improve their reputation",
      icon: Star,
      available: true,
      route: "/low-rating"
    },
    {
      id: "new-domain",
      title: "New Domain Registration Tracker",
      description: "Track newly registered domains and reach out to new businesses early",
      icon: Calendar,
      available: true,
      route: "/new-domain"
    },
    {
      id: "new-business",
      title: "New Business Registration Finder",
      description: "Track newly registered businesses in the last 90 days and extract owner details",
      icon: Building2,
      available: true,
      route: "/new-business"
    },
    {
      id: "domain-scraper",
      title: "Latest Domain Scraper",
      description: "Automatically scrape and track newly registered domains from WhoisXML daily feeds",
      icon: Sparkles,
      available: true,
      route: "/domain-scraper"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-end mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <User className="h-4 w-4" />
                Account
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user.email || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Our AI Agent Offerings
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose an AI agent to supercharge your lead generation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerings.map((offering) => {
            const Icon = offering.icon;
            return (
              <Card
                key={offering.id}
                className={`h-[280px] flex flex-col shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50 transition-all duration-300 ${
                  offering.available
                    ? "hover:shadow-2xl hover:scale-105 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                }`}
                onClick={() => offering.available && offering.route && navigate(offering.route)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-3 rounded-xl ${
                      offering.available
                        ? "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                        : "bg-muted"
                    }`}>
                      <Icon className={`h-6 w-6 ${offering.available ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{offering.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {offering.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {offering.available ? (
                    <div className="text-sm font-semibold text-primary">
                      Click to launch →
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-muted-foreground">
                      Coming Soon
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
