import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { MainLayout } from "./components/layout/MainLayout";
import { NoWebsiteLayout } from "./components/layout/NoWebsiteLayout";
import { LowRatingLayout } from "./components/layout/LowRatingLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import SearchPage from "./pages/SearchPage";
import HistoryPage from "./pages/HistoryPage";
import RecentSearches from "./pages/RecentSearches";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import OfferingsPage from "./pages/OfferingsPage";
import NoWebsiteDashboard from "./pages/nowebsite/NoWebsiteDashboard";
import NoWebsiteSearchPage from "./pages/nowebsite/NoWebsiteSearchPage";
import NoWebsiteRecentSearches from "./pages/nowebsite/NoWebsiteRecentSearches";
import LowRatingDashboard from "./pages/lowrating/LowRatingDashboard";
import LowRatingSearchPage from "./pages/lowrating/LowRatingSearchPage";
import LowRatingRecentSearches from "./pages/lowrating/LowRatingRecentSearches";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/offerings" element={<ProtectedRoute><OfferingsPage /></ProtectedRoute>} />
            <Route path="/no-website" element={<ProtectedRoute><NoWebsiteLayout /></ProtectedRoute>}>
              <Route index element={<NoWebsiteDashboard />} />
              <Route path="search" element={<NoWebsiteSearchPage />} />
              <Route path="recent-searches" element={<NoWebsiteRecentSearches />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/legacy" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="recent-searches" element={<RecentSearches />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/low-rating" element={<ProtectedRoute><LowRatingLayout /></ProtectedRoute>}>
              <Route index element={<LowRatingDashboard />} />
              <Route path="search" element={<LowRatingSearchPage />} />
              <Route path="recent-searches" element={<LowRatingRecentSearches />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="/" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
