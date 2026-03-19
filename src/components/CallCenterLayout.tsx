import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, LogOut, ChevronLeft, Menu, Globe, Headphones,
  ShoppingCart, MessageCircle, HeadphonesIcon, ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import logoWhite from "@/assets/logo-white.png";

const CallCenterLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { tr, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const bn = lang === "bn";

  const sidebarItems = [
    { title: bn ? "ড্যাশবোর্ড" : "Dashboard", url: "/call-center", icon: LayoutDashboard },
    { title: bn ? "অর্ডার ম্যানেজমেন্ট" : "Order Management", url: "/call-center/orders", icon: ShoppingCart },
    { title: bn ? "লাইভ চ্যাট" : "Live Chat", url: "/call-center/live-chat", icon: MessageCircle },
    { title: bn ? "সাপোর্ট টিকেট" : "Support Tickets", url: "/call-center/tickets", icon: HeadphonesIcon },
  ];

  const currentPage = sidebarItems.find(i =>
    i.url === "/call-center" ? location.pathname === "/call-center" : location.pathname.startsWith(i.url)
  );

  const handleSignOut = async () => { await signOut(); navigate("/admin-login"); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <img src={logoWhite} alt="Yess Host" className="h-7" />
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent-foreground tracking-wider uppercase">
                {bn ? "কল সেন্টার" : "Call Center"}
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center"><Headphones className="w-5 h-5 text-primary" /></div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground">
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {!collapsed && <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">{bn ? "মেইন মেনু" : "Main Menu"}</p>}
        {sidebarItems.map(item => (
          <NavLink key={item.url} to={item.url} end={item.url === "/call-center"}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all ${collapsed ? "justify-center" : ""}`}
            activeClassName="bg-primary/10 text-primary shadow-sm"
            onClick={() => setMobileOpen(false)}>
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2.5 border-t border-border/50 space-y-0.5">
        {!collapsed && (
          <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary/50 w-full transition-all">
            <Globe className="w-[18px] h-[18px] shrink-0" />{lang === "bn" ? "English" : "বাংলা"}
          </button>
        )}
        {!collapsed && (
          <div className="px-3 py-2.5 mt-1 rounded-xl bg-secondary/30">
            <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || "Agent"}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        )}
        <button onClick={handleSignOut} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-all ${collapsed ? "justify-center" : ""}`}>
          <LogOut className="w-[18px] h-[18px] shrink-0" />{!collapsed && <span>{tr("dash.signOut")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      <aside className={`hidden lg:flex flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300 ${collapsed ? "w-[68px]" : "w-64"}`}>
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 shadow-2xl"><SidebarContent /></aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center gap-3 px-4 md:px-6 border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground"><Menu className="w-5 h-5" /></button>
          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">{bn ? "কল সেন্টার" : "Call Center"}</span>
            {currentPage && currentPage.url !== "/call-center" && (<><ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" /><span className="font-medium text-foreground">{currentPage.title}</span></>)}
          </div>
          <div className="flex-1" />
          <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 hover:bg-secondary/80 transition-all text-sm font-medium text-foreground">
            <Globe className="w-3.5 h-3.5 text-primary" /><span className="text-xs">{lang === "bn" ? "EN" : "বাং"}</span>
          </button>
          <span className="text-sm text-muted-foreground hidden md:block font-medium">{profile?.full_name || user?.email}</span>
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
            {(profile?.full_name || "A").charAt(0).toUpperCase()}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
};

export default CallCenterLayout;
