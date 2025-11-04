import { Outlet } from "react-router-dom";
import { DomainScraperSidebar } from "./DomainScraperSidebar";
import { Header } from "./Header";

export function DomainScraperLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <DomainScraperSidebar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
