import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { SystemRoleSidebar } from "./SystemRoleSidebar";

export const SystemRoleLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SystemRoleSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
