import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, Star, Server, Globe, Shield, Zap, Clock, Headphones } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";

const brandCurve = [0.2, 0.8, 0.2, 1] as const;

interface ServicePlan {
  name: string;
  price: string;
  annual?: string;
  subtitle?: string;
  features: string[];
  highlighted?: boolean;
}

interface ServiceData {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: typeof Server;
  plans: ServicePlan[];
  highlights: { icon: typeof Zap; label: string; labelEn: string }[];
}

const servicesMap: Record<string, ServiceData> = {
  "basic-hosting": {
    title: "বেসিক ওয়েব হোস্টিং",
    titleEn: "Basic Web Hosting",
    description: "ছোট ওয়েবসাইট ও ব্লগের জন্য পারফেক্ট হোস্টিং সলিউশন। দ্রুত গতি, নির্ভরযোগ্য আপটাইম।",
    descriptionEn: "Perfect hosting solution for small websites and blogs. Fast speed, reliable uptime.",
    icon: Server,
    plans: [
      { name: "PH 1GB", price: "১৩০", annual: "১,২০০", features: ["Host 2 Domain", "1GB NVMe Storage", "Unlimited Bandwidth", "10 Sub Domain", "10 Email Accounts", "10 Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server", "cPanel Control Panel"] },
      { name: "PH 2GB", price: "১৮০", annual: "১,৮০০", features: ["Host 3 Domain", "2GB NVMe Storage", "Unlimited Bandwidth", "15 Sub Domain", "15 Email Accounts", "15 Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server", "cPanel Control Panel"], highlighted: true },
      { name: "PH 5GB", price: "২৫০", annual: "২,৫০০", features: ["Host 5 Domain", "5GB NVMe Storage", "Unlimited Bandwidth", "20 Sub Domain", "20 Email Accounts", "20 Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server", "cPanel Control Panel"] },
    ],
    highlights: [
      { icon: Zap, label: "LiteSpeed সার্ভার", labelEn: "LiteSpeed Server" },
      { icon: Shield, label: "ফ্রি SSL", labelEn: "Free SSL" },
      { icon: Clock, label: "৯৯.৯% আপটাইম", labelEn: "99.9% Uptime" },
      { icon: Headphones, label: "২৪/৭ সাপোর্ট", labelEn: "24/7 Support" },
    ],
  },
  "pro-hosting": {
    title: "প্রো ওয়েব হোস্টিং",
    titleEn: "Pro Web Hosting",
    description: "প্রফেশনাল ওয়েবসাইট ও ই-কমার্স স্টোরের জন্য শক্তিশালী হোস্টিং। সিঙ্গাপুর লোকেশন সার্ভার।",
    descriptionEn: "Powerful hosting for professional websites and e-commerce stores. Singapore location server.",
    icon: Server,
    plans: [
      { name: "PRO 5GB", price: "২০০", annual: "২,২০০", features: ["Host 5 Domain", "5GB NVMe Storage", "Unlimited Bandwidth", "30 Email Accounts", "30 Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server", "Singapore Location Server", "cPanel Control Panel"], highlighted: true },
      { name: "PRO 10GB", price: "৩৫০", annual: "৩,৮০০", features: ["Host 10 Domain", "10GB NVMe Storage", "Unlimited Bandwidth", "50 Email Accounts", "50 Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server", "Singapore Location Server", "cPanel Control Panel"] },
      { name: "PRO 20GB", price: "৫০০", annual: "৫,৫০০", features: ["Host 15 Domain", "20GB NVMe Storage", "Unlimited Bandwidth", "Unlimited Email", "Unlimited Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server", "Singapore Location Server", "cPanel Control Panel"] },
    ],
    highlights: [
      { icon: Globe, label: "সিঙ্গাপুর সার্ভার", labelEn: "Singapore Server" },
      { icon: Zap, label: "NVMe SSD", labelEn: "NVMe SSD" },
      { icon: Shield, label: "ফ্রি SSL", labelEn: "Free SSL" },
      { icon: Headphones, label: "২৪/৭ সাপোর্ট", labelEn: "24/7 Support" },
    ],
  },
  "premium-hosting": {
    title: "প্রিমিয়াম হোস্টিং",
    titleEn: "Premium Hosting",
    description: "সর্বোচ্চ পারফরম্যান্স ও নিরাপত্তা সহ এন্টারপ্রাইজ গ্রেড হোস্টিং সলিউশন। SSH অ্যাক্সেস।",
    descriptionEn: "Enterprise-grade hosting solution with maximum performance and security. SSH access included.",
    icon: Server,
    plans: [
      { name: "Premium 5", price: "৫০০", annual: "৫,৫০০", features: ["10 Website Hosted", "5GB NVMe Storage", "Unlimited Bandwidth", "20 Email Accounts", "20 Sub Domain", "Unlimited Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "Shell (SSH) Access", "cPanel Control Panel"], highlighted: true },
      { name: "Premium 10", price: "৮০০", annual: "৮,৫০০", features: ["15 Website Hosted", "10GB NVMe Storage", "Unlimited Bandwidth", "30 Email Accounts", "30 Sub Domain", "Unlimited Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "Shell (SSH) Access", "cPanel Control Panel"] },
      { name: "Premium 20", price: "১,২০০", annual: "১৩,০০০", features: ["20 Website Hosted", "20GB NVMe Storage", "Unlimited Bandwidth", "Unlimited Email", "Unlimited Sub Domain", "Unlimited Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "Shell (SSH) Access", "cPanel Control Panel"] },
    ],
    highlights: [
      { icon: Zap, label: "SSH অ্যাক্সেস", labelEn: "SSH Access" },
      { icon: Shield, label: "এন্টারপ্রাইজ সিকিউরিটি", labelEn: "Enterprise Security" },
      { icon: Clock, label: "৯৯.৯% আপটাইম", labelEn: "99.9% Uptime" },
      { icon: Headphones, label: "প্রায়োরিটি সাপোর্ট", labelEn: "Priority Support" },
    ],
  },
  "bdix-hosting": {
    title: "বিডিআইএক্স হোস্টিং",
    titleEn: "BDIX Hosting",
    description: "বাংলাদেশের সবচেয়ে দ্রুত BDIX হোস্টিং সার্ভিস। লোকাল কনটেন্ট ডেলিভারির জন্য সেরা।",
    descriptionEn: "Bangladesh's fastest BDIX hosting service. Best for local content delivery.",
    icon: Globe,
    plans: [
      { name: "BDIX 2GB", price: "১৫০", annual: "১,৫০০", features: ["Host 2 Domain", "2GB NVMe Storage", "500 GB Bandwidth", "10 Email Accounts", "10 Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server", "BDIX Location Server", "cPanel Control Panel"] },
      { name: "BDIX 5GB", price: "২৫০", annual: "২,৫০০", features: ["Host 5 Domain", "5GB NVMe Storage", "1TB Bandwidth", "20 Email Accounts", "20 Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server", "BDIX Location Server", "cPanel Control Panel"], highlighted: true },
      { name: "BDIX 10GB", price: "৪০০", annual: "৪,০০০", features: ["Host 10 Domain", "10GB NVMe Storage", "2TB Bandwidth", "30 Email Accounts", "30 Databases", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server", "BDIX Location Server", "cPanel Control Panel"] },
    ],
    highlights: [
      { icon: Zap, label: "BDIX স্পিড", labelEn: "BDIX Speed" },
      { icon: Globe, label: "BD লোকেশন", labelEn: "BD Location" },
      { icon: Shield, label: "ফ্রি SSL", labelEn: "Free SSL" },
      { icon: Headphones, label: "বাংলা সাপোর্ট", labelEn: "Bangla Support" },
    ],
  },
  "linux-reseller": {
    title: "লিনাক্স রিসেলার হোস্টিং",
    titleEn: "Linux Reseller Hosting",
    description: "আপনার নিজস্ব হোস্টিং ব্যবসা শুরু করুন। WHM কন্ট্রোল প্যানেল সহ সম্পূর্ণ রিসেলার প্যাকেজ।",
    descriptionEn: "Start your own hosting business. Complete reseller package with WHM control panel.",
    icon: Server,
    plans: [
      { name: "RH Linux 10", price: "১,৩০০", features: ["10 cPanel Accounts", "10GB SSD Storage", "Unlimited Bandwidth", "cPanel / WHM Access", "Daily Remote Backups", "1-Click App Installs", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server"] },
      { name: "RH Linux 30", price: "২,৪৯৯", features: ["30 cPanel Accounts", "100GB SSD Storage", "Unlimited Bandwidth", "cPanel / WHM Access", "Daily Remote Backups", "1-Click App Installs", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server"], highlighted: true },
      { name: "RH Linux 50", price: "৩,২৯৯", subtitle: "50% OFF — COUPON: RH50", features: ["50 cPanel Accounts", "200GB SSD Storage", "Unlimited Bandwidth", "cPanel / WHM Access", "Daily Remote Backups", "1-Click App Installs", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server"] },
    ],
    highlights: [
      { icon: Server, label: "WHM অ্যাক্সেস", labelEn: "WHM Access" },
      { icon: Shield, label: "হোয়াইট লেবেল", labelEn: "White Label" },
      { icon: Zap, label: "LiteSpeed", labelEn: "LiteSpeed" },
      { icon: Headphones, label: "২৪/৭ সাপোর্ট", labelEn: "24/7 Support" },
    ],
  },
  "bdix-reseller": {
    title: "বিডিআইএক্স রিসেলার হোস্টিং",
    titleEn: "BDIX Reseller Hosting",
    description: "BDIX লোকেশনে রিসেলার হোস্টিং। বাংলাদেশে দ্রুত গতির হোস্টিং ব্যবসা শুরু করুন।",
    descriptionEn: "Reseller hosting at BDIX location. Start a fast hosting business in Bangladesh.",
    icon: Globe,
    plans: [
      { name: "BDIX RH 10", price: "১,০৯৯", features: ["10 cPanel Accounts", "10GB NVMe Storage", "300 GB Bandwidth", "cPanel / WHM Access", "Daily Remote Backups", "1-Click App Installs", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server"] },
      { name: "BDIX RH 20", price: "১,৪৯৯", features: ["20 cPanel Accounts", "20GB NVMe Storage", "500 GB Bandwidth", "cPanel / WHM Access", "Daily Remote Backups", "1-Click App Installs", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server"], highlighted: true },
      { name: "BDIX RH 50", price: "২,৯৯৯", features: ["50 cPanel Accounts", "50GB NVMe Storage", "1TB Bandwidth", "cPanel / WHM Access", "Daily Remote Backups", "1-Click App Installs", "Ruby, Python, NodeJS", "Free SSL Certificate", "LiteSpeed Web Server"] },
    ],
    highlights: [
      { icon: Zap, label: "BDIX স্পিড", labelEn: "BDIX Speed" },
      { icon: Server, label: "WHM অ্যাক্সেস", labelEn: "WHM Access" },
      { icon: Shield, label: "ফ্রি SSL", labelEn: "Free SSL" },
      { icon: Globe, label: "BD লোকেশন", labelEn: "BD Location" },
    ],
  },
  "usa-vps": {
    title: "USA VPS সার্ভার",
    titleEn: "USA VPS Server",
    description: "আমেরিকার ডেটাসেন্টারে শক্তিশালী VPS সার্ভার। ফুল রুট অ্যাক্সেস, KVM ভার্চুয়ালাইজেশন।",
    descriptionEn: "Powerful VPS server in US datacenter. Full root access, KVM virtualization.",
    icon: Server,
    plans: [
      { name: "USA VPS 1", price: "৭৫০", features: ["1 CPU Core", "2 GB RAM", "25GB SSD Disk", "1TB Bandwidth", "1 Dedicated IP", "Full Root Access", "KVM Virtualization", "CentOS / Ubuntu / AlmaLinux"] },
      { name: "USA VPS 2", price: "১,৩০০", features: ["2 CPU Cores", "4 GB RAM", "50GB SSD Disk", "2TB Bandwidth", "1 Dedicated IP", "Full Root Access", "KVM Virtualization", "CentOS / Ubuntu / AlmaLinux"], highlighted: true },
      { name: "USA VPS 4", price: "২,৫০০", features: ["4 CPU Cores", "8 GB RAM", "100GB SSD Disk", "4TB Bandwidth", "1 Dedicated IP", "Full Root Access", "KVM Virtualization", "CentOS / Ubuntu / AlmaLinux"] },
    ],
    highlights: [
      { icon: Globe, label: "USA লোকেশন", labelEn: "USA Location" },
      { icon: Zap, label: "KVM ভার্চুয়ালাইজেশন", labelEn: "KVM Virtualization" },
      { icon: Shield, label: "রুট অ্যাক্সেস", labelEn: "Root Access" },
      { icon: Clock, label: "তাৎক্ষণিক সেটআপ", labelEn: "Instant Setup" },
    ],
  },
  "bdix-vps": {
    title: "BDIX VPS সার্ভার",
    titleEn: "BDIX VPS Server",
    description: "বাংলাদেশ BDIX লোকেশনে দ্রুতগতির VPS সার্ভার। লোকাল ট্রাফিকের জন্য সেরা পারফরম্যান্স।",
    descriptionEn: "High-speed VPS server at Bangladesh BDIX location. Best performance for local traffic.",
    icon: Globe,
    plans: [
      { name: "BDIX VPS 1", price: "৯৯৯", features: ["1 CPU Core", "1 GB RAM", "20GB NVMe Disk", "500 GB Bandwidth", "1 Dedicated IP", "Full Root Access", "KVM Virtualization", "CentOS / Ubuntu / AlmaLinux"], highlighted: true },
      { name: "BDIX VPS 2", price: "১,৮০০", features: ["2 CPU Cores", "2 GB RAM", "40GB NVMe Disk", "1TB Bandwidth", "1 Dedicated IP", "Full Root Access", "KVM Virtualization", "CentOS / Ubuntu / AlmaLinux"] },
      { name: "BDIX VPS 4", price: "৩,৫০০", features: ["4 CPU Cores", "4 GB RAM", "80GB NVMe Disk", "2TB Bandwidth", "1 Dedicated IP", "Full Root Access", "KVM Virtualization", "CentOS / Ubuntu / AlmaLinux"] },
    ],
    highlights: [
      { icon: Zap, label: "BDIX স্পিড", labelEn: "BDIX Speed" },
      { icon: Globe, label: "BD লোকেশন", labelEn: "BD Location" },
      { icon: Shield, label: "NVMe SSD", labelEn: "NVMe SSD" },
      { icon: Headphones, label: "বাংলা সাপোর্ট", labelEn: "Bangla Support" },
    ],
  },
  "dedicated": {
    title: "ডেডিকেটেড সার্ভার",
    titleEn: "Dedicated Server",
    description: "সম্পূর্ণ ডেডিকেটেড সার্ভার — সর্বোচ্চ পারফরম্যান্স, সিকিউরিটি ও কন্ট্রোল।",
    descriptionEn: "Fully dedicated servers — maximum performance, security and control.",
    icon: Server,
    plans: [
      { name: "AMD Ryzen 5600X", price: "১১,৯০০", features: ["6 Cores 3.40 GHz", "64GB DDR3 ECC", "512GB NVMe PCIe 4.0", "1Gbps Port", "1 IP Address", "Fully Managed Service", "Powerful Hardware", "24/7 Customer Support"], highlighted: true },
      { name: "Intel Xeon E-2236", price: "১৫,৯০০", features: ["6 Cores 3.40 GHz", "64GB DDR4 ECC", "1TB NVMe PCIe 4.0", "1Gbps Port", "2 IP Addresses", "Fully Managed Service", "RAID Configuration", "24/7 Customer Support"] },
      { name: "Dual Xeon E5-2680v4", price: "২৫,০০০", features: ["28 Cores 2.40 GHz", "128GB DDR4 ECC", "2x 1TB NVMe SSD", "10Gbps Port", "5 IP Addresses", "Fully Managed Service", "Hardware RAID", "24/7 Priority Support"] },
    ],
    highlights: [
      { icon: Server, label: "ডেডিকেটেড রিসোর্স", labelEn: "Dedicated Resources" },
      { icon: Shield, label: "ম্যানেজড সার্ভিস", labelEn: "Managed Service" },
      { icon: Zap, label: "১ Gbps+ পোর্ট", labelEn: "1 Gbps+ Port" },
      { icon: Headphones, label: "প্রায়োরিটি সাপোর্ট", labelEn: "Priority Support" },
    ],
  },
  "email-hosting": {
    title: "ইমেইল হোস্টিং",
    titleEn: "Email Hosting",
    description: "প্রফেশনাল ইমেইল হোস্টিং সার্ভিস। আপনার ডোমেইন দিয়ে ইমেইল ব্যবহার করুন।",
    descriptionEn: "Professional email hosting service. Use email with your own domain.",
    icon: Globe,
    plans: [
      { name: "Workspace 30GB", price: "৭৯৯", features: ["Up To 5 Email Accounts", "30GB Mail Storage", "CrossBox Suite Panel", "250 Email Per Hour", "IMAP, SMTP, POP Support", "MailChannels SPAM Protection"] },
      { name: "Workspace 100GB", price: "১,২৫০", features: ["Up To 10 Email Accounts", "100GB Mail Storage", "CrossBox Suite Panel", "250 Email Per Hour", "IMAP, SMTP, POP Support", "MailChannels SPAM Protection"], highlighted: true },
      { name: "Workspace 250GB", price: "১,৭৯৯", features: ["Up To 25 Email Accounts", "250GB Mail Storage", "CrossBox Suite Panel", "250 Email Per Hour", "IMAP, SMTP, POP Support", "MailChannels SPAM Protection"] },
    ],
    highlights: [
      { icon: Shield, label: "SPAM প্রটেকশন", labelEn: "SPAM Protection" },
      { icon: Globe, label: "কাস্টম ডোমেইন", labelEn: "Custom Domain" },
      { icon: Zap, label: "IMAP/SMTP/POP", labelEn: "IMAP/SMTP/POP" },
      { icon: Headphones, label: "২৪/৭ সাপোর্ট", labelEn: "24/7 Support" },
    ],
  },
  "radio-hosting": {
    title: "রেডিও হোস্টিং",
    titleEn: "Radio Hosting",
    description: "আপনার নিজস্ব অনলাইন রেডিও স্টেশন চালু করুন। SHOUTcast ও Icecast সাপোর্ট।",
    descriptionEn: "Launch your own online radio station. SHOUTcast and Icecast support.",
    icon: Globe,
    plans: [
      { name: "Radio Basic", price: "৫০০", features: ["50 Listeners", "128 Kbps Quality", "Unlimited Bandwidth", "SHOUTcast Panel", "Auto DJ", "24/7 Streaming", "Custom Mount Points", "SSL Support"] },
      { name: "Radio Pro", price: "৯৯৯", features: ["200 Listeners", "256 Kbps Quality", "Unlimited Bandwidth", "SHOUTcast / Icecast", "Auto DJ + Scheduler", "24/7 Streaming", "Custom Mount Points", "SSL Support"], highlighted: true },
      { name: "Radio Premium", price: "১,৯৯৯", features: ["500 Listeners", "320 Kbps Quality", "Unlimited Bandwidth", "SHOUTcast / Icecast", "Auto DJ + Scheduler", "24/7 Streaming", "Multiple Mount Points", "Dedicated Resources"] },
    ],
    highlights: [
      { icon: Zap, label: "২৪/৭ স্ট্রিমিং", labelEn: "24/7 Streaming" },
      { icon: Globe, label: "Auto DJ", labelEn: "Auto DJ" },
      { icon: Shield, label: "SSL সাপোর্ট", labelEn: "SSL Support" },
      { icon: Headphones, label: "টেক সাপোর্ট", labelEn: "Tech Support" },
    ],
  },
  "graphics-design": {
    title: "গ্রাফিক্স ডিজাইন",
    titleEn: "Graphics Design",
    description: "প্রফেশনাল গ্রাফিক্স ডিজাইন সার্ভিস। লোগো, ব্যানার, সোশ্যাল মিডিয়া পোস্ট ডিজাইন।",
    descriptionEn: "Professional graphics design service. Logo, banner, social media post design.",
    icon: Globe,
    plans: [
      { name: "Logo Design", price: "২,০০০", features: ["3 Concepts", "Unlimited Revisions", "Source File (AI/PSD)", "High Resolution", "Transparent PNG", "Brand Guidelines", "Social Media Kit", "24-48 Hours Delivery"] },
      { name: "Full Branding", price: "৫,০০০", features: ["Logo Design", "Business Card", "Letterhead", "Social Media Cover", "Email Signature", "Brand Color Palette", "Typography Guide", "All Source Files"], highlighted: true },
      { name: "Web Design", price: "১০,০০০", features: ["Custom UI/UX Design", "Responsive Layout", "Up to 10 Pages", "Figma/XD File", "Icon Set", "Image Optimization", "Style Guide", "Revision Support"] },
    ],
    highlights: [
      { icon: Zap, label: "দ্রুত ডেলিভারি", labelEn: "Fast Delivery" },
      { icon: Shield, label: "সোর্স ফাইল", labelEn: "Source Files" },
      { icon: Globe, label: "আনলিমিটেড রিভিশন", labelEn: "Unlimited Revisions" },
      { icon: Headphones, label: "ডেডিকেটেড ডিজাইনার", labelEn: "Dedicated Designer" },
    ],
  },
  "domain": {
    title: "ডোমেইন রেজিস্ট্রেশন",
    titleEn: "Domain Registration",
    description: "আপনার পছন্দের ডোমেইন নেম রেজিস্টার করুন। .com, .net, .org, .xyz, .com.bd সহ সকল এক্সটেনশন।",
    descriptionEn: "Register your preferred domain name. All extensions including .com, .net, .org, .xyz, .com.bd.",
    icon: Globe,
    plans: [
      { name: ".com Domain", price: "১,১৫০", features: ["1 Year Registration", "Free DNS Management", "Free WHOIS Privacy", "Domain Forwarding", "Email Forwarding", "Domain Lock", "Transfer Support", "24/7 Support"] },
      { name: ".com.bd Domain", price: "১,৫০০", features: ["2 Year Registration", "Free DNS Management", "Bangladesh TLD", "Domain Forwarding", "Email Forwarding", "BTCL Approved", "Transfer Support", "24/7 Support"], highlighted: true },
      { name: ".xyz / .online", price: "৩৫০", features: ["1 Year Registration", "Free DNS Management", "Free WHOIS Privacy", "Domain Forwarding", "Email Forwarding", "Domain Lock", "Budget Friendly", "24/7 Support"] },
    ],
    highlights: [
      { icon: Globe, label: "সকল এক্সটেনশন", labelEn: "All Extensions" },
      { icon: Shield, label: "WHOIS প্রাইভেসি", labelEn: "WHOIS Privacy" },
      { icon: Zap, label: "তাৎক্ষণিক অ্যাক্টিভেশন", labelEn: "Instant Activation" },
      { icon: Headphones, label: "ট্রান্সফার সাপোর্ট", labelEn: "Transfer Support" },
    ],
  },
};

const ServiceDetail = () => {
  const { slug } = useParams();
  const { lang, tr } = useLanguage();
  const service = servicesMap[slug || ""];

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">পেইজ পাওয়া যায়নি</h1>
          <Link to="/" className="text-primary hover:underline">হোমপেইজে ফিরুন</Link>
        </div>
        <FooterSection />
      </div>
    );
  }

  const isBn = lang === "bn";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: brandCurve }}
            className="text-center max-w-3xl mx-auto"
          >
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> {isBn ? "হোমপেইজ" : "Home"}
            </Link>
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-primary/10">
                <service.icon className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-foreground">
              {isBn ? service.title : service.titleEn}
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              {isBn ? service.description : service.descriptionEn}
            </p>
          </motion.div>

          {/* Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4 mt-10"
          >
            {service.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card text-sm">
                <h.icon className="w-4 h-4 text-primary" />
                <span className="text-foreground font-medium">{isBn ? h.label : h.labelEn}</span>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Plans */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {service.plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative rounded-2xl overflow-hidden ${plan.highlighted ? "glass-card-elevated glow-border" : "glass-card"}`}
              >
                {plan.highlighted && <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />}
                {plan.highlighted && (
                  <div className="absolute -top-0 right-4 flex items-center gap-1 px-3 py-1.5 gradient-primary text-primary-foreground text-xs font-bold rounded-b-lg">
                    <Star className="w-3 h-3 fill-current" /> {tr("pricing.popular")}
                  </div>
                )}
                <div className="p-8">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{plan.name}</h3>
                  {plan.subtitle && <p className="text-xs text-muted-foreground mt-1">{plan.subtitle}</p>}
                  <div className="flex items-baseline gap-1 my-4">
                    <span className="text-4xl md:text-5xl font-extrabold tabular-nums text-foreground">৳{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{tr("pricing.mo")}</span>
                  </div>
                  {plan.annual && (
                    <p className="text-xs text-muted-foreground mb-4">৳{plan.annual} {tr("pricing.billedAnnually")}</p>
                  )}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/signup"
                    className={`w-full py-3.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                      plan.highlighted
                        ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
                        : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    }`}
                  >
                    {tr("pricing.orderNow")}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      <FooterSection />
    </div>
  );
};

export default ServiceDetail;
