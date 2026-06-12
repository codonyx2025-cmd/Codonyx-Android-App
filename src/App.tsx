import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";
import { useEffect } from 'react';
import { initPushNotifications, savePushToken} from '@/lib/pushNotifications';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import MobileBottomNavBar from "./components/mobile/MobileBottomNavBar";

// Eagerly load critical pages for instant routing
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProfileDetailPage from "./pages/ProfileDetailPage";
import EditProfilePage from "./pages/EditProfilePage";
import ConnectionsPage from "./pages/ConnectionsPage";
import NotificationsPage from "./pages/NotificationsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsConditionsPage from "./pages/TermsConditionsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

// Lazy-loaded pages (less frequently visited)
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdvisorsPage = lazy(() => import("./pages/AdvisorsPage"));
const LaboratoriesPage = lazy(() => import("./pages/LaboratoriesPage"));
const PublicationsPage = lazy(() => import("./pages/PublicationsPage"));
const InvestmentsPage = lazy(() => import("./pages/InvestmentsPage"));
const ProductPage = lazy(() => import("./pages/ProductPage"));
const TechnologyPage = lazy(() => import("./pages/TechnologyPage"));
const BecomeAdvisorPage = lazy(() => import("./pages/BecomeAdvisorPage"));
const RegisterLaboratoryPage = lazy(() => import("./pages/RegisterLaboratoryPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const RegisterDistributorPage = lazy(() => import("./pages/RegisterDistributorPage"));
const DistributorDashboard = lazy(() => import("./pages/DistributorDashboard"));
const DistributorsPage = lazy(() => import("./pages/DistributorsPage"));
const RegisterLaboratoryLandingPage = lazy(() => import("./pages/RegisterLaboratoryLandingPage"));
const DistributorLandingPage = lazy(() => import("./pages/DistributorLandingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

const App = () => {
  useEffect(() => {
    initPushNotifications();

    if (Capacitor.isNativePlatform()) {
      // Handle Google OAuth deep link callback
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        console.log('App URL opened:', url);
        if (url.includes('login-callback')) {
          try {
            await Browser.close();
            // Parse tokens from the URL
            const urlStr = url.replace('org.codonyx.app://', 'https://placeholder.com/');
            const urlObj = new URL(urlStr);
            const accessToken = urlObj.searchParams.get('access_token');
            const refreshToken = urlObj.searchParams.get('refresh_token');

            if (accessToken && refreshToken) {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              await savePushToken();

            } else {
              // Try hash fragment
              const hash = urlObj.hash.substring(1);
              const params = new URLSearchParams(hash);
              const hashAccessToken = params.get('access_token');
              const hashRefreshToken = params.get('refresh_token');
              if (hashAccessToken && hashRefreshToken) {
                await supabase.auth.setSession({
                  access_token: hashAccessToken,
                  refresh_token: hashRefreshToken,
                });
                await savePushToken();
              }
            }
          } catch (err) {
            console.error('Error handling OAuth callback:', err);
          }
        }
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <ScrollToTopButton />
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/~oauth/*" element={<AuthPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/edit-profile" element={<EditProfilePage />} />
                  <Route path="/connections" element={<ConnectionsPage />} />
                  <Route path="/profile/:id" element={<ProfileDetailPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/advisors" element={<AdvisorsPage />} />
                  <Route path="/laboratories" element={<LaboratoriesPage />} />
                  <Route path="/publications" element={<PublicationsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/investments" element={<InvestmentsPage />} />
                  <Route path="/product" element={<ProductPage />} />
                  <Route path="/technology" element={<TechnologyPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsConditionsPage />} />
                  <Route path="/become-advisor" element={<BecomeAdvisorPage />} />
                  <Route path="/register-laboratory" element={<RegisterLaboratoryPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/register-distributor" element={<RegisterDistributorPage />} />
                  <Route path="/distributor-dashboard" element={<DistributorDashboard />} />
                  <Route path="/distributors" element={<DistributorsPage />} />
                  <Route path="/laboratory-info" element={<RegisterLaboratoryLandingPage />} />
                  <Route path="/distributor-info" element={<DistributorLandingPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </ErrorBoundary>
            </Suspense>
            <MobileBottomNavBar />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;