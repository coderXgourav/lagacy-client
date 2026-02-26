import { Users, Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HrEmployeeDirectory() {
    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-muted/20 p-6">
            <div className="container mx-auto max-w-[1600px] space-y-6">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/20 p-8 md:p-12 mb-2">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                                    <Users className="h-7 w-7 text-white" />
                                </div>
                                <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 text-xs font-semibold tracking-wide uppercase">
                                    Management
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                                Employee Directory
                            </h1>
                            <p className="text-lg text-muted-foreground max-w-2xl">
                                Manage and view all members of your organization. Coordinate teams and access profiles easily.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-2 items-end">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                                <Plus className="h-4 w-4" /> Add Employee
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search employees..." className="pl-10" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" /> Filters
                        </Button>
                    </div>
                </div>

                <div className="mt-8 p-12 border-2 border-dashed border-indigo-500/20 rounded-2xl flex flex-col items-center justify-center bg-indigo-500/5">
                    <p className="text-indigo-600 font-bold text-lg">Employee list coming soon...</p>
                    <p className="text-indigo-600/60 text-sm">We are building the directory interface.</p>
                </div>
            </div>
        </div>
    );
}
