import { useState, useEffect } from "react";
import { ArrowLeft, Send, Phone, Mail, User, Building2, Package, CheckCircle, Smartphone, LayoutDashboard, FormInput } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import LeadDashboardPage from "./LeadDashboardPage";

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

type ViewType = "form" | "dashboard";

// Extracted Sidebar Component
const Sidebar = ({ 
  activeView, 
  setActiveView, 
  onNavigate 
}: { 
  activeView: ViewType; 
  setActiveView: (view: ViewType) => void;
  onNavigate: (path: string) => void;
}) => (
  <div className="w-64 bg-background border-r min-h-screen p-4 flex flex-col gap-4">
    <div className="mb-4">
      <Button
        variant="ghost"
        onClick={() => onNavigate("/offerings")}
        className="w-full justify-start gap-2 pl-2 text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Offerings
      </Button>
    </div>

    <div className="space-y-2">
      <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Menu
      </h3>
      
      <Button
        variant={activeView === "form" ? "secondary" : "ghost"}
        className="w-full justify-start gap-2"
        onClick={() => setActiveView("form")}
      >
        <FormInput className="h-4 w-4" />
        Lead Form
      </Button>

      <Button
        variant={activeView === "dashboard" ? "secondary" : "ghost"}
        className="w-full justify-start gap-2"
        onClick={() => setActiveView("dashboard")}
      >
        <LayoutDashboard className="h-4 w-4" />
        Lead Dashboard
      </Button>
    </div>

    <div className="mt-auto p-4 bg-muted/20 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-medium mb-1">
        <Smartphone className="h-4 w-4 text-green-500" />
        AI Calling Active
      </div>
      <p className="text-xs text-muted-foreground">
        System automatically calls new leads within 30 seconds.
      </p>
    </div>
  </div>
);

// Extracted FormView Component
const FormView = ({
  isSubmitted,
  responseMessage,
  setIsSubmitted,
  handleSubmit,
  formData,
  handleInputChange,
  isSubmitting
}: {
  isSubmitted: boolean;
  responseMessage: string;
  setIsSubmitted: (val: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  formData: LeadFormData;
  handleInputChange: (field: keyof LeadFormData, value: string) => void;
  isSubmitting: boolean;
}) => {
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-12">
        <Card className="shadow-2xl border-2 border-green-500/20 bg-green-500/5 max-w-lg w-full">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-muted-foreground text-lg mb-6">
              {responseMessage}
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ Your request has been received</p>
              <p>📞 We will contact you within 5 minutes</p>
              <p>📧 Confirmation email sent</p>
            </div>
            <Button
              className="mt-6"
              onClick={() => setIsSubmitted(false)}
            >
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 pt-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Lead Capture
        </h1>
        <p className="text-muted-foreground text-lg">
          Website Conversion using Meta + Google Ads
        </p>
      </div>

      <Card className="shadow-2xl border-2 border-primary/10">
        <CardHeader className="py-6">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Package className="h-6 w-6 text-primary" />
            Get Started
          </CardTitle>
          <CardDescription className="text-base">
            Fill in your details and we'll help you capture more leads
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="h-10"
              />
            </div>

            {/* Phone (Mandatory) */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
                className="h-10"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="h-10"
              />
            </div>

            {/* Business Type */}
            <div className="space-y-2">
              <Label htmlFor="businessType" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Business Type
              </Label>
              <Input
                id="businessType"
                placeholder="e.g. E-commerce, SaaS, Agency"
                value={formData.businessType}
                onChange={(e) => handleInputChange("businessType", e.target.value)}
                className="h-10"
              />
            </div>

            {/* Package Interested */}
            <div className="space-y-2">
              <Label htmlFor="package" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Package Interested
              </Label>
              <Select
                value={formData.packageInterested}
                onValueChange={(value) => handleInputChange("packageInterested", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full gap-2 mt-4 text-base font-semibold"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Lead
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default function LeadCapturePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<ViewType>("form");
  
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
      // 1. Meta Pixel (fbq)
      if ((window as any).fbq) {
        (window as any).fbq('track', eventName, data);
      }
      
      // 2. Google Ads (gtag)
      if ((window as any).gtag) {
        if (eventName === 'Lead') {
           // Replace 'AW-CONVERSION_ID/LABEL' with your actual Google Ads conversion ID
           // (window as any).gtag('event', 'conversion', { 'send_to': 'AW-XXXXXXXX/Label' });
        }
      }

      console.log(`📡 Tracking Event: ${eventName}`, data);
    } catch (err) {
      console.warn("Pixel tracking failed:", err);
    }
  };

  useEffect(() => {
    // Capture UTM parameters from URL
    setUtmParams({
      utmSource: searchParams.get("utm_source") || "",
      utmMedium: searchParams.get("utm_medium") || "",
      utmCampaign: searchParams.get("utm_campaign") || "",
      utmContent: searchParams.get("utm_content") || "",
      utmTerm: searchParams.get("utm_term") || "",
    });

    // Track ViewContent on page load
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
        
        // Track 'Lead' Event
        trackPixelEvent('Lead', {
          content_name: formData.packageInterested,
          content_category: 'Lead',
          value: 0, // Set value per valid lead if needed
          currency: 'USD'
        });

        toast({
          title: "Lead Captured!",
          description: result.data.responseMessage,
        });

        // Reset form
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onNavigate={(path) => navigate(path)} 
      />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen">
        {activeView === "form" ? (
          <FormView 
            isSubmitted={isSubmitted}
            responseMessage={responseMessage}
            setIsSubmitted={setIsSubmitted}
            handleSubmit={handleSubmit}
            formData={formData}
            handleInputChange={handleInputChange}
            isSubmitting={isSubmitting}
          />
        ) : (
          <LeadDashboardPage isEmbedded={true} />
        )}
      </main>
    </div>
  );
}
