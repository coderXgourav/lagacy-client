import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Download,
  CreditCard,
  FileSignature,
  FileText,
  Zap,
  ChevronRight,
  ListTodo
} from "lucide-react";

export default function KyptronixFormPage() {
  const navigate = useNavigate();

  const forms = [
    {
      id: "contact-us",
      title: "Contact Us",
      description: "Inbound leads and general inquiries from the main contact portal.",
      icon: Mail,
      source: "Kyptronix Lead Form",
      color: "blue"
    },
    {
      id: "download-company-profile",
      title: "Company Profile",
      description: "Requests for the detailed institutional company portfolio.",
      icon: Download,
      source: "Kyptronix Download Company Profile Form",
      color: "emerald"
    },
    {
      id: "download-business-card",
      title: "Business Card",
      description: "Digital business card downloads and networking inquiries.",
      icon: CreditCard,
      source: "Kyptronix Business Form",
      color: "amber"
    },
    {
      id: "request-proposal",
      title: "Proposal Requests",
      description: "Detailed project requirements and customized proposal asks.",
      icon: FileSignature,
      source: "Kyptronix Contact Form",
      color: "indigo"
    },
  ];

  const handleCardClick = (formId: string) => {
    navigate(`/kyptronix-form/${formId}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-600/20">
                <ListTodo className="h-7 w-7 text-white" />
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-xs font-semibold tracking-wide uppercase">
                Form Hub
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              Kyptronix Form Submissions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Consolidated access point for all Kyptronix web submission channels. Monitor leads, proposal requests, and profile downloads.
            </p>
          </div>
          <div className="flex shrink-0">
            <div className="p-4 bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-2xl border border-white/40 dark:border-black/40 shadow-xl">
              <FileText className="w-12 h-12 text-indigo-600 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-[1600px] mx-auto">
        {forms.map((form) => {
          const Icon = form.icon;
          return (
            <Card
              key={form.id}
              className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-border bg-card/30 backdrop-blur-sm relative overflow-hidden h-full flex flex-col p-1 active:scale-[0.98]"
              onClick={() => handleCardClick(form.id)}
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full bg-${form.color}-500 group-hover:w-2 transition-all duration-300`} />
              <CardHeader className="py-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-2xl bg-${form.color}-500/10 group-hover:bg-${form.color}-500/20 transition-all duration-500`}>
                    <Icon className={`h-8 w-8 text-${form.color}-600 group-hover:scale-110 transition-transform duration-500`} />
                  </div>
                  <div className={`p-2 rounded-full border border-border group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-500`}>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold mb-3">{form.title}</CardTitle>
                <CardDescription className="text-base text-muted-foreground leading-relaxed">
                  {form.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-6 px-6 border-t border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                    {form.source}
                  </span>
                  <span className={`text-xs font-bold text-${form.color}-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500`}>
                    <Zap className="h-3 w-3" />
                    Explore Intelligence
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
