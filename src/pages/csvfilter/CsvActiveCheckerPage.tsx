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
    PhoneCall,
    RefreshCw,
    Info,
    Play
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

type Step = 'upload' | 'map' | 'processing' | 'results';

interface VerificationResult {
    originalRow: Record<string, string>;
    originalNumber: string;
    formattedNumber: string;
    active: boolean;
    carrier: string;
    type: string;
    country: string;
    reason: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const COUNTRY_NAME_TO_PREFIX: Record<string, string> = {
    // North America
    'US': '1', 'USA': '1', 'UNITED STATES': '1', 'UNITED STATES OF AMERICA': '1',
    'CA': '1', 'CAN': '1', 'CANADA': '1',
    // Europe
    'GB': '44', 'UK': '44', 'UNITED KINGDOM': '44', 'GREAT BRITAIN': '44',
    'FR': '33', 'FRA': '33', 'FRANCE': '33',
    'DE': '49', 'DEU': '49', 'GERMANY': '49',
    'IT': '39', 'ITA': '39', 'ITALY': '39',
    'ES': '34', 'ESP': '34', 'SPAIN': '34',
    'NL': '31', 'NLD': '31', 'NETHERLANDS': '31',
    'CH': '41', 'CHE': '41', 'SWITZERLAND': '41',
    'SE': '46', 'SWE': '46', 'SWEDEN': '46',
    'NO': '47', 'NOR': '47', 'NORWAY': '47',
    'DK': '45', 'DNK': '45', 'DENMARK': '45',
    'FI': '358', 'FIN': '358', 'FINLAND': '358',
    'IE': '353', 'IRL': '353', 'IRELAND': '353',
    'BE': '32', 'BEL': '32', 'BELGIUM': '32',
    'AT': '43', 'AUT': '43', 'AUSTRIA': '43',
    'PT': '351', 'PRT': '351', 'PORTUGAL': '351',
    'GR': '30', 'GRC': '30', 'GREECE': '30',
    'PL': '48', 'POL': '48', 'POLAND': '48',
    'CY': '357', 'CYP': '357', 'CYPRUS': '357',
    'RO': '40', 'ROU': '40', 'ROMANIA': '40',
    'UA': '380', 'UKR': '380', 'UKRAINE': '380',
    'MD': '373', 'MDA': '373', 'MOLDOVA': '373',
    'GE': '995', 'GEO': '995', 'GEORGIA': '995',
    'AZ': '994', 'AZE': '994', 'AZERBAIJAN': '994',
    'LU': '352', 'LUX': '352', 'LUXEMBOURG': '352',
    'SK': '421', 'SVK': '421', 'SLOVAKIA': '421',
    'AL': '355', 'ALB': '355', 'ALBANIA': '355',
    'AD': '376', 'AND': '376', 'ANDORRA': '376',
    // Asia
    'IN': '91', 'IND': '91', 'INDIA': '91',
    'CN': '86', 'CHN': '86', 'CHINA': '86',
    'JP': '81', 'JPN': '81', 'JAPAN': '81',
    'KR': '82', 'KOR': '82', 'SOUTH KOREA': '82',
    'SG': '65', 'SGP': '65', 'SINGAPORE': '65',
    'MY': '60', 'MYS': '60', 'MALAYSIA': '60',
    'TH': '66', 'THA': '66', 'THAILAND': '66',
    'VN': '84', 'VNM': '84', 'VIETNAM': '84',
    'ID': '62', 'IDN': '62', 'INDONESIA': '62',
    'PH': '63', 'PHL': '63', 'PHILIPPINES': '63',
    'PK': '92', 'PAK': '92', 'PAKISTAN': '92',
    'BD': '880', 'BGD': '880', 'BANGLADESH': '880',
    'LK': '94', 'LKA': '94', 'SRI LANKA': '94',
    'NP': '977', 'NPL': '977', 'NEPAL': '977',
    'TW': '886', 'TWN': '886', 'TAIWAN': '886',
    'IR': '98', 'IRN': '98', 'IRAN': '98',
    'KG': '996', 'KGZ': '996', 'KYRGYZSTAN': '996',
    'LA': '856', 'LAO': '856', 'LAOS': '856',
    'HK': '852', 'HKG': '852', 'HONG KONG': '852',
    // Middle East
    'AE': '971', 'ARE': '971', 'UNITED ARAB EMIRATES': '971', 'UAE': '971',
    'SA': '966', 'SAU': '966', 'SAUDI ARABIA': '966',
    'QA': '974', 'QAT': '974', 'QATAR': '974',
    'OM': '968', 'OMN': '968', 'OMAN': '968',
    'KW': '965', 'KWT': '965', 'KUWAIT': '965',
    'BH': '973', 'BHR': '973', 'BAHRAIN': '973',
    'IL': '972', 'ISR': '972', 'ISRAEL': '972',
    'TR': '90', 'TUR': '90', 'TURKEY': '90',
    'JO': '962', 'JOR': '962', 'JORDAN': '962',
    'IQ': '964', 'IRQ': '964', 'IRAQ': '964',
    'PS': '970', 'PALESTINE': '970',
    // Oceania
    'AU': '61', 'AUS': '61', 'AUSTRALIA': '61',
    'NZ': '64', 'NZL': '64', 'NEW ZEALAND': '64',
    // Africa
    'ZA': '27', 'ZAF': '27', 'SOUTH AFRICA': '27',
    'NG': '234', 'NGA': '234', 'NIGERIA': '234',
    'EG': '20', 'EGY': '20', 'EGYPT': '20',
    'KE': '254', 'KEN': '254', 'KENYA': '254',
    'GH': '233', 'GHA': '233', 'GHANA': '233',
    'MA': '212', 'MAR': '212', 'MOROCCO': '212',
    'LY': '218', 'LBY': '218', 'LIBYA': '218',
    'DZ': '213', 'DZA': '213', 'ALGERIA': '213',
    'TN': '216', 'TUN': '216', 'TUNISIA': '216',
    'UG': '256', 'UGA': '256', 'UGANDA': '256',
    'BW': '267', 'BWA': '267', 'BOTSWANA': '267',
    'RW': '250', 'RWA': '250', 'RWANDA': '250',
    'ZW': '263', 'ZWE': '263', 'ZIMBABWE': '263',
    'RE': '262', 'REU': '262', 'REUNION': '262',
    'SD': '249', 'SDN': '249', 'SUDAN': '249',
    'GM': '220', 'GMB': '220', 'GAMBIA': '220',
    'TG': '228', 'TGO': '228', 'TOGO': '228',
    'VC': '1784', 'VCT': '1784', 'SAINT VINCENT': '1784',
    'TZ': '255', 'TZA': '255', 'TANZANIA': '255',
    'UZ': '998', 'UZB': '998', 'UZBEKISTAN': '998',
    'CZ': '420', 'CZE': '420', 'CZECH': '420', 'CZECH REPUBLIC': '420',
    'KH': '855', 'KHM': '855', 'CAMBODIA': '855',
    'SC': '248', 'SYC': '248', 'SEYCHELLES': '248',
    'LV': '371', 'LVA': '371', 'LATVIA': '371',
    'KZ': '7', 'KAZ': '7', 'KAZAKHSTAN': '7',
    'BG': '359', 'BGR': '359', 'BULGARIA': '359',
    'BI': '257', 'BDI': '257', 'BURUNDI': '257',
    'CD': '243', 'COD': '243', 'CONGO': '243',
    // South America
    'BR': '55', 'BRA': '55', 'BRAZIL': '55',
    'AR': '54', 'ARG': '54', 'ARGENTINA': '54',
    'CO': '57', 'COL': '57', 'COLOMBIA': '57',
    'CL': '56', 'CHL': '56', 'CHILE': '56',
    'PE': '51', 'PER': '51', 'PERU': '51',
    'VE': '58', 'VEN': '58', 'VENEZUELA': '58',
    'MX': '52', 'MEX': '52', 'MEXICO': '52',
    'EC': '593', 'ECU': '593', 'ECUADOR': '593',
    'UY': '598', 'URY': '598', 'URUGUAY': '598',
    'BO': '591', 'BOL': '591', 'BOLIVIA': '591',
    'HN': '504', 'HND': '504', 'HONDURAS': '504',
};

function cleanPhoneNumber(rawPhone: string): string {
    let phoneStr = rawPhone.trim();
    if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(phoneStr)) {
        const num = Number(phoneStr);
        if (!isNaN(num)) {
            phoneStr = num.toString();
        }
    }
    return phoneStr.replace(/\D/g, '');
}

function getValidLocalLengths(prefix: string): number[] {
    switch (prefix) {
        case '1': // US, Canada
            return [10];
        case '86': // China
            return [9, 10, 11];
        case '91': // India
            return [10];
        case '44': // UK
            return [9, 10];
        case '61': // Australia
            return [9];
        case '65': // Singapore
            return [8];
        case '966': // Saudi Arabia
            return [9];
        case '971': // UAE
            return [9];
        case '33': // France
            return [9];
        case '49': // Germany
            return [10, 11];
        case '39': // Italy
            return [9, 10];
        case '34': // Spain
            return [9];
        case '31': // Netherlands
            return [9];
        case '41': // Switzerland
            return [9];
        case '46': // Sweden
            return [7, 8, 9];
        case '47': // Norway
            return [8];
        case '45': // Denmark
            return [8];
        case '32': // Belgium
            return [9];
        case '43': // Austria
            return [10, 11, 12, 13];
        case '351': // Portugal
            return [9];
        case '30': // Greece
            return [10];
        case '48': // Poland
            return [9];
        case '81': // Japan
            return [9, 10];
        case '82': // South Korea
            return [9, 10];
        case '60': // Malaysia
            return [8, 9, 10];
        case '66': // Thailand
            return [9];
        case '84': // Vietnam
            return [9, 10];
        case '62': // Indonesia
            return [9, 10, 11];
        case '63': // Philippines
            return [9, 10];
        case '92': // Pakistan
            return [9, 10];
        case '880': // Bangladesh
            return [10];
        case '94': // Sri Lanka
            return [9];
        case '977': // Nepal
            return [9, 10];
        case '974': // Qatar
            return [8];
        case '968': // Oman
            return [8];
        case '965': // Kuwait
            return [8];
        case '973': // Bahrain
            return [8];
        case '972': // Israel
            return [9];
        case '90': // Turkey
            return [10];
        case '64': // New Zealand
            return [8, 9];
        case '27': // South Africa
            return [9];
        case '234': // Nigeria
            return [10];
        case '20': // Egypt
            return [9, 10];
        case '254': // Kenya
            return [9];
        case '233': // Ghana
            return [9];
        case '212': // Morocco
            return [9];
        case '55': // Brazil
            return [10, 11];
        case '54': // Argentina
            return [10];
        case '57': // Colombia
            return [10];
        case '56': // Chile
            return [9];
        case '51': // Peru
            return [9];
        case '58': // Venezuela
            return [10];
        case '52': // Mexico
            return [10];
        case '357': // Cyprus
            return [8];
        case '40': // Romania
            return [9];
        case '380': // Ukraine
            return [9];
        case '852': // Hong Kong
            return [8];
        case '218': // Libya
            return [9];
        case '994': // Azerbaijan
            return [9];
        case '213': // Algeria
            return [9];
        case '373': // Moldova
            return [8];
        case '995': // Georgia
            return [9];
        case '962': // Jordan
            return [9];
        case '593': // Ecuador
            return [9];
        case '964': // Iraq
            return [10];
        case '216': // Tunisia
            return [8];
        case '256': // Uganda
            return [9];
        case '352': // Luxembourg
            return [9];
        case '886': // Taiwan
            return [9];
        case '421': // Slovakia
            return [9];
        case '98': // Iran
            return [10];
        case '355': // Albania
            return [9];
        case '598': // Uruguay
            return [8, 9];
        case '996': // Kyrgyzstan
            return [9];
        case '267': // Botswana
            return [7, 8];
        case '856': // Laos
            return [9, 10];
        case '250': // Rwanda
            return [9];
        case '591': // Bolivia
            return [8];
        case '263': // Zimbabwe
            return [9];
        case '262': // Reunion
            return [9];
        case '504': // Honduras
            return [8];
        case '376': // Andorra
            return [6];
        case '249': // Sudan
            return [9];
        case '220': // Gambia
            return [7];
        case '992': // Tajikistan
            return [9];
        case '228': // Togo
            return [8];
        case '1784': // Saint Vincent
            return [7];
        case '255': // Tanzania
            return [9];
        case '998': // Uzbekistan
            return [9];
        case '420': // Czech Republic
            return [9];
        case '855': // Cambodia
            return [8, 9];
        case '248': // Seychelles
            return [7];
        case '371': // Latvia
            return [8];
        case '7': // Kazakhstan
            return [10];
        case '359': // Bulgaria
            return [7, 8, 9];
        case '387': // Bosnia
            return [8];
        case '1340': // Virgin Islands US
            return [7];
        case '1284': // Virgin Islands British
            return [7];
        case '225': // Cote D'Ivoire
            return [10];
        case '970': // Palestine
            return [9];
        case '257': // Burundi
            return [8];
        case '243': // Congo
            return [9];
        default:
            return [8, 9, 10, 11]; // default fallback
    }
}

function formatPhoneNumber(rawPhone: string, rowPrefixDigits: string | null): string {
    const cleanDigits = cleanPhoneNumber(rawPhone);
    const hasOriginalPlus = rawPhone.trim().startsWith('+');
    
    const allCountryCodes = Array.from(new Set(Object.values(COUNTRY_NAME_TO_PREFIX)))
        .sort((a, b) => b.length - a.length);

    if (rowPrefixDigits) {
        let processedDigits = cleanDigits;
        if (processedDigits.startsWith(rowPrefixDigits + rowPrefixDigits)) {
            processedDigits = processedDigits.slice(rowPrefixDigits.length);
        }

        let detectedWrongPrefix = '';
        for (const code of allCountryCodes) {
            if (code !== rowPrefixDigits && processedDigits.startsWith(code)) {
                const remainder = processedDigits.slice(code.length);
                
                // If we strip this wrong prefix, what is the resulting local part?
                const localPart = remainder.startsWith(rowPrefixDigits)
                    ? remainder.slice(rowPrefixDigits.length)
                    : remainder;
                
                const validLengths = getValidLocalLengths(rowPrefixDigits);
                const isValidLength = validLengths.includes(localPart.length);

                if (isValidLength && (hasOriginalPlus || remainder.startsWith(rowPrefixDigits))) {
                    detectedWrongPrefix = code;
                    break;
                }
            }
        }

        if (detectedWrongPrefix) {
            processedDigits = processedDigits.slice(detectedWrongPrefix.length);
        }
        
        if (processedDigits.startsWith(rowPrefixDigits + rowPrefixDigits)) {
            processedDigits = processedDigits.slice(rowPrefixDigits.length);
        }

        if (processedDigits.startsWith(rowPrefixDigits)) {
            return `+${processedDigits}`;
        } else {
            return `+${rowPrefixDigits}${processedDigits}`;
        }
    } else {
        return `+${cleanDigits}`;
    }
}

export default function CsvActiveCheckerPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [phoneColumn, setPhoneColumn] = useState<string>('');
    const [countryColumn, setCountryColumn] = useState<string>('');
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
                    
                    // Auto-detect phone number column
                    const detectPhoneColumn = fields.find(h => {
                        const low = h.toLowerCase();
                        return low.includes('phone') || low.includes('number') || low.includes('tel') || low.includes('mobile') || low.includes('contact');
                    });
                    setPhoneColumn(detectPhoneColumn || fields[0] || '');

                    // Auto-detect country column
                    const detectCountryColumn = fields.find(h => {
                        const low = h.toLowerCase().replace(/[\s_-]/g, '');
                        return low === 'registrantcountry';
                    }) || fields.find(h => {
                        const low = h.toLowerCase();
                        return low.includes('country') || low.includes('registrant_country') || low.includes('nation') || low.includes('cntry');
                    });
                    setCountryColumn(detectCountryColumn || 'none');
                    
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
        if (!phoneColumn) {
            toast.error("Please select a phone number column first.");
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
            const rawPhone = row[phoneColumn] || '';
            let rowPrefixDigits: string | null = null;
            
            if (countryColumn && countryColumn !== 'none' && row[countryColumn]) {
                const rowCountry = row[countryColumn].trim().toUpperCase()
                    .replace(/[^A-Z0-9\s]/g, '')
                    .replace(/\s+/g, ' ');
                if (rowCountry) {
                    if (COUNTRY_NAME_TO_PREFIX[rowCountry]) {
                        rowPrefixDigits = COUNTRY_NAME_TO_PREFIX[rowCountry];
                    } else {
                        const foundKey = Object.keys(COUNTRY_NAME_TO_PREFIX).find(key => 
                            rowCountry.includes(key) || key.includes(rowCountry)
                        );
                        if (foundKey) {
                            rowPrefixDigits = COUNTRY_NAME_TO_PREFIX[foundKey];
                        }
                    }
                }
            }

            const finalPhone = rawPhone.trim() ? formatPhoneNumber(rawPhone, rowPrefixDigits) : '';
            return {
                originalRow: row,
                rawPhone,
                formattedPhone: finalPhone
            };
        });

        // Process in batches
        for (let i = 0; i < formattedRows.length; i += batchSize) {
            const batch = formattedRows.slice(i, i + batchSize);
            const batchNumbers = batch.map(b => b.formattedPhone).filter(Boolean);

            if (batchNumbers.length === 0) {
                batch.forEach(b => {
                    verificationResults.push({
                        originalRow: b.originalRow,
                        originalNumber: b.rawPhone,
                        formattedNumber: b.formattedPhone,
                        active: false,
                        carrier: 'N/A',
                        type: 'unknown',
                        country: 'N/A',
                        reason: 'Empty Phone Number'
                    });
                });
                setProcessedCount(prev => Math.min(prev + batch.length, formattedRows.length));
                continue;
            }

            try {
                const response = await axios.post(
                    `${API_URL}/phone-checker/verify-batch`,
                    { numbers: batchNumbers },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data && response.data.results) {
                    const batchResults = response.data.results;
                    
                    batch.forEach((b) => {
                        if (!b.formattedPhone) {
                            verificationResults.push({
                                originalRow: b.originalRow,
                                originalNumber: b.rawPhone,
                                formattedNumber: '',
                                active: false,
                                carrier: 'N/A',
                                type: 'unknown',
                                country: 'N/A',
                                reason: 'Empty Phone Number'
                            });
                            return;
                        }

                        const match = batchResults.find((r: any) => r.original === b.formattedPhone || r.formatted === b.formattedPhone);

                        verificationResults.push({
                            originalRow: b.originalRow,
                            originalNumber: b.rawPhone,
                            formattedNumber: b.formattedPhone,
                            active: match ? match.active : false,
                            carrier: match ? match.carrier || 'N/A' : 'N/A',
                            type: match ? match.type || 'unknown' : 'unknown',
                            country: match ? match.country || 'N/A' : 'N/A',
                            reason: match ? match.reason || 'Verification failed' : 'Verification failed'
                        });
                    });
                }
            } catch (err: any) {
                console.error("Batch verification failed:", err);
                batch.forEach(b => {
                    verificationResults.push({
                        originalRow: b.originalRow,
                        originalNumber: b.rawPhone,
                        formattedNumber: b.formattedPhone,
                        active: false,
                        carrier: 'Error',
                        type: 'unknown',
                        country: 'N/A',
                        reason: err.message || 'API request failed'
                    });
                });
            }

            const updatedCount = Math.min(i + batchSize, formattedRows.length);
            setProcessedCount(updatedCount);
        }

        setResults(verificationResults);
        setStep('results');
        toast.success(`Active Check completed! Processed ${parsedRows.length} rows.`);
    };

    const handleDownload = (filterType: 'all' | 'active' | 'inactive') => {
        if (results.length === 0) return;

        let filtered = results;
        if (filterType === 'active') {
            filtered = results.filter(r => r.active);
        } else if (filterType === 'inactive') {
            filtered = results.filter(r => !r.active);
        }

        const exportData = filtered.map(r => ({
            ...r.originalRow,
            [phoneColumn]: r.formattedNumber || r.originalNumber,
            'Verification Status': r.active ? 'ACTIVE' : 'INACTIVE',
            'Carrier': r.carrier,
            'Number Type': r.type,
            'Region / Country': r.country,
            'Verification Details': r.reason
        }));

        const csv = Papa.unparse(exportData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const baseName = file?.name.replace(/\.[^/.]+$/, "") || "phone_verification";
        link.setAttribute('download', `${baseName}_${filterType}_verified.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Download of ${filterType} results started!`);
    };

    const resetState = () => {
        setFile(null);
        setHeaders([]);
        setPhoneColumn('');
        setCountryColumn('none');
        setParsedRows([]);
        setResults([]);
        setProcessedCount(0);
        setTotalToProcess(0);
        setStep('upload');
    };

    const activeCount = results.filter(r => r.active).length;
    const inactiveCount = results.filter(r => !r.active).length;

    return (
        <div className="flex flex-col w-full max-w-5xl mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/offerings')} className="h-9 w-9 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent flex items-center gap-2">
                            <PhoneCall className="h-6 w-6 text-primary animate-pulse" /> Active Phone Checker Pro
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">Verify if phone numbers are active, lookup carriers, and trace locations in bulk.</p>
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
                                    <p className="text-sm text-muted-foreground">Upload your contacts file with numbers to verify.</p>
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
                                    <p className="font-semibold text-foreground">Active Checking Intelligence</p>
                                    <p>Uses official Twilio Lookup validation to verify existence, network routing status, and line types dynamically.</p>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label htmlFor="phone-col" className="text-sm font-semibold">Select Phone Number Column <span className="text-rose-500">*</span></Label>
                                    <Select value={phoneColumn} onValueChange={setPhoneColumn}>
                                        <SelectTrigger id="phone-col">
                                            <SelectValue placeholder="Choose phone column..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {headers.map(h => (
                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">The column containing phone numbers to cleanse and check.</p>
                                </div>

                                <div className="space-y-3">
                                    <Label htmlFor="country-col" className="text-sm font-semibold">Select Country Column (Optional)</Label>
                                    <Select value={countryColumn} onValueChange={setCountryColumn}>
                                        <SelectTrigger id="country-col">
                                            <SelectValue placeholder="No country column (Fallback to direct numbers)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (No country column)</SelectItem>
                                            {headers.map(h => (
                                                <SelectItem key={h} value={h}>{h}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Used to resolve and prepend the correct country dialing code first.</p>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t">
                                <Button variant="outline" onClick={resetState}>Cancel</Button>
                                <Button onClick={startVerification} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                    <Play className="h-4 w-4 fill-current" /> Start Active Checking
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Processing */}
                    {step === 'processing' && (
                        <div className="flex flex-col items-center gap-6 py-12">
                            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                            <div className="text-center space-y-2">
                                <h3 className="font-bold text-xl">Verifying Active Status...</h3>
                                <p className="text-sm text-muted-foreground">Checked {processedCount.toLocaleString()} of {totalToProcess.toLocaleString()} numbers</p>
                            </div>
                            <div className="w-full max-w-md bg-muted h-2 rounded-full overflow-hidden relative">
                                <div 
                                    className="bg-gradient-to-r from-primary to-indigo-600 h-full transition-all duration-300" 
                                    style={{ width: `${(processedCount / totalToProcess) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-muted-foreground">Formatting with country prefixes and running Twilio lookups...</p>
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Card className="bg-muted/30 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Checked</p>
                                        <p className="text-2xl font-black mt-1 text-foreground">{results.length.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-emerald-500/10 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Active / Valid</p>
                                        <p className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">{activeCount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-red-500/10 border-transparent shadow-none">
                                    <CardContent className="p-4 text-center">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Inactive / Non-Existent</p>
                                        <p className="text-2xl font-black mt-1 text-red-600 dark:text-red-400">{inactiveCount.toLocaleString()}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Export Buttons */}
                            <div className="flex flex-wrap gap-3">
                                <Button onClick={() => handleDownload('all')} className="gap-2">
                                    <Download className="h-4 w-4" /> Download All Results
                                </Button>
                                <Button variant="outline" onClick={() => handleDownload('active')} className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Download Active Only
                                </Button>
                                <Button variant="outline" onClick={() => handleDownload('inactive')} className="gap-2 border-red-500 text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:border-red-800">
                                    <XCircle className="h-4 w-4 text-red-500" /> Download Inactive Only
                                </Button>
                            </div>

                            {/* Preview Table */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Preview (First 10 rows)</h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Original Number</TableHead>
                                                <TableHead>Cleaned & Prepend</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Carrier</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Region</TableHead>
                                                <TableHead>Verification Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.slice(0, 10).map((r, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-mono text-muted-foreground">{r.originalNumber}</TableCell>
                                                    <TableCell className="font-medium font-mono">{r.formattedNumber || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        {r.active ? (
                                                            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800" variant="secondary">
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-rose-500/10 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800" variant="secondary">
                                                                Inactive
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{r.carrier}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize text-xs font-normal">
                                                            {r.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="uppercase">{r.country}</TableCell>
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
