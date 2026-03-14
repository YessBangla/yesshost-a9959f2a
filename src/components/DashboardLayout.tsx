import { Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Server, FileText, HeadphonesIcon, Globe,
  UserCircle, LogOut, ChevronLeft, Menu
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import logoWhite from "@/assets/logo-white.png";

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { tr, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const sidebarItems = [
    { title: tr("dash.overview"), url: "/dashboard", icon: LayoutDashboard },
    { title: tr("dash.services"), url: "/dashboard/services", icon: Server },
    { title: tr("dash.billing"), url: "/dashboard/billing", icon: FileText },
    { title: tr("dash.support"), url: "/dashboard/support", icon: HeadphonesIcon },
    { title: tr("dash.domains"), url: "/dashboard/domains", icon: Globe },
    { title: tr("dash.profile"), url: "/dashboard/profile", icon: UserCircle },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && <img src={logoWhite} alt="YessHost" className="h-8" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/dashboard"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            activeClassName="bg-primary/10 text-primary"
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        {!collapsed && (
          <>
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/60 w-full transition-all mb-1"
            >
              <Globe className="w-5 h-5 shrink-0" />
              {lang === "bn" ? "English" : "বাংলা"}
            </button>
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
      <aside className={`hidden lg:flex flex-col glass border-r border-border transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 glass border-r border-border z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-3 px-4 border-b border-border glass">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground hidden sm:block">{profile?.full_name || user?.email}</span>
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            {(profile?.full_name || "U").charAt(0).toUpperCase()}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
};

export default DashboardLayout;
