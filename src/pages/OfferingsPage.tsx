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
  TrendingUp,
  Activity,
  Zap,
  Youtube,
  FileSpreadsheet,
  Mail,
  PhoneCall,
  Filter,
  Facebook,
  Video,
  MapPin,
  DollarSign,
  MessageCircle,
  Linkedin,
  Smartphone
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
      title: "email+ call flow",
      description:
        "Upload CSV files for automated email and call using vapi ai",
      icon: Upload,
      available: true,
      route: "/csv-uploader",
    },
    {
      id: "csv-marketing-uploader",
      title: "Email Buster",
      description:
        "CSV Marketing Uploader-Upload the CSV or Excel files with full bulk processing",
      icon: Upload,
      available: true,
      route: "/csv-marketing-uploader",
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
      id: "kyptronix-form",
      title: "Kyptronix Form",
      description: "All four form data",
      icon: FileText,
      available: true,
      route: "/kyptronix-form",
    },
    {
      id: "json-converter",
      title: "JSON to Excel/CSV Pro",
      description: "Instantly convert raw JSON data or API responses into professional spreadsheets.",
      icon: FileSpreadsheet,
      available: true,
      route: "/json-converter",
    },
    {
      id: "email-campaign-whisper",
      title: "Email Campaign for Whisper Paddles",
      description: "Automated email outreach and campaign management for Whisper Paddles.",
      icon: Mail,
      available: true,
      route: "/whisper-campaign",
      beta: true,
    },
    {
      id: "email-campaign-growth",
      title: "Email Campaign for Growth Optimizers",
      description: "Automated email outreach and campaign management for Growth Optimizers.",
      icon: Sparkles,
      available: true,
      route: "/growth-campaign",
      beta: true,
    },
    {
      id: "csv-phone-formatter",
      title: "CSV Phone Formatter Pro",
      description: "Cleanse, filter, and format phone numbers in bulk. Prepend country codes (e.g. +91) and remove invalid or non-10 digit numbers.",
      icon: PhoneCall,
      available: true,
      route: "/csv-phone-formatter",
      beta: true,
    },
    {
      id: "csv-mobile-filter",
      title: "CSV Mobile/Telephone Filter Pro",
      description: "Separate mobile numbers from landline/telephone numbers in bulk. Custom presets and filters to isolate leads easily.",
      icon: Filter,
      available: true,
      route: "/csv-mobile-filter",
      beta: true,
    },
    {
      id: "csv-active-checker",
      title: "Active Phone Checker Pro",
      description: "Bulk verify if phone numbers are active, valid, and trace their carrier network/line type dynamically.",
      icon: PhoneCall,
      available: true,
      route: "/csv-active-checker",
      beta: true,
    },
    {
      id: "google-maps-scraper",
      title: "Google Maps Scraper",
      description: "Scrape business leads from Google Maps in bulk. Search by keyword and location — extract name, phone, address, website, rating, and more.",
      icon: MapPin,
      available: true,
      route: "/google-maps-scraper",
      beta: true,
    },
    {
      id: "revenue-intelligence",
      title: "Revenue Intelligence & Lead Generation",
      description: "Full-cycle lead generation: company discovery, decision maker enrichment, buying signal scoring, AI personalization, and automated outreach sequences — 20 qualified meetings/day.",
      icon: TrendingUp,
      available: true,
      route: "/revenue-intelligence",
      beta: true,
    },
    {
      id: "b2b-campaign",
      title: "B2B Campaign Intelligence",
      description: "Fill campaign form → Apollo finds companies & decision makers → Lusha enriches contacts → MillionVerifier validates emails → PageSpeed scores websites → qualified leads scored and exported.",
      icon: Users,
      available: true,
      route: "/b2b-campaign",
      beta: true,
    },
    {
      id: "kyptronix-product-hunt",
      title: "Kyptronix Product Hunt Lead Generation",
      description: "Cron Trigger → Product Hunt API/Apify → Website Enrichment → Email & Phone Discovery → LinkedIn Discovery → AI Lead Scoring → CRM → Email Outreach → LinkedIn Outreach → Follow-ups.",
      icon: Zap,
      available: true,
      route: "/kyptronix-workflow-ph",
      beta: true,
    },
    {
      id: "facebook-b2b-campaign",
      title: "Facebook Pages B2B Lead Generation",
      description: "Generate 200–500 qualified B2B leads/day under $100/mo without Google Maps. FB Pages Scraper → Deduplication → Web Crawl → LinkedIn Comp/People → Enrichment → Verification → Tech Stack check → AI scoring → CRM push.",
      icon: Facebook,
      available: true,
      route: "/facebook-b2b-campaign",
      beta: true,
    },
    {
      id: "website-intelligence-checker",
      title: "Website Signal Checker",
      description: "Upload a sheet of businesses → Website Audit (real PageSpeed score, load time, flagged issues) → Tech Stack Detection → Meta + Google Ads Check → Google Business Profile Lookup → Social Media Crawl → download the sheet back with it all added.",
      icon: Activity,
      available: true,
      route: "/website-intelligence-checker",
      beta: true,
    },
    {
      id: "email-finder",
      title: "Email Finder",
      description: "Select a Niche, Country, and City → real businesses via Google Maps → real emails via Hunter.io (falls back to Prospeo) → download as CSV.",
      icon: Mail,
      available: true,
      route: "/email-finder",
      beta: true,
    },
    {
      id: "funding-lead-agent",
      title: "Funding Lead Agent",
      description: "Discover businesses actively raising funding — no Google Search or Maps. Company Discovery (Crunchbase) → LinkedIn Company → LinkedIn People → News → Job Signals → Website Crawl → Contact Discovery → Mobile Enrichment → AI Analysis → Lead Score → Google Drive Export. Verified mobile only.",
      icon: DollarSign,
      available: true,
      route: "/funding-lead-agent",
      beta: true,
    },
    {
      id: "whatsapp-outreach",
      title: "WhatsApp Outreach Workflow",
      description: "Upload a CSV and run real bulk WhatsApp outreach via the official WhatsApp Business Cloud API — clean & validate, check phone format, dedupe, batch, pace with random delays, personalize, send, save status, and retry failures.",
      icon: MessageCircle,
      available: true,
      route: "/whatsapp-outreach",
      beta: true,
    },
    {
      id: "linkedin-connect",
      title: "LinkedIn Connect Workflow",
      description: "Upload a CSV of emails, resolve real LinkedIn profiles (Prospeo), validate them (Apify), and send real connection requests via PhantomBuster — with a hard daily cap and randomized delays enforced. Real ToS/ban risk — read the in-app warning before using.",
      icon: Linkedin,
      available: true,
      route: "/linkedin-connect",
      beta: true,
    },
    {
      id: "mobile-lead-agent",
      title: "Mobile Lead Agent",
      description: "Generate qualified mobile-app leads (US, Canada, UK, Australia) — no Google Search or Maps. Yellow Pages Discovery → LinkedIn Company → LinkedIn People → Job Signals → Website Crawl (tech stack + app-store detection) → Mobile Enrichment (hard gate) → AI Analysis → Lead Score (80+ only) → Drive XLSX Export → on-demand CEO PDF Summary.",
      icon: Smartphone,
      available: true,
      route: "/mobile-lead-agent",
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
                className={`h-[280px] flex flex-col shadow-xl border overflow-hidden transition-all duration-300 relative ${offering.available
                  ? "hover:shadow-2xl hover:scale-105 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
                  } ${offering.beta
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
                      className={`p-3 rounded-xl ${offering.available
                        ? offering.beta
                          ? "bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                          : "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
                        : "bg-muted"
                        }`}
                    >
                      <Icon
                        className={`h-6 w-6 ${offering.available
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
