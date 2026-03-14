import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Server, FileText, HeadphonesIcon, Globe,
  UserCircle, LogOut, ChevronLeft, Menu, Shield, ShoppingBag,
  Search, ChevronRight, Home, Settings, Bell
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import logoWhite from "@/assets/logo-white.png";
import NotificationBell from "@/components/NotificationBell";
import { Link } from "react-router-dom";

const breadcrumbMap: Record<string, { en: string; bn: string }> = {
  "/dashboard": { en: "Dashboard", bn: "ড্যাশবোর্ড" },
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
    if (user) {
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
    }
  }, [user]);

  // Close user menu on outside click
  useEffect(() => {
    if (!showUserMenu) return;
    const handle = () => setShowUserMenu(false);
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [showUserMenu]);

  const sidebarItems = [
    { title: tr("dash.overview"), url: "/dashboard", icon: LayoutDashboard },
    { title: tr("dash.services"), url: "/dashboard/services", icon: Server },
    { title: bn ? "অর্ডার হিস্ট্রি" : "Orders", url: "/dashboard/orders", icon: ShoppingBag },
    { title: tr("dash.billing"), url: "/dashboard/billing", icon: FileText },
    { title: tr("dash.support"), url: "/dashboard/support", icon: HeadphonesIcon },
    { title: tr("dash.domains"), url: "/dashboard/domains", icon: Globe },
    { title: tr("dash.profile"), url: "/dashboard/profile", icon: UserCircle },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const currentBreadcrumb = breadcrumbMap[location.pathname];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link to="/">
          {!collapsed && <img src={logoWhite} alt="YessHost" className="h-8" />}
          {collapsed && <img src={logoWhite} alt="YessHost" className="h-6 w-6 object-contain" />}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/dashboard"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            activeClassName="bg-primary/10 text-primary font-semibold"
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        {!collapsed && (
          <>
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/60 w-full transition-all"
            >
              <Globe className="w-5 h-5 shrink-0" />
              {lang === "bn" ? "English" : "বাংলা"}
            </button>
            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-amber-500 hover:bg-amber-500/10 w-full transition-all"
                activeClassName=""
              >
                <Shield className="w-5 h-5 shrink-0" />
                {tr("admin.panel")}
              </NavLink>
            )}
          </>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>{tr("dash.signOut")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col glass border-r border-border transition-all duration-300 sticky top-0 h-screen ${collapsed ? "w-16" : "w-64"}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 glass border-r border-border z-50 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Enhanced Header */}
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border glass sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-3.5 h-3.5" />
            </Link>
            {currentBreadcrumb && location.pathname !== "/dashboard" && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                <span className="font-medium text-foreground text-xs">
                  {bn ? currentBreadcrumb.bn : currentBreadcrumb.en}
                </span>
              </>
            )}
          </div>

          <div className="flex-1" />

          {/* Quick Actions */}
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary/60"
          >
            <Home className="w-3.5 h-3.5" />
            {bn ? "সাইট" : "Site"}
          </Link>

          <NotificationBell />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-secondary/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/20">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {(profile?.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">{profile?.full_name || "User"}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">{user?.email}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-card-elevated rounded-xl p-2 shadow-xl border border-border z-50">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">ID: {user?.id?.slice(0, 8).toUpperCase()}</p>
                </div>
                <Link to="/dashboard/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                  <UserCircle className="w-4 h-4" /> {bn ? "প্রোফাইল" : "Profile"}
                </Link>
                <Link to="/dashboard/billing" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                  <FileText className="w-4 h-4" /> {bn ? "বিলিং" : "Billing"}
                </Link>
                <button
                  onClick={() => setLang(lang === "bn" ? "en" : "bn")}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors w-full"
                >
                  <Globe className="w-4 h-4" /> {lang === "bn" ? "English" : "বাংলা"}
                </button>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-amber-500 hover:bg-amber-500/10 transition-colors">
                    <Shield className="w-4 h-4" /> {bn ? "অ্যাডমিন" : "Admin"}
                  </Link>
                )}
                <div className="border-t border-border mt-1 pt-1">
                  <button onClick={handleSignOut} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors w-full">
                    <LogOut className="w-4 h-4" /> {tr("dash.signOut")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
