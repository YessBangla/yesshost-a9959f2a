import { Outlet, useNavigate, useLocation, Link } from "@/lib/router-compat";
import {
  LayoutDashboard, Users, Server, FileText, HeadphonesIcon,
  LogOut, Menu, Globe, Shield, Layers, Palette, Tag, MessageCircle, Mail, BookOpen,
  Search, ChevronRight, PanelLeftClose, PanelLeft, HardDrive, User, KeyRound, ChevronDown, Share2,
  UserCircle, Package, Receipt, TicketCheck, Loader2, History, Settings,
  BarChart3, Wallet, Megaphone, UserCog, CreditCard
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import logoWhite from "@/assets/logo-white.png";

const SIDEBAR_W = 260;
const SWIPE_THRESHOLD = 80;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbResults, setDbResults] = useState<{ users: any[]; services: any[]; orders: any[]; tickets: any[]; invoices: any[] }>({ users: [], services: [], orders: [], tickets: [], invoices: [] });
  const [dbSearching, setDbSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut } = useAuth();
  const { tr, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const bn = lang === "bn";
  const dragX = useMotionValue(0);
  const sidebarX = useTransform(dragX, [0, -SIDEBAR_W], [0, -SIDEBAR_W]);
  const overlayOpacity = useTransform(dragX, [0, -SIDEBAR_W], [1, 0]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        setSearchQuery("");
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
    if (!searchOpen) { setDbResults({ users: [], services: [], orders: [], tickets: [], invoices: [] }); setSearchQuery(""); }
  }, [searchOpen]);

  // Debounced database search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!searchQuery || searchQuery.length < 2) {
      setDbResults({ users: [], services: [], orders: [], tickets: [], invoices: [] });
      return;
    }
    setDbSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const q = searchQuery.toLowerCase();
      const [usersRes, servicesRes, ordersRes, ticketsRes, invoicesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, phone, company_name").or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,company_name.ilike.%${q}%`).limit(5),
        supabase.from("services").select("id, name, domain, status, service_type").or(`name.ilike.%${q}%,domain.ilike.%${q}%`).limit(5),
        supabase.from("orders").select("id, order_number, status, total_bdt").ilike("order_number", `%${q}%`).limit(5),
        supabase.from("support_tickets").select("id, ticket_number, subject, status").or(`ticket_number.ilike.%${q}%,subject.ilike.%${q}%`).limit(5),
        supabase.from("invoices").select("id, invoice_number, status, amount_bdt").ilike("invoice_number", `%${q}%`).limit(5),
      ]);
      setDbResults({
        users: usersRes.data || [],
        services: servicesRes.data || [],
        orders: ordersRes.data || [],
        tickets: ticketsRes.data || [],
        invoices: invoicesRes.data || [],
      });
      setDbSearching(false);
    }, 300);
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery]);

  const menuSections = [
    {
      label: bn ? "প্রধান" : "Main",
      items: [
        { title: tr("admin.dashboard"), url: "/admin", icon: LayoutDashboard },
        { title: tr("admin.users"), url: "/admin/users", icon: Users },
        { title: tr("admin.services"), url: "/admin/services", icon: Server },
        { title: tr("admin.billing"), url: "/admin/billing", icon: FileText },
        { title: tr("admin.tickets"), url: "/admin/tickets", icon: HeadphonesIcon },
        { title: bn ? "WHM সার্ভার" : "WHM Server", url: "/admin/whm", icon: HardDrive },
        { title: bn ? "অ্যাফিলিয়েট" : "Affiliates", url: "/admin/affiliates", icon: Share2 },
      ],
    },
    {
      label: bn ? "বিশ্লেষণ ও ব্যবস্থাপনা" : "Insights & Management",
      items: [
        { title: bn ? "অ্যানালিটিক্স" : "Analytics", url: "/admin/analytics", icon: BarChart3 },
        { title: bn ? "হিসাব/ফিন্যান্স" : "Finance", url: "/admin/finance", icon: Wallet },
        { title: bn ? "পেমেন্ট গেটওয়ে" : "Payment Gateways", url: "/admin/payment-gateways", icon: CreditCard },
        { title: bn ? "মার্কেটিং" : "Marketing", url: "/admin/marketing", icon: Megaphone },
        { title: bn ? "স্টাফ" : "Staff", url: "/admin/staff", icon: UserCog },
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
        { title: bn ? "কল হিস্ট্রি" : "Call History", url: "/admin/call-history", icon: History },
        { title: bn ? "চ্যাট রুম" : "Chat Rooms", url: "/admin/chat-rooms", icon: Users },
        { title: bn ? "কন্টাক্ট" : "Contact", url: "/admin/contact-messages", icon: Mail },
        { title: bn ? "কমিউনিকেশন সেটিংস" : "Comm. Config", url: "/admin/communication-config", icon: Settings },
      ],
    },
  ];

  const allItems = menuSections.flatMap(s => s.items);
  const currentPage = allItems.find(i =>
    i.url === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(i.url)
  );

  const [signOutOpen, setSignOutOpen] = useState(false);
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

          {/* Search trigger */}
          <button
            onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/40 text-muted-foreground/60 text-xs w-52 hover:bg-secondary/70 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{bn ? "সার্চ..." : "Search..."}</span>
            <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded-sm bg-background/80 border border-border/50 font-mono">⌘K</kbd>
          </button>
          {/* Mobile search icon */}
          <button
            onClick={() => { setSearchOpen(true); setSearchQuery(""); }}
            className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-secondary/60 text-muted-foreground"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Language */}
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1 px-2.5 py-2 min-h-[44px] rounded-lg hover:bg-secondary/60 active:bg-secondary/80 transition-colors text-xs font-medium text-muted-foreground"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === "bn" ? "EN" : "বাং"}
          </button>

          {/* User Menu Dropdown */}
          <div className="relative pl-2 ml-1 border-l border-border/40" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-foreground leading-none">{profile?.full_name || "Admin"}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{bn ? "সুপার অ্যাডমিন" : "Super Admin"}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center text-destructive text-xs font-bold border border-destructive/20">
                {(profile?.full_name || "A").charAt(0).toUpperCase()}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform hidden sm:block ${userMenuOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/60 rounded-xl shadow-xl shadow-black/10 py-1.5 z-50"
                >
                  <div className="px-3 py-2.5 border-b border-border/40">
                    <p className="text-sm font-semibold text-foreground">{profile?.full_name || "Admin"}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/8 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {bn ? "প্রোফাইল" : "Profile"}
                    </Link>
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/8 transition-colors"
                    >
                      <KeyRound className="w-4 h-4" />
                      {bn ? "পাসওয়ার্ড পরিবর্তন" : "Change Password"}
                    </Link>
                  </div>
                  <div className="border-t border-border/40 pt-1">
                    <button
                      onClick={() => { setUserMenuOpen(false); setSignOutOpen(true); }}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/8 w-full transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      {bn ? "সাইন আউট" : "Sign Out"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
      {/* Search Command Palette */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-[100]" onClick={() => setSearchOpen(false)}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <div className="relative flex justify-center pt-[15vh] px-4">
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
                  <Search className="w-5 h-5 text-muted-foreground/60 shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchQuery) {
                        const allItems = menuSections.flatMap(s => s.items);
                        const match = allItems.find(item =>
                          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.url.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        if (match) {
                          navigate(match.url);
                          setSearchOpen(false);
                        }
                      }
                    }}
                    placeholder={bn ? "পেজ, মেনু বা ফিচার সার্চ করুন..." : "Search pages, menus or features..."}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-hidden"
                  />
                  <kbd className="text-[10px] px-1.5 py-0.5 rounded-sm bg-secondary/80 border border-border/50 text-muted-foreground font-mono">ESC</kbd>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto py-2">
                  {/* Menu/Page results */}
                  {menuSections.map((section) => {
                    const filtered = section.items.filter(item =>
                      !searchQuery ||
                      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.url.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    if (filtered.length === 0) return null;
                    return (
                      <div key={section.label}>
                        <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                          {section.label}
                        </p>
                        {filtered.map((item) => {
                          const isActive = item.url === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(item.url);
                          return (
                            <button
                              key={item.url}
                              onClick={() => { navigate(item.url); setSearchOpen(false); }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                isActive
                                  ? "text-destructive bg-destructive/5"
                                  : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive ? "bg-destructive/10 text-destructive" : "bg-muted/60 text-muted-foreground"
                              }`}>
                                <item.icon className="w-4 h-4" />
                              </div>
                              <span className="font-medium">{item.title}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto" />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Database results */}
                  {searchQuery && searchQuery.length >= 2 && (
                    <>
                      {dbSearching && (
                        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs">{bn ? "খুঁজছে..." : "Searching..."}</span>
                        </div>
                      )}

                      {/* Users */}
                      {dbResults.users.length > 0 && (
                        <div>
                          <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                            {bn ? "ক্লায়েন্ট" : "Clients"}
                          </p>
                          {dbResults.users.map((u) => (
                            <button
                              key={u.user_id}
                              onClick={() => { navigate("/admin/users"); setSearchOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-500/10 text-blue-500">
                                <UserCircle className="w-4 h-4" />
                              </div>
                              <div className="text-left min-w-0">
                                <span className="font-medium block truncate">{u.full_name || "Unknown"}</span>
                                <span className="text-[11px] text-muted-foreground truncate block">{u.phone} {u.company_name ? `· ${u.company_name}` : ""}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Services */}
                      {dbResults.services.length > 0 && (
                        <div>
                          <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                            {bn ? "সার্ভিস" : "Services"}
                          </p>
                          {dbResults.services.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => { navigate("/admin/services"); setSearchOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-500/10 text-green-500">
                                <Package className="w-4 h-4" />
                              </div>
                              <div className="text-left min-w-0">
                                <span className="font-medium block truncate">{s.name}</span>
                                <span className="text-[11px] text-muted-foreground truncate block">{s.domain || s.service_type} · {s.status}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Orders */}
                      {dbResults.orders.length > 0 && (
                        <div>
                          <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                            {bn ? "অর্ডার" : "Orders"}
                          </p>
                          {dbResults.orders.map((o) => (
                            <button
                              key={o.id}
                              onClick={() => { navigate("/admin/billing"); setSearchOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-orange-500/10 text-orange-500">
                                <Receipt className="w-4 h-4" />
                              </div>
                              <div className="text-left min-w-0">
                                <span className="font-medium block truncate">#{o.order_number}</span>
                                <span className="text-[11px] text-muted-foreground truncate block">৳{o.total_bdt} · {o.status}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tickets */}
                      {dbResults.tickets.length > 0 && (
                        <div>
                          <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                            {bn ? "টিকেট" : "Tickets"}
                          </p>
                          {dbResults.tickets.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => { navigate("/admin/tickets"); setSearchOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-purple-500/10 text-purple-500">
                                <TicketCheck className="w-4 h-4" />
                              </div>
                              <div className="text-left min-w-0">
                                <span className="font-medium block truncate">#{t.ticket_number}</span>
                                <span className="text-[11px] text-muted-foreground truncate block">{t.subject} · {t.status}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Invoices */}
                      {dbResults.invoices.length > 0 && (
                        <div>
                          <p className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                            {bn ? "ইনভয়েস" : "Invoices"}
                          </p>
                          {dbResults.invoices.map((inv) => (
                            <button
                              key={inv.id}
                              onClick={() => { navigate("/admin/billing"); setSearchOpen(false); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-colors"
                            >
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-500">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="text-left min-w-0">
                                <span className="font-medium block truncate">#{inv.invoice_number}</span>
                                <span className="text-[11px] text-muted-foreground truncate block">৳{inv.amount_bdt} · {inv.status}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto shrink-0" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* No results */}
                  {searchQuery && searchQuery.length >= 2 && !dbSearching && 
                    menuSections.every(s => s.items.every(i =>
                      !i.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                      !i.url.toLowerCase().includes(searchQuery.toLowerCase())
                    )) &&
                    dbResults.users.length === 0 && dbResults.services.length === 0 &&
                    dbResults.orders.length === 0 && dbResults.tickets.length === 0 &&
                    dbResults.invoices.length === 0 && (
                    <div className="py-8 text-center">
                      <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">{bn ? "কিছু পাওয়া যায়নি" : "No results found"}</p>
                    </div>
                  )}

                  {/* Hint when empty */}
                  {(!searchQuery || searchQuery.length < 2) && (
                    <div className="py-6 text-center">
                      <p className="text-xs text-muted-foreground/60">{bn ? "ক্লায়েন্ট, সার্ভিস, অর্ডার, টিকেট বা ইনভয়েস সার্চ করুন" : "Search clients, services, orders, tickets or invoices"}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{bn ? "সাইন আউট নিশ্চিত করুন" : "Confirm Sign Out"}</AlertDialogTitle>
            <AlertDialogDescription>
              {bn ? "আপনি কি সত্যিই সাইন আউট করতে চান?" : "Are you sure you want to sign out?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{bn ? "বাতিল" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSignOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bn ? "সাইন আউট" : "Sign Out"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminLayout;
