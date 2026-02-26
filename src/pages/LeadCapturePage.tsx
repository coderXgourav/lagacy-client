import { useState, useEffect } from "react";
import {
  Send,
  Phone,
  Mail,
  User,
  Building2,
  Package,
  CheckCircle,
  Smartphone,
  FormInput,
  Zap,
  ShieldCheck
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface LeadFormData {
  name: string;
  phone: string;
  email: string;
  businessType: string;
  packageInterested: string;
}

interface UTMParams {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function LeadCapturePage() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [formData, setFormData] = useState<LeadFormData>({
    name: "",
    phone: "",
    email: "",
    businessType: "",
    packageInterested: "",
  });

  // Extract UTM parameters from URL
  const [utmParams, setUtmParams] = useState<UTMParams>({
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
  });

  // Safe Pixel Tracking Helper
  const trackPixelEvent = (eventName: string, data?: any) => {
    try {
      if ((window as any).fbq) {
        (window as any).fbq('track', eventName, data);
      }
      if ((window as any).gtag) {
        if (eventName === 'Lead') {
          // (window as any).gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXX/Label' });
        }
      }
      console.log(`\ud83d\udce1 Tracking Event: ${eventName}`, data);
    } catch (err) {
      console.warn("Pixel tracking failed:", err);
    }
  };

  useEffect(() => {
    setUtmParams({
      utmSource: searchParams.get("utm_source") || "",
      utmMedium: searchParams.get("utm_medium") || "",
      utmCampaign: searchParams.get("utm_campaign") || "",
      utmContent: searchParams.get("utm_content") || "",
      utmTerm: searchParams.get("utm_term") || "",
    });
    trackPixelEvent('ViewContent');
  }, [searchParams]);

  const handleInputChange = (field: keyof LeadFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/lead-capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          ...utmParams,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
        setResponseMessage(result.data.responseMessage || "Thank you! Our team will contact you shortly.");

        trackPixelEvent('Lead', {
          content_name: formData.packageInterested,
          content_category: 'Lead',
          value: 0,
          currency: 'USD'
        });

        toast({
          title: "Lead Captured!",
          description: result.data.responseMessage,
        });

        setFormData({
          name: "",
          phone: "",
          email: "",
          businessType: "",
          packageInterested: "",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit form",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto max-w-[1600px] p-6 space-y-8 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="border-border bg-card/50 backdrop-blur-sm max-w-lg w-full shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2 text-foreground">Success!</h2>
              <p className="text-muted-foreground text-lg">
                {responseMessage}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm text-left max-w-[280px] mx-auto bg-muted/30 p-4 rounded-xl border border-border/50">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Lead record created
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AI Call scheduled
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Notification sent
              </div>
            </div>
            <Button
              className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
              onClick={() => setIsSubmitted(false)}
            >
              Capture Another Lead
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-600/20">
                <FormInput className="h-7 w-7 text-white" />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-xs font-semibold tracking-wide uppercase">
                Conversion Engine
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Lead Capture
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Standardize your inbound pipeline with Meta + Google Ads integration and instant AI calling response.
            </p>
          </div>
          <div className="flex shrink-0">
            <div className="p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-2xl border border-white/40 dark:border-black/40 shadow-xl">
              <Smartphone className="w-12 h-12 text-indigo-600 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-[1400px] mx-auto">
        <div className="md:col-span-3">
          <Card className="shadow-2xl border-border bg-card/30 backdrop-blur-sm overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-700" />
            <CardHeader className="py-6 pt-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-indigo-500/10">
                  <Zap className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">New Lead Intake</CardTitle>
                  <CardDescription>Enter prospect details manually</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-6 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6 text-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-indigo-500" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="bg-background/50 border-border focus:ring-2 focus:ring-indigo-500/20 transition-all h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4 text-indigo-500" />
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 91234 56789"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                      className="bg-background/50 border-border focus:ring-2 focus:ring-indigo-500/20 transition-all h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-500" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-background/50 border-border focus:ring-2 focus:ring-indigo-500/20 transition-all h-11"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessType" className="text-sm font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                      Business Type
                    </Label>
                    <Input
                      id="businessType"
                      placeholder="SaaS, Agency, etc."
                      value={formData.businessType}
                      onChange={(e) => handleInputChange("businessType", e.target.value)}
                      className="bg-background/50 border-border focus:ring-2 focus:ring-indigo-500/20 transition-all h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="package" className="text-sm font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4 text-indigo-500" />
                      Package
                    </Label>
                    <Select
                      value={formData.packageInterested}
                      onValueChange={(value) => handleInputChange("packageInterested", value)}
                    >
                      <SelectTrigger className="bg-background/50 border-border focus:ring-2 focus:ring-indigo-500/20 transition-all h-11">
                        <SelectValue placeholder="Select interest" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter Plan</SelectItem>
                        <SelectItem value="growth">Growth Plan</SelectItem>
                        <SelectItem value="scale">Scale Plan</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gap-2 mt-4 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Capture Lead Record
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-border bg-card/20 backdrop-blur-sm shadow-xl relative overflow-hidden h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Automated Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative pl-6 border-l-2 border-indigo-500/20 py-1">
                <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-indigo-500" />
                <p className="text-sm font-bold">Instant Enrichment</p>
                <p className="text-xs text-muted-foreground mt-1">Data verified against LinkedIn & Company databases.</p>
              </div>
              <div className="relative pl-6 border-l-2 border-indigo-500/20 py-1">
                <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-indigo-500" />
                <p className="text-sm font-bold">AI Voice Routing</p>
                <p className="text-xs text-muted-foreground mt-1">System initiates call within 30 seconds.</p>
              </div>
              <div className="relative pl-6 border-l-2 border-indigo-500/20 py-1">
                <div className="absolute -left-[5px] top-2 h-2 w-2 rounded-full bg-indigo-500" />
                <p className="text-sm font-bold">CRM Sync</p>
                <p className="text-xs text-muted-foreground mt-1">Lead automatically pushed to core sales pipeline.</p>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/10 shadow-inner">
            <h4 className="font-bold text-indigo-600 mb-1 flex items-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4" /> Pixel Integration Active
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standard 'Lead' events are being fired to Meta & Google Conversion APIs for all captured records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
