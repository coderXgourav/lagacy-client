import { useState, useEffect } from "react";
import {
    FileText,
    MessageSquare,
    Mail,
    Copy,
    Check,
    Eye,
    Code2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface EmailTemplate {
    subject?: string;
    body?: string;
}

interface SmsTemplate {
    message: string;
}

interface TemplatesData {
    emails: (EmailTemplate | null)[];
    sms: SmsTemplate[];
}

const EmailTemplateViewer = ({ template, index }: { template: EmailTemplate, index: number }) => {
    const [showPreview, setShowPreview] = useState(true);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (template.body) {
            navigator.clipboard.writeText(template.body);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-background">
                            Email {index + 1}
                        </Badge>
                        {index === 0 && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                Initial Email
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-background rounded-lg border p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPreview(true)}
                                className={cn(
                                    "h-7 px-3 text-xs rounded-md",
                                    showPreview && "bg-muted font-medium text-foreground"
                                )}
                            >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Preview
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPreview(false)}
                                className={cn(
                                    "h-7 px-3 text-xs rounded-md",
                                    !showPreview && "bg-muted font-medium text-foreground"
                                )}
                            >
                                <Code2 className="w-3.5 h-3.5 mr-1.5" />
                                Code
                            </Button>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-8 w-8 p-0 ml-2"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-600" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                            <span className="sr-only">Copy body</span>
                        </Button>
                    </div>
                </div>
                <CardTitle className="text-base mt-2">
                    <span className="font-medium">Subject: {template.subject}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {showPreview ? (
                    <div className="bg-white border-b h-[600px] w-full">
                        <iframe
                            srcDoc={template.body}
                            className="w-full h-full border-0"
                            title={`Email Preview ${index + 1}`}
                            sandbox="allow-same-origin"
                        />
                    </div>
                ) : (
                    <div className="bg-muted/30 p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
                        <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                            {template.body}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function CsvUploaderTemplates() {
    const [templates, setTemplates] = useState<TemplatesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<{type: 'sms', index: number} | null>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_BASE_URL}/csv-uploader/templates`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setTemplates(data.templates);
                } else {
                    setError('Failed to load templates');
                }
            } catch (err) {
                setError('Failed to connect to server');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, []);

    const copySmsToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex({ type: 'sms', index });
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    Message Templates
                </h1>
                <p className="text-muted-foreground mt-1">
                    View and preview the email and SMS templates used in your automation sequences
                </p>
            </div>

            <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="email" className="gap-2">
                        <Mail className="w-4 h-4" />
                        Email Templates
                    </TabsTrigger>
                    <TabsTrigger value="sms" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        SMS Templates
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-6 mt-6">
                    {templates?.emails.map((template, index) => (
                        template ? (
                            <EmailTemplateViewer 
                                key={index} 
                                template={template} 
                                index={index} 
                            />
                        ) : (
                            <Card key={index} className="overflow-hidden opacity-75 border-dashed">
                                <CardHeader className="bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">Email {index + 1}</Badge>
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                            Initial Email
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-base mt-2">
                                        <span className="text-muted-foreground italic">
                                            Custom template configured in Dashboard
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        )
                    ))}
                </TabsContent>

                <TabsContent value="sms" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates?.sms.map((template, index) => (
                            <Card key={index}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="bg-muted/50">
                                            SMS {index + 1}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copySmsToClipboard(template.message, index)}
                                            className="h-8 w-8 p-0"
                                        >
                                            {copiedIndex?.type === 'sms' && copiedIndex.index === index ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="p-4 rounded-lg bg-muted/30 border">
                                        <p className="text-sm font-medium whitespace-pre-wrap">
                                            {template.message}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
