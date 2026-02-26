import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { DomainScraperSidebar } from "./DomainScraperSidebar";

export const DomainScraperLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DomainScraperSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
