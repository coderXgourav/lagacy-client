import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function NewDomainRecentSearches() {
  return (
    <div className="container mx-auto space-y-8 animate-fade-in p-6">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold tracking-tight">Search History</h1>
        <p className="text-muted-foreground">View your past domain searches</p>
      </div>

      <Card className="shadow-xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-3">
            <Search className="h-5 w-5" />
            Recent Searches
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">No searches yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start a new search to see results here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
