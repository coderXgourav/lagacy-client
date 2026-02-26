import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Zap
} from 'lucide-react';
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
    source: "Kyptronix Business Form",
    icon: Building2,
    color: "amber"
  },
  {
    id: "request-proposal",
    title: "Proposal Request",
    source: "Kyptronix Contact Form",
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

  const selectedForm = forms.find(f => f.id === formId);

  useEffect(() => {
    if (!selectedForm) {
      navigate('/kyptronix-form');
      return;
    }
    fetchLeads(currentPage);
  }, [selectedForm, currentPage]);

  const fetchLeads = async (page: number) => {
    if (!selectedForm) return;
    try {
      setLoading(true);
      const limit = 10;
      const response = await kyptronixApi.getLeads(selectedForm.source, page, limit);
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

  const StatusBadge = ({ sent, label, color }: { sent: boolean, label: string, color: string }) => (
    <Badge
      variant={sent ? "default" : "secondary"}
      className={sent ? `bg-${color}-500/10 text-${color}-500 border-${color}-500/20 text-[10px] font-bold uppercase tracking-wider` : 'bg-muted/50 text-muted-foreground border-border/50 text-[10px] font-bold uppercase tracking-wider'}
    >
      {label}
    </Badge>
  );

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
                          <td className="px-6 py-6 w-12">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted p-0">
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedRow === lead._id ? 'rotate-180 text-indigo-600' : 'text-muted-foreground/50'}`} />
                              </Button>
                            </CollapsibleTrigger>
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
                          <td className="px-6 py-6">
                            <div className="flex flex-wrap gap-1.5">
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
                              <span className="text-xs font-medium text-foreground tabular-nums">{format(new Date(lead.createdAt), 'MMM dd, yyyy')}</span>
                              <span className="text-xs text-muted-foreground font-medium tabular-nums">{format(new Date(lead.createdAt), 'HH:mm:ss')}</span>
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
                                  {[
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
                                  ))}
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
    </div>
  );
}
