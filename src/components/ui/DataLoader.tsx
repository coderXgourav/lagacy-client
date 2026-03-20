import { Loader2 } from "lucide-react";

interface DataLoaderProps {
    title?: string;
    subtitle?: string;
}

export function DataLoader({ title = "Syncing Data", subtitle = "Fetching information..." }: DataLoaderProps) {
    return (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-6 text-muted-foreground animate-in fade-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                <Loader2 className="w-16 h-16 animate-spin text-indigo-600 relative z-10" />
            </div>
            <div className="text-center space-y-2">
                <p className="text-lg font-bold text-foreground tracking-tight">{title}</p>
                <p className="text-sm font-medium">{subtitle}</p>
            </div>
        </div>
    );
}
