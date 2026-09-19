import { Outlet, useNavigate, useLocation, Link } from "@/lib/router-compat";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, ChevronDown, ChevronRight, CircleUserRound, Globe, Headphones, History, LayoutDashboard, LogOut, Menu, MessageCircle, PanelLeft, PanelLeftClose, Phone, ShoppingCart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import logoWhite from "@/assets/logo-white.png";

const groups = [
  { key: "operations", icon: BarChart3, items: [{ key: "overview", url: "/call-center", icon: LayoutDashboard }] },
  { key: "care", icon: Headphones, items: [{ key: "chat", url: "/call-center/live-chat", icon: MessageCircle }, { key: "tickets", url: "/call-center/tickets", icon: Headphones }, { key: "calls", url: "/call-center/call-history", icon: History }] },
  { key: "sales", icon: ShoppingCart, items: [{ key: "orders", url: "/call-center/orders", icon: ShoppingCart }] },
];

const labels: Record<string, { en: string; bn: string }> = {
  operations: { en: "Operations", bn: "অপারেশনস" }, care: { en: "Customer Care", bn: "গ্রাহক সেবা" }, sales: { en: "Sales", bn: "সেলস" },
  overview: { en: "Overview", bn: "সারসংক্ষেপ" }, chat: { en: "Live Conversations", bn: "লাইভ কথোপকথন" }, tickets: { en: "Support Tickets", bn: "সাপোর্ট টিকেট" }, calls: { en: "Call History", bn: "কল হিস্ট্রি" }, orders: { en: "Orders & Sales", bn: "অর্ডার ও সেলস" },
};

const CallCenterLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const bn = lang === "bn";
  const label = (key: string) => labels[key]?.[bn ? "bn" : "en"] || key;
  const current = groups.flatMap((group) => group.items).find((item) => item.url === "/call-center" ? location.pathname === "/call-center" : location.pathname.startsWith(item.url));
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const handleSignOut = async () => { await signOut(); navigate("/admin-login"); };

  const Sidebar = () => <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
    <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">{collapsed ? <Headphones className="mx-auto size-5" /> : <Link to="/" className="flex items-center gap-3"><img src={logoWhite} alt="Yess Host" className="h-7" /><span className="rounded border border-sidebar-border bg-sidebar-accent px-2 py-1 text-[10px] font-bold uppercase">Staff</span></Link>}</div>
    <nav className="flex-1 overflow-y-auto px-2 py-4">{groups.map((group) => <div key={group.key} className="mb-5">{!collapsed && <p className="mb-1.5 px-3 text-[10px] font-bold uppercase text-sidebar-foreground/50">{label(group.key)}</p>}<div className="space-y-1">{group.items.map((item) => <NavLink key={item.url} to={item.url} end={item.url === "/call-center"} className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${collapsed ? "justify-center" : ""}`} activeClassName="!bg-sidebar-accent !text-sidebar-accent-foreground font-semibold"><item.icon className="size-[18px] shrink-0" />{!collapsed && <span>{label(item.key)}</span>}</NavLink>)}</div></div>)}</nav>
    {!collapsed && <div className="border-t border-sidebar-border p-3"><div className="flex items-center gap-2 rounded-md bg-sidebar-accent/60 px-3 py-2"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" /><span className="relative inline-flex size-2 rounded-full bg-success" /></span><div><p className="text-xs font-semibold">{bn ? "এজেন্ট অনলাইন" : "Agent available"}</p><p className="text-[10px] text-sidebar-foreground/60">{bn ? "কল ও চ্যাট গ্রহণে প্রস্তুত" : "Ready for calls and chats"}</p></div></div></div>}
  </div>;

  return <div className="staff-console min-h-screen bg-background">
    <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-200 lg:block ${collapsed ? "w-16" : "w-64"}`}><Sidebar /></aside>
    <AnimatePresence>{mobileOpen && <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-foreground/55 lg:hidden" onClick={() => setMobileOpen(false)} /><motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden"><Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10 text-sidebar-foreground" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></Button><Sidebar /></motion.aside></>}</AnimatePresence>
    <div className={`flex min-h-screen flex-col transition-[margin] duration-200 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border bg-card px-3 sm:px-5"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></Button><Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle sidebar">{collapsed ? <PanelLeft /> : <PanelLeftClose />}</Button><div className="hidden items-center gap-2 text-xs sm:flex"><Link to="/call-center" className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><Phone className="size-3" />{bn ? "স্টাফ কনসোল" : "Staff Console"}</Link>{current && current.url !== "/call-center" && <><ChevronRight className="size-3 text-muted-foreground" /><span className="font-semibold text-foreground">{label(current.key)}</span></>}</div><p className="min-w-0 flex-1 truncate text-center text-sm font-semibold sm:hidden">{current ? label(current.key) : label("overview")}</p><div className="ml-auto flex items-center gap-1"><Button variant="ghost" onClick={() => setLang(bn ? "en" : "bn")}><Globe />{bn ? "EN" : "বাং"}</Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{(profile?.full_name || "A").charAt(0).toUpperCase()}</span><span className="hidden max-w-32 truncate sm:block">{profile?.full_name || "Agent"}</span><ChevronDown className="size-3" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel><p>{profile?.full_name || "Agent"}</p><p className="text-xs font-normal text-muted-foreground">{bn ? "স্টাফ অ্যাকাউন্ট" : "Staff account"}</p></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem disabled><CircleUserRound />{bn ? "প্রোফাইল" : "Profile"}</DropdownMenuItem><DropdownMenuItem onClick={handleSignOut} className="text-destructive"><LogOut />{bn ? "সাইন আউট" : "Sign out"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></header>
      <main id="main-content" className="flex-1 p-3 sm:p-5 lg:p-6"><Outlet /></main>
      <footer className="flex min-h-8 flex-wrap items-center justify-between gap-2 bg-sidebar px-4 py-2 text-[10px] text-sidebar-foreground/70"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" />{bn ? "সিস্টেম সচল" : "Systems operational"}</span><span>Yess Host Enterprise Staff Console</span></footer>
    </div>
  </div>;
};

export default CallCenterLayout;