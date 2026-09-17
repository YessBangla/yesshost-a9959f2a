import { Outlet, useNavigate, useLocation, Link } from "@/lib/router-compat";
import LiveChatWidget from "@/components/LiveChatWidget";
import {
  LayoutDashboard, Server, FileText, HeadphonesIcon, Globe,
  UserCircle, LogOut, Menu, Shield, ShoppingBag,
  ChevronRight, Home, PanelLeftClose, PanelLeft,
  CreditCard, Share2, KeyRound, Bell, Settings, Wallet,
  ChevronDown, Package, PlusCircle, ListOrdered, RefreshCw, ArrowRightLeft, Search, Layers,
  TicketPlus, Ticket, KeyRound as KeyIcon, BookOpen, Activity,
  Users, DollarSign, MousePointer, Palette, LifeBuoy
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import { supabase } from "@/integrations/supabase/client";
import logoWhite from "@/assets/logo-white.png";
import NotificationBell from "@/components/NotificationBell";
import { formatAmount } from "@/lib/formatPrice";

const SIDEBAR_W = 260;
const SWIPE_THRESHOLD = 80;

const breadcrumbMap: Record<string, { en: string; bn: string }> = {
  "/dashboard": { en: "Overview", bn: "ওভারভিউ" },
  "/dashboard/services": { en: "Services", bn: "সার্ভিস" },
  "/dashboard/orders": { en: "Orders", bn: "অর্ডার" },
  "/dashboard/billing": { en: "Billing", bn: "বিলিং" },
  "/dashboard/support": { en: "Support", bn: "সাপোর্ট" },
  "/dashboard/domains": { en: "Domains", bn: "ডোমেইন" },
  "/dashboard/profile": { en: "Profile", bn: "প্রোফাইল" },
  "/dashboard/reseller": { en: "Reseller", bn: "রিসেলার" },
  "/dashboard/affiliate": { en: "Affiliate", bn: "অ্যাফিলিয়েট" },
  "/dashboard/wallet": { en: "Wallet", bn: "ওয়ালেট" },
  "/dashboard/income": { en: "Income & Payments", bn: "আয় ও পেমেন্ট" },
  "/dashboard/theme-seller": { en: "Sell Themes", bn: "থিম বিক্রি" },
  "/dashboard/troubleshoot": { en: "Troubleshoot", bn: "সমস্যা নির্ণয়" },
  "/dashboard/order-service": { en: "Order New Services", bn: "নতুন সার্ভিস অর্ডার" },
  "/dashboard/domain-tools": { en: "Domain Tools", bn: "ডোমেইন টুলস" },
  "/dashboard/support-pin": { en: "Support PIN", bn: "সাপোর্ট পিন" },
  "/dashboard/knowledge-base": { en: "Knowledgebase", bn: "নলেজবেস" },
  "/dashboard/server-status": { en: "Server Status", bn: "সার্ভার স্ট্যাটাস" },
};


interface TopMenuChild {
  label: string;
  href: string;
  icon: typeof Server;
  badge?: number;
}

interface TopMenuItem {
  label: string;
  href: string;
  icon: typeof Server;
  hasDropdown?: boolean;
  children?: TopMenuChild[];
}

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTopMenu, setActiveTopMenu] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [domainCount, setDomainCount] = useState(0);
  const [unpaidInvoiceCount, setUnpaidInvoiceCount] = useState(0);
  const { user, profile, signOut } = useAuth();
  const { tr, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReseller, setIsReseller] = useState(false);
  const bn = lang === "bn";
  const dragX = useMotionValue(0);
  const sidebarX = useTransform(dragX, [0, -SIDEBAR_W], [0, -SIDEBAR_W]);
  const overlayOpacity = useTransform(dragX, [0, -SIDEBAR_W], [1, 0]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsReseller(false);
        return;
      }

      const [{ data: adminRole }, { data: resellerRole }, { data: resellerPackages }] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "reseller" }),
        supabase.from("reseller_packages").select("id").eq("user_id", user.id).limit(1),
      ]);

      setIsAdmin(!!adminRole);
      setIsReseller(!!resellerRole || !!(resellerPackages && resellerPackages.length > 0));
    };

    checkAccess();
  }, [user]);

  // Fetch wallet balance & service count
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: txns }, { count }, { count: dCount }, { count: invCount }] = await Promise.all([
        supabase.from("wallet_transactions").select("amount_bdt, type").eq("user_id", user.id).eq("status", "completed"),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("service_type", "domain"),
        supabase.from("invoices").select("id", { count: "exact", head: true }).eq("user_id", user.id).in("status", ["unpaid", "overdue"]),
      ]);
      if (txns) {
        const balance = txns.reduce((acc, t) => {
          return t.type === "deposit" || t.type === "refund"
            ? acc + Number(t.amount_bdt)
            : acc - Number(t.amount_bdt);
        }, 0);
        setWalletBalance(Math.max(0, balance));
      }
      setServiceCount(count || 0);
      setDomainCount(dCount || 0);
      setUnpaidInvoiceCount(invCount || 0);
    };
    fetchData();
  }, [user]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!showUserMenu && !activeTopMenu) return;
    const handle = () => { setShowUserMenu(false); setActiveTopMenu(null); };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [showUserMenu, activeTopMenu]);

  const topMenuItems: TopMenuItem[] = [
    {
      label: bn ? "সার্ভিস" : "Services",
      href: "/dashboard/services",
      icon: Server,
      hasDropdown: true,
      children: [
        { label: bn ? "আমার সকল সার্ভিস" : "My All Services", href: "/dashboard/services", icon: Server, badge: serviceCount },
        { label: bn ? "নতুন সার্ভিস অর্ডার" : "Order New Services", href: "/dashboard/order-service", icon: PlusCircle },
        { label: bn ? "এভেইলেবল অ্যাডঅন দেখুন" : "View Available Addons", href: "/dashboard/orders", icon: Package },
      ],
    },
    {
      label: bn ? "ডোমেইন" : "Domains",
      href: "/dashboard/domains",
      icon: Globe,
      hasDropdown: true,
      children: [
        { label: bn ? "আমার ডোমেইন লিস্ট" : "My Domain List", href: "/dashboard/domains", icon: ListOrdered, badge: domainCount },
        { label: bn ? "নতুন ডোমেইন রেজিস্টার" : "Register New Domain", href: "/dashboard/domain-tools?tab=register", icon: PlusCircle },
        { label: bn ? "ডোমেইন রিনিউ" : "Domain Renew", href: "/dashboard/domain-tools?tab=renew", icon: RefreshCw },
        { label: bn ? "ডোমেইন ট্রান্সফার" : "Transfer Domain", href: "/dashboard/domain-tools?tab=transfer", icon: ArrowRightLeft },
        { label: "WHOIS Lookup", href: "/dashboard/domain-tools?tab=whois", icon: Search },

      ],
    },
    {
      label: bn ? "বিলিং" : "Billing",
      href: "/dashboard/billing",
      icon: CreditCard,
      hasDropdown: true,
      children: [
        { label: bn ? "আমার ইনভয়েস" : "My Invoice", href: "/dashboard/billing", icon: FileText, badge: unpaidInvoiceCount },
        { label: bn ? "ম্যাস পেমেন্ট" : "Mass Payment", href: "/dashboard/billing", icon: Layers },
        { label: bn ? "ফান্ড যোগ করুন" : "Add Funds", href: "/dashboard/wallet", icon: PlusCircle },
        { label: bn ? "আয় ও পেমেন্ট" : "Income & Payments", href: "/dashboard/income", icon: DollarSign },
      ],
    },
    {
      label: bn ? "সাপোর্ট" : "Support",
      href: "/dashboard/support",
      icon: HeadphonesIcon,
      hasDropdown: true,
      children: [
        { label: bn ? "সাপোর্ট টিকেট খুলুন" : "Open Support Ticket", href: "/dashboard/support?new=1", icon: TicketPlus },
        { label: bn ? "আমার সাপোর্ট টিকেট" : "My Support Tickets", href: "/dashboard/support", icon: Ticket },
        { label: bn ? "সাপোর্ট পিন" : "Support PIN", href: "/dashboard/support-pin", icon: KeyIcon },
        { label: bn ? "নলেজবেস" : "Knowledgebase", href: "/dashboard/knowledge-base", icon: BookOpen },
        { label: bn ? "সার্ভার স্ট্যাটাস" : "Server Status", href: "/dashboard/server-status", icon: Activity },

      ],
    },
    {
      label: bn ? "অ্যাফিলিয়েট" : "Affiliate",
      href: "/dashboard/affiliate",
      icon: Share2,
      hasDropdown: true,
      children: [
        { label: bn ? "অ্যাফিলিয়েট ড্যাশবোর্ড" : "Affiliate Dashboard", href: "/dashboard/affiliate", icon: Users },
        { label: bn ? "রেফারেল লিংক" : "Referral Link", href: "/dashboard/affiliate", icon: Share2 },
        { label: bn ? "আমার কমিশন" : "My Commissions", href: "/dashboard/affiliate", icon: DollarSign },
        { label: bn ? "পেমেন্ট রিকোয়েস্ট" : "Payment Requests", href: "/dashboard/affiliate", icon: CreditCard },
        { label: bn ? "রেফারেল ক্লিক" : "Referral Clicks", href: "/dashboard/affiliate", icon: MousePointer },
        { label: bn ? "প্রোগ্রাম সম্পর্কে" : "About Program", href: "/affiliate", icon: BookOpen },
      ],
    },
  ];

  const sidebarItems = [
    { title: tr("dash.overview"), url: "/dashboard", icon: LayoutDashboard },
    { title: tr("dash.services"), url: "/dashboard/services", icon: Server },
    { title: bn ? "অর্ডার" : "Orders", url: "/dashboard/orders", icon: ShoppingBag },
    { title: tr("dash.billing"), url: "/dashboard/billing", icon: CreditCard },
    { title: bn ? "ওয়ালেট" : "Wallet", url: "/dashboard/wallet", icon: Wallet },
    { title: bn ? "আয় ও পেমেন্ট" : "Income", url: "/dashboard/income", icon: DollarSign },
    { title: tr("dash.support"), url: "/dashboard/support", icon: HeadphonesIcon },
    { title: tr("dash.domains"), url: "/dashboard/domains", icon: Globe },
    { title: bn ? "অ্যাফিলিয়েট" : "Affiliate", url: "/dashboard/affiliate", icon: Share2 },
    { title: bn ? "থিম বিক্রি" : "Sell Themes", url: "/dashboard/theme-seller", icon: Palette },
    { title: bn ? "সমস্যা নির্ণয়" : "Troubleshoot", url: "/dashboard/troubleshoot", icon: LifeBuoy },
    ...(isReseller ? [{ title: bn ? "রিসেলার" : "Reseller", url: "/dashboard/reseller", icon: Share2 }] : []),
  ];

  const bottomItems = [
    { title: tr("dash.profile"), url: "/dashboard/profile", icon: UserCircle },
  ];

  const [signOutOpen, setSignOutOpen] = useState(false);
  const handleSignOut = async () => { await signOut(); navigate("/"); };
  const currentBreadcrumb = breadcrumbMap[location.pathname];
  const currentPageTitle = sidebarItems.find(i =>
    i.url === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(i.url)
  )?.title || bottomItems.find(i => location.pathname.startsWith(i.url))?.title;

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -300) {
      setMobileOpen(false);
    }
    dragX.set(0);
  }, [dragX]);

  const [expandedSidebarMenu, setExpandedSidebarMenu] = useState<string | null>(null);

  const sidebarMenusWithSubs = [
    { key: "services", title: bn ? "সার্ভিস" : "Services", icon: Server, children: topMenuItems[0].children || [] },
    { key: "domains", title: bn ? "ডোমেইন" : "Domains", icon: Globe, children: topMenuItems[1].children || [] },
    { key: "billing", title: bn ? "বিলিং" : "Billing", icon: CreditCard, children: topMenuItems[2].children || [] },
    { key: "support", title: bn ? "সাপোর্ট" : "Support", icon: HeadphonesIcon, children: topMenuItems[3].children || [] },
  ];

  const SidebarInner = () => (
    <div className="flex flex-col h-full safe-top safe-bottom">
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
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 no-scrollbar overscroll-contain">
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.15em]">
            {bn ? "মেনু" : "Menu"}
          </p>
        )}
        <div className="space-y-0.5">
          {/* Overview */}
          <NavLink
            to="/dashboard"
            end
            className="group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
            activeClassName="!bg-primary/8 !text-primary font-semibold"
          >
            <LayoutDashboard className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{tr("dash.overview")}</span>}
          </NavLink>

          {/* Menus with accordion submenus */}
          {sidebarMenusWithSubs.map((menu) => (
            <div key={menu.key}>
              <button
                onClick={() => setExpandedSidebarMenu(expandedSidebarMenu === menu.key ? null : menu.key)}
                className={`w-full group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-[0.98] ${collapsed ? "justify-center px-2" : ""}`}
              >
                <menu.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1 text-left">{menu.title}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/60 transition-transform duration-200 ${expandedSidebarMenu === menu.key ? "rotate-180" : ""}`} />
                  </>
                )}
              </button>
              <AnimatePresence>
                {!collapsed && expandedSidebarMenu === menu.key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 pl-3 border-l-2 border-border/40 space-y-0.5 py-1">
                      {menu.children.map((child) => {
                        const Icon = child.icon;
                        return (
                          <Link
                            key={child.label}
                            to={child.href}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all"
                            onClick={() => setMobileOpen(false)}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{child.label}</span>
                            {child.badge !== undefined && child.badge > 0 && (
                              <span className="ml-auto text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-bold">{child.badge}</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {/* Orders */}
          <NavLink
            to="/dashboard/orders"
            className="group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
            activeClassName="!bg-primary/8 !text-primary font-semibold"
          >
            <ShoppingBag className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{bn ? "অর্ডার" : "Orders"}</span>}
          </NavLink>

          {/* Wallet */}
          <NavLink
            to="/dashboard/wallet"
            className="group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
            activeClassName="!bg-primary/8 !text-primary font-semibold"
          >
            <Wallet className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{bn ? "ওয়ালেট" : "Wallet"}</span>}
          </NavLink>

          {/* Affiliate */}
          <NavLink
            to="/dashboard/affiliate"
            className="group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
            activeClassName="!bg-primary/8 !text-primary font-semibold"
          >
            <Share2 className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{bn ? "অ্যাফিলিয়েট" : "Affiliate"}</span>}
          </NavLink>

          {/* Theme Seller */}
          <NavLink
            to="/dashboard/theme-seller"
            className="group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
            activeClassName="!bg-primary/8 !text-primary font-semibold"
          >
            <Palette className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{bn ? "থিম বিক্রি" : "Sell Themes"}</span>}
          </NavLink>

          {/* Troubleshoot */}
          <NavLink
            to="/dashboard/troubleshoot"
            className="group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
            activeClassName="!bg-primary/8 !text-primary font-semibold"
          >
            <LifeBuoy className="w-[18px] h-[18px] shrink-0" />
            {!collapsed && <span className="truncate">{bn ? "সমস্যা নির্ণয়" : "Troubleshoot"}</span>}
          </NavLink>

          {/* Reseller */}
          {isReseller && (
            <NavLink
              to="/dashboard/reseller"
              className="group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
              activeClassName="!bg-primary/8 !text-primary font-semibold"
            >
              <Share2 className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{bn ? "রিসেলার" : "Reseller"}</span>}
            </NavLink>
          )}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border/40 p-2.5 space-y-0.5 shrink-0">
        {bottomItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={`group flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-all active:scale-[0.98] ${collapsed ? "justify-center px-2" : ""}`}
            activeClassName="!bg-primary/8 !text-primary font-semibold"
          >
            <item.icon className="w-[17px] h-[17px] shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}

        {!collapsed && isAdmin && (
          <NavLink
            to="/admin"
            className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg text-[13px] font-medium text-amber-600 hover:bg-amber-500/8 transition-all active:scale-[0.98]"
            activeClassName=""
          >
            <Shield className="w-[17px] h-[17px] shrink-0" />
            <span>{tr("admin.panel")}</span>
          </NavLink>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== TOP MENUBAR ===== */}
      <div className="w-full glass-surface sticky top-0 z-40">
        <div className="flex items-center h-11 px-2 sm:px-4 lg:px-6 max-w-full">
          {/* Mobile hamburger (left) */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors shrink-0"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>

          {/* Menu items - visible on all screen sizes */}
          <div className="flex items-center gap-0 overflow-x-auto no-scrollbar flex-1 ml-1 lg:ml-0 lg:justify-end">
            {topMenuItems.map((item) => (
              <div
                key={item.label}
                className="relative flex items-center"
                onMouseEnter={() => {
                  if (window.innerWidth >= 1024 && item.hasDropdown) setActiveTopMenu(item.label);
                }}
                onMouseLeave={() => {
                  if (window.innerWidth >= 1024) setActiveTopMenu(null);
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.hasDropdown) {
                      setActiveTopMenu(activeTopMenu === item.label ? null : item.label);
                    } else {
                      navigate(item.href);
                    }
                  }}
                  className={`flex items-center gap-1 px-1.5 sm:px-3 lg:px-3.5 py-2 text-[11px] sm:text-[13px] font-medium whitespace-nowrap transition-all rounded-md ${
                    location.pathname === item.href || item.children?.some(c => location.pathname === c.href)
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground/75 hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{item.label}</span>
                  {item.hasDropdown && (
                    <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-200 ${activeTopMenu === item.label ? "rotate-180" : ""}`} />
                  )}
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {item.hasDropdown && activeTopMenu === item.label && item.children && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute top-full left-0 sm:left-auto sm:right-0 pt-1.5 z-50"
                    >
                      <div className="bg-card rounded-xl shadow-lg border border-border/60 py-1.5 min-w-[230px] overflow-hidden">
                        {/* Dropdown header */}
                        <div className="px-4 py-2 border-b border-border/40 mb-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                            {item.label}
                          </p>
                        </div>
                        {item.children.map((child) => {
                          const Icon = child.icon;
                          const isActive = location.pathname === child.href;
                          return (
                            <Link
                              key={child.label}
                              to={child.href}
                              className={`group flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                                isActive 
                                  ? "text-primary bg-primary/8" 
                                  : "text-foreground/80 hover:text-foreground hover:bg-muted/50"
                              }`}
                              onClick={() => setActiveTopMenu(null)}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isActive ? "bg-primary/15 text-primary" : "bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="flex-1">{child.label}</span>
                              {child.badge !== undefined && child.badge > 0 && (
                                <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shadow-xs">
                                  {child.badge}
                                </span>
                              )}
                              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-all ${isActive ? "text-primary/40" : ""}`} />
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Right: Wallet + Bell + User */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2">
            {/* Wallet Balance */}
            <Link
              to="/dashboard/wallet"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/15 transition-colors text-[12px] font-semibold whitespace-nowrap text-foreground border border-border"
            >
              <Wallet className="w-3.5 h-3.5 text-primary" />
              <span>TK {formatAmount(walletBalance, lang)} BDT</span>
            </Link>

            {/* Language Switch */}
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-[12px] font-semibold text-foreground border border-border"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{lang === "bn" ? "EN" : "বাং"}</span>
            </button>

            {/* Notification Bell */}
            <div className="[&_button]:text-foreground [&_button]:hover:bg-primary/10">
              <NotificationBell />
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                className="flex items-center gap-2 pl-2 ml-0.5 border-l border-border hover:bg-primary/10 rounded-r-lg pr-2 py-1 transition-colors"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-border shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile?.full_name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/15 flex items-center justify-center text-primary text-[11px] font-bold">
                      {(profile?.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="hidden md:block text-[12px] font-semibold whitespace-nowrap max-w-[120px] truncate text-foreground">
                  {profile?.full_name || "User"}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70 hidden md:block text-muted-foreground" />
              </button>

              {/* User Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-card text-card-foreground rounded-xl p-1.5 shadow-xl border border-border z-50"
                  >
                    <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Link to="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                      <LayoutDashboard className="w-4 h-4" /> {bn ? "ড্যাশবোর্ড" : "Dashboard"}
                    </Link>
                    <Link to="/dashboard/profile" className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                      <UserCircle className="w-4 h-4" /> {bn ? "প্রোফাইল" : "Profile"}
                    </Link>
                    <Link to="/dashboard/wallet" className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                      <Wallet className="w-4 h-4" />
                      <span className="flex-1">{bn ? "ওয়ালেট" : "Wallet"}</span>
                      <span className="text-xs font-semibold text-primary">TK {formatAmount(walletBalance, lang)}</span>
                    </Link>
                    <Link to="/dashboard/profile" className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                      <KeyRound className="w-4 h-4" /> {bn ? "পাসওয়ার্ড পরিবর্তন" : "Change Password"}
                    </Link>
                    <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors w-full">
                      <Globe className="w-4 h-4" /> {lang === "bn" ? "English" : "বাংলা"}
                    </button>
                    {isAdmin && (
                      <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-amber-600 hover:bg-amber-500/8 transition-colors">
                        <Shield className="w-4 h-4" /> {bn ? "অ্যাডমিন" : "Admin"}
                      </Link>
                    )}
                    <div className="border-t border-border/50 mt-1 pt-1">
                      <button onClick={() => { setShowUserMenu(false); setSignOutOpen(true); }} className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-lg text-sm text-destructive hover:bg-destructive/8 transition-colors w-full">
                        <LogOut className="w-4 h-4" /> {tr("dash.signOut")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BODY: Sidebar + Content ===== */}
      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-card border-r border-border/50 transition-all duration-300 ease-out sticky top-11 h-[calc(100vh-2.75rem)] z-20 ${
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
          {/* Sub-header with breadcrumb & collapse toggle */}
          <header className="h-11 flex items-center gap-2 px-3 sm:px-4 lg:px-6 border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-12 z-30 safe-left safe-right">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors"
            >
              {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            {/* Breadcrumb - desktop */}
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

            {/* Mobile Page Title */}
            <div className="sm:hidden flex-1 text-center">
              <span className="text-sm font-semibold text-foreground">
                {currentPageTitle || (bn ? "ড্যাশবোর্ড" : "Dashboard")}
              </span>
            </div>

            <div className="flex-1 hidden sm:block" />

            {/* Wallet badge - mobile */}
            <Link
              to="/dashboard/wallet"
              className="sm:hidden flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-[11px] font-semibold"
            >
              <Wallet className="w-3 h-3" />
              TK {formatAmount(walletBalance, lang)}
            </Link>

            <Link
              to="/"
              className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-lg hover:bg-secondary/50"
            >
              <Home className="w-3.5 h-3.5" />
              {bn ? "সাইট" : "Website"}
            </Link>
          </header>

          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto bg-background">
            <Outlet />
          </main>
        </div>
      </div>

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
      <LiveChatWidget />
    </div>
  );
};

export default DashboardLayout;
