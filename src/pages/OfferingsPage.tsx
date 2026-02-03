import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Globe,
  Sparkles,
  User,
  LogOut,
  Star,
  Calendar,
  Building2,
  FileText,
  Moon,
  Sun,
  Laptop,
  Upload,
  Users,
  Share2,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function OfferingsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { setTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const offerings = [
    {
      id: "legacy-finder",
      title: "Legacy Website Finder",
      description:
        "Discover businesses with outdated websites and connect with decision-makers",
      icon: Search,
      available: true,
      route: "/legacy",
    },
    {
      id: "no-website",
      title: "Business Without Website Finder + Outreach",
      description:
        "Find businesses without websites and automated outreach campaigns",
      icon: Globe,
      available: true,
      route: "/no-website",
    },
    {
      id: "low-rating",
      title: "Low Rating Business Finder",
      description:
        "Find businesses with low ratings and help them improve their reputation",
      icon: Star,
      available: true,
      route: "/low-rating",
    },
    {
      id: "new-domain",
      title: "New Domain Registration Tracker",
      description:
        "Track newly registered domains and reach out to new businesses early",
      icon: Calendar,
      available: true,
      route: "/new-domain",
      beta: true,
    },
    {
      id: "new-business",
      title: "New Business Registration Finder",
      description:
        "Track newly registered businesses in the last 90 days and extract owner details",
      icon: Building2,
      available: true,
      route: "/new-business",
      beta: true,
    },
    {
      id: "domain-scraper",
      title: "Latest Domain Scraper",
      description:
        "Automatically scrape and track newly registered domains from WhoisXML daily feeds",
      icon: Sparkles,
      available: true,
      route: "/domain-scraper",
      beta: true,
    },
    {
      id: "csv-filter",
      title: "CSV Filter Pro",
      description:
        "Upload large CSV files and filter data by country with instant previews",
      icon: FileText,
      available: true,
      route: "/csv-filter",
    },
    {
      id: "csv-uploader",
      title: "CSV Uploader Pro",
      description:
        "Bulk upload and process CSV files with advanced validation and data transformation",
      icon: Upload,
      available: true,
      route: "/csv-uploader",
    },
    {
      id: "hr-portal",
      title: "HR Portal",
      description:
        "Streamline your human resources, simplify recruitment, and manage employee records efficiently",
      icon: Users,
      available: true,
      route: "/hr-portal",
    },
    {
      id: "social-media",
      title: "Social Media Automation",
      description:
        "Automate your social media presence with intelligent scheduling and multi-platform posting",
      icon: Share2,
      available: true,
      route: "/social-media",
      beta: true,
    },
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
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.email || ""}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Laptop className="h-4 w-4 mr-2" />
                      System
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Our AI Agent Offerings</h1>
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
                className={`h-[280px] flex flex-col shadow-xl border overflow-hidden transition-all duration-300 relative ${
                  offering.available
                    ? "hover:shadow-2xl hover:scale-105 cursor-pointer"
                    : "opacity-60 cursor-not-allowed"
                } ${
                  offering.beta
                    ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800"
                    : "bg-gradient-to-br from-card via-card to-card/50 border-transparent"
                }`}
                onClick={() =>
                  offering.available &&
                  offering.route &&
                  navigate(offering.route)
                }
              >
                {offering.beta && (
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                    >
                      Beta
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-3 rounded-xl ${
                        offering.available
                          ? offering.beta
                            ? "bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                            : "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                          : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${
                          offering.available
                            ? offering.beta
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{offering.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {offering.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {offering.available ? (
                    <div
                      className={`text-sm font-semibold ${offering.beta ? "text-amber-600 dark:text-amber-400" : "text-primary"}`}
                    >
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
