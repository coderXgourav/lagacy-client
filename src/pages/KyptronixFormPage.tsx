import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Download,
  CreditCard,
  FileSignature,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Globe,
  Building,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { kyptronixApi } from "@/services/api";

export default function KyptronixFormPage() {
  const navigate = useNavigate();
  const [selectedForm, setSelectedForm] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const forms = [
    {
      id: "contact-us",
      title: "Contact Us",
      description: "Get in touch with our team",
      icon: Mail,
      source: "Kyptronix Contact Form",
    },
    {
      id: "download-profile",
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
      source: "Kyptronix Download Business Card Form",
    },
    {
      id: "request-proposal",
      title: "Request a Proposal",
      description: "Ask for a customized proposal",
      icon: FileSignature,
      source: "Kyptronix Request a Proposal Form",
    },
  ];

  const handleCardClick = (formId: string) => {
    const form = forms.find((f) => f.id === formId);
    if (form) {
      setSelectedForm(form.source);
      setOpen(true);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (open && selectedForm) {
      fetchLeads();
    }
  }, [open, selectedForm]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await kyptronixApi.getLeads(selectedForm!);
      if (response.success) {
        setLeads(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge variant="secondary">New</Badge>;
      case "contacted":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Contacted</Badge>;
      case "qualified":
        return <Badge className="bg-green-600">Qualified</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/offerings")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Offerings
          </Button>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Kyptronix Forms</h1>
          <p className="text-muted-foreground text-lg">
            Select a form to view submissions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {forms.map((form) => {
            const Icon = form.icon;
            return (
              <Card
                key={form.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-primary/10 hover:border-primary/30"
                onClick={() => handleCardClick(form.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{form.title}</CardTitle>
                  </div>
                  <CardDescription className="text-base">
                    {form.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    View Submissions →
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Form Submissions</DialogTitle>
              <DialogDescription>
                Showing leads for: <span className="font-semibold text-foreground">{selectedForm}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                  <p className="text-muted-foreground">No submissions found for this form.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Company Details</TableHead>
                        <TableHead>Request Details</TableHead>
                        <TableHead>Outreach Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <>
                          <TableRow key={lead._id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(lead._id)}>
                            <TableCell>
                              {expandedRows[lead._id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </TableCell>
                            <TableCell className="max-w-[120px]">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {new Date(lead.createdAt).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(lead.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-semibold">{lead.name}</span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" /> {lead.email}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" /> {lead.phone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 font-medium">
                                  <Building className="h-3 w-3" /> {lead.companyName || "-"}
                                </div>
                                {lead.website && (
                                  <div className="flex items-center gap-1 text-xs text-blue-500">
                                    <Globe className="h-3 w-3" /> 
                                    <a href={lead.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{lead.website}</a>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 text-sm">
                                {lead.serviceCategory && <div><span className="text-muted-foreground">Category:</span> {lead.serviceCategory}</div>}
                                {lead.packageTier && <div><span className="text-muted-foreground">Tier:</span> {lead.packageTier}</div>}
                                {lead.budgetRange && <div><span className="text-muted-foreground">Budget:</span> {lead.budgetRange}</div>}
                                {lead.preferredCallTime && <div><span className="text-muted-foreground">Call Time:</span> {lead.preferredCallTime}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2 mb-2">
                                {lead.emailSent ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">Email</Badge>
                                ) : <Badge variant="outline" className="opacity-50">Email</Badge>}
                                {lead.smsSent ? (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">SMS</Badge>
                                ) : <Badge variant="outline" className="opacity-50">SMS</Badge>}
                                {lead.callInitiated ? (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">Call</Badge>
                                ) : <Badge variant="outline" className="opacity-50">Call</Badge>}
                              </div>
                            </TableCell>
                          </TableRow>
                          {expandedRows[lead._id] && (
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={6} className="p-4">
                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" /> Communication Log
                                  </h4>
                                  {lead.communicationLogs && lead.communicationLogs.length > 0 ? (
                                    <div className="grid gap-2">
                                      {lead.communicationLogs.map((log: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-background border text-sm">
                                          <div className="flex items-center gap-3">
                                            <Badge variant="outline" className={
                                              log.type === 'EMAIL' ? 'bg-green-50 text-green-700' :
                                              log.type === 'SMS' ? 'bg-blue-50 text-blue-700' :
                                              'bg-purple-50 text-purple-700'
                                            }>{log.type}</Badge>
                                            <span>{log.details || log.status}</span>
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {new Date(log.timestamp).toLocaleString()}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">No communication logs available.</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
