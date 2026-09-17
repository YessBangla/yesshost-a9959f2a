import { Outlet, useNavigate, useLocation } from "@/lib/router-compat";
import {
  LayoutDashboard, LogOut, Menu, Globe, Headphones,
  ShoppingCart, MessageCircle, HeadphonesIcon, ChevronRight,
  PanelLeftClose, PanelLeft, Phone, History
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import { Link } from "@/lib/router-compat";
import logoWhite from "@/assets/logo-white.png";

const SIDEBAR_W = 260;
const SWIPE_THRESHOLD = 80;

const CallCenterLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { tr, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const bn = lang === "bn";
  const dragX = useMotionValue(0);
  const sidebarX = useTransform(dragX, [0, -SIDEBAR_W], [0, -SIDEBAR_W]);
  const overlayOpacity = useTransform(dragX, [0, -SIDEBAR_W], [1, 0]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const sidebarItems = [
    { title: bn ? "ড্যাশবোর্ড" : "Dashboard", url: "/call-center", icon: LayoutDashboard },
    { title: bn ? "অর্ডার" : "Orders", url: "/call-center/orders", icon: ShoppingCart },
    { title: bn ? "লাইভ চ্যাট" : "Live Chat", url: "/call-center/live-chat", icon: MessageCircle },
    { title: bn ? "টিকেট" : "Tickets", url: "/call-center/tickets", icon: HeadphonesIcon },
    { title: bn ? "কল হিস্ট্রি" : "Call History", url: "/call-center/call-history", icon: History },
  ];

  const currentPage = sidebarItems.find(i =>
    i.url === "/call-center" ? location.pathname === "/call-center" : location.pathname.startsWith(i.url)
  );

  const handleSignOut = async () => { await signOut(); navigate("/admin-login"); };

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -300) {
      setMobileOpen(false);
    }
    dragX.set(0);
  }, [dragX]);

  const SidebarInner = () => (
    <div className="flex flex-col h-full safe-top safe-bottom">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border/40 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Link to="/"><img src={logoWhite} alt="Yess Host" className="h-7" /></Link>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary tracking-widest uppercase border border-primary/20">
              {bn ? "সাপোর্ট" : "Support"}
            </span>
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <Headphones className="w-5 h-5 text-primary" />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 no-scrollbar overscroll-contain">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em]">
            {bn ? "কাজের তালিকা" : "Workspace"}
          </p>
        )}
        <div className="space-y-0.5">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/call-center"}
              className={`group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-[0.98] ${collapsed ? "justify-center px-2" : ""}`}
              activeClassName="!bg-primary/8 !text-primary font-semibold"
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border/40 p-2.5 space-y-0.5 shrink-0">
        {/* Online Status */}
        {!collapsed && (
          <div className="mx-0.5 mb-2 p-3 rounded-xl bg-success/5 border border-success/15">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">{bn ? "অনলাইন" : "Online"}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{bn ? "কল ও চ্যাট গ্রহণে প্রস্তুত" : "Ready to take calls & chats"}</p>
          </div>
        )}

        {/* User Card */}
        {!collapsed && (
          <div className="mx-0.5 p-3 rounded-xl bg-secondary/40 border border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/15 shrink-0">
                {(profile?.full_name || "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{profile?.full_name || "Agent"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{bn ? "সাপোর্ট এজেন্ট" : "Support Agent"}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/8 w-full transition-all active:scale-[0.98] ${collapsed ? "justify-center px-2" : ""}`}
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

      {/* Mobile Overlay with swipe-to-close */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ opacity: overlayOpacity }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -SIDEBAR_W }}
              animate={{ x: 0 }}
              exit={{ x: -SIDEBAR_W }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{ x: sidebarX }}
              drag="x"
              dragConstraints={{ left: -SIDEBAR_W, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="absolute left-0 top-0 bottom-0 w-[260px] bg-card border-r border-border shadow-2xl touch-pan-y"
            >
              <SidebarInner />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center gap-2 px-3 sm:px-4 lg:px-6 border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-30 safe-left safe-right">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-secondary/60 active:bg-secondary/80 text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors"
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Breadcrumb - desktop */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs ml-1">
            <Link to="/call-center" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {bn ? "সাপোর্ট" : "Support"}
            </Link>
            {currentPage && currentPage.url !== "/call-center" && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                <span className="font-medium text-foreground">{currentPage.title}</span>
              </>
            )}
          </div>

          {/* Mobile Page Title */}
          <div className="sm:hidden flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">
              {currentPage?.title || (bn ? "সাপোর্ট" : "Support")}
            </span>
          </div>

          <div className="flex-1 hidden sm:block" />

          {/* Language */}
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1 px-2.5 py-2 min-h-[44px] rounded-lg hover:bg-secondary/60 active:bg-secondary/80 transition-colors text-xs font-medium text-muted-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === "bn" ? "EN" : "বাং"}
          </button>

          {/* Agent Info */}
          <div className="flex items-center gap-2.5 pl-2.5 ml-1 border-l border-border/40">
            <div className="hidden sm:flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs font-medium text-foreground">{profile?.full_name || "Agent"}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/15">
              {(profile?.full_name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CallCenterLayout;
