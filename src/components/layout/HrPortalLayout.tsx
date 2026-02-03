import { Outlet } from "react-router-dom";
import { HrPortalSidebar } from "./HrPortalSidebar";
import { Header } from "./Header";

export const HrPortalLayout = () => {
    return (
        <div className="flex min-h-screen bg-[#02040A] font-sans antialiased text-slate-200 selection:bg-teal-500/30 selection:text-teal-200 show-spinner">
            {/* --- CINEMATIC BACKGROUND --- */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                {/* 1. Deep Base Gradient */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#022c22_0%,_#020617_50%,_#000000_100%)] opacity-80" />

                {/* 2. Dynamic Blobs (Animated) */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/10 blur-[150px] animate-pulse duration-[10000ms]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[150px] animate-pulse duration-[12000ms]" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-cyan-600/5 blur-[120px]" />

                {/* 3. Noise Texture Overlay for Realism */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
                
                {/* 4. Subtle Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <HrPortalSidebar />
            
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
                {/* Glass Header Container */}
                <div className="sticky top-0 z-40">
                     {/* Gradient separator at bottom of header */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="bg-[#02040A]/60 backdrop-blur-md">
                        <Header />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 lg:p-8 scroll-smooth custom-scrollbar">
                    <div className="mx-auto max-w-[1920px] w-full animate-in fade-in-50 slide-in-from-bottom-2 duration-700 ease-out">
                         {/* Content Wrapper with subtle backing for readability if helpful, usually just clean */}
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
