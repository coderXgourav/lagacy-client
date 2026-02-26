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
import NewDomainLayout from "./components/layout/NewDomainLayout";
import NewBusinessLayout from "./components/layout/NewBusinessLayout";
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
import NewDomainDashboard from "./pages/newdomain/NewDomainDashboard";
import NewDomainSearchPage from "./pages/newdomain/NewDomainSearchPage";
import NewDomainRecentSearches from "./pages/newdomain/NewDomainRecentSearches";
import NewBusinessDashboard from "./pages/newbusiness/NewBusinessDashboard";
import NewBusinessSearchPage from "./pages/newbusiness/NewBusinessSearchPage";
import NewBusinessRecentSearches from "./pages/newbusiness/NewBusinessRecentSearches";
import DomainScraperDashboard from "./pages/domainscraper/DomainScraperDashboard";
import DomainScraperSettings from "./pages/domainscraper/DomainScraperSettings";
import { CsvFilterLayout } from "./components/layout/CsvFilterLayout";
import CsvFilterDashboard from "./pages/csvfilter/CsvFilterDashboard";
import { CsvUploaderLayout } from "./components/layout/CsvUploaderLayout";
import CsvUploaderDashboard from "./pages/csvuploader/CsvUploaderDashboard";
import CsvUploaderStats from "./pages/csvuploader/CsvUploaderStats";
import CsvUploaderInbox from "./pages/csvuploader/CsvUploaderInbox";
import CsvUploaderTemplates from "./pages/csvuploader/CsvUploaderTemplates";
import { HrPortalLayout } from "./components/layout/HrPortalLayout";
import HrPortalDashboard from "./pages/hrportal/HrPortalDashboard";
import HrEmployeeDirectory from "./pages/hrportal/HrEmployeeDirectory";
import HrRecruitment from "./pages/hrportal/HrRecruitment";
import HrJobRequest from "./pages/hrportal/recruitment/HrJobRequest";
import CandidateBoard from "./pages/hrportal/recruitment/CandidateBoard";
import SocialMediaDashboard from "./pages/socialmedia/SocialMediaDashboard";
import SourceSiteOwnersPage from "./pages/SourceSiteOwnersPage";
import LeadCapturePage from "./pages/LeadCapturePage";
import LeadDashboardPage from "./pages/LeadDashboardPage";
import PainSignalPage from "./pages/PainSignalPage";
import KyptronixFormPage from "./pages/KyptronixFormPage";
import KyptronixFormDetailsPage from "./pages/KyptronixFormDetailsPage";
import SystemRoleDashboard from "./pages/SystemRoleDashboard";
import NotFound from "./pages/NotFound";
import { SystemRoleLayout } from "./components/layout/SystemRoleLayout";
import { PainSignalLayout } from "./components/layout/PainSignalLayout";
import { SocialMediaLayout } from "./components/layout/SocialMediaLayout";
import { SourceSiteOwnersLayout } from "./components/layout/SourceSiteOwnersLayout";
import { LeadCaptureLayout } from "./components/layout/LeadCaptureLayout";
import { KyptronixFormLayout } from "./components/layout/KyptronixFormLayout";
import { DomainScraperLayout } from "./components/layout/DomainScraperLayout";

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
              <Route path="/new-domain" element={<ProtectedRoute><NewDomainLayout /></ProtectedRoute>}>
                <Route index element={<NewDomainDashboard />} />
                <Route path="search" element={<NewDomainSearchPage />} />
                <Route path="recent-searches" element={<NewDomainRecentSearches />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/new-business" element={<ProtectedRoute><NewBusinessLayout /></ProtectedRoute>}>
                <Route index element={<NewBusinessDashboard />} />
                <Route path="search" element={<NewBusinessSearchPage />} />
                <Route path="recent-searches" element={<NewBusinessRecentSearches />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="/domain-scraper" element={<ProtectedRoute><DomainScraperLayout /></ProtectedRoute>}>
                <Route index element={<DomainScraperDashboard />} />
                <Route path="settings" element={<DomainScraperSettings />} />
              </Route>
              <Route path="/csv-filter" element={<ProtectedRoute><CsvFilterLayout /></ProtectedRoute>}>
                <Route index element={<CsvFilterDashboard />} />
              </Route>
              <Route path="/csv-uploader" element={<ProtectedRoute><CsvUploaderLayout /></ProtectedRoute>}>
                <Route index element={<CsvUploaderDashboard />} />
                <Route path="stats" element={<CsvUploaderStats />} />
                <Route path="inbox" element={<CsvUploaderInbox />} />
                <Route path="templates" element={<CsvUploaderTemplates />} />
              </Route>
              <Route path="/hr-portal" element={<ProtectedRoute><HrPortalLayout /></ProtectedRoute>}>
                <Route index element={<HrPortalDashboard />} />
                <Route path="employees" element={<HrEmployeeDirectory />} />
                <Route path="recruitment" element={<HrRecruitment />} />
                <Route path="recruitment/new" element={<HrJobRequest />} />
                <Route path="recruitment/board/:jobId" element={<CandidateBoard />} />
              </Route>
              <Route path="/social-media" element={<ProtectedRoute><SocialMediaLayout /></ProtectedRoute>}>
                <Route index element={<SocialMediaDashboard />} />
              </Route>
              <Route path="/source-site-owners" element={<ProtectedRoute><SourceSiteOwnersLayout /></ProtectedRoute>}>
                <Route index element={<SourceSiteOwnersPage />} />
              </Route>
              <Route path="/lead-capture" element={<ProtectedRoute><LeadCaptureLayout /></ProtectedRoute>}>
                <Route index element={<LeadCapturePage />} />
                <Route path="dashboard" element={<LeadDashboardPage />} />
              </Route>
              <Route path="/pain-signal" element={<ProtectedRoute><PainSignalLayout /></ProtectedRoute>}>
                <Route index element={<PainSignalPage />} />
              </Route>
              <Route path="/kyptronix-form" element={<ProtectedRoute><KyptronixFormLayout /></ProtectedRoute>}>
                <Route index element={<KyptronixFormPage />} />
                <Route path=":formId" element={<KyptronixFormDetailsPage />} />
              </Route>
              <Route path="/system-role" element={<ProtectedRoute><SystemRoleLayout /></ProtectedRoute>}>
                <Route index element={<SystemRoleDashboard />} />
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
