import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Server, FileText, HeadphonesIcon, Globe,
  UserCircle, LogOut, Menu, Shield, ShoppingBag,
  ChevronRight, Home, PanelLeftClose, PanelLeft,
  CreditCard, Settings
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import logoWhite from "@/assets/logo-white.png";
import NotificationBell from "@/components/NotificationBell";

const breadcrumbMap: Record<string, { en: string; bn: string }> = {
  "/dashboard": { en: "Overview", bn: "ওভারভিউ" },
  "/dashboard/services": { en: "Services", bn: "সার্ভিস" },
  "/dashboard/orders": { en: "Orders", bn: "অর্ডার" },
  "/dashboard/billing": { en: "Billing", bn: "বিলিং" },
  "/dashboard/support": { en: "Support", bn: "সাপোর্ট" },
  "/dashboard/domains": { en: "Domains", bn: "ডোমেইন" },
  "/dashboard/profile": { en: "Profile", bn: "প্রোফাইল" },
};

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { tr, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const bn = lang === "bn";

  useEffect(() => {
    if (user) supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!showUserMenu) return;
    const handle = () => setShowUserMenu(false);
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [showUserMenu]);

  const sidebarItems = [
    { title: tr("dash.overview"), url: "/dashboard", icon: LayoutDashboard },
    { title: tr("dash.services"), url: "/dashboard/services", icon: Server },
    { title: bn ? "অর্ডার" : "Orders", url: "/dashboard/orders", icon: ShoppingBag },
    { title: tr("dash.billing"), url: "/dashboard/billing", icon: CreditCard },
    { title: tr("dash.support"), url: "/dashboard/support", icon: HeadphonesIcon },
    { title: tr("dash.domains"), url: "/dashboard/domains", icon: Globe },
  ];

  const bottomItems = [
    { title: tr("dash.profile"), url: "/dashboard/profile", icon: UserCircle },
  ];

  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const currentBreadcrumb = breadcrumbMap[location.pathname];

  const SidebarInner = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border/40 shrink-0">
        {!collapsed ? (
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoWhite} alt="Yess Host" className="h-7" />
          </Link>
        ) : (
          <Link to="/" className="flex justify-center w-full">
            <img src={logoWhite} alt="Yess Host" className="h-5 w-5 object-contain" />
          </Link>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 no-scrollbar">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em]">
            {bn ? "মেনু" : "Menu"}
          </p>
        )}
        <div className="space-y-0.5">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/dashboard"}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 ${collapsed ? "justify-center px-2" : ""}`}
              activeClassName="!bg-primary/8 !text-primary font-semibold"
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border/40 p-2.5 space-y-0.5 shrink-0">
        {bottomItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all ${collapsed ? "justify-center px-2" : ""}`}
            activeClassName="!bg-primary/8 !text-primary font-semibold"
          >
            <item.icon className="w-[17px] h-[17px] shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}

        {!collapsed && isAdmin && (
          <NavLink
            to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-amber-600 hover:bg-amber-500/8 transition-all"
            activeClassName=""
          >
            <Shield className="w-[17px] h-[17px] shrink-0" />
            <span>{tr("admin.panel")}</span>
          </NavLink>
        )}

        {/* User Card */}
        {!collapsed && (
          <div className="mx-0.5 mt-2 p-3 rounded-xl bg-secondary/40 border border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/15 shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {(profile?.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{profile?.full_name || "User"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{profile?.company_name || user?.email}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 w-full transition-all ${collapsed ? "justify-center px-2" : ""}`}
        >
          <LogOut className="w-[17px] h-[17px] shrink-0" />
          {!collapsed && <span>{tr("dash.signOut")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-card border-r border-border/50 transition-all duration-300 ease-out sticky top-0 h-screen z-20 ${
          collapsed ? "w-[60px]" : "w-[250px]"
        }`}
      >
        <SidebarInner />
      </aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-[260px] bg-card border-r border-border shadow-2xl"
            >
              <SidebarInner />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center gap-2 px-4 lg:px-6 border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors"
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs ml-1">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-3.5 h-3.5" />
            </Link>
            {currentBreadcrumb && location.pathname !== "/dashboard" && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                <span className="font-medium text-foreground">{bn ? currentBreadcrumb.bn : currentBreadcrumb.en}</span>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* Quick Links */}
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary/50"
          >
            <Home className="w-3.5 h-3.5" />
            {bn ? "সাইট" : "Website"}
          </Link>

          <NotificationBell />

          {/* Language */}
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors text-xs font-medium text-muted-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === "bn" ? "EN" : "বাং"}
          </button>

          {/* User */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
              className="flex items-center gap-2 pl-2.5 ml-1 border-l border-border/40"
            >
              <div className="hidden md:block text-right">
                <p className="text-xs font-semibold text-foreground leading-none">{profile?.full_name || "User"}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{profile?.company_name || (bn ? "ক্লায়েন্ট" : "Client")}</p>
              </div>
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/15">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {(profile?.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl p-1.5 shadow-xl border border-border z-50"
                >
                  <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <Link to="/dashboard/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                    <UserCircle className="w-4 h-4" /> {bn ? "প্রোফাইল" : "Profile"}
                  </Link>
                  <Link to="/dashboard/billing" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                    <CreditCard className="w-4 h-4" /> {bn ? "বিলিং" : "Billing"}
                  </Link>
                  <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors w-full">
                    <Globe className="w-4 h-4" /> {lang === "bn" ? "English" : "বাংলা"}
                  </button>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-amber-600 hover:bg-amber-500/8 transition-colors">
                      <Shield className="w-4 h-4" /> {bn ? "অ্যাডমিন" : "Admin"}
                    </Link>
                  )}
                  <div className="border-t border-border/50 mt-1 pt-1">
                    <button onClick={handleSignOut} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/8 transition-colors w-full">
                      <LogOut className="w-4 h-4" /> {tr("dash.signOut")}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
