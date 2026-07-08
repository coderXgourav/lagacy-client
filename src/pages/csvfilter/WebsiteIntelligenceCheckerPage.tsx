import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    Loader2, Upload, Download, ArrowLeft, RefreshCw, Play, Search,
    CheckCircle, XCircle, MapPin, Star, Facebook, Twitter, Instagram, Youtube, Link2, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

type Step = 'upload' | 'map' | 'processing' | 'results';

interface BusinessResult {
    company: string;
    website: string;
    isLive: boolean;
    error: string | null;
    pageSpeedScore: number | null;
    loadTimeSeconds: number | null;
    auditIssues: string[];
    techStack: string[];
    runningGoogleAdsTracking: boolean;
    runningGoogleAds: boolean;
    googleAds: { advertiser?: string; format?: string; firstShown?: string; lastShown?: string; totalDaysShown?: number; detailsLink?: string }[];
    runningMetaAds: boolean;
    metaAds: { text?: string; imageUrl?: string; startDate?: string; adLibraryUrl?: string }[];
    gmbFound: boolean;
    gmbRating: number | null;
    gmbReviewsCount: number;
    gmbUrl: string;
    socialLinks: { facebook: string; twitter: string; instagram: string; youtube: string; linkedin: string };
    originalRow: Record<string, string>;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BATCH_SIZE = 6;

export default function WebsiteIntelligenceCheckerPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('upload');
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);

    const [companyColumn, setCompanyColumn] = useState('');
    const [websiteColumn, setWebsiteColumn] = useState('');
    const [facebookColumn, setFacebookColumn] = useState('none');
    const [cityColumn, setCityColumn] = useState('none');
    const [stateColumn, setStateColumn] = useState('none');
    const [countryColumn, setCountryColumn] = useState('none');

    const [processedCount, setProcessedCount] = useState(0);
    const [totalToProcess, setTotalToProcess] = useState(0);
    const [results, setResults] = useState<BusinessResult[]>([]);
    const [selectedResult, setSelectedResult] = useState<BusinessResult | null>(null);

    // Column name conventions vary wildly across sheets (a WHOIS export uses
    // "registrant_company"/"domain_name"/"registrant_city" while another sheet might use
    // "Business Name"/"Website"/"City"). Keyword-substring matching handles most naming styles
    // automatically, but the ORDER of checks matters: a generic "name" column must lose to an
    // explicit "company" column (WHOIS's "registrant_name" is a person, not the business), and
    // a dedicated "country" column must win over "city"/"state" even if one of those happens to
    // appear earlier in the sheet.
    const applyParsedData = (fields: string[], rows: Record<string, string>[]) => {
        setHeaders(fields);
        setParsedRows(rows);

        const find = (keywords: string[]) => fields.find(h => {
            const low = h.toLowerCase();
            return keywords.some(k => low.includes(k));
        });

        setCompanyColumn(find(['company', 'business', 'organization']) || find(['name']) || fields[0] || '');
        setWebsiteColumn(find(['domain', 'website', 'url', 'site']) || '');
        setFacebookColumn(find(['facebook', 'fb']) || 'none');
        setCityColumn(find(['city', 'town']) || 'none');
        setStateColumn(find(['state', 'province']) || 'none');
        setCountryColumn(find(['country']) || find(['location', 'nation', 'region']) || 'none');

        setStep('map');
    };

    const parseHeaders = (targetFile: File) => {
        const isExcel = /\.(xlsx|xls)$/i.test(targetFile.name);

        if (isExcel) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const buffer = e.target?.result as ArrayBuffer;
                    const wb = XLSX.read(buffer, { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const rows2d = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
                    if (rows2d.length < 1) {
                        toast.error("This sheet appears to be empty.");
                        return;
                    }
                    const fields = rows2d[0].map((h: any) => String(h || '').trim()).filter(Boolean);
                    const rows = rows2d.slice(1).map(r => {
                        const obj: Record<string, string> = {};
                        fields.forEach((f, i) => { obj[f] = String(r[i] ?? '').trim(); });
                        return obj;
                    });
                    applyParsedData(fields, rows);
                } catch (err: any) {
                    toast.error("Error reading Excel file: " + err.message);
                }
            };
            reader.readAsArrayBuffer(targetFile);
            return;
        }

        Papa.parse(targetFile, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: (parseResults) => {
                const fields = parseResults.meta?.fields;
                if (!fields || fields.length === 0) {
                    toast.error("Could not parse file headers. Is this a valid CSV?");
                    return;
                }
                applyParsedData(fields, parseResults.data as Record<string, string>[]);
            },
            error: (err) => toast.error("Error reading file: " + err.message),
        });
    };

    const isSupportedFile = (name: string) => /\.(csv|xlsx|xls)$/i.test(name);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) { setFile(f); parseHeaders(f); }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f && isSupportedFile(f.name)) { setFile(f); parseHeaders(f); }
        else toast.error("Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)");
    };

    const startAnalysis = async () => {
        if (!companyColumn || !websiteColumn) {
            toast.error("Please select both a Company and a Website column.");
            return;
        }

        setStep('processing');
        setProcessedCount(0);
        setTotalToProcess(parsedRows.length);
        const token = localStorage.getItem("token");
        const collected: BusinessResult[] = [];

        const businesses = parsedRows.map(row => {
            // Combine city/state/country into one richer location string when the sheet has
            // them as separate columns (e.g. a WHOIS export) — gives the Google Business
            // Profile lookup more to match on than a bare country name would.
            const locationParts = [
                cityColumn !== 'none' ? row[cityColumn] : '',
                stateColumn !== 'none' ? row[stateColumn] : '',
                countryColumn !== 'none' ? row[countryColumn] : '',
            ].filter(Boolean);

            return {
                company: row[companyColumn] || '',
                website: row[websiteColumn] || '',
                facebookUrl: facebookColumn !== 'none' ? row[facebookColumn] : undefined,
                country: locationParts.length > 0 ? locationParts.join(', ') : undefined,
                originalRow: row,
            };
        });

        for (let i = 0; i < businesses.length; i += BATCH_SIZE) {
            const batch = businesses.slice(i, i + BATCH_SIZE);
            const withWebsite = batch.filter(b => b.website.trim());
            const withoutWebsite = batch.filter(b => !b.website.trim());

            withoutWebsite.forEach(b => {
                collected.push({
                    company: b.company, website: '', isLive: false, error: 'No website provided',
                    pageSpeedScore: null, loadTimeSeconds: null, auditIssues: [], techStack: [],
                    runningGoogleAdsTracking: false, runningGoogleAds: false, googleAds: [],
                    runningMetaAds: false, metaAds: [], gmbFound: false, gmbRating: null, gmbReviewsCount: 0, gmbUrl: '',
                    socialLinks: { facebook: b.facebookUrl || '', twitter: '', instagram: '', youtube: '', linkedin: '' },
                    originalRow: b.originalRow,
                });
            });

            if (withWebsite.length > 0) {
                try {
                    const response = await axios.post(
                        `${API_URL}/website-intelligence/analyze-batch`,
                        { businesses: withWebsite.map(({ originalRow, ...b }) => b) },
                        { headers: { Authorization: `Bearer ${token}` }, timeout: 300000 }
                    );
                    const batchResults: Omit<BusinessResult, 'originalRow'>[] = response.data?.results || [];
                    batchResults.forEach((r, idx) => {
                        collected.push({ ...r, originalRow: withWebsite[idx].originalRow });
                    });
                } catch (err: any) {
                    withWebsite.forEach(b => {
                        collected.push({
                            company: b.company, website: b.website, isLive: false, error: err.message || 'Request failed',
                            pageSpeedScore: null, loadTimeSeconds: null, auditIssues: [], techStack: [],
                            runningGoogleAdsTracking: false, runningGoogleAds: false, googleAds: [],
                            runningMetaAds: false, metaAds: [], gmbFound: false, gmbRating: null, gmbReviewsCount: 0, gmbUrl: '',
                            socialLinks: { facebook: b.facebookUrl || '', twitter: '', instagram: '', youtube: '', linkedin: '' },
                            originalRow: b.originalRow,
                        });
                    });
                }
            }

            setProcessedCount(Math.min(i + BATCH_SIZE, businesses.length));
        }

        setResults(collected);
        setStep('results');
    };

    const handleDownload = () => {
        if (results.length === 0) return;
        const exportData = results.map(r => ({
            ...r.originalRow,
            'Website Audit Score': r.pageSpeedScore ?? 'N/A',
            'Load Time (s)': r.loadTimeSeconds ?? 'N/A',
            'Flagged Issues': r.auditIssues.join('; '),
            'Technology': r.techStack.join(', '),
            'Meta Ads Running': r.runningMetaAds ? 'YES' : 'NO',
            'Google Ads Running': r.runningGoogleAds ? 'YES' : 'NO',
            'Google Business Profile': r.gmbFound ? `${r.gmbRating ?? 'N/A'}★ (${r.gmbReviewsCount} reviews)` : 'Not found',
            'Facebook': r.socialLinks.facebook,
            'Twitter': r.socialLinks.twitter,
            'Instagram': r.socialLinks.instagram,
            'YouTube': r.socialLinks.youtube,
            'LinkedIn': r.socialLinks.linkedin,
        }));
        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const baseName = file?.name.replace(/\.[^/.]+$/, "") || "website_intelligence";
        link.setAttribute('download', `${baseName}_enriched.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started!");
    };

    const resetState = () => {
        setFile(null); setHeaders([]); setParsedRows([]);
        setCompanyColumn(''); setWebsiteColumn(''); setFacebookColumn('none');
        setCityColumn('none'); setStateColumn('none'); setCountryColumn('none');
        setResults([]); setProcessedCount(0); setTotalToProcess(0);
        setStep('upload');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="flex flex-col w-full max-w-5xl mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/offerings')} className="h-9 w-9 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
                            <Search className="h-6 w-6 text-primary" /> Website Signal Checker
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Upload a sheet of businesses — get real website audit, ads status, tech stack, and social media back for each one.
                        </p>
                    </div>
                </div>
                {step !== 'upload' && (
                    <Button variant="outline" size="sm" onClick={resetState} className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Start Over
                    </Button>
                )}
            </div>

            {step === 'upload' && (
                <Card>
                    <CardContent className="pt-6">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                        >
                            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                            <p className="font-semibold">Drop your CSV or Excel file here, or click to browse</p>
                            <p className="text-sm text-muted-foreground mt-1">Needs at least a company name column and a website/domain column — works with any naming convention (e.g. "registrant_company"/"domain_name" from a WHOIS export, or "Business Name"/"Website"). Facebook URL, city, state, and country columns are optional but improve accuracy.</p>
                            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 'map' && (
                <Card>
                    <CardHeader><CardTitle>Map Your Columns</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Company Name Column *</Label>
                                <Select value={companyColumn} onValueChange={setCompanyColumn}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Website Column *</Label>
                                <Select value={websiteColumn} onValueChange={setWebsiteColumn}>
                                    <SelectTrigger><SelectValue placeholder="Select column" /></SelectTrigger>
                                    <SelectContent>{headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Facebook URL Column (optional — enables real Meta ad data)</Label>
                                <Select value={facebookColumn} onValueChange={setFacebookColumn}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>City Column (optional)</Label>
                                <Select value={cityColumn} onValueChange={setCityColumn}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>State / Province Column (optional)</Label>
                                <Select value={stateColumn} onValueChange={setStateColumn}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Country Column (optional — City/State/Country are combined to improve Google Business Profile matching)</Label>
                                <Select value={countryColumn} onValueChange={setCountryColumn}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{parsedRows.length} row(s) detected in this sheet.</p>
                        <Button onClick={startAnalysis} className="gap-2">
                            <Play className="h-4 w-4" /> Run Website Signal Check
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === 'processing' && (
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center gap-4 py-12">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="font-semibold">Checking {processedCount} / {totalToProcess} businesses...</p>
                        <p className="text-sm text-muted-foreground">Each business gets a real PageSpeed audit, tech-stack scan, Meta + Google ads check, Google Business Profile lookup, and social media crawl — this can take a while for larger sheets.</p>
                        <div className="w-full max-w-md h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${totalToProcess ? (processedCount / totalToProcess) * 100 : 0}%` }} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 'results' && (
                <>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{results.length} business(es) checked</p>
                        <Button onClick={handleDownload} className="gap-2">
                            <Download className="h-4 w-4" /> Download Enriched CSV
                        </Button>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Website Audit</TableHead>
                                        <TableHead>Technology</TableHead>
                                        <TableHead>Ads Running</TableHead>
                                        <TableHead>Social Media</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((r, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{r.company || '—'}</TableCell>
                                            <TableCell>
                                                {r.error ? <span className="text-xs text-muted-foreground">{r.error}</span> :
                                                    r.pageSpeedScore != null ? `${r.pageSpeedScore}/100 · ${r.loadTimeSeconds ?? '?'}s` : 'N/A'}
                                            </TableCell>
                                            <TableCell>{r.techStack.length > 0 ? r.techStack.join(', ') : '—'}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-2 text-xs">
                                                    <span className={r.runningMetaAds ? 'text-emerald-600' : 'text-muted-foreground'}>Meta {r.runningMetaAds ? '✓' : '✗'}</span>
                                                    <span className={r.runningGoogleAds ? 'text-emerald-600' : 'text-muted-foreground'}>Google {r.runningGoogleAds ? '✓' : '✗'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {[r.socialLinks.facebook, r.socialLinks.twitter, r.socialLinks.instagram, r.socialLinks.youtube, r.socialLinks.linkedin].filter(Boolean).length || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" onClick={() => setSelectedResult(r)}>View Card</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}

            <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedResult?.company}</DialogTitle>
                        <DialogDescription>{selectedResult?.website}</DialogDescription>
                    </DialogHeader>
                    {selectedResult && (
                        <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 text-sm">
                            {selectedResult.error ? (
                                <p className="text-muted-foreground">{selectedResult.error}</p>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Website Audit & Tech Stack</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-muted p-3 rounded border text-center">
                                                <span className="text-muted-foreground block text-[10px] uppercase">PageSpeed Score</span>
                                                <strong className="text-lg">{selectedResult.pageSpeedScore ?? 'N/A'}</strong>
                                            </div>
                                            <div className="bg-muted p-3 rounded border text-center">
                                                <span className="text-muted-foreground block text-[10px] uppercase">Load Time (mobile)</span>
                                                <strong className="text-lg">{selectedResult.loadTimeSeconds != null ? `${selectedResult.loadTimeSeconds}s` : 'N/A'}</strong>
                                            </div>
                                        </div>
                                        {selectedResult.auditIssues.length > 0 && (
                                            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                                                {selectedResult.auditIssues.map((issue, i) => <li key={i}>{issue}</li>)}
                                            </ul>
                                        )}
                                        {selectedResult.techStack.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedResult.techStack.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}
                                            </div>
                                        )}
                                        <div className="flex gap-4 text-xs">
                                            <span className={`flex items-center gap-1 ${selectedResult.runningMetaAds ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                                {selectedResult.runningMetaAds ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} Meta Ads
                                            </span>
                                            <span className={`flex items-center gap-1 ${selectedResult.runningGoogleAds ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                                {selectedResult.runningGoogleAds ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />} Google Ads
                                            </span>
                                        </div>
                                    </div>

                                    {selectedResult.gmbFound && (
                                        <div className="space-y-1">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Google Business Profile</h4>
                                            <a href={selectedResult.gmbUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs bg-muted px-3 py-2 rounded-lg border w-fit">
                                                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                                {selectedResult.gmbRating != null && <span className="flex items-center gap-1 text-amber-500"><Star className="h-3 w-3 fill-amber-500" /> {selectedResult.gmbRating}</span>}
                                                <span>({selectedResult.gmbReviewsCount} reviews)</span>
                                            </a>
                                        </div>
                                    )}

                                    {selectedResult.metaAds.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Currently Running Ads — Meta ({selectedResult.metaAds.length})</h4>
                                            <div className="grid grid-cols-3 gap-2">
                                                {selectedResult.metaAds.map((ad, i) => (
                                                    <div key={i} className="bg-muted rounded-lg border overflow-hidden">
                                                        {ad.imageUrl && <img src={ad.imageUrl} alt="Ad" className="w-full h-20 object-cover" />}
                                                        <div className="p-2 space-y-1">
                                                            <p className="text-xs line-clamp-2">{ad.text}</p>
                                                            {ad.adLibraryUrl ? (
                                                                <a href={ad.adLibraryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] text-primary font-medium">
                                                                    <ExternalLink className="h-3 w-3" /> View Ad
                                                                </a>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground">No direct link available</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedResult.googleAds.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Currently Running Ads — Google ({selectedResult.googleAds.length})</h4>
                                            {selectedResult.googleAds.map((ad, i) => (
                                                ad.detailsLink ? (
                                                    <a key={i} href={ad.detailsLink} target="_blank" rel="noreferrer" className="flex items-center justify-between text-xs bg-muted hover:bg-muted/70 p-2 rounded-lg border">
                                                        <span>{ad.format || 'Ad'} · Shown {ad.totalDaysShown ?? '?'} days · Last seen {ad.lastShown?.slice(0, 10)}</span>
                                                        <span className="flex items-center gap-1 text-primary font-medium shrink-0 ml-2"><ExternalLink className="h-3 w-3" /> View Ad</span>
                                                    </a>
                                                ) : (
                                                    <div key={i} className="flex items-center justify-between text-xs bg-muted p-2 rounded-lg border">
                                                        <span>{ad.format || 'Ad'} · Shown {ad.totalDaysShown ?? '?'} days · Last seen {ad.lastShown?.slice(0, 10)}</span>
                                                        <span className="text-muted-foreground shrink-0 ml-2">No direct link available</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Social Media</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedResult.socialLinks.facebook && (
                                                <a href={selectedResult.socialLinks.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full border text-blue-600"><Facebook className="h-3.5 w-3.5" /> Facebook</a>
                                            )}
                                            {selectedResult.socialLinks.twitter && (
                                                <a href={selectedResult.socialLinks.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full border text-sky-600"><Twitter className="h-3.5 w-3.5" /> Twitter/X</a>
                                            )}
                                            {selectedResult.socialLinks.instagram && (
                                                <a href={selectedResult.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full border text-pink-600"><Instagram className="h-3.5 w-3.5" /> Instagram</a>
                                            )}
                                            {selectedResult.socialLinks.youtube && (
                                                <a href={selectedResult.socialLinks.youtube} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full border text-red-600"><Youtube className="h-3.5 w-3.5" /> YouTube</a>
                                            )}
                                            {selectedResult.socialLinks.linkedin && (
                                                <a href={selectedResult.socialLinks.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full border text-blue-700"><Link2 className="h-3.5 w-3.5" /> LinkedIn</a>
                                            )}
                                            {![selectedResult.socialLinks.facebook, selectedResult.socialLinks.twitter, selectedResult.socialLinks.instagram, selectedResult.socialLinks.youtube, selectedResult.socialLinks.linkedin].some(Boolean) && (
                                                <span className="text-xs text-muted-foreground">No social media links found</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
