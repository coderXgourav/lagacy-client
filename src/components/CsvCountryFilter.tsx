
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
    Loader2,
    Upload,
    Download,
    CheckCircle2,
    Database,
    X,
    Eye,
    FileDown,
    FileSpreadsheet,
    Check,
    ChevronsUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

// Column indices based on 13-column schema:
// 0:domainName, 1:createdDate, 2:expiresDate, 3:name, 4:registrant_name, 5:registrant_organization
// 6:registrant_street1, 7:registrant_city, 8:registrant_state, 9:registrant_postalCode
// 10:registrant_country, 11:email, 12:number
const COL_DOMAIN_NAME = 0;
const COL_CREATE_DATE = 1;
const COL_EXPIRY_DATE = 2;
const COL_REGISTRANT_NAME = 3;
const COL_REGISTRANT_COMPANY = 4;
const COL_REGISTRAR_NAME = 5;
const COL_REGISTRANT_ADDRESS = 6;
const COL_REGISTRANT_CITY = 7;
const COL_REGISTRANT_STATE = 8;
const COL_REGISTRANT_ZIP = 9;
const COL_REGISTRANT_COUNTRY = 10;
const COL_REGISTRANT_EMAIL = 11;
const COL_REGISTRANT_PHONE = 12;

interface FilteredRow {
    domainName: string;
    createdDate: string;
    expiresDate: string;
    name: string;
    registrant_name: string;
    registrant_organization: string;
    registrant_street1: string;
    registrant_city: string;
    registrant_state: string;
    registrant_postalCode: string;
    registrant_country: string;
    email: string;
    number: string;
}

const formatDate = (val: string) => {
    if (!val || val.trim() === '') return '';
    try {
        let date: Date;
        const num = Number(val);

        // Check if it's an Excel serial date (e.g., 46026 is roughly in year 2026)
        // Excel base date is Dec 30, 1899. Values between 30000 and 60000 cover roughly 1982 to 2064.
        if (!isNaN(num) && num > 30000 && num < 60000) {
            date = new Date(Math.round((num - 25569) * 86400 * 1000));
        } else {
            date = new Date(val);
        }

        if (!isNaN(date.getTime())) {
            const year = date.getUTCFullYear();
            // Guard against invalid/extreme years that cause '+' sign prefix in ISO
            if (year < 1900 || year > 2100) return val;

            return date.toISOString().split('.')[0] + 'Z';
        }
    } catch (e) {
        return val;
    }
    return val;
};

type Step = 'upload' | 'scanning' | 'filter' | 'viewing';

export function CsvCountryFilter() {
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [countries, setCountries] = useState<string[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [open, setOpen] = useState(false);

    const [results, setResults] = useState<FilteredRow[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processedCount, setProcessedCount] = useState(0);
    const [columnIndices, setColumnIndices] = useState({
        domain: COL_DOMAIN_NAME,
        country: COL_REGISTRANT_COUNTRY,
        email: COL_REGISTRANT_EMAIL,
        name: COL_REGISTRANT_NAME,
        phone: COL_REGISTRANT_PHONE,
        company: COL_REGISTRANT_COMPANY,
        registrar: COL_REGISTRAR_NAME,
        address: COL_REGISTRANT_ADDRESS,
        city: COL_REGISTRANT_CITY,
        state: COL_REGISTRANT_STATE,
        zip: COL_REGISTRANT_ZIP,
        createDate: COL_CREATE_DATE,
        expiryDate: COL_EXPIRY_DATE
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            resetState();
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setStep('scanning');
            scanForCountries(selectedFile);
        }
    };

    const resetState = () => {
        setCountries([]);
        setSelectedCountry('');
        setResults([]);
        setProcessedCount(0);
        setStep('upload');
        setIsProcessing(false);
        // Reset column indices to default when a new file is uploaded
        setColumnIndices({
            domain: COL_DOMAIN_NAME,
            country: COL_REGISTRANT_COUNTRY,
            email: COL_REGISTRANT_EMAIL,
            name: COL_REGISTRANT_NAME,
            phone: COL_REGISTRANT_PHONE,
            company: COL_REGISTRANT_COMPANY,
            registrar: COL_REGISTRAR_NAME,
            address: COL_REGISTRANT_ADDRESS,
            city: COL_REGISTRANT_CITY,
            state: COL_REGISTRANT_STATE,
            zip: COL_REGISTRANT_ZIP,
            createDate: COL_CREATE_DATE,
            expiryDate: COL_EXPIRY_DATE
        });
    };

    const scanForCountries = (targetFile: File) => {
        setIsProcessing(true);
        const uniqueCountries = new Set<string>();
        let count = 0;
        let detectedIndices = { ...columnIndices };
        let indicesFound = false;

        Papa.parse(targetFile, {
            skipEmptyLines: true,
            chunkSize: 1024 * 1024 * 5,
            step: (row) => {
                count++;
                const data = row.data as string[];
                if (!data || data.length < 5) return;

                // Try to detect headers from the very first row
                if (count === 1 && !indicesFound) {
                    const header = data.map(v => v.toString().toLowerCase().trim());

                    // Look for exact matches first, then partials
                    const findIdx = (names: string[]) => {
                        for (const name of names) {
                            const exact = header.indexOf(name);
                            if (exact !== -1) return exact;
                        }
                        for (const name of names) {
                            const partial = header.findIndex(h => h.includes(name));
                            if (partial !== -1) return partial;
                        }
                        return -1;
                    };

                    const cIdx = findIdx(['registrant_country', 'country']);
                    if (cIdx !== -1) {
                        detectedIndices = {
                            domain: findIdx(['domain_name', 'domain']),
                            country: cIdx,
                            email: findIdx(['registrant_email', 'email']),
                            name: findIdx(['registrant_name', 'name']),
                            phone: findIdx(['registrant_phone', 'phone', 'number']),
                            company: findIdx(['registrant_company', 'company']),
                            registrar: findIdx(['domain_registrar_name', 'registrar']),
                            address: findIdx(['registrant_address', 'address', 'street']),
                            city: findIdx(['registrant_city', 'city']),
                            state: findIdx(['registrant_state', 'state']),
                            zip: findIdx(['registrant_zip', 'zip', 'postal']),
                            createDate: findIdx(['create_date', 'created']),
                            expiryDate: findIdx(['expiry_date', 'expires', 'expiry'])
                        };

                        // Ensure we don't have -1 for critical fields
                        if (detectedIndices.domain === -1) detectedIndices.domain = 0;

                        indicesFound = true;
                        setColumnIndices(detectedIndices);
                        return; // Skip the header row from country list
                    }
                }

                if (count % 10000 === 0) setProcessedCount(count);

                const countryIdx = detectedIndices.country;
                if (data.length > countryIdx) {
                    const country = data[countryIdx]?.toString().trim();
                    if (country &&
                        country.length > 0 &&
                        !country.toLowerCase().includes('registrant_country') &&
                        country.length < 60) {
                        uniqueCountries.add(country);
                    }
                }
            },
            complete: () => {
                const sortedCountries = Array.from(uniqueCountries).sort();
                setCountries(sortedCountries);
                setIsProcessing(false);
                setStep('filter');
                if (sortedCountries.length === 0) {
                    toast.error("No countries found. Please check file format.");
                } else {
                    toast.success(`Analysis complete! Found ${sortedCountries.length} countries.`);
                }
            },
            error: (err) => {
                console.error(err);
                setIsProcessing(false);
                setStep('upload');
                toast.error("Error scanning file: " + err.message);
            }
        });
    };

    const handleAction = (type: 'preview' | 'download') => {
        if (!file || !selectedCountry) return;
        setIsProcessing(true);

        const newResults: FilteredRow[] = [];
        let count = 0;

        Papa.parse(file, {
            skipEmptyLines: true,
            chunkSize: 1024 * 1024 * 5,
            step: (row) => {
                count++;
                if (count % 10000 === 0) setProcessedCount(count);

                const data = row.data as string[];
                const cIdx = columnIndices.country;
                if (data && data.length > cIdx) {
                    const country = data[cIdx]?.toString().trim();

                    if (country === selectedCountry) {
                        newResults.push({
                            domainName: data[columnIndices.domain] || '',
                            createdDate: formatDate(data[columnIndices.createDate] || ''),
                            expiresDate: formatDate(data[columnIndices.expiryDate] || ''),
                            name: data[columnIndices.registrar] || '',
                            registrant_name: data[columnIndices.company] || '',
                            registrant_organization: data[columnIndices.name] || '',
                            registrant_street1: data[columnIndices.address] || '',
                            registrant_city: data[columnIndices.city] || '',
                            registrant_state: data[columnIndices.state] || '',
                            registrant_postalCode: data[columnIndices.zip] || '',
                            registrant_country: country || '',
                            email: data[columnIndices.email] || '',
                            number: data[columnIndices.phone] || ''
                        });
                    }
                }
            },
            complete: () => {
                setIsProcessing(false);
                if (type === 'preview') {
                    setResults(newResults);
                    setStep('viewing');
                    toast.success(`Showing ${newResults.length} records.`);
                } else {
                    performDownload(newResults);
                    toast.success("Download started!");
                }
            },
            error: (err) => {
                setIsProcessing(false);
                toast.error("Process failed");
            }
        });
    };

    const performDownload = (data: FilteredRow[]) => {
        if (data.length === 0) return;

        // Map to exact requested header names
        const exportData = data.map((row) => ({
            'domainName': row.domainName,
            'createdDate': row.createdDate,
            'expiresDate': row.expiresDate,
            'name': row.name,
            'registrant_name': row.registrant_name,
            'registrant_organization': row.registrant_organization,
            'registrant_street1': row.registrant_street1,
            'registrant_city': row.registrant_city,
            'registrant_state': row.registrant_state,
            'registrant_postalCode': row.registrant_postalCode,
            'registrant_country': row.registrant_country,
            'email': row.email,
            'number': row.number
        }));

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `filtered_${selectedCountry.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 w-full max-w-5xl mx-auto">
            <div className="text-center mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">CSV Country Filter</h1>
                <p className="text-muted-foreground">Local processing for large CSV files.</p>
            </div>

            <Card className="w-full max-w-2xl border shadow-md">
                <CardContent className="pt-8">
                    {/* Stepper Inside Card */}
                    <div className="flex items-center justify-center gap-4 mb-10 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-full">
                        <div className={cn("flex items-center gap-2", step === 'upload' ? "text-primary" : "opacity-40")}>
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">1</span>
                            UPLOAD
                        </div>
                        <div className="w-8 h-px bg-border"></div>
                        <div className={cn("flex items-center gap-2", ['scanning', 'filter'].includes(step) ? "text-primary" : "opacity-40")}>
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">2</span>
                            ANALYZE
                        </div>
                        <div className="w-8 h-px bg-border"></div>
                        <div className={cn("flex items-center gap-2", step === 'viewing' ? "text-primary" : "opacity-40")}>
                            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">3</span>
                            RESULTS
                        </div>
                    </div>

                    <div className="w-full">
                        {/* Step 1: Upload */}
                        {step === 'upload' && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="h-48 border-2 border-dashed rounded-lg border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5 transition-colors cursor-pointer flex flex-col items-center justify-center gap-4"
                            >
                                <div className="p-3 rounded-full bg-primary/5 text-primary">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium">Click to select CSV</p>
                                    <p className="text-xs text-muted-foreground mt-1">Files up to 1GB supported</p>
                                </div>
                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept=".csv,.txt"
                                />
                            </div>
                        )}

                        {/* Step 2: Scanning */}
                        {step === 'scanning' && (
                            <div className="flex flex-col items-center gap-6 py-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <div className="text-center space-y-1">
                                    <h3 className="font-bold">Analyzing file...</h3>
                                    <p className="text-sm text-muted-foreground">Processed {processedCount.toLocaleString()} rows</p>
                                </div>
                                <div className="w-full max-w-xs bg-muted h-1 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Filter */}
                        {step === 'filter' && (
                            <div className="space-y-6">
                                <div className="text-center space-y-1">
                                    <h3 className="font-bold text-lg">Configure Filter</h3>
                                    <p className="text-xs text-muted-foreground">File: {file?.name}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Select Country</label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={open}
                                                className="w-full justify-between h-11 border font-normal"
                                                disabled={isProcessing}
                                            >
                                                {selectedCountry ? selectedCountry : "Search country..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search country..." />
                                                <CommandList>
                                                    <CommandEmpty>No country found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {countries.map((c) => (
                                                            <CommandItem
                                                                key={c}
                                                                value={c}
                                                                onSelect={(currentValue) => {
                                                                    setSelectedCountry(currentValue === selectedCountry ? "" : currentValue);
                                                                    setOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedCountry === c ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {c}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="outline"
                                        className="h-11 gap-2 border font-semibold"
                                        disabled={!selectedCountry || isProcessing}
                                        onClick={() => handleAction('preview')}
                                    >
                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                        Preview
                                    </Button>
                                    <Button
                                        className="h-11 gap-2 font-semibold"
                                        disabled={!selectedCountry || isProcessing}
                                        onClick={() => handleAction('download')}
                                    >
                                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                                        Download
                                    </Button>
                                </div>
                                <Button variant="ghost" className="w-full text-xs text-muted-foreground h-8" onClick={resetState}>
                                    Choose another file
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Step 4: Full Results Table - Wider Layout */}
            {step === 'viewing' && (
                <div className="w-full mt-8 space-y-4">
                    <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md">
                                <FileSpreadsheet className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold">{selectedCountry} Results</h3>
                                <p className="text-xs text-muted-foreground">Found {results.length.toLocaleString()} matches</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAction('download')} className="gap-2 h-9">
                                <Download className="h-3.5 w-3.5" />
                                Download Full CSV
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setStep('filter')} className="h-9">
                                Back to Filter
                            </Button>
                        </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse">
                                <TableHeader className="bg-muted/10 border-b">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="border-r font-bold text-foreground w-[60px]">No.</TableHead>
                                        <TableHead className="border-r font-bold text-foreground">Name</TableHead>
                                        <TableHead className="border-r font-bold text-foreground">Domain Name</TableHead>
                                        <TableHead className="border-r font-bold text-foreground">Number</TableHead>
                                        <TableHead className="font-bold text-foreground">Email</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.slice(0, 50).map((row, idx) => (
                                        <TableRow key={idx} className={cn(
                                            "border-b",
                                            idx % 2 === 0 ? "bg-white" : "bg-muted/30"
                                        )}>
                                            <TableCell className="border-r py-3 px-4 font-bold text-muted-foreground text-center">{idx + 1}</TableCell>
                                            <TableCell className="border-r py-3 px-4 font-medium">{row.name || 'N/A'}</TableCell>
                                            <TableCell className="border-r py-3 px-4 text-primary font-mono text-sm">{row.domainName}</TableCell>
                                            <TableCell className="border-r py-3 px-4 text-muted-foreground">{row.number}</TableCell>
                                            <TableCell className="py-3 px-4 text-muted-foreground">{row.email}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="p-3 bg-muted/10 border-t text-center text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                            Showing first 50 results. Download to view all {results.length.toLocaleString()} rows.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
