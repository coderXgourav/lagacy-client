import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Loader2,
    Upload,
    Download,
    CheckCircle2,
    XCircle,
    FileSpreadsheet,
    ArrowLeft,
    PhoneCall,
    RefreshCw,
    AlertCircle,
    Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ProcessedRow {
    original: any[];
    cleanedPhone: string;
    status: 'kept' | 'removed';
    reason?: string;
}

type Step = 'upload' | 'config' | 'processing' | 'results';

const COUNTRY_CODES = [
    { name: 'India (+91)', value: '+91' },
    { name: 'United States / Canada (+1)', value: '+1' },
    { name: 'United Kingdom (+44)', value: '+44' },
    { name: 'Australia (+61)', value: '+61' },
    { name: 'United Arab Emirates (+971)', value: '+971' },
    { name: 'Singapore (+65)', value: '+65' },
    { name: 'Saudi Arabia (+966)', value: '+966' },
];

export default function CsvPhoneFormatterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [phoneColumn, setPhoneColumn] = useState<string>('');
    const [defaultCountryCode, setDefaultCountryCode] = useState<string>('+91');
    const [customCountryCode, setCustomCountryCode] = useState<string>('');
    const [requiredDigits, setRequiredDigits] = useState<number>(10);
    const [isCustomPrefix, setIsCustomPrefix] = useState<boolean>(false);

    // Results state
    const [keptRows, setKeptRows] = useState<any[]>([]);
    const [removedRows, setRemovedRows] = useState<any[]>([]);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [processedCount, setProcessedCount] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            parseHeaders(selectedFile);
        }
    };

    const parseHeaders = (targetFile: File) => {
        Papa.parse(targetFile, {
            preview: 1, // Only read first line
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    const parsedHeaders = results.data[0] as string[];
                    
                    // Clean and deduplicate headers to avoid Radix UI Select crashes on empty or duplicate values
                    const uniqueHeaders: string[] = [];
                    const seen = new Set<string>();
                    
                    parsedHeaders.forEach((h, index) => {
                        let name = (h || '').trim();
                        if (name === '') {
                            name = `Column ${index + 1}`;
                        }
                        let candidate = name;
                        let counter = 1;
                        while (seen.has(candidate)) {
                            candidate = `${name} (${counter})`;
                            counter++;
                        }
                        seen.add(candidate);
                        uniqueHeaders.push(candidate);
                    });

                    setHeaders(uniqueHeaders);
                    
                    // Auto-detect phone number column
                    const detectPhoneColumn = uniqueHeaders.find(h => {
                        const low = h.toLowerCase();
                        return low.includes('phone') || low.includes('number') || low.includes('tel') || low.includes('mobile') || low.includes('contact');
                    });
                    
                    if (detectPhoneColumn) {
                        setPhoneColumn(detectPhoneColumn);
                        toast.success(`Auto-detected phone column: "${detectPhoneColumn}"`);
                    } else if (uniqueHeaders.length > 0) {
                        setPhoneColumn(uniqueHeaders[0]);
                    }
                    
                    setStep('config');
                } else {
                    toast.error("Could not parse file headers. Is this a valid CSV?");
                }
            },
            error: (err) => {
                toast.error("Error reading file: " + err.message);
            }
        });
    };

    const handleProcess = () => {
        if (!file || !phoneColumn) return;
        setStep('processing');
        setProcessedCount(0);

        const phoneColIdx = headers.indexOf(phoneColumn);
        if (phoneColIdx === -1) {
            toast.error("Selected phone column not found in headers.");
            setStep('config');
            return;
        }

        const prefixToUse = isCustomPrefix ? customCountryCode.trim() : defaultCountryCode;
        if (!prefixToUse) {
            toast.error("Please enter or select a valid country code prefix.");
            setStep('config');
            return;
        }

        const activeKept: any[] = [];
        const activeRemoved: any[] = [];
        let count = 0;
        let isFirstRow = true;

        Papa.parse(file, {
            header: false,
            skipEmptyLines: 'greedy',
            chunkSize: 1024 * 1024 * 5, // 5MB chunks
            step: (row) => {
                if (isFirstRow) {
                    isFirstRow = false;
                    return; // Skip the headers row
                }

                count++;
                if (count % 1000 === 0) {
                    setProcessedCount(count);
                }

                const rowData = row.data as string[];
                const data: Record<string, string> = {};
                headers.forEach((header, index) => {
                    data[header] = rowData[index] || '';
                });

                const rawPhone = data[phoneColumn];

                if (!rawPhone || rawPhone.trim() === '') {
                    activeRemoved.push({
                        ...data,
                        __skipReason: 'Empty Phone Number'
                    });
                    return;
                }

                let phoneStr = rawPhone.trim();
                // Convert scientific notation (e.g. 8.61559E+12) to standard digits
                if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(phoneStr)) {
                    const num = Number(phoneStr);
                    if (!isNaN(num)) {
                        phoneStr = num.toString();
                    }
                }

                // Clean phone number (keep digits and +)
                let cleaned = phoneStr.replace(/[^\d+]/g, '');

                // Validation and formatting logic
                let finalPhone = '';
                let isValid = true;
                let skipReason = '';

                if (cleaned.startsWith('+')) {
                    // Already has country code +something
                    const digits = cleaned.replace(/\D/g, '');
                    if (digits.length < requiredDigits) {
                        isValid = false;
                        skipReason = `Invalid Length (${digits.length} digits, expected at least ${requiredDigits})`;
                    } else {
                        finalPhone = cleaned;
                    }
                } else {
                    const digits = cleaned.replace(/\D/g, '');
                    if (digits.length === requiredDigits) {
                        // Standard local number (e.g. 10 digits)
                        const fmtPrefix = prefixToUse.startsWith('+') ? prefixToUse : `+${prefixToUse}`;
                        finalPhone = fmtPrefix + digits;
                    } else if (digits.length > requiredDigits) {
                        // Might already have country code, missing '+' sign
                        // e.g. '919876543210' -> starts with '91' and length 12
                        const cleanPrefixDigits = prefixToUse.replace(/\D/g, '');
                        if (cleanPrefixDigits && digits.startsWith(cleanPrefixDigits) && digits.length === cleanPrefixDigits.length + requiredDigits) {
                            finalPhone = `+${digits}`;
                        } else {
                            // Assume it starts with a country code, prepend '+'
                            finalPhone = `+${digits}`;
                        }
                    } else {
                        // Too short
                        isValid = false;
                        skipReason = `Too Short (${digits.length} digits, expected ${requiredDigits})`;
                    }
                }

                if (isValid && finalPhone) {
                    activeKept.push({
                        ...data,
                        [phoneColumn]: finalPhone
                    });
                } else {
                    activeRemoved.push({
                        ...data,
                        __skipReason: skipReason || 'Invalid Phone Number'
                    });
                }
            },
            complete: () => {
                setTotalRows(count);
                setKeptRows(activeKept);
                setRemovedRows(activeRemoved);
                setStep('results');
                toast.success(`Processing complete! Processed ${count.toLocaleString()} rows.`);
            },
            error: (err) => {
                toast.error("Processing failed: " + err.message);
                setStep('config');
            }
        });
    };

    const handleDownload = () => {
        if (keptRows.length === 0) return;
        const csv = Papa.unparse(keptRows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const baseName = file?.name.replace(/\.[^/.]+$/, "") || "processed";
        link.setAttribute('download', `${baseName}_formatted.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started!");
    };

    const handleDownloadRemoved = () => {
        if (removedRows.length === 0) return;
        // Clean skip reason property from downloaded CSV to keep original headers + skipReason column
        const exportRemoved = removedRows.map(row => {
            const copy = { ...row };
            const reason = copy.__skipReason;
            delete copy.__skipReason;
            return {
                ...copy,
                'Reason For Removal': reason
            };
        });
        const csv = Papa.unparse(exportRemoved);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const baseName = file?.name.replace(/\.[^/.]+$/, "") || "processed";
        link.setAttribute('download', `${baseName}_removed_records.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download of removed records started!");
    };

    const resetState = () => {
        setFile(null);
        setHeaders([]);
        setPhoneColumn('');
        setKeptRows([]);
        setRemovedRows([]);
        setTotalRows(0);
        setProcessedCount(0);
        setStep('upload');
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
                            <PhoneCall className="h-6 w-6 text-primary animate-pulse" /> CSV Phone Formatter Pro
                        </h1>
                        <p className="text-muted-foreground text-sm">Clean, validate, and format global phone lists at scale.</p>
                    </div>
                </div>
            </div>

            {/* Stepper Header */}
            <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground w-full py-2">
                <div className={cn("flex items-center gap-2 transition-all duration-300", step === 'upload' ? "text-primary scale-105" : "opacity-50")}>
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
                    UPLOAD
                </div>
                <div className="w-8 h-px bg-border"></div>
                <div className={cn("flex items-center gap-2 transition-all duration-300", step === 'config' ? "text-primary scale-105" : "opacity-50")}>
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
                    CONFIGURE
                </div>
                <div className="w-8 h-px bg-border"></div>
                <div className={cn("flex items-center gap-2 transition-all duration-300", step === 'processing' ? "text-primary scale-105" : "opacity-50")}>
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
                    PROCESS
                </div>
                <div className="w-8 h-px bg-border"></div>
                <div className={cn("flex items-center gap-2 transition-all duration-300", step === 'results' ? "text-primary scale-105" : "opacity-50")}>
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">4</span>
                    EXPORT
                </div>
            </div>

            <Card className="w-full border shadow-xl bg-gradient-to-br from-card to-card/95 overflow-hidden">
                <CardContent className="pt-6">
                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="h-64 border-2 border-dashed rounded-2xl border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-4"
                            >
                                <div className="p-4 rounded-full bg-primary/10 text-primary">
                                    <Upload className="h-8 w-8" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="font-semibold text-lg">Drag & drop or Click to Upload CSV</p>
                                    <p className="text-sm text-muted-foreground">Supports files up to 500MB (100k+ rows)</p>
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
                                    <p className="font-semibold text-foreground">Local Processing Privacy</p>
                                    <p>Your file is processed entirely inside your browser. No data is ever sent to external servers.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Configuration */}
                    {step === 'config' && (
                        <div className="space-y-6">
                            <div className="border-b pb-4">
                                <h3 className="font-bold text-lg">Format Configuration</h3>
                                <p className="text-xs text-muted-foreground">File: {file?.name} ({Math.round(file!.size / 1024)} KB)</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Phone Number Column</label>
                                    <Select value={phoneColumn} onValueChange={setPhoneColumn}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {headers.map(h => (
                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">This column will be cleaned, formatted, and validated.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Default Country Prefix</label>
                                    <div className="flex gap-2">
                                        {!isCustomPrefix ? (
                                            <Select value={defaultCountryCode} onValueChange={(val) => {
                                                if (val === 'custom') {
                                                    setIsCustomPrefix(true);
                                                } else {
                                                    setDefaultCountryCode(val);
                                                }
                                            }}>
                                                <SelectTrigger className="h-11 flex-1">
                                                    <SelectValue placeholder="Select country code" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {COUNTRY_CODES.map(c => (
                                                        <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>
                                                    ))}
                                                    <SelectItem value="custom">Custom Prefix...</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="flex gap-2 w-full">
                                                <Input
                                                    placeholder="e.g. +91"
                                                    value={customCountryCode}
                                                    onChange={(e) => setCustomCountryCode(e.target.value)}
                                                    className="h-11 flex-1"
                                                />
                                                <Button variant="outline" className="h-11" onClick={() => setIsCustomPrefix(false)}>
                                                    Select List
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">Prepended to phone numbers missing a country code.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Local Phone Digits Required</label>
                                    <Input
                                        type="number"
                                        min={4}
                                        max={15}
                                        value={requiredDigits}
                                        onChange={(e) => setRequiredDigits(Number(e.target.value))}
                                        className="h-11"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Records with fewer local digits (excluding country code) will be removed. Default: 10.</p>
                                </div>

                                <div className="space-y-2 flex flex-col justify-end">
                                    <div className="flex gap-3">
                                        <Button variant="outline" className="h-11 flex-1 font-semibold" onClick={resetState}>
                                            Cancel
                                        </Button>
                                        <Button className="h-11 flex-1 font-bold" onClick={handleProcess}>
                                            Cleanse & Format →
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Processing */}
                    {step === 'processing' && (
                        <div className="flex flex-col items-center gap-6 py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="text-center space-y-2">
                                <h3 className="font-bold text-xl">Processing CSV File...</h3>
                                <p className="text-sm text-muted-foreground">Validated {processedCount.toLocaleString()} records</p>
                            </div>
                            <div className="w-full max-w-md bg-muted h-2 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-primary to-indigo-500 h-full animate-pulse" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Results */}
                    {step === 'results' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <h3 className="font-bold text-lg">Cleansing Summary</h3>
                                    <p className="text-xs text-muted-foreground">File: {file?.name}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={resetState} className="gap-2">
                                    <RefreshCw className="h-3 w-3" /> Start Over
                                </Button>
                            </div>

                            {/* KPI Metrics Dashboard */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="bg-muted/30 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Rows</p>
                                        <p className="text-2xl font-black mt-1 text-foreground">{totalRows.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-emerald-500/10 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Kept & Formatted</p>
                                        <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{keptRows.length.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-red-500/10 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Filtered Out</p>
                                        <p className="text-2xl font-black mt-1 text-red-600 dark:text-red-400">{removedRows.length.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-indigo-500/10 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Success Rate</p>
                                        <p className="text-2xl font-black mt-1 text-indigo-600 dark:text-indigo-400">
                                            {totalRows > 0 ? `${Math.round((keptRows.length / totalRows) * 100)}%` : '0%'}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex flex-col md:flex-row gap-3 pt-2">
                                <Button onClick={handleDownload} disabled={keptRows.length === 0} className="flex-1 h-12 gap-2 font-bold shadow-lg shadow-primary/20 text-md">
                                    <Download className="h-5 w-5" /> Download Cleaned CSV ({keptRows.length.toLocaleString()} rows)
                                </Button>
                                {removedRows.length > 0 && (
                                    <Button onClick={handleDownloadRemoved} variant="outline" className="h-12 gap-2 font-semibold border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/10 text-md">
                                        <XCircle className="h-5 w-5" /> Export Removed Records ({removedRows.length.toLocaleString()} rows)
                                    </Button>
                                )}
                            </div>

                            {/* Data Previews */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Data Sample Preview (First 50 Rows)</h4>
                                <Tabs defaultValue="kept" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
                                        <TabsTrigger value="kept" className="font-bold">Kept & Cleaned ({keptRows.length})</TabsTrigger>
                                        <TabsTrigger value="removed" className="font-bold">Removed / Invalid ({removedRows.length})</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="kept" className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/10 border-b">
                                                    <TableRow>
                                                        <TableHead className="w-[60px] font-bold text-center border-r">No.</TableHead>
                                                        <TableHead className="font-bold border-r">Formatted Phone</TableHead>
                                                        {headers.filter(h => h !== phoneColumn).slice(0, 3).map(h => (
                                                            <TableHead key={h} className="font-bold border-r">{h}</TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {keptRows.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium">
                                                                No clean records found.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        keptRows.slice(0, 50).map((row, idx) => (
                                                            <TableRow key={idx} className={cn("border-b", idx % 2 === 0 ? "bg-white" : "bg-muted/20")}>
                                                                <TableCell className="text-center font-bold text-muted-foreground border-r">{idx + 1}</TableCell>
                                                                <TableCell className="font-bold text-primary font-mono border-r">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                                                                        {row[phoneColumn]}
                                                                    </div>
                                                                </TableCell>
                                                                {headers.filter(h => h !== phoneColumn).slice(0, 3).map(h => (
                                                                    <TableCell key={h} className="text-muted-foreground border-r truncate max-w-[200px]">{row[h] || 'N/A'}</TableCell>
                                                                ))}
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        {keptRows.length > 50 && (
                                            <div className="p-3 bg-muted/10 border-t text-center text-xs text-muted-foreground font-medium">
                                                Showing first 50 results. Download to get the full formatted file.
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="removed" className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/10 border-b">
                                                    <TableRow>
                                                        <TableHead className="w-[60px] font-bold text-center border-r">No.</TableHead>
                                                        <TableHead className="font-bold text-red-600 border-r">Reason For Removal</TableHead>
                                                        <TableHead className="font-bold border-r">Original Phone Field</TableHead>
                                                        {headers.filter(h => h !== phoneColumn).slice(0, 3).map(h => (
                                                            <TableHead key={h} className="font-bold border-r">{h}</TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {removedRows.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-medium">
                                                                No records were filtered out!
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        removedRows.slice(0, 50).map((row, idx) => (
                                                            <TableRow key={idx} className={cn("border-b", idx % 2 === 0 ? "bg-white" : "bg-muted/20")}>
                                                                <TableCell className="text-center font-bold text-muted-foreground border-r">{idx + 1}</TableCell>
                                                                <TableCell className="font-bold text-red-600 border-r">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                                                        {row.__skipReason}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-mono text-muted-foreground border-r italic">
                                                                    {row[phoneColumn] || <span className="opacity-50">(empty)</span>}
                                                                </TableCell>
                                                                {headers.filter(h => h !== phoneColumn).slice(0, 3).map(h => (
                                                                    <TableCell key={h} className="text-muted-foreground border-r truncate max-w-[200px]">{row[h] || 'N/A'}</TableCell>
                                                                ))}
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        {removedRows.length > 50 && (
                                            <div className="p-3 bg-muted/10 border-t text-center text-xs text-muted-foreground font-medium">
                                                Showing first 50 results. Export removed records to view all.
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
