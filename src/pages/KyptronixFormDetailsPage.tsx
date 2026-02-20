import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Mail, Phone, Building2, Globe, ArrowLeft, Loader2, CheckCircle2, ChevronDown, Clock, Banknote, HelpCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { kyptronixApi } from '@/services/api';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";

const forms = [
  {
    id: "contact-us",
    title: "Contact Us",
    source: "Kyptronix Lead Form",
  },
  {
    id: "download-company-profile",
    title: "Download Company Profile",
    source: "Kyptronix Download Company Profile Form",
  },
  {
    id: "download-business-card",
    title: "Download Business Card",
    source: "Kyptronix Business Form",
  },
  {
    id: "request-proposal",
    title: "Request a Proposal",
    source: "Kyptronix Contact Form",
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

  const StatusBadge = ({ sent, label }: { sent: boolean, label: string }) => (
    <Badge 
      variant={sent ? "default" : "secondary"}
      className={`${sent ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-400'} text-xs`}
    >
      {label}
    </Badge>
  );

  if (!selectedForm) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/kyptronix-form')}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Forms
        </Button>

        <Card className="bg-[#1e293b] border-slate-700">
          <CardHeader className="border-b border-slate-800 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl text-white">{selectedForm.title} Submissions</CardTitle>
                <p className="text-sm text-slate-400 mt-1">
                  Showing leads for: <span className="text-blue-400 font-medium">{selectedForm.source}</span>
                </p>
              </div>
              <div className="text-sm text-slate-400">
                Total Submissions: <span className="text-white font-medium">{totalLeads}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
                <FileText className="w-12 h-12 text-slate-600" />
                <p>No submissions found for this form.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800 border-b border-slate-800">
                <div className="grid grid-cols-[40px_1fr_2fr_1.5fr_1.5fr_1fr] gap-4 p-4 text-sm font-medium text-slate-400 bg-slate-900/50">
                  <div></div>
                  <div>Date</div>
                  <div>Contact Info</div>
                  <div>Company Details</div>
                  <div>Request Details</div>
                  <div>Outreach Status</div>
                </div>
                
                {leads.map((lead) => (
                  <Collapsible
                    key={lead._id}
                    open={expandedRow === lead._id}
                    onOpenChange={() => setExpandedRow(expandedRow === lead._id ? null : lead._id)}
                    className="group"
                  >
                    <div className="grid grid-cols-[40px_1fr_2fr_1.5fr_1.5fr_1fr] gap-4 p-4 text-sm items-start hover:bg-slate-800/50 transition-colors">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6 mt-1 text-slate-500 hover:text-white">
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedRow === lead._id ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      
                      <div className="pt-1 text-slate-300">
                        {format(new Date(lead.createdAt), 'M/d/yyyy')}
                        <div className="text-xs text-slate-500 mt-0.5">
                          {format(new Date(lead.createdAt), 'h:mm:ss a')}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="font-medium text-slate-200">{lead.name}</div>
                        <div className="flex items-center text-slate-400 text-xs">
                          <Mail className="w-3 h-3 mr-1.5 text-blue-400/70" />
                          <a href={`mailto:${lead.email}`} className="hover:text-blue-400 transition-colors">
                            {lead.email}
                          </a>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center text-slate-400 text-xs">
                            <Phone className="w-3 h-3 mr-1.5 text-blue-400/70" />
                            <a href={`tel:${lead.phone}`} className="hover:text-blue-400 transition-colors">
                              {lead.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <div className="flex flex-col gap-1.5">
                          {lead.companyName && (
                            <div className="flex items-center text-slate-300 font-medium">
                              <Building2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                              {lead.companyName}
                            </div>
                          )}
                          {!lead.companyName && (
                            <div className="flex items-center text-slate-500 text-xs italic">
                              <Building2 className="w-3.5 h-3.5 mr-1.5" />
                              -
                            </div>
                          )}
                          {lead.website && (
                            <div className="flex items-center text-blue-400/80 hover:text-blue-400 text-xs transition-colors">
                              <Globe className="w-3 h-3 mr-1.5" />
                              <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer">
                                {lead.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1 text-xs">
                        {lead.serviceCategory && (
                          <div className="flex items-start">
                            <span className="text-slate-500 w-16">Category:</span>
                            <span className="text-slate-300 font-medium">{lead.serviceCategory}</span>
                          </div>
                        )}
                        {lead.packageTier && (
                          <div className="flex items-start">
                            <span className="text-slate-500 w-16">Tier:</span>
                            <span className="text-slate-300">{lead.packageTier}</span>
                          </div>
                        )}
                        {lead.budgetRange && (
                          <div className="flex items-start">
                            <span className="text-slate-500 w-16">Budget:</span>
                            <span className="text-emerald-400/90">{lead.budgetRange}</span>
                          </div>
                        )}
                        {lead.preferredCallTime && (
                          <div className="flex items-start">
                            <span className="text-slate-500 w-16">Call Time:</span>
                            <span className="text-slate-300">{lead.preferredCallTime}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <StatusBadge sent={lead.emailSent} label="Email" />
                        <StatusBadge sent={lead.smsSent} label="SMS" />
                        <StatusBadge sent={lead.callInitiated} label="Call" />
                      </div>
                    </div>

                    <CollapsibleContent>
                      <div className="pl-[56px] pr-4 py-4 bg-slate-900/30 border-t border-slate-800/50">
                        {lead.message && (
                          <div className="space-y-2 mb-6">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center">
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                              Message / Requirements
                            </h4>
                            <p className="text-sm text-slate-300 bg-slate-900 p-4 rounded-lg border border-slate-800 leading-relaxed">
                              {lead.message}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {lead.service && (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                              <div className="text-xs text-slate-500 mb-1 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Requested Service
                              </div>
                              <div className="font-medium text-slate-300 text-sm">{lead.service}</div>
                            </div>
                          )}
                          
                          {lead.businessType && (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                              <div className="text-xs text-slate-500 mb-1 flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                Business Type
                              </div>
                              <div className="font-medium text-slate-300 text-sm">{lead.businessType}</div>
                            </div>
                          )}

                          {lead.price && (
                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                              <div className="text-xs text-slate-500 mb-1 flex items-center">
                                <Banknote className="w-3 h-3 mr-1" />
                                Quoted Price
                              </div>
                              <div className="font-medium text-emerald-400 text-sm">{lead.price}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
            
            {!loading && leads.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="text-sm text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="border-slate-700 hover:bg-slate-800 text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="border-slate-700 hover:bg-slate-800 text-slate-300"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
