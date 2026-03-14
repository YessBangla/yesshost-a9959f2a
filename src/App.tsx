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
import DashboardLayout from "@/components/DashboardLayout";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardOverview from "./pages/dashboard/Overview";
import DashboardServices from "./pages/dashboard/Services";
import DashboardBilling from "./pages/dashboard/Billing";
import DashboardSupport from "./pages/dashboard/Support";
import DashboardDomains from "./pages/dashboard/Domains";
import DashboardProfile from "./pages/dashboard/Profile";
import DashboardOrders from "./pages/dashboard/Orders";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminServices from "./pages/admin/Services";
import AdminBilling from "./pages/admin/Billing";
import AdminTickets from "./pages/admin/Tickets";
import AdminCMS from "./pages/admin/CMS";
import AdminThemes from "./pages/admin/Themes";
import AdminCoupons from "./pages/admin/Coupons";
import ServiceDetail from "./pages/services/ServiceDetail";
import About from "./pages/company/About";
import Contact from "./pages/company/Contact";
import KnowledgeBase from "./pages/company/KnowledgeBase";
import Affiliate from "./pages/company/Affiliate";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import Refund from "./pages/legal/Refund";
import ThemeStore from "./pages/themes/ThemeStore";
import ThemeDetail from "./pages/themes/ThemeDetail";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import { PaymentSuccess, PaymentFail, PaymentCancel } from "./pages/PaymentResult";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
        <CartProvider>
        <AuthProvider>
          <CartDrawer />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/fail" element={<PaymentFail />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Service detail pages */}
            <Route path="/services/:slug" element={<ServiceDetail />} />

            {/* Company pages */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/affiliate" element={<Affiliate />} />

            {/* Theme pages */}
            <Route path="/themes" element={<ThemeStore />} />
            <Route path="/themes/:slug" element={<ThemeDetail />} />

            {/* Legal pages */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/refund" element={<Refund />} />

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
              <Route path="billing" element={<DashboardBilling />} />
              <Route path="support" element={<DashboardSupport />} />
              <Route path="domains" element={<DashboardDomains />} />
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
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </CartProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
