import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    Upload,
    Download,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    Mail,
    RefreshCw,
    Info,
    Play,
    AlertCircle,
    Check,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

type Step = 'upload' | 'map' | 'processing' | 'results';

interface VerificationResult {
    originalRow: Record<string, string>;
    originalEmail: string;
    email: string;
    result: string; // valid, invalid, unknown
    reason: string;
    disposable: string; // true/false
    accept_all: string; // true/false
    role: string; // true/false
    free: string; // true/false
    safe_to_send: string; // true/false
    success: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function CsvEmailVerifierPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [emailColumn, setEmailColumn] = useState<string>('');
    const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    
    // Progress and results state
    const [processedCount, setProcessedCount] = useState<number>(0);
    const [totalToProcess, setTotalToProcess] = useState<number>(0);
    const [results, setResults] = useState<VerificationResult[]>([]);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            parseHeaders(selectedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.csv')) {
                setFile(droppedFile);
                parseHeaders(droppedFile);
            } else {
                toast.error("Please upload a valid CSV file (.csv)");
            }
        }
    };

    const parseHeaders = (targetFile: File) => {
        Papa.parse(targetFile, {
            header: true,
            skipEmptyLines: 'greedy',
            complete: (parseResults) => {
                if (parseResults.meta && parseResults.meta.fields) {
                    const fields = parseResults.meta.fields;
                    setHeaders(fields);
                    setParsedRows(parseResults.data as Record<string, string>[]);
                    
                    // Auto-detect email column
                    const detectEmailColumn = fields.find(h => {
                        const low = h.toLowerCase();
                        return low.includes('email') || low.includes('mail') || low.includes('addr');
                    });
                    setEmailColumn(detectEmailColumn || fields[0] || '');
                    setStep('map');
                } else {
                    toast.error("Could not parse file headers. Is this a valid CSV?");
                }
            },
            error: (err) => {
                toast.error("Error reading file: " + err.message);
            }
        });
    };

    const startVerification = async () => {
        if (!emailColumn) {
            toast.error("Please select an email column first.");
            return;
        }

        setStep('processing');
        setProcessedCount(0);
        setTotalToProcess(parsedRows.length);
        
        const verificationResults: VerificationResult[] = [];
        const batchSize = 15;
        const token = localStorage.getItem("token");

        // Format all rows first
        const formattedRows = parsedRows.map(row => {
            const rawEmail = row[emailColumn] || '';
            return {
                originalRow: row,
                rawEmail,
                cleanEmail: rawEmail.trim()
            };
        });

        // Process in batches
        for (let i = 0; i < formattedRows.length; i += batchSize) {
            const batch = formattedRows.slice(i, i + batchSize);
            const batchEmails = batch.map(b => b.cleanEmail).filter(Boolean);

            if (batchEmails.length === 0) {
                batch.forEach(b => {
                    verificationResults.push({
                        originalRow: b.originalRow,
                        originalEmail: b.rawEmail,
                        email: b.cleanEmail,
                        result: 'invalid',
                        reason: 'Empty email address',
                        disposable: 'false',
                        accept_all: 'false',
                        role: 'false',
                        free: 'false',
                        safe_to_send: 'false',
                        success: false
                    });
                });
                setProcessedCount(prev => Math.min(prev + batch.length, formattedRows.length));
                continue;
            }

            try {
                const response = await axios.post(
                    `${API_URL}/email-checker/verify-batch`,
                    { emails: batchEmails },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data && response.data.results) {
                    const batchResults = response.data.results;
                    
                    batch.forEach((b) => {
                        if (!b.cleanEmail) {
                            verificationResults.push({
                                originalRow: b.originalRow,
                                originalEmail: b.rawEmail,
                                email: '',
                                result: 'invalid',
                                reason: 'Empty email address',
                                disposable: 'false',
                                accept_all: 'false',
                                role: 'false',
                                free: 'false',
                                safe_to_send: 'false',
                                success: false
                            });
                            return;
                        }

                        const match = batchResults.find((r: any) => r.email.toLowerCase() === b.cleanEmail.toLowerCase());

                        verificationResults.push({
                            originalRow: b.originalRow,
                            originalEmail: b.rawEmail,
                            email: b.cleanEmail,
                            result: match ? match.result || 'unknown' : 'unknown',
                            reason: match ? match.reason || 'Verification failed' : 'Verification failed',
                            disposable: match ? String(match.disposable) : 'false',
                            accept_all: match ? String(match.accept_all) : 'false',
                            role: match ? String(match.role) : 'false',
                            free: match ? String(match.free) : 'false',
                            safe_to_send: match ? String(match.safe_to_send) : 'false',
                            success: match ? !!match.success : false
                        });
                    });
                }
            } catch (err: any) {
                console.error("Batch email verification failed:", err);
                batch.forEach(b => {
                    verificationResults.push({
                        originalRow: b.originalRow,
                        originalEmail: b.rawEmail,
                        email: b.cleanEmail,
                        result: 'unknown',
                        reason: err.message || 'API request failed',
                        disposable: 'false',
                        accept_all: 'false',
                        role: 'false',
                        free: 'false',
                        safe_to_send: 'false',
                        success: false
                    });
                });
            }

            const updatedCount = Math.min(i + batchSize, formattedRows.length);
            setProcessedCount(updatedCount);
        }

        setResults(verificationResults);
        setStep('results');
        toast.success(`Email Check completed! Processed ${parsedRows.length} rows.`);
    };

    const handleDownload = (filterType: 'all' | 'safe' | 'valid' | 'invalid') => {
        if (results.length === 0) return;

        let filtered = results;
        if (filterType === 'safe') {
            filtered = results.filter(r => r.safe_to_send === 'true');
        } else if (filterType === 'valid') {
            filtered = results.filter(r => r.result === 'valid');
        } else if (filterType === 'invalid') {
            filtered = results.filter(r => r.result === 'invalid');
        }

        const exportData = filtered.map(r => ({
            ...r.originalRow,
            [emailColumn]: r.email || r.originalEmail,
            'Verification Status': (r.result || 'unknown').toUpperCase(),
            'Safe to Send': r.safe_to_send === 'true' ? 'YES' : 'NO',
            'Disposable': r.disposable === 'true' ? 'YES' : 'NO',
            'Role Account': r.role === 'true' ? 'YES' : 'NO',
            'Free Provider': r.free === 'true' ? 'YES' : 'NO',
            'Accept All': r.accept_all === 'true' ? 'YES' : 'NO',
            'Verification Details': r.reason
        }));

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const baseName = file?.name.replace(/\.[^/.]+$/, "") || "email_verification";
        link.setAttribute('download', `${baseName}_${filterType}_verified.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Download of ${filterType} results started!`);
    };

    const resetState = () => {
        setFile(null);
        setHeaders([]);
        setEmailColumn('');
        setParsedRows([]);
        setResults([]);
        setProcessedCount(0);
        setTotalToProcess(0);
        setStep('upload');
    };

    const totalCount = results.length;
    const safeCount = results.filter(r => r.safe_to_send === 'true').length;
    const validCount = results.filter(r => r.result === 'valid').length;
    const invalidCount = results.filter(r => r.result === 'invalid').length;
    const disposableCount = results.filter(r => r.disposable === 'true').length;

    return (
        <div className="flex flex-col w-full max-w-5xl mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/offerings')} className="h-9 w-9 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
                            <Mail className="h-6 w-6 text-primary animate-pulse" /> Email Verifier Pro
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">Verify email existence, deliverability, role accounts, and disposable addresses in bulk.</p>
                    </div>
                </div>
            </div>

            <Card className="w-full border shadow-xl bg-gradient-to-br from-card to-card/95 overflow-hidden">
                <CardContent className="pt-6">
                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`h-64 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4 ${
                                    isDragging 
                                        ? 'border-primary bg-primary/10 scale-[1.01] shadow-lg shadow-primary/5' 
                                        : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5'
                                    }`}
                            >
                                <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                                    <Upload className="h-8 w-8" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-semibold text-lg">Drag & drop or Click to Upload CSV</p>
                                    <p className="text-sm text-muted-foreground">Upload your contacts file with emails to verify.</p>
                                </div>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".csv"
                                />
                            </div>
                            <div className="flex gap-2 items-start bg-muted/40 p-4 rounded-xl text-xs text-muted-foreground">
                                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-semibold text-foreground">Email Checking Intelligence</p>
                                    <p>Uses QuickEmailVerification API validation to detect invalid, role-based, catch-all, and disposable spam emails.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Map Columns */}
                    {step === 'map' && (
                        <div className="space-y-6">
                            <div className="bg-muted/30 p-4 rounded-xl space-y-2">
                                <p className="font-semibold text-sm">Selected File: <span className="text-primary font-normal">{file?.name}</span></p>
                                <p className="text-xs text-muted-foreground">Rows detected: <span className="text-foreground font-semibold">{parsedRows.length.toLocaleString()}</span></p>
                            </div>

                            <div className="space-y-3 max-w-md">
                                <Label htmlFor="email-col" className="text-sm font-semibold">Select Email Column <span className="text-rose-500">*</span></Label>
                                <Select value={emailColumn} onValueChange={setEmailColumn}>
                                    <SelectTrigger id="email-col">
                                        <SelectValue placeholder="Choose email column..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {headers.map(h => (
                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">The column containing email addresses to verify.</p>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <Button variant="outline" onClick={resetState}>Cancel</Button>
                                <Button onClick={startVerification} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                    <Play className="h-4 w-4 fill-current" /> Start Email Verification
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Processing */}
                    {step === 'processing' && (
                        <div className="flex flex-col items-center gap-6 py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                            <div className="text-center space-y-2">
                                <h3 className="font-bold text-xl">Verifying Emails...</h3>
                                <p className="text-sm text-muted-foreground">Checked {processedCount.toLocaleString()} of {totalToProcess.toLocaleString()} emails</p>
                            </div>
                            <div className="w-full max-w-md bg-muted h-2 rounded-full overflow-hidden relative">
                                <div 
                                    className="bg-gradient-to-r from-primary to-indigo-600 h-full transition-all duration-300" 
                                    style={{ width: `${(processedCount / totalToProcess) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">Hitting QuickEmailVerification API in concurrent batches...</p>
                        </div>
                    )}

                    {/* Step 4: Results */}
                    {step === 'results' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <h3 className="font-bold text-lg">Verification Summary</h3>
                                    <p className="text-xs text-muted-foreground">File: {file?.name}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={resetState} className="gap-2">
                                    <RefreshCw className="h-3.5 w-3.5" /> Start Over
                                </Button>
                            </div>

                            {/* KPI Metrics Dashboard */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Card className="bg-muted/30 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Checked</p>
                                        <p className="text-2xl font-black mt-1 text-foreground">{totalCount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-indigo-500/10 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Safe to Send</p>
                                        <p className="text-2xl font-black mt-1 text-indigo-600 dark:text-indigo-400">{safeCount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-emerald-500/10 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Valid Emails</p>
                                        <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{validCount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-rose-500/10 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Disposable Spam</p>
                                        <p className="text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">{disposableCount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Export Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <Button onClick={() => handleDownload('all')} className="gap-2">
                                    <Download className="h-4 w-4" /> Download All Results
                                </Button>
                                <Button variant="outline" onClick={() => handleDownload('safe')} className="gap-2 border-indigo-500 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-800">
                                    <CheckCircle2 className="h-4 w-4 text-indigo-500" /> Download Safe to Send
                                </Button>
                                <Button variant="outline" onClick={() => handleDownload('valid')} className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Download Valid Only
                                </Button>
                                <Button variant="outline" onClick={() => handleDownload('invalid')} className="gap-2 border-red-500 text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:border-red-800">
                                    <XCircle className="h-4 w-4 text-red-500" /> Download Invalid Only
                                </Button>
                            </div>

                            {/* Preview Table */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Verification Results</h4>
                                <div className="border rounded-lg max-h-[450px] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Email Address</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Safe to Send</TableHead>
                                                <TableHead>Disposable</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Free Provider</TableHead>
                                                <TableHead>Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.map((r, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium font-mono text-xs">{r.email || r.originalEmail}</TableCell>
                                                    <TableCell>
                                                        {r.result === 'valid' && (
                                                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800" variant="secondary">
                                                                Valid
                                                            </Badge>
                                                        )}
                                                        {r.result === 'invalid' && (
                                                            <Badge className="bg-rose-500/10 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800" variant="secondary">
                                                                Invalid
                                                            </Badge>
                                                        )}
                                                        {r.result !== 'valid' && r.result !== 'invalid' && (
                                                            <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800" variant="secondary">
                                                                {r.result || 'Unknown'}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {r.safe_to_send === 'true' ? (
                                                            <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                                                                <Check className="h-3.5 w-3.5" /> Yes
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-rose-600 text-xs font-semibold">
                                                                <X className="h-3.5 w-3.5" /> No
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {r.disposable === 'true' ? (
                                                            <Badge variant="destructive" className="text-[10px] py-0 px-1">Disposable</Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">No</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {r.role === 'true' ? (
                                                            <Badge variant="outline" className="text-[10px] py-0 px-1 border-amber-300 text-amber-700">Role</Badge>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">No</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {r.free === 'true' ? (
                                                            <span className="text-xs text-indigo-600 font-medium">Free</span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Domain</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{r.reason}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
