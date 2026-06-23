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
import axios from 'axios';

type Step = 'upload' | 'config' | 'processing' | 'results';
type FilterAction = 'remove-telephone' | 'remove-mobile';
type CountryPreset = 'india' | 'uk' | 'us' | 'custom';
type ClassificationMode = 'twilio' | 'local';

interface ProcessedRow {
    original: Record<string, string>;
    formattedNumber: string;
    type: 'mobile' | 'telephone' | 'invalid';
    reason: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

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
        case '1': return [10];
        case '86': return [9, 10, 11];
        case '91': return [10];
        case '44': return [9, 10];
        case '61': return [9];
        case '65': return [8];
        case '966': return [9];
        case '971': return [9];
        case '33': return [9];
        case '49': return [10, 11];
        case '39': return [9, 10];
        case '34': return [9];
        case '31': return [9];
        case '41': return [9];
        case '46': return [7, 8, 9];
        case '47': return [8];
        case '45': return [8];
        case '32': return [9];
        case '43': return [10, 11, 12, 13];
        case '351': return [9];
        case '30': return [10];
        case '48': return [9];
        case '81': return [9, 10];
        case '82': return [9, 10];
        case '60': return [8, 9, 10];
        case '66': return [9];
        case '84': return [9, 10];
        case '62': return [9, 10, 11];
        case '63': return [9, 10];
        case '92': return [9, 10];
        case '880': return [10];
        case '94': return [9];
        case '977': return [9, 10];
        case '974': return [8];
        case '968': return [8];
        case '965': return [8];
        case '973': return [8];
        case '972': return [9];
        case '90': return [10];
        case '64': return [8, 9];
        case '27': return [9];
        case '234': return [10];
        case '20': return [9, 10];
        case '254': return [9];
        case '233': return [9];
        case '212': return [9];
        case '55': return [10, 11];
        case '54': return [10];
        case '57': return [10];
        case '56': return [9];
        case '51': return [9];
        case '58': return [10];
        case '52': return [10];
        case '357': return [8];
        case '40': return [9];
        case '380': return [9];
        case '852': return [8];
        case '218': return [9];
        case '994': return [9];
        case '213': return [9];
        case '373': return [8];
        case '995': return [9];
        case '962': return [9];
        case '593': return [9];
        case '964': return [10];
        case '216': return [8];
        case '256': return [9];
        case '352': return [9];
        case '886': return [9];
        case '421': return [9];
        case '98': return [10];
        case '355': return [9];
        case '598': return [8, 9];
        case '996': return [9];
        case '267': return [7, 8];
        case '856': return [9, 10];
        case '250': return [9];
        case '591': return [8];
        case '263': return [9];
        case '262': return [9];
        case '504': return [8];
        case '376': return [6];
        case '249': return [9];
        case '220': return [7];
        case '992': return [9];
        case '228': return [8];
        case '1784': return [7];
        case '255': return [9];
        case '998': return [9];
        case '420': return [9];
        case '855': return [8, 9];
        case '248': return [7];
        case '371': return [8];
        case '7': return [10];
        case '359': return [7, 8, 9];
        case '387': return [8];
        case '1340': return [7];
        case '1284': return [7];
        case '225': return [10];
        case '970': return [9];
        case '257': return [8];
        case '243': return [9];
        default: return [8, 9, 10, 11];
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
    const [classificationMode, setClassificationMode] = useState<ClassificationMode>('twilio');
    const [countryColumn, setCountryColumn] = useState<string>('none');
    const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
    
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
                    
                    if (detectPhoneColumn) {
                        setPhoneColumn(detectPhoneColumn);
                        toast.success(`Auto-detected column: "${detectPhoneColumn}"`);
                    } else if (fields.length > 0) {
                        setPhoneColumn(fields[0]);
                    }

                    // Auto-detect country column
                    const detectCountryColumn = fields.find(h => {
                        const low = h.toLowerCase().replace(/[\s_-]/g, '');
                        return low === 'registrantcountry';
                    }) || fields.find(h => {
                        const low = h.toLowerCase();
                        return low.includes('country') || low.includes('registrant_country') || low.includes('nation') || low.includes('cntry');
                    });
                    setCountryColumn(detectCountryColumn || 'none');
                    
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

    const handleProcess = async () => {
        if (!file || !phoneColumn) return;
        setStep('processing');
        setProcessedCount(0);
        setMobileCount(0);
        setTelephoneCount(0);
        setInvalidCount(0);

        const activeKept: any[] = [];
        const activeRemoved: any[] = [];
        let mobiles = 0;
        let telephones = 0;
        let invalids = 0;

        if (classificationMode === 'local') {
            parsedRows.forEach((row, index) => {
                const rawPhone = row[phoneColumn] || '';
                const classification = classifyNumber(rawPhone);

                const recordWithClassification = {
                    ...row,
                    [phoneColumn]: classification.cleaned || rawPhone,
                    __phoneType: classification.type,
                    __classificationReason: classification.reason,
                    __active: classification.type !== 'invalid',
                    __carrier: 'N/A (Local Heuristics)',
                    __country: 'N/A'
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
            });

            setTotalRows(parsedRows.length);
            setMobileCount(mobiles);
            setTelephoneCount(telephones);
            setInvalidCount(invalids);
            setKeptRows(activeKept);
            setRemovedRows(activeRemoved);
            setStep('results');
            toast.success(`Analysis complete! Classified ${parsedRows.length.toLocaleString()} records.`);
            return;
        }

        // Twilio Mode
        const token = localStorage.getItem("token");
        const batchSize = 15;

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
                    invalids++;
                    activeRemoved.push({
                        ...b.originalRow,
                        [phoneColumn]: b.rawPhone,
                        __phoneType: 'invalid',
                        __classificationReason: 'Empty Phone Number',
                        __active: false,
                        __carrier: 'N/A',
                        __country: 'N/A',
                        __skipReason: 'Empty Phone Number'
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
                            invalids++;
                            activeRemoved.push({
                                ...b.originalRow,
                                [phoneColumn]: b.rawPhone,
                                __phoneType: 'invalid',
                                __classificationReason: 'Empty Phone Number',
                                __active: false,
                                __carrier: 'N/A',
                                __country: 'N/A',
                                __skipReason: 'Empty Phone Number'
                            });
                            return;
                        }

                        const match = batchResults.find((r: any) => r.original === b.formattedPhone || r.formatted === b.formattedPhone);
                        
                        const isActive = match ? match.active : false;
                        const twilioType = match ? match.type || 'unknown' : 'unknown';
                        const carrierName = match ? match.carrier || 'Unknown' : 'Unknown';
                        const countryCode = match ? match.country || 'Unknown' : 'Unknown';
                        const verifyReason = match ? match.reason || 'Verification failed' : 'Verification failed';

                        // Map twilio type
                        let classificationType: 'mobile' | 'telephone' | 'invalid' = 'telephone';
                        if (!isActive) {
                            classificationType = 'invalid';
                        } else if (twilioType === 'mobile') {
                            classificationType = 'mobile';
                        } else {
                            classificationType = 'telephone'; // landline, voip, unknown
                        }

                        const recordWithClassification = {
                            ...b.originalRow,
                            [phoneColumn]: b.formattedPhone,
                            __phoneType: classificationType,
                            __classificationReason: verifyReason,
                            __active: isActive,
                            __carrier: carrierName,
                            __country: countryCode
                        };

                        if (classificationType === 'mobile') {
                            mobiles++;
                            if (filterAction === 'remove-telephone') {
                                activeKept.push(recordWithClassification);
                            } else {
                                activeRemoved.push({
                                    ...recordWithClassification,
                                    __skipReason: 'Is Mobile Number'
                                });
                            }
                        } else if (classificationType === 'telephone') {
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
                                __skipReason: verifyReason
                            });
                        }
                    });
                }
            } catch (err: any) {
                console.error("Batch verification failed:", err);
                batch.forEach(b => {
                    invalids++;
                    activeRemoved.push({
                        ...b.originalRow,
                        [phoneColumn]: b.formattedPhone || b.rawPhone,
                        __phoneType: 'invalid',
                        __classificationReason: err.message || 'API request failed',
                        __active: false,
                        __carrier: 'Error',
                        __country: 'N/A',
                        __skipReason: err.message || 'API request failed'
                    });
                });
            }

            const updatedCount = Math.min(i + batchSize, formattedRows.length);
            setProcessedCount(updatedCount);
        }

        setTotalRows(formattedRows.length);
        setMobileCount(mobiles);
        setTelephoneCount(telephones);
        setInvalidCount(invalids);
        setKeptRows(activeKept);
        setRemovedRows(activeRemoved);
        setStep('results');
        toast.success(`Verification complete! Classified ${formattedRows.length.toLocaleString()} records.`);
    };

    const handleDownloadKept = () => {
        if (keptRows.length === 0) return;
        
        let exportData: any[];
        if (classificationMode === 'twilio') {
            exportData = keptRows.map(row => {
                const copy = { ...row };
                const active = copy.__active;
                const carrier = copy.__carrier;
                const country = copy.__country;
                const phoneType = copy.__phoneType;
                const reason = copy.__classificationReason;
                delete copy.__phoneType;
                delete copy.__classificationReason;
                delete copy.__active;
                delete copy.__carrier;
                delete copy.__country;
                return {
                    ...copy,
                    'Verification Status': active ? 'ACTIVE' : 'INACTIVE',
                    'Carrier': carrier,
                    'Number Type': phoneType === 'mobile' ? 'Verified Mobile' : (phoneType === 'telephone' ? 'Verified Landline' : 'Invalid Number'),
                    'Region / Country': country,
                    'Verification Details': reason
                };
            });
        } else {
            exportData = keptRows.map(row => {
                const copy = { ...row };
                delete copy.__phoneType;
                delete copy.__classificationReason;
                delete copy.__active;
                delete copy.__carrier;
                delete copy.__country;
                return copy;
            });
        }

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

        let exportData: any[];
        if (classificationMode === 'twilio') {
            exportData = removedRows.map(row => {
                const copy = { ...row };
                const active = copy.__active;
                const carrier = copy.__carrier;
                const country = copy.__country;
                const phoneType = copy.__phoneType;
                const skipReason = copy.__skipReason;
                delete copy.__phoneType;
                delete copy.__classificationReason;
                delete copy.__active;
                delete copy.__carrier;
                delete copy.__country;
                delete copy.__skipReason;
                return {
                    ...copy,
                    'Filter Reason': skipReason,
                    'Verification Status': active ? 'ACTIVE' : 'INACTIVE',
                    'Carrier': carrier,
                    'Number Type': phoneType === 'mobile' ? 'Verified Mobile' : (phoneType === 'telephone' ? 'Verified Landline' : 'Invalid Number'),
                    'Region / Country': country
                };
            });
        } else {
            exportData = removedRows.map(row => {
                const copy = { ...row };
                const skipReason = copy.__skipReason;
                delete copy.__phoneType;
                delete copy.__classificationReason;
                delete copy.__active;
                delete copy.__carrier;
                delete copy.__country;
                delete copy.__skipReason;
                return {
                    ...copy,
                    'Filter Reason': skipReason
                };
            });
        }

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

                                <div className="space-y-3 col-span-1 md:col-span-2 border-b pb-4">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Classification Method</Label>
                                    <RadioGroup 
                                        value={classificationMode} 
                                        onValueChange={(val) => setClassificationMode(val as ClassificationMode)}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1"
                                    >
                                        <div className={cn(
                                            "flex items-center space-x-3 rounded-xl border p-4 transition-all duration-300 cursor-pointer hover:bg-muted/40",
                                            classificationMode === 'twilio' ? "border-indigo-600 bg-indigo-50/10 shadow-sm" : ""
                                        )}>
                                            <RadioGroupItem value="twilio" id="mode-twilio" />
                                            <Label htmlFor="mode-twilio" className="flex flex-col gap-1 cursor-pointer w-full">
                                                <span className="font-bold text-sm flex items-center gap-2">
                                                    <Smartphone className="h-4 w-4 text-indigo-500 animate-pulse" /> Twilio API Verification (Recommended)
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">Real-time lookup to accurately verify validity and carrier type</span>
                                            </Label>
                                        </div>
                                        <div className={cn(
                                            "flex items-center space-x-3 rounded-xl border p-4 transition-all duration-300 cursor-pointer hover:bg-muted/40",
                                            classificationMode === 'local' ? "border-indigo-600 bg-indigo-50/10 shadow-sm" : ""
                                        )}>
                                            <RadioGroupItem value="local" id="mode-local" />
                                            <Label htmlFor="mode-local" className="flex flex-col gap-1 cursor-pointer w-full">
                                                <span className="font-bold text-sm flex items-center gap-2">
                                                    <Filter className="h-4 w-4 text-slate-500" /> Local Heuristic Patterns
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">Instant browser-based sorting based on prefixes and length rules</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {classificationMode === 'twilio' && (
                                    <div className="space-y-3">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Country Column (Optional)</Label>
                                        <Select value={countryColumn} onValueChange={setCountryColumn}>
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="No country column (Fallback to direct numbers)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None (No country column)</SelectItem>
                                                {headers.map(h => (
                                                    <SelectItem key={h} value={h}>{h}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground">Used to resolve and prepend the correct country dialing prefix first.</p>
                                    </div>
                                )}

                                {classificationMode === 'local' && (
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
                                )}

                                {classificationMode === 'local' && preset === 'custom' && (
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
                                )}

                                {classificationMode === 'local' && preset !== 'custom' && (
                                    <div className="flex items-center gap-3 bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-xl">
                                        <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Using {preset.toUpperCase()} Preset rules</p>
                                            <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80">Rules are automatically calibrated for the selected region. No additional parameters are required.</p>
                                        </div>
                                    </div>
                                )}

                                {classificationMode === 'twilio' && (
                                    <div className="flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-xl">
                                        <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 font-sans">Twilio Lookup Engine Active</p>
                                            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">Will dynamically query Twilio to verify line validity (Active vs Inactive) and exact carrier network routing types.</p>
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
                                                        {classificationMode === 'twilio' && (
                                                            <>
                                                                <TableHead className="font-bold border-r">Status</TableHead>
                                                                <TableHead className="font-bold border-r">Carrier</TableHead>
                                                                <TableHead className="font-bold border-r">Region</TableHead>
                                                            </>
                                                        )}
                                                        {headers.filter(h => h !== phoneColumn).slice(0, 3).map(h => (
                                                            <TableHead key={h} className="font-bold border-r">{h}</TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {keptRows.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={classificationMode === 'twilio' ? 9 : 6} className="text-center py-8 text-muted-foreground font-medium">
                                                                No matching records found.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        keptRows.slice(0, 50).map((row, idx) => (
                                                            <TableRow key={idx} className={cn("border-b", idx % 2 === 0 ? "bg-white" : "bg-muted/20")}>
                                                                <TableCell className="text-center font-bold text-muted-foreground border-r">{idx + 1}</TableCell>
                                                                <TableCell className="font-bold text-primary font-mono border-r">
                                                                    <div className="flex items-center gap-1.5">
                                                                        {row.__active ? (
                                                                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                                        ) : (
                                                                            <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                                                                        )}
                                                                        {row[phoneColumn]}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="border-r">
                                                                    <Badge 
                                                                        variant={row.__phoneType === 'mobile' ? 'default' : 'secondary'} 
                                                                        className={cn(
                                                                            "uppercase text-[9px] font-bold",
                                                                            classificationMode === 'twilio' && row.__phoneType === 'mobile' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "",
                                                                            classificationMode === 'twilio' && row.__phoneType === 'telephone' ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                                                                        )}
                                                                    >
                                                                        {classificationMode === 'twilio' 
                                                                            ? (row.__phoneType === 'mobile' ? 'Verified Mobile' : 'Verified Landline')
                                                                            : row.__phoneType
                                                                        }
                                                                    </Badge>
                                                                </TableCell>
                                                                {classificationMode === 'twilio' && (
                                                                    <>
                                                                        <TableCell className="border-r">
                                                                            <Badge variant="outline" className={cn(
                                                                                "uppercase text-[9px] font-bold",
                                                                                row.__active ? "text-emerald-600 border-emerald-200 bg-emerald-50/50" : "text-rose-600 border-rose-200 bg-rose-50/50"
                                                                            )}>
                                                                                {row.__active ? 'Active' : 'Inactive'}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="border-r text-xs font-medium max-w-[150px] truncate">{row.__carrier || 'N/A'}</TableCell>
                                                                        <TableCell className="border-r text-xs font-mono uppercase">{row.__country || 'N/A'}</TableCell>
                                                                    </>
                                                                )}
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
                                                        {classificationMode === 'twilio' && (
                                                            <>
                                                                <TableHead className="font-bold border-r">Status</TableHead>
                                                                <TableHead className="font-bold border-r">Carrier</TableHead>
                                                                <TableHead className="font-bold border-r">Region</TableHead>
                                                            </>
                                                        )}
                                                        {headers.filter(h => h !== phoneColumn).slice(0, 3).map(h => (
                                                            <TableHead key={h} className="font-bold border-r">{h}</TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {removedRows.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={classificationMode === 'twilio' ? 10 : 7} className="text-center py-8 text-muted-foreground font-medium">
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
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={cn(
                                                                            "uppercase text-[9px] font-bold",
                                                                            classificationMode === 'twilio' && row.__phoneType === 'mobile' ? "text-emerald-600 border-emerald-200 bg-emerald-50/50" : "",
                                                                            classificationMode === 'twilio' && row.__phoneType === 'telephone' ? "text-blue-600 border-blue-200 bg-blue-50/50" : ""
                                                                        )}
                                                                    >
                                                                        {classificationMode === 'twilio' 
                                                                            ? (row.__phoneType === 'mobile' ? 'Verified Mobile' : 'Verified Landline')
                                                                            : row.__phoneType
                                                                        }
                                                                    </Badge>
                                                                </TableCell>
                                                                {classificationMode === 'twilio' && (
                                                                    <>
                                                                        <TableCell className="border-r">
                                                                            <Badge variant="outline" className={cn(
                                                                                "uppercase text-[9px] font-bold",
                                                                                row.__active ? "text-emerald-600 border-emerald-200 bg-emerald-50/50" : "text-rose-600 border-rose-200 bg-rose-50/50"
                                                                            )}>
                                                                                {row.__active ? 'Active' : 'Inactive'}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell className="border-r text-xs font-medium max-w-[150px] truncate">{row.__carrier || 'N/A'}</TableCell>
                                                                        <TableCell className="border-r text-xs font-mono uppercase">{row.__country || 'N/A'}</TableCell>
                                                                    </>
                                                                )}
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
