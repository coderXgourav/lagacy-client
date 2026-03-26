import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  Globe,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Banknote,
  FileText,
  BarChart3,
  RefreshCw,
  Search,
  Filter,
  Users,
  Target,
  Zap,
  Trash2,
  Eye,
  FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { kyptronixApi } from '@/services/api';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

const forms = [
  {
    id: "contact-us",
    title: "Contact Us",
    source: "Kyptronix Lead Form",
    icon: Mail,
    color: "blue"
  },
  {
    id: "download-company-profile",
    title: "Company Profile",
    source: "Kyptronix Download Company Profile Form",
    icon: FileText,
    color: "emerald"
  },
  {
    id: "download-business-card",
    title: "Business Card",
    source: "Business",
    icon: Building2,
    color: "amber"
  },
  {
    id: "request-proposal",
    title: "Proposal Request",
    source: "Proposal",
    icon: Target,
    color: "indigo"
  }
];

export default function KyptronixFormDetailsPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [selectedFormType, setSelectedFormType] = useState<string>(searchParams.get('type') || 'all');

  const [viewingLead, setViewingLead] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const type = searchParams.get('type') || 'all';
    setSelectedFormType(type);
    setCurrentPage(1); // Reset to page 1 on type change
  }, [searchParams]);

  const questionnaireFilters = [
    { label: 'All', value: 'all' },
    { label: 'SMO', value: 'smo' },
    { label: 'SEO', value: 'seo' },
    { label: 'Kyptronix', value: 'kyptronix' },
    { label: 'App Development', value: 'app-development' },
    { label: 'Automation', value: 'automation' },
    { label: 'Discovery', value: 'discovery' }
  ];

  const selectedForm = forms.find(f => f.id === formId);

  const fetchLeads = async (page: number) => {
    if (!selectedForm) return;
    try {
      setLoading(true);
      const limit = 10;
      let response;
      if (formId === 'request-proposal') {
        response = await kyptronixApi.getQuestionnaires(
          selectedFormType === 'all' ? undefined : selectedFormType, 
          page, 
          limit
        );
      } else {
        response = await kyptronixApi.getLeads(selectedForm.source, page, limit);
      }
      
      if (response && response.data) {
        setLeads(response.data);
        setTotalPages(response.totalPages || 1);
        setTotalLeads(response.totalLeads || 0);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch form submissions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedForm) {
      navigate('/kyptronix-form');
      return;
    }
    fetchLeads(currentPage);
  }, [selectedForm, currentPage, selectedFormType]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission? This action cannot be undone.')) return;
    
    try {
      if (formId === 'request-proposal') {
        await kyptronixApi.deleteQuestionnaire(id);
      } else {
        await kyptronixApi.deleteLead(id);
      }
      toast({
        title: "Success",
        description: "Submission deleted successfully",
      });
      fetchLeads(currentPage);
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast({
        title: "Error",
        description: "Failed to delete submission",
        variant: "destructive"
      });
    }
  };

  const StatusBadge = ({ sent, label, color }: { sent: boolean, label: string, color: string }) => (
    <Badge
      variant={sent ? "default" : "secondary"}
      className={sent ? `bg-${color}-500/10 text-${color}-500 border-${color}-500/20 text-[10px] font-bold uppercase tracking-wider` : 'bg-muted/50 text-muted-foreground border-border/50 text-[10px] font-bold uppercase tracking-wider'}
    >
      {label}
    </Badge>
  );

  const handleDownloadPdf = (lead: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo color
    doc.text('Kyptronix Form Submission', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm:ss')}`, 14, 30);
    
    // Core Info
    const coreInfo = [
      ['Submission ID', lead._id],
      ['Form Type', lead.formType || lead.source || 'N/A'],
      ['Submitter Name', lead.name || 'N/A'],
      ['Email', lead.email || 'N/A'],
      ['Phone', lead.phone || 'N/A'],
      ['Company', lead.companyName || lead.businessType || 'N/A'],
      ['Date', format(new Date(lead.submittedAt || lead.createdAt), 'MMM dd, yyyy HH:mm:ss')],
    ];

    autoTable(doc, {
      startY: 40,
      head: [['Field', 'Information']],
      body: coreInfo,
      theme: 'striped',
      headStyles: { fillStyle: 'fill', fillColor: [79, 70, 229] },
    });

    // Responses / Requirements
    if (lead.responses || lead.message) {
      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text('Submission Details', 14, (doc as any).lastAutoTable.finalY + 15);

      const responseData = lead.responses 
        ? Object.entries(lead.responses).map(([key, value]) => [
            key.replace(/([A-Z])/g, ' $1').trim(),
            String(value)
          ]) 
        : [['Message / Message', lead.message]];

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Question', 'Response']],
        body: responseData,
        theme: 'grid',
        headStyles: { fillStyle: 'fill', fillColor: [55, 65, 81] },
        styles: { overflow: 'linebreak' },
        columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
      });
    }

    doc.save(`Kyptronix_Submission_${lead.name || lead._id}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: "Submission report has been downloaded successfully.",
    });
  };

  if (!selectedForm) return null;

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-${selectedForm.color}-500/10 via-${selectedForm.color}-500/5 to-transparent border border-${selectedForm.color}-500/20 p-8 md:p-12`}>
        <div className={`absolute top-0 right-0 w-64 h-64 bg-${selectedForm.color}-500/5 rounded-full blur-3xl`} />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br from-${selectedForm.color}-600 to-${selectedForm.color}-800 shadow-lg shadow-${selectedForm.color}-600/20`}>
                <selectedForm.icon className="h-7 w-7 text-white" />
              </div>
              <div className={`px-2.5 py-0.5 rounded-full bg-${selectedForm.color}-500/10 text-${selectedForm.color}-600 border border-${selectedForm.color}-500/20 text-xs font-semibold tracking-wide uppercase`}>
                Submission Hub
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              {selectedForm.title} Intelligence
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Analyzing submissons from <span className={`text-${selectedForm.color}-600 font-bold uppercase tracking-tight`}>{selectedForm.source}</span>.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button
              onClick={() => fetchLeads(currentPage)}
              variant="outline"
              className="h-12 gap-2 bg-card/50 backdrop-blur-sm border-border hover:bg-muted/50 transition-all font-semibold"
            >
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Sync Data
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Intake", value: totalLeads, icon: Users, color: selectedForm.color, sub: "All time submissions" },
          { label: "Active Pipeline", value: leads.length, icon: Target, color: "indigo", sub: "Current view results" },
          { label: "Engagement Rate", value: "94%", icon: Zap, color: "emerald", sub: "Form completion ratio" },
          { label: "Avg. Velocity", value: "2.4h", icon: Clock, color: "blue", sub: "Lead response time" }
        ].map((s, idx) => (
          <Card key={idx} className="border-border bg-card/30 backdrop-blur-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all p-1">
            <div className={`absolute top-0 left-0 w-1 h-full bg-${s.color}-500`} />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="font-semibold text-[10px] uppercase tracking-wider">{s.label}</CardDescription>
                <s.icon className={`h-4 w-4 text-${s.color}-500`} />
              </div>
              <CardTitle className="text-3xl font-extrabold tracking-tight">{s.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submissions Section */}
      <Card className="border-border bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden relative">
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${selectedForm.color}-500/50 to-transparent`} />
        <CardHeader className="py-8 bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className={`w-6 h-6 text-${selectedForm.color}-600`} />
                Live Submission Feed
              </CardTitle>
              <CardDescription className="text-sm font-medium">Real-time engagement tracking and analysis</CardDescription>
            </div>
            
            {formId === 'request-proposal' && (
              <div className="flex flex-wrap gap-2 pt-4 md:pt-0">
                {questionnaireFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedFormType === filter.value ? "default" : "outline"}
                    size="sm"
                    className={`text-[10px] font-bold uppercase tracking-widest rounded-xl h-8 px-4 transition-all duration-300 ${
                      selectedFormType === filter.value 
                        ? `bg-${selectedForm.color}-600 hover:bg-${selectedForm.color}-700 shadow-lg shadow-${selectedForm.color}-600/20` 
                        : "bg-background/50 border-border hover:bg-muted"
                    }`}
                    onClick={() => {
                      setSelectedFormType(filter.value);
                      setCurrentPage(1);
                    }}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  className="pl-10 pr-4 py-2 bg-background/50 border border-border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64 transition-all"
                />
              </div>
              <Button variant="outline" size="icon" className="rounded-xl border-border bg-background/50">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className={`h-12 w-12 text-${selectedForm.color}-500 animate-spin`} />
              <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest animate-pulse">Retrieving encrypted leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-32 bg-muted/5 border-y border-border/50">
              <FileText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
              <p className="text-muted-foreground text-xl font-medium tracking-tight">No submissions detected in this channel.</p>
              <Button variant="link" onClick={() => navigate('/kyptronix-form')} className="mt-2 text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Back to Directory</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-muted/30 border-y border-border/50">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-xs text-muted-foreground"></th>
                    <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">Prospect Intel</th>
                    <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">Entity Details</th>
                    <th className="px-6 py-4 font-semibold text-xs text-muted-foreground">Requirements</th>
                    <th className="px-6 py-4 font-semibold text-xs text-muted-foreground text-center">Engagement Status</th>
                    <th className="px-6 py-4 font-semibold text-xs text-muted-foreground text-right">Intake Vector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {leads.map((lead) => (
                    <Collapsible
                      key={lead._id}
                      asChild
                      open={expandedRow === lead._id}
                      onOpenChange={() => setExpandedRow(expandedRow === lead._id ? null : lead._id)}
                    >
                      <>
                        <tr className="hover:bg-indigo-500/[0.02] transition-colors group cursor-pointer border-l-2 border-l-transparent hover:border-l-indigo-500">
                          <td className="px-6 py-6 w-24">
                            <div className="flex items-center gap-2">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted p-0">
                                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedRow === lead._id ? 'rotate-180 text-indigo-600' : 'text-muted-foreground/50'}`} />
                                </Button>
                              </CollapsibleTrigger>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-600 text-muted-foreground transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingLead(lead);
                                  setIsViewModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPdf(lead);
                                }}
                              >
                                <FileDown className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(lead._id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-foreground text-sm group-hover:text-indigo-600 transition-colors">{lead.name}</span>
                              <div className="flex items-center gap-3">
                                <a href={`mailto:${lead.email}`} className="text-xs text-muted-foreground font-medium hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                                  <Mail className="h-3 w-3" /> {lead.email}
                                </a>
                                {lead.phone && (
                                  <a href={`tel:${lead.phone}`} className="text-xs text-muted-foreground font-medium hover:text-indigo-600 flex items-center gap-1.5 transition-colors">
                                    <Phone className="h-3 w-3" /> {lead.phone}
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Building2 className="h-3 w-3 text-muted-foreground" /> {lead.companyName || "Private Individual"}
                              </span>
                              {lead.website && (
                                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 font-medium hover:underline flex items-center gap-1.5">
                                  <Globe className="h-3 w-3" /> {lead.website.replace(/^https?:\/\//, '')}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-6 font-bold">
                            <div className="flex flex-wrap gap-1.5 ">
                              {lead.formType && (
                                <Badge variant="default" className={`text-[9px] font-bold uppercase tracking-wider h-5 bg-${selectedForm.color}-500/10 text-${selectedForm.color}-600 border-${selectedForm.color}-500/20`}>
                                  {lead.formType}
                                </Badge>
                              )}
                              {lead.serviceCategory && <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider h-5 bg-background/50">{lead.serviceCategory}</Badge>}
                              {lead.budgetRange && <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider h-5 border-emerald-500/20 text-emerald-600 bg-emerald-500/5">{lead.budgetRange}</Badge>}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center justify-center gap-1.5">
                              <StatusBadge sent={lead.emailSent} label="E" color="indigo" />
                              <StatusBadge sent={lead.smsSent} label="S" color="blue" />
                              <StatusBadge sent={lead.callInitiated} label="C" color="emerald" />
                            </div>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs font-medium text-foreground tabular-nums">{format(new Date(lead.submittedAt || lead.createdAt), 'MMM dd, yyyy')}</span>
                              <span className="text-xs text-muted-foreground font-medium tabular-nums">{format(new Date(lead.submittedAt || lead.createdAt), 'HH:mm:ss')}</span>
                            </div>
                          </td>
                        </tr>
                        <CollapsibleContent asChild>
                          <tr>
                            <td colSpan={6} className="bg-indigo-500/[0.01] px-6 py-0 overflow-hidden">
                              <div className="py-8 px-12 space-y-8 animate-slide-up border-x-2 border-indigo-500/10">
                                {lead.message && (
                                  <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                        <FileText className="h-4 w-4 text-indigo-600" />
                                      </div>
                                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Requirements Manifest</h4>
                                    </div>
                                    <div className="bg-card/50 backdrop-blur-md rounded-2xl border border-border p-6 shadow-xl relative overflow-hidden group">
                                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Zap className="h-12 w-12 text-indigo-500" />
                                      </div>
                                      <p className="text-sm text-foreground leading-relaxed font-medium">
                                        {lead.message}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                  {formId === 'request-proposal' && lead.responses ? (
                                    Object.entries(lead.responses).filter(([_, val]) => val).map(([key, val], i) => (
                                      <div key={i} className="p-4 rounded-xl bg-background/40 border border-border flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                          <CheckCircle2 className={`h-3 w-3 text-${selectedForm.color}-500`} />
                                          {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </div>
                                        <div className="text-xs font-bold text-foreground line-clamp-2" title={String(val)}>{String(val)}</div>
                                      </div>
                                    ))
                                  ) : (
                                    [
                                      { label: "Target Service", value: lead.service, icon: CheckCircle2, color: "emerald" },
                                      { label: "Business Sector", value: lead.businessType, icon: Building2, color: "indigo" },
                                      { label: "Quoted Valuation", value: lead.price, icon: Banknote, color: "blue" },
                                      { label: "Preferred Sync", value: lead.preferredCallTime, icon: Clock, color: "amber" }
                                    ].map((attr, i) => (
                                      attr.value && (
                                        <div key={i} className="p-4 rounded-xl bg-background/40 border border-border flex flex-col gap-2">
                                          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                            <attr.icon className={`h-3 w-3 text-${attr.color}-500`} />
                                            {attr.label}
                                          </div>
                                          <div className="text-xs font-bold text-foreground">{attr.value}</div>
                                        </div>
                                      )
                                    ))
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        <div className="px-8 py-6 bg-muted/20 border-t border-border/50 flex items-center justify-between">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Displaying intelligence page <span className="text-foreground">{currentPage}</span> of <span className="text-foreground">{totalPages}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="rounded-xl border-border bg-background/50 h-9 px-4 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i + 1 === currentPage ? 'bg-indigo-600 scale-125' : 'bg-muted-foreground/30'}`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="rounded-xl border-border bg-background/50 h-9 px-4 font-bold text-[10px] uppercase tracking-widest transition-all hover:bg-muted"
            >
              Next <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Submission View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border shadow-2xl">
          <DialogHeader className="border-b border-border pb-6">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${selectedForm.color}-500/10`}>
                    <selectedForm.icon className={`h-6 w-6 text-${selectedForm.color}-600`} />
                  </div>
                  Full Form Submission
                </DialogTitle>
                <DialogDescription className="text-sm font-medium mt-1">
                  Submission ID: <span className="text-indigo-600 font-bold tabular-nums">{viewingLead?._id}</span>
                </DialogDescription>
              </div>
              <Button 
                variant="default"
                className={`bg-${selectedForm.color}-600 hover:bg-${selectedForm.color}-700 shadow-lg shadow-${selectedForm.color}-600/20 gap-2 h-11 px-6 rounded-xl font-bold`}
                onClick={() => handleDownloadPdf(viewingLead)}
              >
                <FileDown className="h-4 w-4" />
                Export as PDF
              </Button>
            </div>
          </DialogHeader>

          {viewingLead && (
            <div className="py-8 space-y-10 group">
              {/* Primary Profile */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Prospect Details</div>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">{viewingLead.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">{viewingLead.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Phone className="h-3 w-3" /> {viewingLead.phone || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Entity & Source</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Building2 className="h-4 w-4 text-indigo-500" /> {viewingLead.companyName || 'Private Individual'}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600">
                      <Badge variant="outline" className="text-[10px] border-indigo-500/20 bg-indigo-500/5">{viewingLead.formType || selectedForm.source}</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Timestamp</div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Clock className="h-4 w-4 text-amber-500" /> {format(viewingLead.submittedAt ? new Date(viewingLead.submittedAt) : viewingLead.createdAt ? new Date(viewingLead.createdAt) : new Date(), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs font-bold text-muted-foreground tabular-nums">
                      {format(viewingLead.submittedAt ? new Date(viewingLead.submittedAt) : viewingLead.createdAt ? new Date(viewingLead.createdAt) : new Date(), 'HH:mm:ss')} (Server Time)
                    </div>
                  </div>
                </div>
              </div>

              {/* Comprehensive Response Grid */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Requirements Manifest</span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingLead.responses ? (
                    Object.entries(viewingLead.responses).filter(([_, v]) => v && v !== 'on').map(([key, val], idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-card border border-border/80 hover:border-indigo-500/30 transition-all group/item shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className={`h-3 w-3 text-${selectedForm.color}-500 opacity-0 group-hover/item:opacity-100 transition-opacity`} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground leading-relaxed break-words">{String(val)}</p>
                      </div>
                    ))
                  ) : viewingLead.message ? (
                    <div className="col-span-2 p-6 rounded-2xl bg-card border border-border shadow-sm">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 opacity-40">Direct Requirements Message</div>
                      <p className="text-sm font-medium text-foreground leading-relaxed italic">{viewingLead.message}</p>
                    </div>
                  ) : (
                    <div className="col-span-2 text-center py-10 opacity-40 italic text-sm">No structured response data available for this submission.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-6">
            <Button variant="ghost" onClick={() => setIsViewModalOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Close Inspector</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
