import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { searchesApi, leadsApi } from "@/services/api";
import { Search, Eye, Calendar, Database, Trash2, RefreshCw, TrendingUp, Users, Filter, Mail, Phone, Building2, MapPin, Globe, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface SearchType {
  _id: string;
  query: string;
  searchType: string;
  status: string;
  resultsCount: number;
  apiUsed: string;
  executedAt: string;
  createdAt: string;
}

interface LeadType {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  industry: string;
  source: string;
  status: string;
  notes: string;
  createdAt: string;
}

const RecentSearches = () => {
  const [searches, setSearches] = useState<SearchType[]>([]);
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [selectedSearch, setSelectedSearch] = useState<SearchType | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadType | null>(null);
  const [loading, setLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [showLeadsDialog, setShowLeadsDialog] = useState(false);
  const [showLeadDetailDialog, setShowLeadDetailDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    setLoading(true);
    try {
      const response = await searchesApi.getRecentSearches(20);
      if (response.success) {
        setSearches(response.data);
      }
    } catch (error) {
      console.error("Error fetching searches:", error);
      toast({
        title: "Error",
        description: "Failed to load recent searches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsBySearch = async (searchId: string) => {
    setLeadsLoading(true);
    try {
      const response = await leadsApi.getLeadsBySearchId(searchId);
      if (response.success) {
        setLeads(response.data);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads for this search",
        variant: "destructive"
      });
    } finally {
      setLeadsLoading(false);
    }
  };

  const handleViewLeads = async (search: SearchType) => {
    setSelectedSearch(search);
    setShowLeadsDialog(true);
    await fetchLeadsBySearch(search._id);
  };

  const handleViewLeadDetails = (lead: LeadType) => {
    setSelectedLead(lead);
    setShowLeadDetailDialog(true);
  };

  const handleDeleteSearch = async (id: string) => {
    if (!confirm("Are you sure you want to delete this search and all associated leads?")) {
      return;
    }
    
    try {
      await searchesApi.deleteSearch(id);
      toast({
        title: "Success",
        description: "Search deleted successfully"
      });
      fetchSearches();
    } catch (error) {
      console.error("Error deleting search:", error);
      toast({
        title: "Error",
        description: "Failed to delete search",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getLeadStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      new: "default",
      contacted: "secondary",
      qualified: "default",
      closed: "default",
      lost: "destructive"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Recent Searches
              </h1>
              <p className="text-muted-foreground mt-1">Manage your search history and discover leads</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={fetchSearches} 
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Searches</p>
                <p className="text-3xl font-bold mt-2">{searches.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Search className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold mt-2">
                  {searches.reduce((acc, s) => acc + s.resultsCount, 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold mt-2">
                  {searches.filter(s => s.status === 'completed').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <CheckCircle2 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xl border-0 bg-gradient-to-br from-card via-card to-card/50">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                Search History
              </CardTitle>
              <CardDescription className="mt-2">Track and manage all your lead search activities</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="text-muted-foreground font-medium">Loading searches...</p>
            </div>
          ) : searches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="p-4 rounded-full bg-muted/50">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-muted-foreground">No searches found</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Start a new search to discover leads and they'll appear here for you to manage.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-bold">Query</TableHead>
                    <TableHead className="font-bold">Type</TableHead>
                    <TableHead className="font-bold">API</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-center">Results</TableHead>
                    <TableHead className="font-bold">Date</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searches.map((search, index) => (
                    <TableRow 
                      key={search._id} 
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          {search.query}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-medium">
                          {search.searchType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-muted-foreground">
                          {search.apiUsed}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(search.status)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-bold">
                          {search.resultsCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(search.executedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleViewLeads(search)}
                            className="gap-2 shadow-sm"
                          >
                            <Eye className="h-4 w-4" />
                            View Leads
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteSearch(search._id)}
                            className="shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads Dialog */}
      <Dialog open={showLeadsDialog} onOpenChange={setShowLeadsDialog}>
        <DialogContent className="max-w-7xl max-h-[85vh]">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl">
                  Leads for: <span className="text-primary">{selectedSearch?.query}</span>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Total leads: <strong>{leads.length}</strong>
                  </span>
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Status: {getStatusBadge(selectedSearch?.status || 'pending')}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <ScrollArea className="h-[calc(85vh-180px)] pr-4">
            {leadsLoading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="p-4 rounded-full bg-muted/50">
                  <Users className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-muted-foreground">No leads found</p>
                  <p className="text-sm text-muted-foreground">
                    This search hasn't generated any leads yet.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-bold">Contact</TableHead>
                      <TableHead className="font-bold">Company</TableHead>
                      <TableHead className="font-bold">Phone</TableHead>
                      <TableHead className="font-bold">Location</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Source</TableHead>
                      <TableHead className="font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead._id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-semibold">{lead.name}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{lead.company || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {lead.phone || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {lead.city || lead.state ? `${lead.city || ''} ${lead.state || ''}`.trim() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>{getLeadStatusBadge(lead.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {lead.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleViewLeadDetails(lead)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Lead Details Dialog */}
      <Dialog open={showLeadDetailDialog} onOpenChange={setShowLeadDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {selectedLead?.name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedLead?.email}
                  </span>
                  {selectedLead?.status && (
                    <span>
                      {getLeadStatusBadge(selectedLead.status)}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedLead && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone</Label>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        {selectedLead.phone || 'Not provided'}
                      </p>
                    </div>
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary" />
                        {selectedLead.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <Building2 className="h-5 w-5" />
                    Company Details
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Company</Label>
                      <p className="text-sm font-medium">{selectedLead.company || 'Not provided'}</p>
                    </div>
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Industry</Label>
                      <p className="text-sm font-medium">{selectedLead.industry || 'Not specified'}</p>
                    </div>
                    <div className="col-span-2 space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Website
                      </Label>
                      <p className="text-sm font-medium">
                        {selectedLead.website ? (
                          <a 
                            href={selectedLead.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {selectedLead.website}
                            <Globe className="h-3 w-3" />
                          </a>
                        ) : (
                          'Not provided'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <MapPin className="h-5 w-5" />
                    Location
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">City</Label>
                      <p className="text-sm font-medium">{selectedLead.city || 'N/A'}</p>
                    </div>
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">State</Label>
                      <p className="text-sm font-medium">{selectedLead.state || 'N/A'}</p>
                    </div>
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Country</Label>
                      <p className="text-sm font-medium">{selectedLead.country || 'N/A'}</p>
                    </div>
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Zip Code</Label>
                      <p className="text-sm font-medium">{selectedLead.zipCode || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedLead.address && (
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Address</Label>
                      <p className="text-sm font-medium">{selectedLead.address}</p>
                    </div>
                  )}
                </div>

                {/* Additional Information */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <Database className="h-5 w-5" />
                    Additional Details
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Source</Label>
                      <div className="text-sm font-medium">
                        <Badge variant="outline" className="font-semibold">{selectedLead.source}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created
                      </Label>
                      <p className="text-sm font-medium">
                        {new Date(selectedLead.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {selectedLead.notes && (
                    <div className="space-y-2 p-4 rounded-lg bg-muted/30 border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Notes</Label>
                      <p className="text-sm font-medium leading-relaxed">{selectedLead.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecentSearches;
