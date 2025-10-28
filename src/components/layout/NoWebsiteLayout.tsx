import { Outlet } from "react-router-dom";
import { NoWebsiteSidebar } from "./NoWebsiteSidebar";
import { Header } from "./Header";

export function NoWebsiteLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <NoWebsiteSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
