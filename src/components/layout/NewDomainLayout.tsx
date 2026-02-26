import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import NewDomainSidebar from "./NewDomainSidebar";

export default function NewDomainLayout() {
  return (
    <div className="flex h-screen overflow-hidden w-full bg-background">
      <NewDomainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-background via-background to-primary/5 scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
