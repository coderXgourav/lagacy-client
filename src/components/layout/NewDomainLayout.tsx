import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import NewDomainSidebar from "./NewDomainSidebar";

export default function NewDomainLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <NewDomainSidebar />
      <div className="flex-1">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
