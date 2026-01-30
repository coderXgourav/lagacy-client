import { Outlet } from "react-router-dom";
import { HrPortalSidebar } from "./HrPortalSidebar";
import { Header } from "./Header";

export const HrPortalLayout = () => {
    return (
        <div className="flex min-h-screen bg-[#020617] font-sans antialiased text-slate-200">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-violet-900/10 blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-sky-900/5 blur-[80px]" />
            </div>

            <HrPortalSidebar />
            
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                <div className="border-b border-white/5 bg-[#0F172A]/50 backdrop-blur-md sticky top-0 z-40">
                    <Header />
                </div>
                <div className="flex-1 overflow-auto p-6 lg:p-10 scroll-smooth custom-scrollbar">
                    <div className="mx-auto max-w-[1600px] w-full animate-in fade-in zoom-in-95 duration-500">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
