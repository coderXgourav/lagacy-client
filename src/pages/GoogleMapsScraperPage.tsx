import React, { useState, useRef } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, MapPin, Plus, Trash2, Play, Download, Loader2, SlidersHorizontal } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'it', label: 'Italian' },
    { value: 'hi', label: 'Hindi' },
];

type RunStatus = 'idle' | 'running' | 'SUCCEEDED' | 'FAILED' | 'ABORTED';

interface PlaceResult {
    title?: string;
    name?: string;
    address?: string;
    street?: string;
    phone?: string;
    website?: string;
    url?: string;
    totalScore?: number;
    reviewsCount?: number;
    categoryName?: string;
    categories?: string[];
    city?: string;
    state?: string;
    countryCode?: string;
    email?: string;
    emails?: string[];
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
    [key: string]: any;
}

export default function GoogleMapsScraperPage() {
    const navigate = useNavigate();
    const [searchTerms, setSearchTerms] = useState<string[]>(['']);
    const [location, setLocation] = useState('');
    const [maxPlaces, setMaxPlaces] = useState('50');
    const [language, setLanguage] = useState('en');
    const [maxStars, setMaxStars] = useState('none');
    const [websiteFilter, setWebsiteFilter] = useState('allPlaces');
    const [skipClosed, setSkipClosed] = useState(false);
    const [maxReviews, setMaxReviews] = useState('0');
    const [scrapeContacts, setScrapeContacts] = useState(false);
    const [status, setStatus] = useState<RunStatus>('idle');
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [statsText, setStatsText] = useState('');
    const [phoneStatuses, setPhoneStatuses] = useState<Record<number, 'active' | 'inactive' | 'unknown' | 'checking'>>({});
    const [verifyingPhones, setVerifyingPhones] = useState(false);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    const addSearchTerm = () => setSearchTerms(prev => [...prev, '']);
    const removeSearchTerm = (i: number) => setSearchTerms(prev => prev.filter((_, idx) => idx !== i));
    const updateSearchTerm = (i: number, val: string) =>
        setSearchTerms(prev => prev.map((t, idx) => idx === i ? val : t));

    const startScraper = async () => {
        const terms = searchTerms.map(t => t.trim()).filter(Boolean);
        if (!terms.length) return toast.error('Add at least one search term.');
        if (!location.trim()) return toast.error('Enter a location.');

        setStatus('running');
        setResults([]);
        setStatsText('');

        try {
            const { data } = await axios.post(`${API_URL}/google-maps-scraper/start`, {
                searchTerms: terms,
                location: location.trim(),
                maxPlaces,
                language,
                maxStars,
                websiteFilter,
                skipClosed,
                scrapeContacts,
            });

            const { runId, defaultDatasetId } = data;
            toast.success('Scraper started! Waiting for results…');

            pollRef.current = setInterval(async () => {
                try {
                    const { data: statusData } = await axios.get(
                        `${API_URL}/google-maps-scraper/status/${runId}`
                    );
                    const { status: runStatus, defaultDatasetId: dsId, stats } = statusData;

                    if (stats) {
                        setStatsText(`Places found: ${stats.itemCount ?? 0}`);
                    }

                    if (runStatus === 'SUCCEEDED') {
                        clearInterval(pollRef.current!);
                        const { data: resultsData } = await axios.get(
                            `${API_URL}/google-maps-scraper/results/${dsId || defaultDatasetId}`
                        );
                        const maxR = parseInt(maxReviews) || 0;
                        const maxS = maxStars !== 'none' ? parseFloat(maxStars) : null;
                        const filtered = (resultsData.items || []).filter((item: PlaceResult) => {
                            if (!item.phone) return false;
                            if (maxR > 0 && (item.reviewsCount ?? 0) > maxR) return false;
                            if (maxS !== null && (item.totalScore ?? 0) > maxS) return false;
                            return true;
                        });
                        const total = (resultsData.items || []).length;
                        const noPhone = total - filtered.length;
                        setResults(filtered);
                        setStatus('SUCCEEDED');
                        toast.success(`Done! ${filtered.length} places with phone numbers (${noPhone} without phone removed).`);
                        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                    } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(runStatus)) {
                        clearInterval(pollRef.current!);
                        setStatus('FAILED');
                        toast.error(`Scraper ${runStatus.toLowerCase()}.`);
                    }
                } catch {
                    // keep polling
                }
            }, 5000);
        } catch (err: any) {
            setStatus('idle');
            toast.error(err.response?.data?.error || 'Failed to start scraper.');
        }
    };

    const verifyPhones = async () => {
        const toVerify = results
            .map((r, i) => ({ index: i, phone: r.phone, countryCode: r.countryCode || 'US' }))
            .filter(p => p.phone);

        if (!toVerify.length) return toast.error('No phone numbers to verify.');

        setVerifyingPhones(true);
        const initial: Record<number, 'checking'> = {};
        toVerify.forEach(p => { initial[p.index] = 'checking'; });
        setPhoneStatuses(initial);

        const BATCH = 10;
        for (let i = 0; i < toVerify.length; i += BATCH) {
            const batch = toVerify.slice(i, i + BATCH);
            try {
                const { data } = await axios.post(`${API_URL}/google-maps-scraper/verify-phones`, {
                    phones: batch.map(p => ({ phone: p.phone, countryCode: p.countryCode }))
                });
                const update: Record<number, 'active' | 'inactive' | 'unknown'> = {};
                data.results.forEach((r: any, j: number) => {
                    update[batch[j].index] = r.active ? 'active' : 'inactive';
                });
                setPhoneStatuses(prev => ({ ...prev, ...update }));
            } catch {
                const update: Record<number, 'unknown'> = {};
                batch.forEach(p => { update[p.index] = 'unknown'; });
                setPhoneStatuses(prev => ({ ...prev, ...update }));
            }
        }

        setVerifyingPhones(false);
        toast.success('Phone verification complete!');
    };

    const handleDownload = () => {
        if (!results.length) return;
        const rows = results.map((r, i) => ({
            Name: r.title || r.name || '',
            Phone: r.phone || '',
            'Phone Status': phoneStatuses[i] || '',
            Email: r.email || (r.emails || []).join(', '),
            Website: r.website || '',
            'Google Maps URL': r.url || '',
            Address: r.address || [r.street, r.city, r.state].filter(Boolean).join(', '),
            City: r.city || '',
            State: r.state || '',
            Country: r.countryCode || '',
            Rating: r.totalScore ?? '',
            Reviews: r.reviewsCount ?? '',
            Category: r.categoryName || (r.categories || []).join(', '),
            Facebook: r.facebook || '',
            Instagram: r.instagram || '',
            YouTube: r.youtube || '',
            TikTok: r.tiktok || '',
            Twitter: r.twitter || '',
        }));
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `google_maps_${location.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col w-full max-w-5xl mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/offerings')} className="h-9 w-9 rounded-lg">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-green-500 bg-clip-text text-transparent flex items-center gap-2">
                            <MapPin className="h-6 w-6 text-primary" /> Google Maps Scraper
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Scrape business leads from Google Maps using Apify.
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">Beta</Badge>
            </div>

            {/* Form */}
            <Card className="border shadow-xl bg-gradient-to-br from-card to-card/95">
                <CardContent className="pt-6 space-y-5">
                    {/* Search Terms */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Search Term(s)</Label>
                        {searchTerms.map((term, i) => (
                            <div key={i} className="flex gap-2">
                                <Input
                                    placeholder={`e.g. Real estate`}
                                    value={term}
                                    onChange={e => updateSearchTerm(i, e.target.value)}
                                />
                                {searchTerms.length > 1 && (
                                    <Button variant="ghost" size="icon" onClick={() => removeSearchTerm(i)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addSearchTerm} className="gap-1">
                            <Plus className="h-4 w-4" /> Add term
                        </Button>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Location</Label>
                        <Input
                            placeholder="e.g. New York, USA"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                        />
                    </div>

                    {/* Places count + Language */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Max places per search term</Label>
                            <Input
                                type="number"
                                min={1}
                                max={1000}
                                value={maxPlaces}
                                onChange={e => setMaxPlaces(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Language</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(l => (
                                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Search filters & categories */}
                    <div className="border rounded-xl p-4 space-y-4 bg-muted/30">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <SlidersHorizontal className="h-4 w-4 text-primary" />
                            Search filters &amp; categories
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Maximum star rating */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Maximum star rating</Label>
                                <p className="text-xs text-muted-foreground">Only show businesses rated at or below this value.</p>
                                <Select value={maxStars} onValueChange={setMaxStars}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="No maximum" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No maximum</SelectItem>
                                        <SelectItem value="1.5">Up to 1.5 stars</SelectItem>
                                        <SelectItem value="2">Up to 2 stars</SelectItem>
                                        <SelectItem value="2.5">Up to 2.5 stars</SelectItem>
                                        <SelectItem value="3">Up to 3 stars</SelectItem>
                                        <SelectItem value="3.5">Up to 3.5 stars</SelectItem>
                                        <SelectItem value="4">Up to 4 stars</SelectItem>
                                        <SelectItem value="4.5">Up to 4.5 stars</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Website filter */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold">Website filter</Label>
                                <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="allPlaces">All places</SelectItem>
                                        <SelectItem value="withWebsite">Only places WITH a website</SelectItem>
                                        <SelectItem value="withoutWebsite">Only places WITHOUT a website</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Maximum reviews */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Maximum reviews count</Label>
                            <Input
                                type="number"
                                min={0}
                                value={maxReviews}
                                onChange={e => setMaxReviews(e.target.value)}
                                placeholder="e.g. 50 (0 = no limit)"
                            />
                            <p className="text-xs text-muted-foreground">Only show businesses with this many reviews or fewer. Set 0 to disable.</p>
                        </div>

                        {/* Skip closed places */}
                        <div className="flex items-center gap-3">
                            <Switch
                                id="skipClosed"
                                checked={skipClosed}
                                onCheckedChange={setSkipClosed}
                            />
                            <Label htmlFor="skipClosed" className="text-sm cursor-pointer">
                                Skip closed places
                            </Label>
                        </div>
                    </div>

                    {/* Start button */}
                    <Button
                        onClick={startScraper}
                        disabled={status === 'running'}
                        className="w-full gap-2"
                    >
                        {status === 'running' ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Scraping… {statsText && `(${statsText})`}</>
                        ) : (
                            <><Play className="h-4 w-4" /> Start Scraper</>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Loading state */}
            {status === 'running' && (
                <Card className="border shadow-xl">
                    <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
                        <div className="relative flex items-center justify-center">
                            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                            <MapPin className="absolute h-6 w-6 text-primary" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-base font-semibold">Scraping Google Maps…</p>
                            <p className="text-sm text-muted-foreground">
                                {statsText || 'Starting up, please wait…'}
                            </p>
                            <p className="text-xs text-muted-foreground">This may take 1–3 minutes depending on the number of results.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No results state */}
            <div ref={resultsRef} />
            {status === 'SUCCEEDED' && results.length === 0 && (
                <Card className="border shadow-xl">
                    <CardContent className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                        <MapPin className="h-10 w-10 text-muted-foreground opacity-30" />
                        <p className="text-base font-semibold text-muted-foreground">No results found</p>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Your filters are too strict — no businesses matched all conditions (no website + max {maxReviews || '0'} reviews + max {maxStars === 'none' ? 'any' : maxStars} stars + must have phone number).
                        </p>
                        <p className="text-xs text-muted-foreground">Try removing one filter at a time — for example increase the max reviews count, or set Website Filter to "All places".</p>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {results.length > 0 && (
                <Card className="border shadow-xl">
                    <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-muted-foreground">
                                {results.length} places found
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={verifyPhones}
                                    disabled={verifyingPhones}
                                    className="gap-2"
                                >
                                    {verifyingPhones
                                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                                        : <><Play className="h-4 w-4" /> Verify Phones</>}
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
                                    <Download className="h-4 w-4" /> Download CSV
                                </Button>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Rating</TableHead>
                                        <TableHead>Reviews</TableHead>
                                        <TableHead>Website</TableHead>
                                        <TableHead>Google Maps</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((r, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium max-w-[160px] truncate">
                                                {r.title || r.name || '—'}
                                            </TableCell>
                                            <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">
                                                {r.categoryName || (r.categories || [])[0] || '—'}
                                            </TableCell>
                                            <TableCell className="text-xs whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span>{r.phone || '—'}</span>
                                                    {phoneStatuses[i] === 'checking' && (
                                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />checking</span>
                                                    )}
                                                    {phoneStatuses[i] === 'active' && (
                                                        <span className="text-[10px] font-semibold text-green-500">● Active</span>
                                                    )}
                                                    {phoneStatuses[i] === 'inactive' && (
                                                        <span className="text-[10px] font-semibold text-red-500">● Inactive</span>
                                                    )}
                                                    {phoneStatuses[i] === 'unknown' && (
                                                        <span className="text-[10px] text-muted-foreground">● Unknown</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[160px] truncate text-xs">
                                                {r.email || (r.emails || [])[0] || '—'}
                                            </TableCell>
                                            <TableCell className="max-w-[180px] truncate text-xs">
                                                {r.address || [r.street, r.city, r.state].filter(Boolean).join(', ') || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {r.totalScore != null ? (
                                                    <Badge variant="secondary">{r.totalScore} ★</Badge>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="text-xs">{r.reviewsCount ?? '—'}</TableCell>
                                            <TableCell className="max-w-[140px] truncate text-xs">
                                                {r.website ? (
                                                    <a href={r.website} target="_blank" rel="noreferrer"
                                                       className="text-primary underline underline-offset-2">
                                                        {r.website.replace(/^https?:\/\//, '')}
                                                    </a>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {r.url ? (
                                                    <a href={r.url} target="_blank" rel="noreferrer"
                                                       className="text-green-500 underline underline-offset-2 whitespace-nowrap">
                                                        View on Maps
                                                    </a>
                                                ) : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
