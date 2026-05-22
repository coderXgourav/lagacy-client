import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Loader2,
    Upload,
    Download,
    CheckCircle2,
    XCircle,
    FileSpreadsheet,
    ArrowLeft,
    Phone,
    Smartphone,
    PhoneOff,
    Filter,
    RefreshCw,
    AlertCircle,
    Info,
    Check,
    HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type Step = 'upload' | 'config' | 'processing' | 'results';
type FilterAction = 'remove-telephone' | 'remove-mobile';
type CountryPreset = 'india' | 'uk' | 'us' | 'custom';

interface ProcessedRow {
    original: Record<string, string>;
    formattedNumber: string;
    type: 'mobile' | 'telephone' | 'invalid';
    reason: string;
}

export default function CsvMobileFilterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [phoneColumn, setPhoneColumn] = useState<string>('');
    
    // Filter logic states
    const [filterAction, setFilterAction] = useState<FilterAction>('remove-telephone');
    const [preset, setPreset] = useState<CountryPreset>('india');
    const [mobilePrefixes, setMobilePrefixes] = useState<string>('6,7,8,9');
    const [mobileLength, setMobileLength] = useState<number>(10);

    // Results state
    const [keptRows, setKeptRows] = useState<any[]>([]);
    const [removedRows, setRemovedRows] = useState<any[]>([]);
    const [totalRows, setTotalRows] = useState<number>(0);
    const [processedCount, setProcessedCount] = useState<number>(0);
    const [mobileCount, setMobileCount] = useState<number>(0);
    const [telephoneCount, setTelephoneCount] = useState<number>(0);
    const [invalidCount, setInvalidCount] = useState<number>(0);

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
            preview: 1,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data && results.data.length > 0) {
                    const parsedHeaders = results.data[0] as string[];
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
                        toast.success(`Auto-detected column: "${detectPhoneColumn}"`);
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

    const handlePresetChange = (selectedPreset: CountryPreset) => {
        setPreset(selectedPreset);
        if (selectedPreset === 'india') {
            setMobilePrefixes('6,7,8,9');
            setMobileLength(10);
        } else if (selectedPreset === 'uk') {
            setMobilePrefixes('7');
            setMobileLength(10); // UK numbers starting with 7 have 10 digits (excluding +44)
        } else if (selectedPreset === 'us') {
            setMobilePrefixes('2,3,4,5,6,7,8,9'); // USA mobile/landline mostly share area codes
            setMobileLength(10);
        }
    };

    const classifyNumber = (rawPhone: string): { type: 'mobile' | 'telephone' | 'invalid', cleaned: string, reason: string } => {
        if (!rawPhone || rawPhone.trim() === '') {
            return { type: 'invalid', cleaned: '', reason: 'Empty Number' };
        }

        let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');
        let digits = cleaned.replace(/\D/g, '');

        if (digits.length < 5) {
            return { type: 'invalid', cleaned, reason: 'Too short to be a valid phone' };
        }

        if (preset === 'india') {
            let localDigits = digits;
            let countryPrefix = '+91';
            
            if (digits.startsWith('91') && digits.length === 12) {
                localDigits = digits.substring(2);
            } else if (digits.startsWith('0') && digits.length === 11) {
                localDigits = digits.substring(1);
            }

            if (localDigits.length === 10) {
                const firstChar = localDigits.charAt(0);
                if (['6', '7', '8', '9'].includes(firstChar)) {
                    return { type: 'mobile', cleaned: countryPrefix + localDigits, reason: 'Indian 10-digit mobile' };
                } else {
                    return { type: 'telephone', cleaned: countryPrefix + localDigits, reason: 'Indian 10-digit landline/telephone' };
                }
            } else {
                return { type: 'telephone', cleaned: cleaned.startsWith('+') ? cleaned : '+' + digits, reason: 'Indian landline' };
            }
        }

        if (preset === 'uk') {
            let localDigits = digits;
            let countryPrefix = '+44';
            
            if (digits.startsWith('44') && digits.length === 12) {
                localDigits = digits.substring(2);
            } else if (digits.startsWith('0')) {
                localDigits = digits.substring(1);
            }

            if (localDigits.startsWith('7') && localDigits.length === 10) {
                return { type: 'mobile', cleaned: countryPrefix + localDigits, reason: 'UK Mobile (starts with 7)' };
            } else {
                return { type: 'telephone', cleaned: cleaned.startsWith('+') ? cleaned : '+' + digits, reason: 'UK Telephone' };
            }
        }

        if (preset === 'us') {
            const hasExtension = /ext|extension|#|x\s*\d+/i.test(rawPhone);
            let localDigits = digits;
            let countryPrefix = '+1';
            
            if (digits.startsWith('1') && digits.length === 11) {
                localDigits = digits.substring(1);
            }

            if (localDigits.length === 10) {
                const areaCode = localDigits.substring(0, 3);
                const tollFreeCodes = ['800', '888', '877', '866', '855', '844', '833'];
                const isTollFree = tollFreeCodes.includes(areaCode);
                const isHqLine = localDigits.endsWith('00');

                if (hasExtension) {
                    return { type: 'telephone', cleaned: rawPhone.trim(), reason: 'US/Canada number with extension (Corporate/Landline)' };
                } else if (isTollFree) {
                    return { type: 'telephone', cleaned: countryPrefix + localDigits, reason: `US/Canada Toll-Free area code (${areaCode})` };
                } else if (isHqLine) {
                    return { type: 'telephone', cleaned: countryPrefix + localDigits, reason: 'US/Canada HQ Main Line / Switchboard (ends in 00)' };
                } else {
                    return { type: 'mobile', cleaned: countryPrefix + localDigits, reason: 'US/Canada 10-digit mobile number' };
                }
            } else {
                if (hasExtension) {
                    return { type: 'telephone', cleaned: rawPhone.trim(), reason: 'US/Canada number with extension (Corporate/Landline)' };
                }
                return { type: 'telephone', cleaned: cleaned.startsWith('+') ? cleaned : '+' + digits, reason: 'US/Canada Landline/Telephone' };
            }
        }

        // Custom preset logic
        const prefixes = mobilePrefixes.split(',').map(p => p.trim()).filter(p => p !== '');
        let localDigits = digits;
        if (digits.length > mobileLength) {
            localDigits = digits.slice(-mobileLength);
        }

        if (localDigits.length === mobileLength) {
            const isMobile = prefixes.some(p => localDigits.startsWith(p));
            if (isMobile) {
                return { type: 'mobile', cleaned, reason: `Matches prefixes (${prefixes.join(',')})` };
            } else {
                return { type: 'telephone', cleaned, reason: 'Does not match mobile prefixes' };
            }
        }

        return { type: 'telephone', cleaned, reason: `Length is ${localDigits.length} (expected ${mobileLength})` };
    };

    const handleProcess = () => {
        if (!file || !phoneColumn) return;
        setStep('processing');
        setProcessedCount(0);
        setMobileCount(0);
        setTelephoneCount(0);
        setInvalidCount(0);

        const phoneColIdx = headers.indexOf(phoneColumn);
        if (phoneColIdx === -1) {
            toast.error("Selected phone column not found in headers.");
            setStep('config');
            return;
        }

        const activeKept: any[] = [];
        const activeRemoved: any[] = [];
        let count = 0;
        let mobiles = 0;
        let telephones = 0;
        let invalids = 0;
        let isFirstRow = true;

        Papa.parse(file, {
            header: false,
            skipEmptyLines: 'greedy',
            chunkSize: 1024 * 1024 * 5,
            step: (row) => {
                if (isFirstRow) {
                    isFirstRow = false;
                    return;
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
                const classification = classifyNumber(rawPhone);

                const recordWithClassification = {
                    ...data,
                    [phoneColumn]: classification.cleaned || rawPhone,
                    __phoneType: classification.type,
                    __classificationReason: classification.reason
                };

                if (classification.type === 'mobile') {
                    mobiles++;
                    if (filterAction === 'remove-telephone') {
                        activeKept.push(recordWithClassification);
                    } else {
                        activeRemoved.push({
                            ...recordWithClassification,
                            __skipReason: 'Is Mobile Number'
                        });
                    }
                } else if (classification.type === 'telephone') {
                    telephones++;
                    if (filterAction === 'remove-mobile') {
                        activeKept.push(recordWithClassification);
                    } else {
                        activeRemoved.push({
                            ...recordWithClassification,
                            __skipReason: 'Is Telephone/Landline'
                        });
                    }
                } else {
                    invalids++;
                    activeRemoved.push({
                        ...recordWithClassification,
                        __skipReason: classification.reason
                    });
                }
            },
            complete: () => {
                setTotalRows(count);
                setMobileCount(mobiles);
                setTelephoneCount(telephones);
                setInvalidCount(invalids);
                setKeptRows(activeKept);
                setRemovedRows(activeRemoved);
                setStep('results');
                toast.success(`Analysis complete! Classified ${count.toLocaleString()} records.`);
            },
            error: (err) => {
                toast.error("Processing failed: " + err.message);
                setStep('config');
            }
        });
    };

    const handleDownloadKept = () => {
        if (keptRows.length === 0) return;
        
        // Strip helpers before download
        const exportData = keptRows.map(row => {
            const copy = { ...row };
            delete copy.__phoneType;
            delete copy.__classificationReason;
            return copy;
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const baseName = file?.name.replace(/\.[^/.]+$/, "") || "processed";
        const suffix = filterAction === 'remove-telephone' ? "mobiles_only" : "telephones_only";
        link.setAttribute('download', `${baseName}_${suffix}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started!");
    };

    const handleDownloadRemoved = () => {
        if (removedRows.length === 0) return;

        // Structure filtered records cleanly
        const exportData = removedRows.map(row => {
            const copy = { ...row };
            const skipReason = copy.__skipReason;
            delete copy.__phoneType;
            delete copy.__classificationReason;
            delete copy.__skipReason;
            return {
                ...copy,
                'Filter Reason': skipReason
            };
        });

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const baseName = file?.name.replace(/\.[^/.]+$/, "") || "processed";
        const suffix = filterAction === 'remove-telephone' ? "removed_telephones" : "removed_mobiles";
        link.setAttribute('download', `${baseName}_${suffix}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Export started!");
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
                            <Filter className="h-6 w-6 text-primary animate-pulse" /> CSV Mobile/Telephone Filter Pro
                        </h1>
                        <p className="text-muted-foreground text-sm">Upload mixed contact lists to isolate landlines from mobile phone numbers instantly.</p>
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
                                    <p className="text-sm text-muted-foreground">Isolate and filter landlines from mobile phone numbers</p>
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
                                    <p className="font-semibold text-foreground">Local Browser Processing</p>
                                    <p>Your list is processed instantly within your browser. Absolute confidentiality is maintained since no data is sent to outer networks.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Configuration */}
                    {step === 'config' && (
                        <div className="space-y-6">
                            <div className="border-b pb-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">Filter Configuration</h3>
                                    <p className="text-xs text-muted-foreground">File: {file?.name} ({Math.round(file!.size / 1024)} KB)</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={resetState}>
                                    Change File
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Phone Field</Label>
                                    <Select value={phoneColumn} onValueChange={setPhoneColumn}>
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select phone column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {headers.map(h => (
                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground">Choose the column containing the mixed numbers.</p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter Action</Label>
                                    <RadioGroup 
                                        value={filterAction} 
                                        onValueChange={(val) => setFilterAction(val as FilterAction)}
                                        className="flex flex-col gap-2 mt-1"
                                    >
                                        <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                                            <RadioGroupItem value="remove-telephone" id="act-remove-tel" />
                                            <Label htmlFor="act-remove-tel" className="flex flex-col gap-0.5 cursor-pointer w-full">
                                                <span className="font-semibold text-sm">Remove Telephone / Landlines</span>
                                                <span className="text-[10px] text-muted-foreground">Keep only mobile phone numbers</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                                            <RadioGroupItem value="remove-mobile" id="act-remove-mob" />
                                            <Label htmlFor="act-remove-mob" className="flex flex-col gap-0.5 cursor-pointer w-full">
                                                <span className="font-semibold text-sm">Remove Mobile Numbers</span>
                                                <span className="text-[10px] text-muted-foreground">Keep only landline / telephone numbers</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mobile Detection Preset</Label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['india', 'uk', 'us', 'custom'] as CountryPreset[]).map(p => (
                                            <Button
                                                key={p}
                                                type="button"
                                                variant={preset === p ? "default" : "outline"}
                                                className="h-10 text-xs font-bold uppercase"
                                                onClick={() => handlePresetChange(p)}
                                            >
                                                {p === 'us' ? 'US/Canada' : p}
                                            </Button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        {preset === 'india' && "India: Mobile = 10 digits starting with 6,7,8,9. Others = Telephone."}
                                        {preset === 'uk' && "UK: Mobile = 10 digits starting with 7. Others = Telephone."}
                                        {preset === 'us' && "US/Canada: Mobile = 10 digits. Telephone = Toll-free, corporate endings (00/000), or extensions."}
                                        {preset === 'custom' && "Configure custom classification prefixes below."}
                                    </p>
                                </div>

                                {preset === 'custom' ? (
                                    <div className="space-y-4 border p-4 rounded-xl bg-muted/20">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Mobile Start Prefixes</Label>
                                            <Input
                                                placeholder="e.g. 6,7,8,9"
                                                value={mobilePrefixes}
                                                onChange={(e) => setMobilePrefixes(e.target.value)}
                                                className="h-10"
                                            />
                                            <p className="text-[9px] text-muted-foreground">Comma-separated digits mobile numbers start with (local part).</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Mobile Digit Length</Label>
                                            <Input
                                                type="number"
                                                value={mobileLength}
                                                onChange={(e) => setMobileLength(Number(e.target.value))}
                                                className="h-10"
                                                min={4}
                                                max={15}
                                            />
                                            <p className="text-[9px] text-muted-foreground">Expected length of a mobile number (excluding country code).</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-xl">
                                        <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Using {preset.toUpperCase()} Preset rules</p>
                                            <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80">Rules are automatically calibrated for the selected region. No additional parameters are required.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 col-span-1 md:col-span-2 pt-4 flex gap-3">
                                    <Button variant="outline" className="h-12 flex-1 font-semibold" onClick={resetState}>
                                        Reset Upload
                                    </Button>
                                    <Button className="h-12 flex-1 font-bold shadow-lg shadow-primary/20" onClick={handleProcess}>
                                        Classify & Filter CSV →
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Processing */}
                    {step === 'processing' && (
                        <div className="flex flex-col items-center gap-6 py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="text-center space-y-2">
                                <h3 className="font-bold text-xl">Separating Phone Types...</h3>
                                <p className="text-sm text-muted-foreground">Analyzed {processedCount.toLocaleString()} numbers</p>
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
                                    <h3 className="font-bold text-lg">Filtering Results</h3>
                                    <p className="text-xs text-muted-foreground">File: {file?.name}</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={resetState} className="gap-2">
                                    <RefreshCw className="h-3 w-3" /> Upload Another File
                                </Button>
                            </div>

                            {/* Metrics Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="bg-muted/30 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Rows</p>
                                        <p className="text-2xl font-black mt-1 text-foreground">{totalRows.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className={cn("border-transparent shadow-none", filterAction === 'remove-telephone' ? "bg-emerald-500/10" : "bg-muted/30")}>
                                    <CardContent className="p-4 text-center">
                                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", filterAction === 'remove-telephone' ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>Mobile Numbers</p>
                                        <p className={cn("text-2xl font-black mt-1", filterAction === 'remove-telephone' ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>{mobileCount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className={cn("border-transparent shadow-none", filterAction === 'remove-mobile' ? "bg-emerald-500/10" : "bg-muted/30")}>
                                    <CardContent className="p-4 text-center">
                                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", filterAction === 'remove-mobile' ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>Landlines / Telephones</p>
                                        <p className={cn("text-2xl font-black mt-1", filterAction === 'remove-mobile' ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>{telephoneCount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-red-500/10 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Empty / Invalid</p>
                                        <p className="text-2xl font-black mt-1 text-red-600 dark:text-red-400">{invalidCount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Export Buttons */}
                            <div className="flex flex-col md:flex-row gap-3 pt-2">
                                <Button onClick={handleDownloadKept} disabled={keptRows.length === 0} className="flex-1 h-12 gap-2 font-bold shadow-lg shadow-primary/20 text-md">
                                    <Download className="h-5 w-5" /> Download Cleaned CSV ({keptRows.length.toLocaleString()} rows)
                                </Button>
                                {removedRows.length > 0 && (
                                    <Button onClick={handleDownloadRemoved} variant="outline" className="h-12 gap-2 font-semibold border-indigo-200 dark:border-indigo-800 text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 text-md">
                                        <XCircle className="h-5 w-5" /> Export Removed Records ({removedRows.length.toLocaleString()} rows)
                                    </Button>
                                )}
                            </div>

                            {/* Samples Preview */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Data Sample Preview (First 50 Rows)</h4>
                                <Tabs defaultValue="kept" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 max-w-sm mb-4">
                                        <TabsTrigger value="kept" className="font-bold">Kept Records ({keptRows.length})</TabsTrigger>
                                        <TabsTrigger value="removed" className="font-bold">Filtered Out ({removedRows.length})</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="kept" className="border rounded-xl overflow-hidden bg-white shadow-sm">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-muted/10 border-b">
                                                    <TableRow>
                                                        <TableHead className="w-[60px] font-bold text-center border-r">No.</TableHead>
                                                        <TableHead className="font-bold border-r">Phone</TableHead>
                                                        <TableHead className="font-bold border-r">Phone Type</TableHead>
                                                        {headers.filter(h => h !== phoneColumn).slice(0, 3).map(h => (
                                                            <TableHead key={h} className="font-bold border-r">{h}</TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {keptRows.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">
                                                                No matching records found.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        keptRows.slice(0, 50).map((row, idx) => (
                                                            <TableRow key={idx} className={cn("border-b", idx % 2 === 0 ? "bg-white" : "bg-muted/20")}>
                                                                <TableCell className="text-center font-bold text-muted-foreground border-r">{idx + 1}</TableCell>
                                                                <TableCell className="font-bold text-primary font-mono border-r">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                                        {row[phoneColumn]}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="border-r">
                                                                    <Badge variant={row.__phoneType === 'mobile' ? 'default' : 'secondary'} className="uppercase text-[9px] font-bold">
                                                                        {row.__phoneType}
                                                                    </Badge>
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
                                                        <TableHead className="font-bold text-indigo-600 border-r">Filter Reason</TableHead>
                                                        <TableHead className="font-bold border-r">Phone</TableHead>
                                                        <TableHead className="font-bold border-r">Detected Type</TableHead>
                                                        {headers.filter(h => h !== phoneColumn).slice(0, 3).map(h => (
                                                            <TableHead key={h} className="font-bold border-r">{h}</TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {removedRows.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-medium">
                                                                No records were filtered out!
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        removedRows.slice(0, 50).map((row, idx) => (
                                                            <TableRow key={idx} className={cn("border-b", idx % 2 === 0 ? "bg-white" : "bg-muted/20")}>
                                                                <TableCell className="text-center font-bold text-muted-foreground border-r">{idx + 1}</TableCell>
                                                                <TableCell className="font-bold text-indigo-600 border-r">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <AlertCircle className="h-4 w-4 shrink-0 text-indigo-500" />
                                                                        {row.__skipReason}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="font-mono text-muted-foreground border-r italic">
                                                                    {row[phoneColumn] || <span className="opacity-50">(empty)</span>}
                                                                </TableCell>
                                                                <TableCell className="border-r">
                                                                    <Badge variant="outline" className="uppercase text-[9px] font-bold">
                                                                        {row.__phoneType}
                                                                    </Badge>
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
