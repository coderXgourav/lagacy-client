import { Outlet } from "react-router-dom";
import { LowRatingSidebar } from "./LowRatingSidebar";
import { Header } from "./Header";

export function LowRatingLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <LowRatingSidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
