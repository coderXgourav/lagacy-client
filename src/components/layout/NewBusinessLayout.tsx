import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import NewBusinessSidebar from "./NewBusinessSidebar";

export default function NewBusinessLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <NewBusinessSidebar />
      <div className="flex-1">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
