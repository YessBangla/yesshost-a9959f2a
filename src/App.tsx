import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import CallCenterRoute from "@/components/CallCenterRoute";
import CallCenterLayout from "@/components/CallCenterLayout";
import DashboardLayout from "@/components/DashboardLayout";
import AdminLayout from "@/components/AdminLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import OfflineBanner from "@/components/OfflineBanner";

// Eagerly loaded critical pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy loaded pages for code splitting
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentMethods = lazy(() => import("./pages/PaymentMethods"));
const PaymentResult = lazy(() => import("./pages/PaymentResult").then(m => ({ default: m.PaymentSuccess })));
const PaymentFail = lazy(() => import("./pages/PaymentResult").then(m => ({ default: m.PaymentFail })));
const PaymentCancel = lazy(() => import("./pages/PaymentResult").then(m => ({ default: m.PaymentCancel })));

const DomainPricing = lazy(() => import("./pages/DomainPricing"));
const DomainSearchPage = lazy(() => import("./pages/DomainSearchPage"));
const HostingPlans = lazy(() => import("./pages/HostingPlans"));
const ServiceDetail = lazy(() => import("./pages/services/ServiceDetail"));
const ResellerHosting = lazy(() => import("./pages/ResellerHosting"));

const About = lazy(() => import("./pages/company/About"));
const Contact = lazy(() => import("./pages/company/Contact"));
const KnowledgeBase = lazy(() => import("./pages/company/KnowledgeBase"));
const KnowledgeBaseArticle = lazy(() => import("./pages/company/KnowledgeBaseArticle"));
const Affiliate = lazy(() => import("./pages/company/Affiliate"));

const ThemeStore = lazy(() => import("./pages/themes/ThemeStore"));
const ThemeDetail = lazy(() => import("./pages/themes/ThemeDetail"));
const ThemeDemo = lazy(() => import("./pages/themes/ThemeDemo"));

const ChatRooms = lazy(() => import("./pages/ChatRooms"));

const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const Refund = lazy(() => import("./pages/legal/Refund"));

// Dashboard pages
const DashboardOverview = lazy(() => import("./pages/dashboard/Overview"));
const DashboardServices = lazy(() => import("./pages/dashboard/Services"));
const DashboardBilling = lazy(() => import("./pages/dashboard/Billing"));
const DashboardSupport = lazy(() => import("./pages/dashboard/Support"));
const DashboardDomains = lazy(() => import("./pages/dashboard/Domains"));
const DashboardProfile = lazy(() => import("./pages/dashboard/Profile"));
const DashboardOrders = lazy(() => import("./pages/dashboard/Orders"));
const DashboardReseller = lazy(() => import("./pages/dashboard/Reseller"));
const DashboardWallet = lazy(() => import("./pages/dashboard/Wallet"));
const DashboardAffiliate = lazy(() => import("./pages/dashboard/AffiliateDashboard"));
const DashboardThemeSeller = lazy(() => import("./pages/dashboard/ThemeSeller"));
const DashboardTroubleshoot = lazy(() => import("./pages/dashboard/Troubleshoot"));
const DashboardOrderService = lazy(() => import("./pages/dashboard/OrderService"));
const DashboardDomainTools = lazy(() => import("./pages/dashboard/DomainTools"));
const DashboardSupportPin = lazy(() => import("./pages/dashboard/SupportPin"));
const DashboardKnowledgeBase = lazy(() => import("./pages/dashboard/KnowledgeBasePage"));
const DashboardServerStatus = lazy(() => import("./pages/dashboard/ServerStatusPage"));

const AdminAffiliates = lazy(() => import("./pages/admin/Affiliates"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminServices = lazy(() => import("./pages/admin/Services"));
const AdminBilling = lazy(() => import("./pages/admin/Billing"));
const AdminTickets = lazy(() => import("./pages/admin/Tickets"));
const AdminCMS = lazy(() => import("./pages/admin/CMS"));
const AdminThemes = lazy(() => import("./pages/admin/Themes"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminLiveChat = lazy(() => import("./pages/admin/LiveChat"));
const AdminChatRooms = lazy(() => import("./pages/admin/ChatRooms"));
const AdminContactMessages = lazy(() => import("./pages/admin/ContactMessages"));
const AdminKnowledgeBase = lazy(() => import("./pages/admin/KnowledgeBase"));
const AdminWHM = lazy(() => import("./pages/admin/WHM"));
const AdminCallHistory = lazy(() => import("./pages/callcenter/CallHistory"));
const AdminCommunicationConfig = lazy(() => import("./pages/admin/CommunicationConfig"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminFinance = lazy(() => import("./pages/admin/Finance"));
const AdminMarketing = lazy(() => import("./pages/admin/Marketing"));
const AdminStaff = lazy(() => import("./pages/admin/Staff"));

// Call center pages
const CallCenterDashboard = lazy(() => import("./pages/callcenter/Dashboard"));
const CallCenterOrders = lazy(() => import("./pages/callcenter/Orders"));
const CallCenterLiveChat = lazy(() => import("./pages/callcenter/LiveChat"));
const CallCenterTickets = lazy(() => import("./pages/callcenter/Tickets"));
const CallCenterCallHistory = lazy(() => import("./pages/callcenter/CallHistory"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Minimal loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageProvider>
          <CartProvider>
          <AuthProvider>
            {/* Skip to content for accessibility */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-semibold">
              Skip to content
            </a>
            <ScrollToTop />
            <OfflineBanner />
            <CartDrawer />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment" element={<PaymentMethods />} />
                <Route path="/payment/success" element={<PaymentResult />} />
                <Route path="/payment/fail" element={<PaymentFail />} />
                <Route path="/payment/cancel" element={<PaymentCancel />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Domain pricing */}
                <Route path="/domain-pricing" element={<DomainPricing />} />
                <Route path="/domain-search" element={<DomainSearchPage />} />
                <Route path="/hosting-plans" element={<HostingPlans />} />

                {/* Service detail pages */}
                <Route path="/services/:slug" element={<ServiceDetail />} />
                <Route path="/reseller-hosting" element={<ResellerHosting />} />

                {/* Company pages */}
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/knowledge-base" element={<KnowledgeBase />} />
                <Route path="/knowledge-base/:slug" element={<KnowledgeBaseArticle />} />
                <Route path="/affiliate" element={<Affiliate />} />

                {/* Theme pages */}
                <Route path="/themes" element={<ThemeStore />} />
                <Route path="/themes/:slug" element={<ThemeDetail />} />
                <Route path="/themes/:slug/demo" element={<ThemeDemo />} />

                {/* Legal pages */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/refund" element={<Refund />} />
                <Route path="/chat-rooms" element={<ChatRooms />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardOverview />} />
                  <Route path="services" element={<DashboardServices />} />
                  <Route path="orders" element={<DashboardOrders />} />
                  <Route path="billing" element={<DashboardBilling />} />
                  <Route path="support" element={<DashboardSupport />} />
                  <Route path="domains" element={<DashboardDomains />} />
                  <Route path="reseller" element={<DashboardReseller />} />
                  <Route path="affiliate" element={<DashboardAffiliate />} />
                  <Route path="wallet" element={<DashboardWallet />} />
                  <Route path="theme-seller" element={<DashboardThemeSeller />} />
                  <Route path="troubleshoot" element={<DashboardTroubleshoot />} />
                  <Route path="order-service" element={<DashboardOrderService />} />
                  <Route path="domain-tools" element={<DashboardDomainTools />} />
                  <Route path="support-pin" element={<DashboardSupportPin />} />
                  <Route path="knowledge-base" element={<DashboardKnowledgeBase />} />
                  <Route path="server-status" element={<DashboardServerStatus />} />
                  <Route path="profile" element={<DashboardProfile />} />

                </Route>
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="services" element={<AdminServices />} />
                  <Route path="billing" element={<AdminBilling />} />
                  <Route path="tickets" element={<AdminTickets />} />
                  <Route path="cms" element={<AdminCMS />} />
                  <Route path="themes" element={<AdminThemes />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="live-chat" element={<AdminLiveChat />} />
                  <Route path="call-history" element={<AdminCallHistory />} />
                  <Route path="communication-config" element={<AdminCommunicationConfig />} />
                  <Route path="chat-rooms" element={<AdminChatRooms />} />
                  <Route path="contact-messages" element={<AdminContactMessages />} />
                  <Route path="knowledge-base" element={<AdminKnowledgeBase />} />
                  <Route path="whm" element={<AdminWHM />} />
                  <Route path="affiliates" element={<AdminAffiliates />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="finance" element={<AdminFinance />} />
                  <Route path="marketing" element={<AdminMarketing />} />
                  <Route path="staff" element={<AdminStaff />} />
                </Route>
                <Route
                  path="/call-center"
                  element={
                    <CallCenterRoute>
                      <CallCenterLayout />
                    </CallCenterRoute>
                  }
                >
                  <Route index element={<CallCenterDashboard />} />
                  <Route path="orders" element={<CallCenterOrders />} />
                  <Route path="live-chat" element={<CallCenterLiveChat />} />
                  <Route path="tickets" element={<CallCenterTickets />} />
                  <Route path="call-history" element={<CallCenterCallHistory />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
          </CartProvider>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;