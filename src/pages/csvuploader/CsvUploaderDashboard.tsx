import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, AlertCircle, Send, Mail, User, Phone, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Contact {
    name: string;
    email: string;
    number: string;
    country?: string;
}

interface EmailResult {
    success: boolean;
    email: string;
    name?: string;
    error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function CsvUploaderDashboard() {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [subject, setSubject] = useState("Quick System Check - Kyptronix");
    const [body, setBody] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quick System Check</title>
<style>
body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
body { margin: 0; padding: 0; width: 100% !important; background-color: #f4f7f6; font-family: Helvetica, Arial, sans-serif; }
@media screen and (max-width:600px){ .mobile-width{width:100%!important} .mobile-padding{padding:20px!important} }
</style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f6;">
<tr>
<td align="center" style="padding:40px 10px;">
<table width="600" class="mobile-width" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;box-shadow:0 4px 15px rgba(0,0,0,.05);overflow:hidden;">
<tr><td height="6" style="background:#0056b3"></td></tr>
<tr>
<td align="center" style="padding:40px 40px 25px;border-bottom:1px solid #eeeeee;">
<a href="https://kyptronix.us" target="_blank">
<img src="https://media.designrush.com/agencies/325222/conversions/Kyptronix-logo-profile.jpg" width="180" alt="Kyptronix Logo" style="display:block;">
</a>
<table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top:25px;">
<tr>
<td align="center">
<a href="https://kyptronix.us/about-us" style="color:#555555;text-decoration:none;font-size:13px;font-weight:bold;padding:0 10px;text-transform:uppercase;letter-spacing:.5px;">About</a>
<span style="color:#e0e0e0;">|</span>
<a href="https://kyptronix.us/services" style="color:#555555;text-decoration:none;font-size:13px;font-weight:bold;padding:0 10px;text-transform:uppercase;letter-spacing:.5px;">Services</a>
<span style="color:#e0e0e0;">|</span>
<a href="https://kyptronix.us/package-and-pricing" style="color:#555555;text-decoration:none;font-size:13px;font-weight:bold;padding:0 10px;text-transform:uppercase;letter-spacing:.5px;">Packages</a>
<span style="color:#e0e0e0;">|</span>
<a href="https://kyptronix.us/portfolio" style="color:#555555;text-decoration:none;font-size:13px;font-weight:bold;padding:0 10px;text-transform:uppercase;letter-spacing:.5px;">Portfolio</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td class="mobile-padding" style="padding:40px 50px;color:#374151;font-size:16px;line-height:1.6;">
<h1 style="margin:0 0 20px;font-size:22px;color:#1F2937;">Hi {{name}},</h1>
<p>I don't know your setup yet, but I know the pattern.</p>
<p>We audit a lot of B2B companies in the US &amp; Canada.<br>Different industries. Same problems:</p>
<ul style="padding-left:18px;margin:0 0 20px;">
<li>Leads show up → nobody follows up fast enough</li>
<li>Website exists → but it doesn't convert</li>
<li>Tools exist → but nothing talks to each other</li>
</ul>
<p>So growth feels random.<br>Some weeks good. Some weeks dead.</p>
<p style="font-weight:bold;">That's not a traffic issue.<br>That's a system issue.</p>
<p style="margin-bottom:30px;">If you're open, I can show you what most teams miss in 10 minutes.<br>No pitch. Just clarity.</p>
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background:#0056b3;border-radius:50px;">
<a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1kzqqp92tBVNRFyNSo_sdyCg68VzzRMbv947cCXtze9o3lML1qr7B-xhYMp8myDqwLR4vbhrr2" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-weight:bold;text-decoration:none;">Book Free 10-Min System Check</a>
</td>
</tr>
</table>
<p style="margin-top:30px;">—<br><strong>Souvik Karmakar</strong><br>CEO, Kyptronix LLP</p>
<p style="font-size:14px;color:#4B5563;">+1 (302) 219-6889 (USA)<br>+91 91238 37577 (IND)<br><a href="https://kyptronix.us" style="color:#0056b3;text-decoration:none;">kyptronix.us</a></p>
<p style="font-size:13px;color:#6B7280;">651 N Broad St, Middletown, DE 19709, USA</p>
</td>
</tr>
<tr>
<td align="center" style="background-color:#2c3e50; background-image:linear-gradient(135deg,#2c3e50 0%,#0056b3 100%); padding:40px 30px;">
<h2 style="margin:0 0 15px;color:#ffffff;font-size:22px;">Ready to fix your growth system?</h2>
<p style="margin:0 0 25px;color:#e0e0e0;font-size:14px;line-height:1.5;max-width:420px;">Kyptronix LLP designs automation systems that capture, qualify, and convert leads — without manual chaos.</p>
<table cellpadding="0" cellspacing="0">
<tr>
<td style="background:#ffffff;border-radius:50px;">
<a href="https://kyptronix.us/contact-us" target="_blank" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:bold;color:#0056b3;text-decoration:none;border-radius:50px;border:2px solid #ffffff;">Get Started Today</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background:#f8f9fa;padding:40px;border-top:1px solid #eeeeee;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding-bottom:25px;">
<a href="https://www.facebook.com/kyptronixllp/" target="_blank" style="margin:0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/145/145802.png" width="32" height="32"></a>
<a href="https://x.com/Kyptronixus" target="_blank" style="margin:0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" width="32" height="32"></a>
<a href="https://www.linkedin.com/company/kyptronixllp/" target="_blank" style="margin:0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/145/145807.png" width="32" height="32"></a>
<a href="https://www.instagram.com/kyptronix_llp/" target="_blank" style="margin:0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/3955/3955024.png" width="32" height="32"></a>
<a href="https://www.youtube.com/@kyptronixllp2467" target="_blank" style="margin:0 10px;"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" width="32" height="32"></a>
</td>
</tr>
<tr>
<td align="center" style="font-size:12px;color:#999999;line-height:1.6;">
<p style="margin:0 0 10px;"><strong>Kyptronix LLP</strong></p>
<p style="margin:0 0 20px;">Professional digital solutions and automation systems since 2015.<br>Trusted by professionals worldwide.</p>
<p style="margin:0;">
<a href="#" style="color:#bbbbbb;text-decoration:none;">Privacy Policy</a> &nbsp;|&nbsp;
<a href="#" style="color:#bbbbbb;text-decoration:none;">Terms of Service</a> &nbsp;|&nbsp;
<a href="#" style="color:#bbbbbb;text-decoration:none;">Unsubscribe</a>
</p>
<p style="margin-top:20px;font-size:11px;color:#cccccc;">© 2015–2026 Kyptronix LLP. All rights reserved.</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`);
    const [isSending, setIsSending] = useState(false);
    const [sendResults, setSendResults] = useState<EmailResult[] | null>(null);
    const { toast } = useToast();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const parseCSV = (text: string): Contact[] => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        // Auto-detect delimiter by checking which one appears most in the header
        const firstLine = lines[0];
        const commaCount = (firstLine.match(/,/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        
        let delimiter = ',';
        if (tabCount > commaCount && tabCount > semicolonCount) {
            delimiter = '\t';
        } else if (semicolonCount > commaCount && semicolonCount > tabCount) {
            delimiter = ';';
        }

        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        // Find column indexes - check for various column name formats
        const nameIndex = headers.findIndex(h => 
            h === 'name' || h === 'registrant_name' || h === 'contact_name' || h === 'full_name' || h === 'fullname'
        );
        const emailIndex = headers.findIndex(h => 
            h === 'email' || h === 'email_address' || h === 'emailaddress' || h === 'e-mail'
        );
        const numberIndex = headers.findIndex(h => 
            h === 'number' || h === 'phone' || h === 'phone_number' || h === 'phonenumber' || h === 'mobile' || h === 'telephone'
        );
        const countryIndex = headers.findIndex(h => 
            h === 'country' || h === 'registrant_country' || h === 'country_code' || h === 'countrycode'
        );

        console.log('CSV Parsing Debug:', { delimiter, headers, nameIndex, emailIndex, numberIndex, countryIndex });

        const extractedContacts: Contact[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
            
            const contact: Contact = {
                name: nameIndex >= 0 ? (values[nameIndex] || '').trim() : '',
                email: emailIndex >= 0 ? (values[emailIndex] || '').trim() : '',
                number: numberIndex >= 0 ? (values[numberIndex] || '').trim() : '',
                country: countryIndex >= 0 ? (values[countryIndex] || '').trim() : ''
            };

            // Only add if has valid email
            if (contact.email && contact.email.includes('@')) {
                extractedContacts.push(contact);
            }
        }

        return extractedContacts;
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const extracted = parseCSV(text);
            setContacts(extracted);
            setFileName(file.name);
            setSendResults(null);
            
            toast({
                title: "CSV Parsed Successfully",
                description: `Found ${extracted.length} contacts with valid emails`,
            });
        };
        reader.onerror = () => {
            toast({
                title: "Error",
                description: "Failed to read the CSV file",
                variant: "destructive"
            });
        };
        reader.readAsText(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const csvFile = files.find(f => f.name.endsWith('.csv'));
        if (csvFile) {
            processFile(csvFile);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const csvFile = files.find(f => f.name.endsWith('.csv'));
        if (csvFile) {
            processFile(csvFile);
        }
    };

    const sendEmails = async () => {
        if (contacts.length === 0) return;

        setIsSending(true);
        setSendResults(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/csv-uploader/send-emails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    contacts,
                    subject,
                    body
                })
            });

            const data = await response.json();

            if (data.success) {
                setSendResults(data.results);
                toast({
                    title: "Emails Sent!",
                    description: `${data.summary.sent} sent, ${data.summary.failed} failed`,
                });
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to send emails",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to connect to server",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };

    const sendEmailSequence = async () => {
        if (contacts.length === 0) return;

        setIsSending(true);
        setSendResults(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/csv-uploader/send-sequence`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    contacts,
                    subject,
                    body,
                    delayMinutes: 2
                })
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "🚀 Email Sequence Started!",
                    description: `4 emails will be sent to ${contacts.length} contacts with 2-min delays. Total: ${data.totalEmails} emails over ~${data.estimatedCompletion}`,
                });
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to start sequence",
                    variant: "destructive"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to connect to server",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };

    const clearData = () => {
        setContacts([]);
        setFileName(null);
        setSendResults(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">CSV Uploader Pro</h1>
                <p className="text-muted-foreground mt-1">
                    Upload CSV files, extract contacts, and send bulk emails
                </p>
            </div>

            {/* Upload Section */}
            <Card className="border-2 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload CSV File
                    </CardTitle>
                    <CardDescription>
                        Upload a CSV file with columns: name, email, number
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer",
                            isDragging
                                ? "border-primary bg-primary/5 scale-[1.02]"
                                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                        )}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileInput}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center gap-4">
                            <div className={cn(
                                "p-4 rounded-full transition-all duration-300",
                                isDragging ? "bg-primary/10 scale-110" : "bg-muted"
                            )}>
                                <Upload className={cn(
                                    "h-10 w-10 transition-colors",
                                    isDragging ? "text-primary" : "text-muted-foreground"
                                )} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-lg font-semibold">
                                    {isDragging ? "Drop your file here" : "Drag & Drop CSV file"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    or click to browse from your computer
                                </p>
                            </div>
                            {fileName && (
                                <div className="flex items-center gap-2 text-primary">
                                    <FileText className="h-4 w-4" />
                                    <span className="font-medium">{fileName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contacts Table */}
            {contacts.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Extracted Contacts ({contacts.length})
                            </CardTitle>
                            <CardDescription>
                                Contacts extracted from your CSV file
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={clearData}>
                            <X className="h-4 w-4 mr-2" />
                            Clear
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border overflow-hidden">
                            <div className="max-h-[300px] overflow-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 sticky top-0">
                                        <tr>
                                            <th className="text-left p-3 font-medium">Name</th>
                                            <th className="text-left p-3 font-medium">Email</th>
                                            <th className="text-left p-3 font-medium">Number</th>
                                            {sendResults && <th className="text-left p-3 font-medium">Status</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contacts.map((contact, i) => {
                                            const result = sendResults?.find(r => r.email === contact.email);
                                            return (
                                                <tr key={i} className="border-t">
                                                    <td className="p-3">{contact.name || '-'}</td>
                                                    <td className="p-3 text-muted-foreground">{contact.email}</td>
                                                    <td className="p-3 text-muted-foreground">{contact.number || '-'}</td>
                                                    {sendResults && (
                                                        <td className="p-3">
                                                            {result?.success ? (
                                                                <span className="flex items-center gap-1 text-green-600">
                                                                    <CheckCircle className="h-4 w-4" />
                                                                    Sent
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 text-red-600">
                                                                    <AlertCircle className="h-4 w-4" />
                                                                    {result?.error || 'Failed'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Email Template */}
            {contacts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Email Template
                        </CardTitle>
                        <CardDescription>
                            Use {"{{name}}"} as a placeholder for personalization
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Email subject..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="body">Body (HTML supported)</Label>
                            <Textarea
                                id="body"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="Email body..."
                                rows={6}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={sendEmails}
                                disabled={isSending || contacts.length === 0}
                                className="flex-1"
                                size="lg"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5 mr-2" />
                                        Send Single Email
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={sendEmailSequence}
                                disabled={isSending || contacts.length === 0}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                size="lg"
                            >
                                {isSending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Starting...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-5 w-5 mr-2" />
                                        Send 4-Email Sequence
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                            Sequence: Sends 4 emails to each contact with 2-minute delays between each
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Results Summary */}
            {sendResults && (
                <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Email Sending Complete</h3>
                                <p className="text-muted-foreground">
                                    {sendResults.filter(r => r.success).length} emails sent successfully,{' '}
                                    {sendResults.filter(r => !r.success).length} failed
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
