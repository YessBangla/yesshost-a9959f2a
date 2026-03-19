import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, Server, FileText, HeadphonesIcon,
  LogOut, Menu, Globe, Shield, Layers, Palette, Tag, MessageCircle, Mail, BookOpen,
  Search, ChevronRight, PanelLeftClose, PanelLeft
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanEvent } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import logoWhite from "@/assets/logo-white.png";

const SIDEBAR_W = 260;
const SWIPE_THRESHOLD = 80;

const AdminLayout = () => {
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

  const menuSections = [
    {
      label: bn ? "প্রধান" : "Main",
      items: [
        { title: tr("admin.dashboard"), url: "/admin", icon: LayoutDashboard },
        { title: tr("admin.users"), url: "/admin/users", icon: Users },
        { title: tr("admin.services"), url: "/admin/services", icon: Server },
        { title: tr("admin.billing"), url: "/admin/billing", icon: FileText },
        { title: tr("admin.tickets"), url: "/admin/tickets", icon: HeadphonesIcon },
      ],
    },
    {
      label: bn ? "কন্টেন্ট" : "Content",
      items: [
        { title: bn ? "থিম স্টোর" : "Themes", url: "/admin/themes", icon: Palette },
        { title: bn ? "কুপন" : "Coupons", url: "/admin/coupons", icon: Tag },
        { title: "CMS", url: "/admin/cms", icon: Layers },
        { title: bn ? "নলেজ বেস" : "Knowledge Base", url: "/admin/knowledge-base", icon: BookOpen },
      ],
    },
    {
      label: bn ? "যোগাযোগ" : "Communication",
      items: [
        { title: bn ? "লাইভ চ্যাট" : "Live Chat", url: "/admin/live-chat", icon: MessageCircle },
        { title: bn ? "চ্যাট রুম" : "Chat Rooms", url: "/admin/chat-rooms", icon: Users },
        { title: bn ? "কন্টাক্ট" : "Contact", url: "/admin/contact-messages", icon: Mail },
      ],
    },
  ];

  const allItems = menuSections.flatMap(s => s.items);
  const currentPage = allItems.find(i =>
    i.url === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(i.url)
  );

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -300) {
      setMobileOpen(false);
    }
    dragX.set(0);
  }, [dragX]);

  const SidebarInner = () => (
    <div className="flex flex-col h-full safe-top safe-bottom">
      {/* Logo Header */}
      <div className="h-16 flex items-center px-4 border-b border-border/40 shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Link to="/"><img src={logoWhite} alt="Yess Host" className="h-7" /></Link>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive tracking-widest uppercase border border-destructive/20">
              Admin
            </span>
          </div>
        ) : (
          <div className="flex justify-center w-full">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-5 no-scrollbar overscroll-contain">
        {menuSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em]">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url === "/admin"}
                  className={`group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent/8 transition-all duration-200 active:scale-[0.98] ${collapsed ? "justify-center px-2" : ""}`}
                  activeClassName="!bg-destructive/8 !text-destructive font-semibold"
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/40 p-2.5 space-y-0.5 shrink-0">
        {!collapsed && (
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-accent/8 hover:text-foreground transition-all active:scale-[0.98]"
            activeClassName=""
          >
            <LayoutDashboard className="w-[17px] h-[17px] shrink-0" />
            <span>{tr("admin.clientDashboard")}</span>
          </NavLink>
        )}

        {/* User Card */}
        {!collapsed && (
          <div className="mx-1 mt-2 p-3 rounded-xl bg-secondary/40 border border-border/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive text-xs font-bold shrink-0">
                {(profile?.full_name || "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{profile?.full_name || "Admin"}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
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
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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

      {/* Main Content */}
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

          {/* Breadcrumb */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs ml-1">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              {bn ? "অ্যাডমিন" : "Admin"}
            </Link>
            {currentPage && currentPage.url !== "/admin" && (
              <>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                <span className="font-medium text-foreground">{currentPage.title}</span>
              </>
            )}
          </div>

          {/* Mobile Page Title */}
          <div className="sm:hidden flex-1 text-center">
            <span className="text-sm font-semibold text-foreground">
              {currentPage?.title || (bn ? "অ্যাডমিন" : "Admin")}
            </span>
          </div>

          <div className="flex-1 hidden sm:block" />

          {/* Search - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/40 text-muted-foreground/60 text-xs w-52 cursor-pointer hover:bg-secondary/70 transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span>{bn ? "সার্চ..." : "Search..."}</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/50 font-mono">⌘K</kbd>
          </div>

          {/* Language */}
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1 px-2.5 py-2 min-h-[44px] rounded-lg hover:bg-secondary/60 active:bg-secondary/80 transition-colors text-xs font-medium text-muted-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === "bn" ? "EN" : "বাং"}
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-border/40">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-foreground leading-none">{profile?.full_name || "Admin"}</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{bn ? "সুপার অ্যাডমিন" : "Super Admin"}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center text-destructive text-xs font-bold border border-destructive/20">
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

export default AdminLayout;
