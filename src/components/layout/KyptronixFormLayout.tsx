import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { KyptronixFormSidebar } from "./KyptronixFormSidebar";

export const KyptronixFormLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <KyptronixFormSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto scrollbar-hide">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
