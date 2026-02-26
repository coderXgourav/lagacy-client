import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { LeadCaptureSidebar } from "./LeadCaptureSidebar";

export const LeadCaptureLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <LeadCaptureSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto scrollbar-hide">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
