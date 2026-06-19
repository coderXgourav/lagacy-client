import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import api from "@/services/api";
import {
  Facebook,
  Search,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  XCircle,
  Download,
  Loader2,
  Play,
  Sparkles,
  Globe,
  Activity,
  Users,
  Copy,
  Check,
  MessageSquare,
  Eye,
  FileText
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const opportunitySignalDefinitions = [
  { key: "adRun30Days", label: "Ad run continuously 30+ days", points: 8, desc: "Sustained spend, not a one-off test" },
  { key: "multipleCreatives", label: "2+ active creatives", points: 6, desc: "Real testing budget, mid-funnel sophistication" },
  { key: "multipleAdIds", label: "Multiple Ad IDs live", points: 5, desc: "Confirms ongoing, deliberate spend" },
  { key: "genericCta", label: "Generic Call-to-Action", points: 7, desc: "Direct copywriting gap you can sell into" },
  { key: "genericTemplate", label: "Generic template/stock-photo", points: 5, desc: "Creative production gap" },
  { key: "freshAdEstablishedPage", label: "Fresh Ad on Established Page", points: 4, desc: "Fresh budget decision — good timing" },
  { key: "rawShortener", label: "Destination link raw shortener", points: 8, desc: "No real tracking discipline" },
  { key: "noEmailCapture", label: "No email capture on landing page", points: 9, desc: "Highest-leverage gap: paying for clicks, capturing nothing" },
  { key: "mobileUnresponsive", label: "Landing page breaks on mobile", points: 7, desc: "Direct web-dev opportunity" },
  { key: "slowPageLoad", label: "Page load slow (3s+)", points: 5, desc: "Web-dev/CRO opportunity" },
  { key: "noHttps", label: "No HTTPS / mixed-content warnings", points: 6, desc: "Trust + basic dev fix" },
  { key: "freeBuilderSubdomain", label: "Site on free builder subdomain", points: 6, desc: "No real web investment yet" },
  { key: "noBlog", label: "No blog/content section", points: 5, desc: "Content/SEO opportunity" },
  { key: "noCtaAboveFold", label: "No clear CTA above the fold", points: 4, desc: "CRO opportunity" },
  { key: "noRankPage1", label: "Doesn't rank page-1 for brand", points: 6, desc: "Core SEO gap" },
  { key: "thinMeta", label: "Thin/missing meta title/desc", points: 4, desc: "Quick-win SEO gap" },
  { key: "noSchema", label: "No schema markup detected", points: 3, desc: "Technical SEO gap" },
  { key: "gbpReviews", label: "Google Business Profile <10 reviews", points: 6, desc: "Local SEO/reputation gap" },
  { key: "noMetaPixel", label: "No Meta Pixel / tracking", points: 9, desc: "Can't retarget or optimize spend" },
  { key: "noCrmAutomation", label: "No CRM/email automation fingerprint", points: 5, desc: "AI marketing infrastructure gap" },
  { key: "adBroadGeneric", label: "Ad messaging broad/generic", points: 4, desc: "Targeting/strategy gap" },
  { key: "organicEngagement", label: "Organic engagement with weak creative", points: 5, desc: "Real audience exists; execution gap" },
  { key: "organicGaps", label: "Organic posting gaps > 2 weeks", points: 4, desc: "Budget without content strategy" },
  { key: "followerGate", label: "Follower count within 0-11k", points: 0, desc: "Pre-qualification gate passed" },
  { key: "multiLocation", label: "Multi-location/franchise structure", points: 5, desc: "Higher budget ceiling" },
  { key: "offerRecurring", label: "Offer is recurring/higher-ticket", points: 6, desc: "Better LTV, easier to justify retainer" },
  { key: "domainOld", label: "Domain registered > 4 years ago", points: 4, desc: "Established enough, needs help" },
  { key: "directEmailRecovered", label: "Direct email recovered", points: 7, desc: "Directly actionable outreach" },
  { key: "founderIdentifiable", label: "Named founder contact identifiable", points: 5, desc: "Outreach has a real person" },
  { key: "kyptronixMarket", label: "Active Kyptronix market", points: 6, desc: "ICP/geo fit, smoother sales" }
];

const willingnessSignalDefinitions = [
  { key: "threePlusAdIds", label: "3+ Ad IDs created over time", points: 8, isPositive: true },
  { key: "adGap60Days", label: "Oldest vs newest ad gap 60+ days", points: 6, isPositive: true },
  { key: "franchiseStructure", label: "Multiple locations or franchise", points: 6, isPositive: true },
  { key: "externalFunding", label: "External funding announced", points: 12, isPositive: true },
  { key: "activeJobPostings", label: "Active job postings for growth/sales", points: 8, isPositive: true },
  { key: "serialFounder", label: "Founder is serial operator", points: 6, isPositive: true },
  { key: "paidMarketingTool", label: "Runs paid marketing tools", points: 7, isPositive: true },
  { key: "recentRebrand", label: "Rebrand/relaunch in last 12 months", points: 5, isPositive: true },
  { key: "directFounderContact", label: "Founder direct contact", points: 4, isPositive: true },
  { key: "oneAdDormant", label: "Only one Ad ID, dormant since", points: -10, isPositive: false },
  { key: "financialDistress", label: "Visible financial-distress language", points: -15, isPositive: false },
  { key: "adCadenceDeclining", label: "Ad cadence declining", points: -8, isPositive: false },
  { key: "supportInboxOnly", label: "Support-inbox only, faceless brand", points: -6, isPositive: false },
  { key: "antiPaidMarketing", label: "Founder publicly anti-paid-marketing", points: -5, isPositive: false }
];

const generateHtmlEmailBody = (subject: string, bodyText: string, pageName: string) => {
  const lines = bodyText.split('\n').map(l => l.trim()).filter(Boolean);
  let greeting = `Hi Team ${pageName || 'Diplomaticn'},`;
  let paragraphLines = [];
  if (lines.length > 0) {
    if (/^(hi|hello|dear|hey)\b/i.test(lines[0])) {
      greeting = lines[0];
      paragraphLines = lines.slice(1);
    } else {
      paragraphLines = lines;
    }
  }

  while (paragraphLines.length > 0) {
    const lastLine = paragraphLines[paragraphLines.length - 1].toLowerCase();
    if (
      lastLine.startsWith('best regards') ||
      lastLine.startsWith('sincerely') ||
      lastLine.startsWith('regards') ||
      lastLine.startsWith('thanks') ||
      lastLine.startsWith('thank you') ||
      lastLine.startsWith('[your name]') ||
      lastLine.includes('souvik')
    ) {
      paragraphLines.pop();
    } else {
      break;
    }
  }

  const formattedParagraphs = paragraphLines.map(line => {
    let cleanLine = line.replace(/\[Your Company\]/gi, 'Kyptronix LLP');
    if (cleanLine.trim().startsWith('-')) {
      return `<li style="margin-bottom:8px; list-style-type: disc; margin-left: 20px;">${cleanLine.substring(1).trim()}</li>`;
    }
    return `<p style="margin:0 0 20px;">${cleanLine}</p>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; background-color: #f4f7f6; font-family: Helvetica, Arial, sans-serif; }
@media screen and (max-width:600px){ .mobile-width{width:100%!important} .mobile-padding{padding:20px!important} .mobile-menu a{font-size:10px!important;padding:0 4px!important;letter-spacing:0!important} .mobile-menu span{padding:0 2px!important} .mobile-social{display:inline-block!important;margin:0 5px!important} }
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;">
<tr>
<td align="center" style="padding:40px 10px;">
<table width="600" class="mobile-width" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,.05);overflow:hidden;">
<tr><td height="6" style="background:#0056b3"></td></tr>
<tr>
<td align="center" style="padding:40px 40px 25px;border-bottom:1px solid #eeeeee;">
<a href="https://kyptronix.us" target="_blank"><img src="https://media.designrush.com/agencies/325222/conversions/Kyptronix-logo-profile.jpg" width="180" alt="Kyptronix Logo" style="display:block;"></a>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:25px;" class="mobile-menu">
<tr>
<td align="center">
<a href="https://kyptronix.us/about-us" style="color:#555555;text-decoration:none;font-size:13px;font-weight:bold;padding:0 10px;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;">About</a>
<span style="color:#e0e0e0;">|</span>
<a href="https://kyptronix.us/services" style="color:#555555;text-decoration:none;font-size:13px;font-weight:bold;padding:0 10px;text-transform:uppercase;letter-spacing:.5px;">Services</a>
<span style="color:#e0e0e0;">|</span>
<a href="https://kyptronix.us/package-and-pricing" style="color:#555555;text-decoration:none;font-size:13px;font-weight:bold;padding:0 10px;text-transform:uppercase;letter-spacing:.5px;">Packages</a>
<span style="color:#e0e0e0;">|</span>
<a href="https://kyptronix.us/portfolio" style="color:#555555;text-decoration:none;font-size:13px;font-weight:bold;padding:0 10px;text-transform:uppercase;letter-spacing:.5px;">Portfolio</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td class="mobile-padding" style="padding:40px 50px;color:#374151;font-size:16px;line-height:1.6;">
<h1 style="margin:0 0 20px;font-size:22px;color:#1F2937;">${greeting}</h1>
${formattedParagraphs}
<table cellpadding="0" cellspacing="0" style="margin-bottom:30px; margin-top:20px;">
<tr>
<td style="background:#0056b3;border-radius:50px;">
<a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1kzqqp92tBVNRFyNSo_sdyCg68VzzRMbv947cCXtze9o3lML1qr7B-xhYMp8myDqwLR4vbhrr2" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:bold;text-decoration:none;">Get the Checklist</a>
</td>
</tr>
</table>
<p style="margin-top:30px;">—<br><strong>Souvik Karmakar</strong><br>CEO, Kyptronix LLP</p>
<p style="font-size:14px;color:#4B5563;">+1 (302) 219-6889 (USA)<br>+91 91238 37577 (IND)<br><a href="https://kyptronix.us" style="color:#0056b3;text-decoration:none;">kyptronix.us</a></p>
<p style="font-size:13px;color:#6B7280;">651 N Broad St, Middletown, DE 19709, USA</p>
</td>
</tr>
<tr>
<td align="center" style="background-color:#2c3e50; background-image:linear-gradient(135deg,#2c3e50 0%,#0056b3 100%); padding:40px 30px;">
<h2 style="margin:0 0 15px;color:#ffffff;font-size:22px;">Ready to fix your growth system?</h2>
<p style="margin:0 0 25px;color:#e0e0e0;font-size:14px;line-height:1.5;max-width:420px;">Kyptronix LLP designs automation systems that capture, qualify, and convert leads — without manual chaos.</p>
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background:#ffffff;border-radius:50px;">
<a href="https://kyptronix.us/contact-us" target="_blank" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:bold;color:#0056b3;text-decoration:none;border-radius:50px;border:2px solid #ffffff;">Get Started Today</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background:#f8f9fa;padding:40px;border-top:1px solid #eeeeee;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding-bottom:25px;">
<a href="https://www.facebook.com/kyptronixllp/" target="_blank" class="mobile-social" style="margin:0 10px;display:inline-block;"><img src="https://cdn-icons-png.flaticon.com/512/145/145802.png" width="32" height="32"></a>
<a href="https://x.com/Kyptronixus" target="_blank" style="margin:0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" width="32" height="32"></a>
<a href="https://www.linkedin.com/company/kyptronixllp/" target="_blank" style="margin:0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/145/145807.png" width="32" height="32"></a>
<a href="https://www.instagram.com/kyptronix_llp/" target="_blank" style="margin:0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/3955/3955024.png" width="32" height="32"></a>
<a href="https://www.youtube.com/@kyptronixllp2467" target="_blank" style="margin:0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" width="32" height="32"></a>
</td>
</tr>
<tr>
<td align="center" style="font-size:12px;color:#999999;line-height:1.6;">
<p style="margin:0 0 10px;"><strong>Kyptronix LLP</strong></p>
<p style="margin:0 0 20px;">Professional digital solutions and automation systems since 2015.<br>Trusted by professionals worldwide.</p>
<p style="margin:0;">
<a href="https://kyptronix.us/PrivacyPolicies" style="color:#bbbbbb;text-decoration:none;">Privacy Policy</a> &nbsp;|&nbsp;
<a href="https://kyptronix.us/terms-and-conditions" style="color:#bbbbbb;text-decoration:none;">Terms of Service</a> &nbsp;|&nbsp;
<a href="#" style="color:#bbbbbb;text-decoration:none;">Unsubscribe</a>
</p>
<p style="margin-top:20px;font-size:11px;color:#cccccc;">© 2015–2026 Kyptronix LLP. All rights reserved.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
};

export default function FacebookAdsExtractorDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [niche, setNiche] = useState("nike");
  const [country, setCountry] = useState("US");
  const [activeStatus, setActiveStatus] = useState("active");
  const [contactType, setContactType] = useState("email");
  const [limit, setLimit] = useState("5");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searches, setSearches] = useState<any[]>([]);
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const [activeSearch, setActiveSearch] = useState<any | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<any | null>(null);
  const [generatingPacket, setGeneratingPacket] = useState(false);

  const handleManualGeneratePacket = async (leadId: string) => {
    setGeneratingPacket(true);
    try {
      const response = await api.facebookAdsExtractor.generateLeadSalesPacket(leadId);
      if (response.success && response.data) {
        toast({
          title: "Success",
          description: "AI Sales Packet generated successfully!",
        });
        const updatedLead = response.data;
        setSelectedLeadForDetails(updatedLead);
        setLeads((prevLeads) =>
          prevLeads.map((l) => (l._id === leadId ? updatedLead : l))
        );
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to call AI model to generate sales packet.",
      });
    } finally {
      setGeneratingPacket(false);
    }
  };

  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(true);

  const [smtpEmail, setSmtpEmail] = useState(() => localStorage.getItem("lead_smtp_email") || "");
  const [smtpPassword, setSmtpPassword] = useState(() => localStorage.getItem("lead_smtp_password") || "");

  useEffect(() => {
    localStorage.setItem("lead_smtp_email", smtpEmail);
  }, [smtpEmail]);

  useEffect(() => {
    localStorage.setItem("lead_smtp_password", smtpPassword);
  }, [smtpPassword]);

  useEffect(() => {
    if (selectedLeadForDetails) {
      const defaultSubject = selectedLeadForDetails.emailSubject || `One mistake that silently kills B2B growth`;
      
      let cleanOpener = selectedLeadForDetails.emailOpener || "We can help you plug the funnel leak in your campaign and capture more customer inquiries.";
      if (cleanOpener.trim().toLowerCase().startsWith("subject:")) {
        const lines = cleanOpener.split("\n");
        if (lines.length > 1 && lines[0].trim().toLowerCase().startsWith("subject:")) {
          lines.shift();
          cleanOpener = lines.join("\n").trim();
        } else {
          cleanOpener = cleanOpener.replace(/^subject:\s*.*?[.!?]\s+/i, '').trim();
        }
      }

      // If cleanOpener starts with greeting, strip it so we can insert only the audit points/bullets
      cleanOpener = cleanOpener.replace(/^(hi|hello|dear|hey)\s+[^!,.\n]+[!,.\n]+/i, '').trim();

      // Ensure cleanOpener is formatted as list items starting with a hyphen
      let auditPoints = cleanOpener;
      if (!auditPoints.includes("-")) {
        const sentences = auditPoints.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 5);
        if (sentences.length > 0) {
          auditPoints = sentences.map(s => `- ${s}`).join("\n");
        } else {
          auditPoints = `- ${auditPoints}`;
        }
      }

      const defaultBody = `Hi Team ${selectedLeadForDetails.pageName || 'Diplomaticn'},

Most teams think they need more leads.
They don't.

They need less friction between interest and action.

What we see in audits:
${auditPoints}

So the lead cools off.
Sales blames marketing.
Marketing blames traffic.

The fix is boring.
That's why it works.

If you want, I'll send you the exact checklist we use to diagnose this.

Best regards,
[Your Name]`;

      setEmailSubject(defaultSubject);
      setEmailBody(defaultBody);
    } else {
      setEmailSubject("");
      setEmailBody("");
    }
  }, [selectedLeadForDetails]);

  const handleSendEmail = async () => {
    if (!selectedLeadForDetails) return;
    const toEmail = selectedLeadForDetails.email || (selectedLeadForDetails.scrapedEmails && selectedLeadForDetails.scrapedEmails[0]);
    if (!toEmail) {
      toast({
        variant: "destructive",
        title: "Missing Email",
        description: "No recipient email address available for this lead.",
      });
      return;
    }

    setSendingEmail(true);
    try {
      const compiledHtmlBody = generateHtmlEmailBody(emailSubject, emailBody, selectedLeadForDetails?.pageName);
      const response = await api.facebookAdsExtractor.sendLeadEmail(selectedLeadForDetails._id, {
        subject: emailSubject,
        body: compiledHtmlBody,
        toEmail,
        smtpEmail,
        smtpPassword
      });
      if (response.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Cold email has been dispatched to ${toEmail}.`,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send Email",
        description: error.message || "An error occurred while connecting to the SMTP server.",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (!text) {
      toast({
        variant: "destructive",
        title: "Nothing to copy",
        description: `The script template is empty.`,
      });
      return;
    }
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label} has been successfully copied!`,
    });
  };

  // Poll active search if it is processing or pending
  const [pollTrigger, setPollTrigger] = useState(0);

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  useEffect(() => {
    if (selectedSearchId) {
      fetchSearchResults(selectedSearchId);
    }
  }, [selectedSearchId, pollTrigger]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSearchId]);

  // Periodic polling for active processing searches
  useEffect(() => {
    const hasActiveSearch = searches.some(
      (s) => s.status === "processing" || s.status === "pending"
    );

    if (hasActiveSearch || (activeSearch && (activeSearch.status === "processing" || activeSearch.status === "pending"))) {
      const interval = setInterval(() => {
        setPollTrigger((prev) => prev + 1);
        fetchRecentSearches(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [searches, activeSearch]);

  const fetchRecentSearches = async (silent = false) => {
    try {
      const response = await api.facebookAdsExtractor.getRecentSearches(1, 20);
      const searchList = response.searches || response.data || [];
      setSearches(searchList);
      
      // If no search is selected, auto-select the latest one
      if (!selectedSearchId && searchList.length > 0) {
        setSelectedSearchId(searchList[0]._id);
      }
    } catch (error: any) {
      if (!silent) {
        toast({
          variant: "destructive",
          title: "Failed to fetch search history",
          description: error.message || "An error occurred",
        });
      }
    }
  };

  const fetchSearchResults = async (searchId: string) => {
    setLoadingLeads(true);
    try {
      const response = await api.facebookAdsExtractor.getSearchResults(searchId);
      if (response.success && response.data) {
        setActiveSearch(response.data.search);
        setLeads(response.data.results || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch search results:", error);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche || !country) {
      toast({
        variant: "destructive",
        title: "Required Fields",
        description: "Please specify both niche and country.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await api.facebookAdsExtractor.scan({
        niche,
        country,
        activeStatus,
        contactType,
        limit: parseInt(limit) || 5,
      });

      if (response.success && response.searchId) {
        toast({
          title: "Scan Initiated",
          description: "Scraping pipeline is running in the background.",
        });
        setSelectedSearchId(response.searchId);
        await fetchRecentSearches();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to trigger scan",
        description: error.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelScan = async (searchId: string) => {
    try {
      const response = await api.facebookAdsExtractor.cancelSearch(searchId);
      if (response.success) {
        toast({
          title: "Scan Cancelled",
          description: "The pipeline has been requested to stop.",
        });
        fetchRecentSearches();
        if (selectedSearchId === searchId) {
          fetchSearchResults(searchId);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel running search",
      });
    }
  };

  const handleDeleteScan = async (searchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this scan and all of its leads?")) return;

    try {
      const response = await api.facebookAdsExtractor.deleteSearch(searchId);
      if (response.success) {
        toast({
          title: "Scan Deleted",
          description: "Search scan history and leads cleared.",
        });
        if (selectedSearchId === searchId) {
          setSelectedSearchId(null);
          setActiveSearch(null);
          setLeads([]);
        }
        fetchRecentSearches();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "An error occurred",
      });
    }
  };

  const handleExportExcel = async () => {
    if (leads.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Empty",
        description: "No leads available to export.",
      });
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const dataToExport = leads.map((l) => ({
        "Page Name": l.pageName || "N/A",
        "Ad Archive ID": l.adArchiveID || "N/A",
        "Page Category": l.pageCategory || "N/A",
        "Ad Status": l.adStatus || "N/A",
        "Likes": l.likes || l.pageLikes || 0,
        "Followers": l.followers || 0,
        "Facebook URL": l.facebookUrl || "N/A",
        "Website": l.website || "N/A",
        "Intro": l.intro || "N/A",
        "Page Email": l.email || "N/A",
        "Scraped Emails": l.scrapedEmails ? l.scrapedEmails.join(", ") : "N/A",
        "Scraped Phones": l.scrapedPhones ? l.scrapedPhones.join(", ") : "N/A",
        "Ad Library URL": l.adLibraryURL || "N/A",
        "Ad Text": l.adText || "N/A",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Facebook Ads Leads");
      XLSX.writeFile(
        workbook,
        `fb-ads-leads-${activeSearch?.niche}-${activeSearch?.country}-${new Date().toISOString().split("T")[0]}.xlsx`
      );

      toast({
        title: "Export Success",
        description: "Lead entries downloaded as Excel spreadsheet.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: error.message || "Failed to generate Excel file",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Completed</Badge>;
      case "processing":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white gap-1 flex items-center w-fit">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing
          </Badge>
        );
      case "pending":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Pending</Badge>;
      case "cancelled":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLeadStatusBadge = (status: string) => {
    switch (status) {
      case "enriched":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Enriched</Badge>;
      case "fb_details_found":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">FB Details Scraped</Badge>;
      case "discovered":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Ad Scraped</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  const getScoreBadge = (category: string) => {
    switch (category) {
      case "Priority Close":
        return (
          <Badge className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white border-none text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
            Priority Close
          </Badge>
        );
      case "Hot Lead":
        return (
          <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none text-[10px] font-bold uppercase tracking-wider">
            Hot Lead
          </Badge>
        );
      case "Nurture":
        return (
          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-none text-[10px] font-medium uppercase tracking-wider">
            Nurture
          </Badge>
        );
      case "Cold Lead":
      default:
        return (
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-light">
            Cold Lead
          </Badge>
        );
    }
  };

  const getCombinedActionBadge = (action: string) => {
    switch (action) {
      case "Call Today":
        return (
          <Badge className="bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white border-none text-[10px] font-extrabold uppercase tracking-wider animate-pulse shadow-sm">
            🔥 Call Today
          </Badge>
        );
      case "Quick Discovery Call":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-none text-[10px] font-bold uppercase tracking-wider shadow-sm">
            📞 Discovery Call
          </Badge>
        );
      case "Displacement Pitch":
        return (
          <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white border-none text-[10px] font-semibold uppercase tracking-wider shadow-sm">
            🔄 Displacement Pitch
          </Badge>
        );
      case "Deprioritize":
      default:
        return (
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-light border border-muted-foreground/20">
            💤 Deprioritize
          </Badge>
        );
    }
  };

  const getScoreBreakdownText = (breakdown: any) => {
    if (!breakdown) return "No breakdown details available";
    const details = [];
    if (breakdown.metaAdsRunning) details.push("• Meta Ads Running (+20)");
    if (breakdown.freshAds) details.push("• Fresh Ads (+15)");
    if (breakdown.noCta) details.push("• No CTA (+15)");
    if (breakdown.noBookingForm) details.push("• No Booking Form (+15)");
    if (breakdown.noWhatsApp) details.push("• No WhatsApp (+10)");
    if (breakdown.verifiedMobile) details.push("• Verified Mobile (+10)");
    if (breakdown.verifiedOwner) details.push("• Verified Owner (+20)");
    if (breakdown.poorReviews) details.push("• Poor Reviews (+10)");
    return details.length > 0 ? details.join("\n") : "• No criteria met (0)";
  };
  const activeScansCount = searches.filter(
    (s) => s.status === "processing" || s.status === "pending"
  ).length;

  const totalLeadsCount = leads.length;
  const enrichedLeadsCount = leads.filter((l) => l.status === "enriched").length;
  const totalPages = Math.ceil(leads.length / itemsPerPage);
  const paginatedLeads = leads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container mx-auto space-y-6 p-6 max-w-7xl animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/offerings")}
            className="h-10 w-10 rounded-full hover:bg-muted border border-muted-foreground/20 text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
            title="Back to Offerings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
              <Facebook className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              Facebook Ads Lead Extractor
            </h1>
            <p className="text-muted-foreground text-md mt-1">
              Autonomously extract leads: Meta Ads Library &rarr; Facebook Page Metadata &rarr; Website Contacts.
            </p>
          </div>
        </div>
        {activeSearch && (
          <Button
            onClick={handleExportExcel}
            className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md gap-2"
          >
            <Download className="w-4 h-4" /> Export Excel
          </Button>
        )}
      </div>

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card via-card to-indigo-50/10 dark:to-indigo-950/10 border-indigo-200/50 dark:border-indigo-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Scans</p>
              <p className="text-3xl font-extrabold mt-1">{searches.length}</p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-full">
              <Search className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-amber-50/10 dark:to-amber-950/10 border-amber-200/50 dark:border-amber-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Scans</p>
              <p className="text-3xl font-extrabold mt-1 text-amber-600 dark:text-amber-500">{activeScansCount}</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-500 rounded-full">
              <Activity className={`w-5 h-5 ${activeScansCount > 0 ? "animate-pulse" : ""}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-blue-50/10 dark:to-blue-950/10 border-blue-200/50 dark:border-blue-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Found</p>
              <p className="text-3xl font-extrabold mt-1 text-blue-600 dark:text-blue-500">{totalLeadsCount}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-card to-emerald-50/10 dark:to-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enriched Leads</p>
              <p className="text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-500">{enrichedLeadsCount}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Extractor controls & Search history */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-lg border border-border bg-gradient-to-b from-card to-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Play className="w-4 h-4 text-indigo-500" />
                Run Extractor Scan
              </CardTitle>
              <CardDescription>Configure search params and launch.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartScan} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Niche Keyword</label>
                  <Input
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. nike, dental, lawyer"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Country Code (ISO)</label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="US, GB, CA, AU"
                    className="h-9 uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Active Status</label>
                  <Select value={activeStatus} onValueChange={setActiveStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="all">All Ads</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Contact Preference</label>
                  <Select value={contactType} onValueChange={setContactType}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone Number">Phone Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Results limit</label>
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="h-9"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-md gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {loading ? "Launching..." : "Collect Ads Leads"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search History */}
          <Card className="shadow-lg border border-border h-[320px] flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Search Log History</span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {searches.length} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-2">
              {searches.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-12">
                  No scan history found.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {searches.map((s) => (
                    <div
                      key={s._id}
                      onClick={() => setSelectedSearchId(s._id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col gap-1 transition-all duration-200 ${
                        selectedSearchId === s._id
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800"
                          : "hover:bg-muted border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="capitalize text-foreground truncate max-w-[120px]">
                          {s.niche} ({s.country})
                        </span>
                        <div className="flex items-center gap-1">
                          {s.status === "processing" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-4 w-4 text-red-500 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelScan(s._id);
                              }}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 text-muted-foreground hover:text-red-500"
                            onClick={(e) => handleDeleteScan(s._id, e)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Limit: {s.limit}</span>
                        {getStatusBadge(s.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Leads Details Panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="shadow-lg border border-border min-h-[500px] flex flex-col">
            <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  Processed Lead Details
                </CardTitle>
                {activeSearch && (
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>
                      Showing results for keyword{" "}
                      <span className="font-bold text-foreground">
                        "{activeSearch.niche}"
                      </span>{" "}
                      in{" "}
                      <span className="font-bold text-foreground">
                        {activeSearch.country}
                      </span>
                    </span>
                    {getStatusBadge(activeSearch.status)}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              {loadingLeads && leads.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span className="text-sm text-muted-foreground">Retrieving scraped leads...</span>
                  </div>
                </div>
              ) : leads.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-[400px] p-6">
                  <Facebook className="w-16 h-16 text-muted-foreground/30 mb-2" />
                  <p className="text-sm font-semibold">No Leads Available</p>
                  <p className="text-xs max-w-sm mt-1">
                    Select a scan run from search history on the left, or input query parameters to kick off a new collection run.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[220px]">Company Name</TableHead>
                        <TableHead className="w-[180px]">Facebook Page</TableHead>
                        <TableHead className="w-[200px]">Website</TableHead>
                        <TableHead className="w-[200px]">Scraped Contacts</TableHead>
                        <TableHead className="w-[120px]">AI Score</TableHead>
                        <TableHead className="w-[120px]">Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLeads.map((lead) => (
                        <TableRow key={lead._id} className="hover:bg-muted/30">
                          <TableCell className="align-top py-4">
                            <div className="font-bold text-foreground">{lead.pageName}</div>
                            {lead.pageCategory && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {lead.pageCategory}
                              </div>
                            )}
                            {lead.adArchiveID && (
                              <div className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono mt-1">
                                Ad ID: {lead.adArchiveID}
                              </div>
                            )}
                            {lead.adText && (
                              <div className="text-[10px] text-muted-foreground mt-2 line-clamp-2 italic bg-muted/40 p-1.5 rounded border">
                                "{lead.adText}"
                              </div>
                            )}
                          </TableCell>

                          <TableCell className="align-top py-4">
                            <div className="space-y-1">
                              {(lead.likes || lead.pageLikes || 0) <= 5000 && (
                                <>
                                  {(lead.likes > 0 || lead.pageLikes > 0) && (
                                    <div className="text-xs text-foreground font-semibold">
                                      Likes: {(lead.likes || lead.pageLikes).toLocaleString()}
                                    </div>
                                  )}
                                  {lead.followers > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      Followers: {lead.followers.toLocaleString()}
                                    </div>
                                  )}
                                </>
                              )}

                              {lead.adLibraryURL && (
                                <a
                                  href={
                                    (lead.isMock || lead.adArchiveID?.startsWith('800') || lead.adArchiveID?.startsWith('880'))
                                      ? `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${lead.pageCountry || lead.country || 'ALL'}&q=${encodeURIComponent(lead.pageName.replace(/\s\(\d+\)$/, ''))}`
                                      : lead.adLibraryURL
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-500 hover:underline flex items-center gap-1 font-semibold mt-1"
                                >
                                  <Globe className="w-3 h-3" /> View Ad Library
                                </a>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="align-top py-4">
                            {lead.website ? (
                              <div className="space-y-1.5">
                                <a
                                  href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-500 hover:underline font-bold break-all flex items-center gap-1"
                                >
                                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                                  {lead.website}
                                </a>
                                {lead.email && (
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1 break-all">
                                    <Mail className="w-3 h-3 flex-shrink-0 text-muted-foreground/70" />
                                    {lead.email}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No website URL</span>
                            )}
                          </TableCell>

                          <TableCell className="align-top py-4">
                            <div className="space-y-1.5">
                              {/* Scraped Emails */}
                              {lead.scrapedEmails && lead.scrapedEmails.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Scraped Emails:
                                  </div>
                                  <div className="flex flex-col gap-1 pl-1">
                                    {lead.scrapedEmails.map((email: string, idx: number) => (
                                      <span key={idx} className="text-xs font-mono bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40 w-fit break-all">
                                        {email}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {/* Scraped Phones */}
                              {lead.scrapedPhones && lead.scrapedPhones.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-blue-600 dark:text-blue-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> Scraped Phones:
                                  </div>
                                  <div className="flex flex-col gap-1 pl-1">
                                    {lead.scrapedPhones.map((phone: string, idx: number) => (
                                      <span key={idx} className="text-xs font-mono bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/40 w-fit">
                                        {phone}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : null}

                              {/* Fallbacks */}
                              {(!lead.scrapedEmails || lead.scrapedEmails.length === 0) &&
                               (!lead.scrapedPhones || lead.scrapedPhones.length === 0) && (
                                <div className="text-xs text-muted-foreground italic">
                                  {lead.status === "enriched"
                                    ? "No direct contact found on website"
                                    : "Scraping pending..."}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell className="align-top py-4">
                            <div className="flex flex-col gap-1.5 items-center justify-center min-h-[95px] bg-muted/20 p-2.5 rounded-lg border border-border/50">
                              <div className="text-2xl font-black text-foreground">{lead.score || 0}</div>
                              <div className="flex flex-col gap-1 items-center">
                                {getScoreBadge(lead.scoreCategory || 'Cold Lead')}
                                {lead.combinedAction && (
                                  <div className="mt-1 flex justify-center">
                                    {getCombinedActionBadge(lead.combinedAction)}
                                  </div>
                                )}
                              </div>
                              <div 
                                className="text-[10px] text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold cursor-pointer underline decoration-dotted mt-1.5" 
                                onClick={() => setSelectedLeadForDetails(lead)}
                              >
                                View Details
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="align-top py-4">
                            <div className="flex flex-col gap-2">
                              {getLeadStatusBadge(lead.status)}
                              
                              {/* Small visual pipeline steps representation */}
                              <div className="flex items-center gap-1 mt-1 bg-muted/20 p-1.5 rounded border w-fit">
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    lead.status === "discovered" ||
                                    lead.status === "fb_details_found" ||
                                    lead.status === "enriched"
                                      ? "bg-amber-500"
                                      : "bg-muted"
                                  }`}
                                  title="Ad Discovered"
                                />
                                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    lead.status === "fb_details_found" || lead.status === "enriched"
                                      ? "bg-blue-500"
                                      : "bg-muted"
                                  }`}
                                  title="FB Info Fetched"
                                />
                                <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                                <div
                                  className={`w-2.5 h-2.5 rounded-full ${
                                    lead.status === "enriched" ? "bg-emerald-500" : "bg-muted"
                                  }`}
                                  title="Website Contacts Scraped"
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border bg-muted/10">
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  Showing <span className="font-semibold text-foreground">{Math.min((currentPage - 1) * itemsPerPage + 1, leads.length)}</span> to{" "}
                  <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, leads.length)}</span> of{" "}
                  <span className="font-semibold text-foreground">{leads.length}</span> leads
                </p>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`h-8 w-8 text-xs p-0 font-bold ${
                        currentPage === page
                          ? "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-none shadow-sm"
                          : "hover:bg-muted"
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    className="h-8 px-2.5 text-xs font-semibold"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
      <Dialog open={!!selectedLeadForDetails} onOpenChange={(open) => !open && setSelectedLeadForDetails(null)}>
        <DialogContent className="max-w-2xl bg-card border border-border text-foreground max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <span>{selectedLeadForDetails?.pageName}</span>
              <span className="text-xs font-normal text-muted-foreground">- Lead Audit & Sales Packet</span>
            </DialogTitle>
            <DialogDescription>
              AI scoring and sales intelligence recommendations.
            </DialogDescription>
          </DialogHeader>

          {selectedLeadForDetails && (
            <div className="space-y-6 mt-4">
              {/* Dual Axis Score Summary */}
              <div className="grid grid-cols-4 gap-3 bg-gradient-to-br from-card to-muted/30 p-4 rounded-lg border border-border/60 shadow-sm">
                <div className="text-center border-r border-border">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Opportunity</div>
                  <div className="text-2xl font-black mt-1 text-foreground">{selectedLeadForDetails.opportunityScore || selectedLeadForDetails.score || 0} pts</div>
                  <div className="mt-1 flex justify-center">{getScoreBadge(selectedLeadForDetails.scoreCategory || 'Cold Lead')}</div>
                </div>
                <div className="text-center border-r border-border">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Willingness</div>
                  <div className="text-2xl font-black mt-1 text-foreground">{selectedLeadForDetails.willingnessScore || 0} pts</div>
                  <div className="mt-1 flex justify-center">
                    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${
                      selectedLeadForDetails.willingnessCategory === 'High' ? 'border-emerald-500 text-emerald-500 bg-emerald-50/10' :
                      selectedLeadForDetails.willingnessCategory === 'Medium' ? 'border-amber-500 text-amber-500 bg-amber-50/10' :
                      'border-red-500 text-red-500 bg-red-50/10'
                    }`}>
                      {selectedLeadForDetails.willingnessCategory || 'Low'}
                    </Badge>
                  </div>
                </div>
                <div className="text-center border-r border-border">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Sales Action</div>
                  <div className="mt-2.5 flex justify-center">{getCombinedActionBadge(selectedLeadForDetails.combinedAction || 'Deprioritize')}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Likes</div>
                  <div className="text-xl font-bold mt-1.5 text-foreground">{(selectedLeadForDetails.likes || selectedLeadForDetails.pageLikes || 0).toLocaleString()}</div>
                </div>
              </div>

              {/* Scoring breakdown */}
              <div className="space-y-3">
                <Tabs defaultValue="opportunity" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/80 p-1 rounded-lg">
                    <TabsTrigger value="opportunity" className="text-xs font-bold py-2">
                      🎯 Opportunity Audit ({opportunitySignalDefinitions.filter(d => selectedLeadForDetails.opportunityBreakdown?.[d.key] || selectedLeadForDetails.scoreBreakdown?.[d.key]).length} Active)
                    </TabsTrigger>
                    <TabsTrigger value="willingness" className="text-xs font-bold py-2">
                      💰 Budget Willingness ({willingnessSignalDefinitions.filter(d => selectedLeadForDetails.willingnessBreakdown?.[d.key]).length} Active)
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="opportunity" className="mt-3 space-y-2">
                    <div className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider font-bold">
                      Axis 1: Funnel & Brand Gaps (Total points: {selectedLeadForDetails.opportunityScore || selectedLeadForDetails.score || 0})
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {opportunitySignalDefinitions.filter(d => selectedLeadForDetails.opportunityBreakdown?.[d.key] || selectedLeadForDetails.scoreBreakdown?.[d.key]).map(d => (
                        <div key={d.key} className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-xs flex justify-between items-start gap-4 transition-all hover:bg-emerald-500/15">
                          <div className="space-y-0.5">
                            <div className="font-bold text-foreground">{d.label}</div>
                            <div className="text-[10px] text-muted-foreground/85 italic">Why it matters: {d.desc}</div>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">+{d.points} pts</span>
                        </div>
                      ))}
                      {opportunitySignalDefinitions.filter(d => !(selectedLeadForDetails.opportunityBreakdown?.[d.key] || selectedLeadForDetails.scoreBreakdown?.[d.key])).map(d => (
                        <div key={d.key} className="bg-muted/10 border border-border/40 p-2 rounded-lg text-xs flex justify-between items-center opacity-40">
                          <span className="text-muted-foreground font-medium">{d.label}</span>
                          <span className="text-muted-foreground text-[10px]">+{d.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="willingness" className="mt-3 space-y-2">
                    <div className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider font-bold">
                      Axis 2: Spending Indicators (Total points: {selectedLeadForDetails.willingnessScore || 0})
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                      {willingnessSignalDefinitions.filter(d => selectedLeadForDetails.willingnessBreakdown?.[d.key]).map(d => (
                        <div key={d.key} className={`p-2.5 rounded-lg text-xs flex justify-between items-start gap-4 transition-all ${
                          d.isPositive 
                            ? 'bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15' 
                            : 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/15'
                        }`}>
                          <div className="space-y-0.5">
                            <div className="font-bold text-foreground">{d.label}</div>
                            <div className="text-[10px] text-muted-foreground/85">Indicator of {d.isPositive ? 'healthy expansion budget' : 'outreach risk / restriction'}</div>
                          </div>
                          <span className={`font-bold whitespace-nowrap ${d.isPositive ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                            {d.points > 0 ? `+${d.points}` : d.points} pts
                          </span>
                        </div>
                      ))}
                      {willingnessSignalDefinitions.filter(d => !(selectedLeadForDetails.willingnessBreakdown?.[d.key])).map(d => (
                        <div key={d.key} className="bg-muted/10 border border-border/40 p-2 rounded-lg text-xs flex justify-between items-center opacity-40">
                          <span className="text-muted-foreground font-medium">{d.label}</span>
                          <span className="text-muted-foreground text-[10px]">{d.points > 0 ? `+${d.points}` : d.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* AI Sales Packet Section */}
              <div className="space-y-4 pt-2 border-t border-border">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  AI Sales Intelligence Packet
                </h3>
                
                {selectedLeadForDetails.hasSalesPacket ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-xs">
                        <span className="font-bold text-red-500">Funnel Leak Diagnosis:</span>
                        <p className="mt-1 text-foreground/90 leading-relaxed">{selectedLeadForDetails.funnelLeakDiagnosis}</p>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs">
                        <span className="font-bold text-amber-500">Best Pitch Angle:</span>
                        <p className="mt-1 text-foreground/90 leading-relaxed">{selectedLeadForDetails.pitchAngle}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Communication Templates</span>
                      
                      <Tabs defaultValue="email" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-muted/80 p-1 rounded-lg">
                          <TabsTrigger value="email" className="gap-2 text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400">
                            <Mail className="w-3.5 h-3.5" /> Cold Email
                          </TabsTrigger>
                          <TabsTrigger value="call" className="gap-2 text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400">
                            <Phone className="w-3.5 h-3.5" /> Cold Call
                          </TabsTrigger>
                          <TabsTrigger value="dm" className="gap-2 text-xs font-bold py-2 data-[state=active]:bg-background data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400">
                            <MessageSquare className="w-3.5 h-3.5" /> WhatsApp / DM
                          </TabsTrigger>
                        </TabsList>

                        {/* Cold Email Tab */}
                        <TabsContent value="email" className="mt-2 space-y-2">
                          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-muted/30 border-b border-border p-3 text-xs space-y-1 font-sans">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">
                                  <span className="font-semibold text-foreground">To:</span>{" "}
                                  <span className="font-mono text-xs text-indigo-500 font-semibold bg-indigo-50/50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded border border-indigo-100/30">
                                    {selectedLeadForDetails.email || (selectedLeadForDetails.scrapedEmails && selectedLeadForDetails.scrapedEmails[0]) || "No email available"}
                                  </span>
                                </span>
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    type="button"
                                    className="h-7 px-2.5 text-[10px] font-bold gap-1 border-indigo-200 hover:border-indigo-300 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 bg-background"
                                    onClick={() => handleCopyText(`Subject: ${emailSubject}\n\n${emailBody}`, "Cold Email Pitch")}
                                  >
                                    <Copy className="w-3 h-3" /> Copy
                                  </Button>
                                  <Button
                                    size="sm"
                                    type="button"
                                    disabled={sendingEmail || !(selectedLeadForDetails.email || (selectedLeadForDetails.scrapedEmails && selectedLeadForDetails.scrapedEmails.length > 0))}
                                    className="h-7 px-2.5 text-[10px] font-extrabold gap-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow"
                                    onClick={handleSendEmail}
                                  >
                                    {sendingEmail ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Mail className="w-3 h-3" />
                                    )}
                                    {sendingEmail ? "Sending..." : "Send Email via SMTP"}
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-semibold text-foreground min-w-[50px]">Subject:</span>
                                <Input
                                  value={emailSubject}
                                  onChange={(e) => setEmailSubject(e.target.value)}
                                  className="h-7 text-xs bg-background/80 border-border focus-visible:ring-indigo-500 flex-1 font-medium"
                                />
                              </div>
                            </div>
                            <div className="p-3 bg-muted/5 space-y-3">
                              {/* SMTP Credentials Form */}
                              <div className="grid grid-cols-2 gap-3 bg-background/50 border border-border/60 p-2.5 rounded-lg">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block">Sender GMail Address</label>
                                  <Input
                                    value={smtpEmail}
                                    onChange={(e) => setSmtpEmail(e.target.value)}
                                    placeholder="sender@gmail.com"
                                    className="h-7 text-xs bg-background/70 border-border/80 focus-visible:ring-indigo-500 font-mono"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground block">App Password (16-char)</label>
                                  <Input
                                    type="password"
                                    value={smtpPassword}
                                    onChange={(e) => setSmtpPassword(e.target.value)}
                                    placeholder="xxxx xxxx xxxx xxxx"
                                    className="h-7 text-xs bg-background/70 border-border/80 focus-visible:ring-indigo-500 font-mono"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-between border-b pb-2 mb-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Content</span>
                                <div className="flex gap-1 bg-muted p-0.5 rounded border">
                                  <Button
                                    size="sm"
                                    type="button"
                                    variant={showEmailPreview ? "secondary" : "ghost"}
                                    className="h-6 px-2 text-[10px] font-bold"
                                    onClick={() => setShowEmailPreview(true)}
                                  >
                                    <Eye className="w-3 h-3 mr-1" /> Preview HTML
                                  </Button>
                                  <Button
                                    size="sm"
                                    type="button"
                                    variant={!showEmailPreview ? "secondary" : "ghost"}
                                    className="h-6 px-2 text-[10px] font-bold"
                                    onClick={() => setShowEmailPreview(false)}
                                  >
                                    <FileText className="w-3 h-3 mr-1" /> Edit Text
                                  </Button>
                                </div>
                              </div>

                              {showEmailPreview ? (
                                <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
                                  <iframe
                                    srcDoc={generateHtmlEmailBody(emailSubject, emailBody, selectedLeadForDetails?.pageName)}
                                    className="w-full h-[320px] border-0"
                                    title="HTML Email Preview"
                                  />
                                </div>
                              ) : (
                                <textarea
                                  value={emailBody}
                                  onChange={(e) => setEmailBody(e.target.value)}
                                  className="w-full min-h-[200px] p-3 text-xs bg-background/50 border border-border focus:border-indigo-500 rounded-lg text-foreground focus:outline-none resize-y leading-relaxed font-sans"
                                  placeholder="Enter email body..."
                                />
                              )}
                              <p className="text-[10px] text-muted-foreground italic mt-0.5 px-1">
                                ⚙️ Note: If left blank, SMTP will default to the server environment settings (`.env`).
                              </p>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Cold Call Tab */}
                        <TabsContent value="call" className="mt-2 space-y-2">
                          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                            <div className="bg-muted/30 border-b border-border p-3 flex justify-between items-center text-xs">
                              <span className="text-muted-foreground font-semibold">Cold Call Opener Script</span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[10px] font-bold gap-1 border-indigo-200 hover:border-indigo-300 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 bg-background"
                                onClick={() => handleCopyText(selectedLeadForDetails.coldCallOpener || "", "Cold Call Opener")}
                              >
                                <Copy className="w-3 h-3" /> Copy Opener
                              </Button>
                            </div>
                            <div className="p-4 bg-muted/5 flex gap-3 items-start">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Phone className="w-4 h-4" />
                              </div>
                              <div className="space-y-1.5 flex-1">
                                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Hook & Call Opener</div>
                                <div className="text-xs font-serif italic text-foreground/95 bg-blue-50/50 dark:bg-blue-950/10 p-3 rounded-lg border border-blue-100/30 leading-relaxed">
                                  "{selectedLeadForDetails.coldCallOpener || 'Hi, is this the owner? I noticed your active ads campaign on Facebook...'}"
                                </div>
                                <div className="text-[10px] text-muted-foreground italic mt-1">
                                  💡 Tip: Call the office number, ask for the owner/marketing head, and offer to share the conversion funnel leak diagnosis.
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {/* WhatsApp / DM Tab */}
                        <TabsContent value="dm" className="mt-2 space-y-2">
                          <div className="bg-[#e5ddd5] dark:bg-zinc-900 border border-border rounded-lg overflow-hidden shadow-sm font-sans">
                            <div className="bg-[#075e54] dark:bg-zinc-800 text-white p-3 flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-[10px] text-white">
                                  {selectedLeadForDetails.pageName ? selectedLeadForDetails.pageName[0].toUpperCase() : "C"}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-xs">{selectedLeadForDetails.pageName || "Lead Contact"}</span>
                                  <span className="text-[9px] text-emerald-200">Online</span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-[10px] font-bold gap-1 bg-[#128c7e] hover:bg-[#075e54] text-white border-none"
                                onClick={() => handleCopyText(selectedLeadForDetails.whatsAppOpener || "", "WhatsApp Script")}
                              >
                                <Copy className="w-3 h-3" /> Copy Message
                              </Button>
                            </div>
                            
                            {/* WhatsApp Chat Simulation */}
                            <div className="p-4 space-y-3 min-h-[120px] flex flex-col justify-end bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-contain bg-opacity-10 dark:bg-none">
                              <div className="self-end bg-[#dcf8c6] dark:bg-emerald-950/60 border border-[#cbebb0] dark:border-emerald-900/40 p-3 rounded-lg text-xs max-w-[85%] text-slate-800 dark:text-emerald-100 shadow-sm">
                                <p className="leading-relaxed">"{selectedLeadForDetails.whatsAppOpener || 'Hi, I saw your Facebook ads and noticed your booking link is missing...'}"</p>
                                <div className="text-[9px] text-slate-400 dark:text-emerald-400 text-right mt-1 font-semibold flex items-center justify-end gap-0.5">
                                  <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span className="text-blue-500 font-extrabold text-[11px] leading-none">✓✓</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="bg-muted p-3 rounded-lg text-[11px] col-span-1 border">
                        <span className="font-bold text-muted-foreground block mb-1">Urgency Trigger:</span>
                        <span className="text-foreground/90">{selectedLeadForDetails.urgencyTrigger}</span>
                      </div>
                      <div className="bg-muted p-3 rounded-lg text-[11px] col-span-1 border">
                        <span className="font-bold text-muted-foreground block mb-1">Best Time to Call:</span>
                        <span className="text-foreground/90">{selectedLeadForDetails.bestTimeToCall}</span>
                      </div>
                      <div className="bg-muted p-3 rounded-lg text-[11px] col-span-1 border">
                        <span className="font-bold text-indigo-500 dark:text-indigo-400 block mb-1">Recommended CTA:</span>
                        <span className="text-foreground/90 font-semibold">{selectedLeadForDetails.recommendedCta}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col items-center gap-3">
                    {selectedLeadForDetails.status === 'enriched' ? (
                      <>
                        <span>AI Sales Packet is ready to be generated for this enriched lead.</span>
                        <Button 
                          onClick={() => handleManualGeneratePacket(selectedLeadForDetails._id)}
                          disabled={generatingPacket}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold"
                        >
                          {generatingPacket ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {generatingPacket ? "Generating Sales Packet..." : "Generate AI Sales Packet Now"}
                        </Button>
                      </>
                    ) : (
                      <span>Sales Packet will be generated once lead scraping is fully completed (Enriched).</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
