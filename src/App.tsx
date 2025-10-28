import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { MainLayout } from "./components/layout/MainLayout";
import { NoWebsiteLayout } from "./components/layout/NoWebsiteLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import HistoryPage from "./pages/HistoryPage";
import RecentSearches from "./pages/RecentSearches";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import OfferingsPage from "./pages/OfferingsPage";
import NoWebsiteDashboard from "./pages/nowebsite/NoWebsiteDashboard";
import NoWebsiteSearchPage from "./pages/NoWebsiteSearchPage";
import NoWebsiteHistoryPage from "./pages/NoWebsiteHistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/offerings" element={<ProtectedRoute><OfferingsPage /></ProtectedRoute>} />
            <Route path="/no-website" element={<ProtectedRoute><NoWebsiteLayout /></ProtectedRoute>}>
              <Route index element={<NoWebsiteDashboard />} />
              <Route path="search" element={<NoWebsiteSearchPage />} />
              <Route path="history" element={<NoWebsiteHistoryPage />} />
              <Route path="recent-searches" element={<NoWebsiteHistoryPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/legacy" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="recent-searches" element={<RecentSearches />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
