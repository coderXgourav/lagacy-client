import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Download,
  CreditCard,
  FileSignature,
  ArrowLeft
} from "lucide-react";

export default function KyptronixFormPage() {
  const navigate = useNavigate();

  const forms = [
    {
      id: "contact-us",
      title: "Contact Us",
      description: "Get in touch with our team",
      icon: Mail,
      source: "Kyptronix Lead Form",
    },
    {
      id: "download-company-profile",
      title: "Download Company Profile",
      description: "Get our detailed company profile",
      icon: Download,
      source: "Kyptronix Download Company Profile Form",
    },
    {
      id: "download-business-card",
      title: "Download Business Card",
      description: "Get our digital business card",
      icon: CreditCard,
      source: "Kyptronix Business Form",
    },
    {
      id: "request-proposal",
      title: "Request a Proposal",
      description: "Ask for a customized proposal",
      icon: FileSignature,
      source: "Kyptronix Contact Form",
    },
  ];

  const handleCardClick = (formId: string) => {
    navigate(`/kyptronix-form/${formId}`);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/offerings")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Offerings
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">Kyptronix Forms</h1>
          <p className="text-slate-400 text-lg">
            Select a form to view submissions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {forms.map((form) => {
            const Icon = form.icon;
            return (
              <Card
                key={form.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-[#1e293b] border-slate-700 hover:border-slate-500"
                onClick={() => handleCardClick(form.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-xl bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors">
                      <Icon className="h-6 w-6 text-slate-300 group-hover:text-white" />
                    </div>
                    <CardTitle className="text-xl text-slate-200 group-hover:text-white transition-colors">{form.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base text-slate-400">
                    {form.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-slate-300 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    View Submissions →
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
