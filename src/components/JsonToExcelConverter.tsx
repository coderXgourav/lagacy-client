import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileJson, FileSpreadsheet, Download, RefreshCw, Table as TableIcon, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export const JsonToExcelConverter: React.FC = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonInput(e.target.value);
    };

    const validateAndParse = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            const dataArray = Array.isArray(parsed) ? parsed : [parsed];
            if (dataArray.length === 0) {
                toast.error("JSON array is empty");
                return null;
            }
            return dataArray;
        } catch (error: any) {
            toast.error(`Invalid JSON: ${error.message}`);
            return null;
        }
    };

    const convertToExcel = () => {
        const data = validateAndParse();
        if (!data) return;

        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
            XLSX.writeFile(workbook, `converted_data_${Date.now()}.xlsx`);
            toast.success("Excel file downloaded successfully!");
        } catch (error: any) {
            toast.error(`Excel Conversion Error: ${error.message}`);
        }
    };

    const convertToCsv = () => {
        const data = validateAndParse();
        if (!data) return;

        try {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `converted_data_${Date.now()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("CSV file downloaded successfully!");
        } catch (error: any) {
            toast.error(`CSV Conversion Error: ${error.message}`);
        }
    };

    const handlePreview = () => {
        const data = validateAndParse();
        if (data) {
            setPreviewData(data);
            setCurrentPage(1);
            toast.info(`Showing preview of ${data.length} records`);
        }
    };

    const clearInput = () => {
        setJsonInput('');
        setPreviewData([]);
        setCurrentPage(1);
    };

    // Pagination Logic
    const totalPages = Math.ceil(previewData.length / rowsPerPage);
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = previewData.slice(indexOfFirstRow, indexOfLastRow);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2 mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    JSON Data Converter
                </h2>
                <p className="text-muted-foreground text-sm">
                    Paste your JSON array below and instantly convert it to professional Excel or CSV spreadsheets.
                </p>
            </div>

            <Card className="border-2 border-primary/10 shadow-xl overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="bg-muted/30 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileJson className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Input JSON Data</CardTitle>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={clearInput} className="text-xs h-8">
                                <RefreshCw className="h-3 w-3 mr-1" /> Clear
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Textarea
                        placeholder='[{"name": "John", "email": "john@example.com"}, ...]'
                        className="min-h-[300px] font-mono text-sm border-2 focus-visible:ring-primary transition-all bg-muted/20"
                        value={jsonInput}
                        onChange={handleJsonChange}
                    />
                    
                    <div className="flex flex-wrap gap-3 mt-6">
                        <Button 
                            onClick={convertToExcel} 
                            disabled={!jsonInput}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                        >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Download Excel (.xlsx)
                        </Button>
                        <Button 
                            onClick={convertToCsv} 
                            disabled={!jsonInput}
                            variant="secondary"
                            className="shadow-lg"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV (.csv)
                        </Button>
                        <Button 
                            onClick={handlePreview} 
                            disabled={!jsonInput}
                            variant="outline"
                            className="border-2"
                        >
                            <TableIcon className="mr-2 h-4 w-4" />
                            Preview Data
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {previewData.length > 0 && (
                <Card className="animate-in zoom-in duration-300 shadow-lg border-primary/5">
                    <CardHeader className="border-b bg-muted/10">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-md flex items-center gap-2">
                                <TableIcon className="h-4 w-4 text-primary" />
                                Data Preview ({previewData.length} records)
                            </CardTitle>
                            
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground mr-2">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        disabled={currentPage === 1}
                                        onClick={() => paginate(currentPage - 1)}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        disabled={currentPage === totalPages}
                                        onClick={() => paginate(currentPage + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-auto max-h-[500px]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    {Object.keys(previewData[0]).map((key) => (
                                        <th key={key} className="text-left p-3 font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows.map((row, i) => (
                                    <tr key={i} className="border-b hover:bg-muted/20 transition-colors">
                                        {Object.values(row).map((val: any, idx) => (
                                            <td key={idx} className="p-3 text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                    
                    {totalPages > 1 && (
                        <div className="p-4 bg-muted/5 border-t flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                                Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, previewData.length)} of {previewData.length} entries
                            </p>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => paginate(1)} 
                                    disabled={currentPage === 1}
                                    className="text-xs h-7"
                                >
                                    First
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    onClick={() => paginate(totalPages)} 
                                    disabled={currentPage === totalPages}
                                    className="text-xs h-7"
                                >
                                    Last
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};
