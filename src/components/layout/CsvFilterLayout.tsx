import { Outlet } from "react-router-dom";
import { CsvFilterSidebar } from "./CsvFilterSidebar";
import { Header } from "./Header";

export const CsvFilterLayout = () => {
    return (
        <div className="flex min-h-screen bg-background font-sans antialiased">
            <CsvFilterSidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header />
                <div className="flex-1 overflow-auto p-6 scroll-smooth">
                    <div className="mx-auto max-w-7xl w-full animate-fade-in space-y-6">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
