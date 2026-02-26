import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { SocialMediaSidebar } from "./SocialMediaSidebar";

export const SocialMediaLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SocialMediaSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
