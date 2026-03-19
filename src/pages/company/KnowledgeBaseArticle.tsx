import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Clock, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import PublicLayout from "@/components/PublicLayout";
import SEOHead from "@/components/SEOHead";

// Full article content database
const articlesData: Record<string, { bn: string; en: string; categoryBn: string; categoryEn: string; contentBn: string; contentEn: string }> = {
  "upload-website-using-cpanel": {
    bn: "cPanel ব্যবহার করে ওয়েবসাইট আপলোড করুন",
    en: "Upload website using cPanel",
    categoryBn: "হোস্টিং গাইড", categoryEn: "Hosting Guide",
    contentBn: `## cPanel দিয়ে ওয়েবসাইট আপলোড

### ধাপ ১: cPanel এ লগইন
আপনার হোস্টিং অ্যাকাউন্টের cPanel এ লগইন করুন। সাধারণত URL হবে: \`yourdomain.com/cpanel\` অথবা \`yourdomain.com:2083\`

### ধাপ ২: File Manager ওপেন করুন
cPanel ড্যাশবোর্ড থেকে **File Manager** অপশনে ক্লিক করুন।

### ধাপ ৩: public_html ফোল্ডারে যান
বাম দিকের ট্রি থেকে \`public_html\` ফোল্ডারে নেভিগেট করুন। এটিই আপনার ওয়েবসাইটের রুট ডিরেক্টরি।

### ধাপ ৪: ফাইল আপলোড করুন
উপরের টুলবারে **Upload** বাটনে ক্লিক করুন। আপনার কম্পিউটার থেকে ওয়েবসাইটের ফাইলগুলো সিলেক্ট করে আপলোড করুন।

### ধাপ ৫: জিপ ফাইল এক্সট্রাক্ট করুন
যদি আপনি জিপ ফাইল আপলোড করেন, তাহলে ফাইলটিতে রাইট ক্লিক করে **Extract** অপশন সিলেক্ট করুন।

> **টিপস:** সবসময় ব্যাকআপ রাখুন এবং আপলোডের আগে ফাইল সাইজ চেক করুন।`,
    contentEn: `## Upload Website via cPanel

### Step 1: Login to cPanel
Login to your hosting account's cPanel. The URL is usually: \`yourdomain.com/cpanel\` or \`yourdomain.com:2083\`

### Step 2: Open File Manager
Click on **File Manager** from the cPanel dashboard.

### Step 3: Navigate to public_html
Navigate to the \`public_html\` folder from the left tree. This is your website's root directory.

### Step 4: Upload Files
Click the **Upload** button in the top toolbar. Select and upload your website files from your computer.

### Step 5: Extract Zip Files
If you uploaded a zip file, right-click on it and select **Extract**.

> **Tips:** Always keep backups and check file sizes before uploading.`,
  },
  "upload-files-via-ftp": {
    bn: "FTP দিয়ে ফাইল আপলোড করুন", en: "Upload files via FTP",
    categoryBn: "হোস্টিং গাইড", categoryEn: "Hosting Guide",
    contentBn: `## FTP দিয়ে ফাইল আপলোড

### ধাপ ১: FTP ক্লায়েন্ট ইনস্টল করুন
FileZilla বা অন্য কোনো FTP ক্লায়েন্ট ডাউনলোড ও ইনস্টল করুন।

### ধাপ ২: FTP ক্রেডেনশিয়াল সংগ্রহ করুন
cPanel থেকে আপনার FTP হোস্ট, ইউজারনেম এবং পাসওয়ার্ড সংগ্রহ করুন।

### ধাপ ৩: সার্ভারে কানেক্ট করুন
FileZilla তে হোস্ট, ইউজারনেম, পাসওয়ার্ড এবং পোর্ট (21) দিয়ে কানেক্ট করুন।

### ধাপ ৪: ফাইল ট্রান্সফার করুন
বাম দিক থেকে লোকাল ফাইল সিলেক্ট করে ডান দিকে (সার্ভার) ড্র্যাগ করুন।`,
    contentEn: `## Upload Files via FTP

### Step 1: Install FTP Client
Download and install FileZilla or any other FTP client.

### Step 2: Get FTP Credentials
Get your FTP host, username and password from cPanel.

### Step 3: Connect to Server
Enter host, username, password and port (21) in FileZilla to connect.

### Step 4: Transfer Files
Select local files from the left panel and drag them to the right (server) panel.`,
  },
  "change-php-version": {
    bn: "PHP ভার্সন পরিবর্তন করুন", en: "Change PHP version",
    categoryBn: "হোস্টিং গাইড", categoryEn: "Hosting Guide",
    contentBn: `## PHP ভার্সন পরিবর্তন

### ধাপ ১: cPanel এ লগইন করুন
আপনার cPanel ড্যাশবোর্ডে লগইন করুন।

### ধাপ ২: MultiPHP Manager খুঁজুন
সার্চ বারে "MultiPHP" লিখে **MultiPHP Manager** অপশনটি খুঁজুন।

### ধাপ ৩: ডোমেইন সিলেক্ট করুন
যে ডোমেইনের PHP ভার্সন পরিবর্তন করতে চান সেটি চেকবক্স দিয়ে সিলেক্ট করুন।

### ধাপ ৪: ভার্সন সিলেক্ট করুন
ড্রপডাউন থেকে আপনার কাঙ্ক্ষিত PHP ভার্সন সিলেক্ট করে **Apply** ক্লিক করুন।`,
    contentEn: `## Change PHP Version

### Step 1: Login to cPanel
Login to your cPanel dashboard.

### Step 2: Find MultiPHP Manager
Search for "MultiPHP" and find the **MultiPHP Manager** option.

### Step 3: Select Domain
Check the domain whose PHP version you want to change.

### Step 4: Select Version
Select your desired PHP version from the dropdown and click **Apply**.`,
  },
  "install-ssl-certificate": {
    bn: "SSL সার্টিফিকেট ইনস্টল করুন", en: "Install SSL certificate",
    categoryBn: "হোস্টিং গাইড", categoryEn: "Hosting Guide",
    contentBn: `## SSL সার্টিফিকেট ইনস্টল

### ধাপ ১: cPanel এ লগইন করুন
আপনার হোস্টিং cPanel এ লগইন করুন।

### ধাপ ২: SSL/TLS সেকশনে যান
Security সেকশন থেকে **SSL/TLS** অপশনে ক্লিক করুন।

### ধাপ ৩: AutoSSL চালান
**Run AutoSSL** বাটনে ক্লিক করুন। এটি স্বয়ংক্রিয়ভাবে আপনার ডোমেইনের জন্য ফ্রি SSL ইনস্টল করবে।

> **নোট:** AutoSSL সাধারণত ২৪ ঘণ্টার মধ্যে সক্রিয় হয়ে যায়।`,
    contentEn: `## Install SSL Certificate

### Step 1: Login to cPanel
Login to your hosting cPanel.

### Step 2: Go to SSL/TLS Section
Click on **SSL/TLS** under the Security section.

### Step 3: Run AutoSSL
Click the **Run AutoSSL** button. This will automatically install a free SSL for your domain.

> **Note:** AutoSSL usually activates within 24 hours.`,
  },
  "change-domain-nameservers": {
    bn: "ডোমেইন নেমসার্ভার পরিবর্তন করুন", en: "Change domain nameservers",
    categoryBn: "ডোমেইন গাইড", categoryEn: "Domain Guide",
    contentBn: `## ডোমেইন নেমসার্ভার পরিবর্তন

### ধাপ ১: ডোমেইন রেজিস্ট্রারে লগইন করুন
আপনার ডোমেইন যেখান থেকে কিনেছেন সেই প্রোভাইডারে লগইন করুন।

### ধাপ ২: ডোমেইন ম্যানেজমেন্ট খুলুন
ডোমেইন লিস্ট থেকে আপনার ডোমেইন সিলেক্ট করুন এবং **Manage** বা **DNS Settings** এ ক্লিক করুন।

### ধাপ ৩: নেমসার্ভার পরিবর্তন করুন
কাস্টম নেমসার্ভার অপশন সিলেক্ট করুন এবং আপনার হোস্টিং প্রোভাইডারের নেমসার্ভারগুলো দিন।

> **সতর্কতা:** নেমসার্ভার পরিবর্তন কার্যকর হতে ২৪-৪৮ ঘণ্টা সময় লাগতে পারে।`,
    contentEn: `## Change Domain Nameservers

### Step 1: Login to Domain Registrar
Login to the provider where you purchased your domain.

### Step 2: Open Domain Management
Select your domain from the list and click **Manage** or **DNS Settings**.

### Step 3: Change Nameservers
Select custom nameservers and enter your hosting provider's nameservers.

> **Warning:** Nameserver changes may take 24-48 hours to propagate.`,
  },
  "transfer-your-domain": {
    bn: "ডোমেইন ট্রান্সফার করুন", en: "Transfer your domain",
    categoryBn: "ডোমেইন গাইড", categoryEn: "Domain Guide",
    contentBn: `## ডোমেইন ট্রান্সফার গাইড

### ধাপ ১: ডোমেইন আনলক করুন
বর্তমান রেজিস্ট্রারে গিয়ে ডোমেইনটি আনলক করুন।

### ধাপ ২: EPP/Auth কোড সংগ্রহ করুন
ডোমেইন ট্রান্সফারের জন্য EPP কোড (Authorization Code) সংগ্রহ করুন।

### ধাপ ৩: নতুন রেজিস্ট্রারে ট্রান্সফার শুরু করুন
নতুন রেজিস্ট্রারে গিয়ে ডোমেইন ট্রান্সফার অর্ডার দিন এবং EPP কোড দিন।

### ধাপ ৪: ট্রান্সফার অনুমোদন করুন
ইমেইলে আসা ট্রান্সফার কনফার্মেশন লিংকে ক্লিক করুন।`,
    contentEn: `## Domain Transfer Guide

### Step 1: Unlock Domain
Go to your current registrar and unlock the domain.

### Step 2: Get EPP/Auth Code
Get the EPP code (Authorization Code) for the transfer.

### Step 3: Initiate Transfer at New Registrar
Go to the new registrar, order a domain transfer and enter the EPP code.

### Step 4: Approve Transfer
Click the transfer confirmation link sent to your email.`,
  },
  "setup-dns-records": {
    bn: "DNS রেকর্ড সেটআপ করুন", en: "Setup DNS records",
    categoryBn: "ডোমেইন গাইড", categoryEn: "Domain Guide",
    contentBn: `## DNS রেকর্ড সেটআপ

### সাধারণ DNS রেকর্ড টাইপ
- **A Record:** ডোমেইনকে একটি IP অ্যাড্রেসে পয়েন্ট করে
- **CNAME:** একটি ডোমেইনকে অন্য ডোমেইনে এলিয়াস করে
- **MX Record:** ইমেইল সার্ভার নির্দেশ করে
- **TXT Record:** ভেরিফিকেশন ও SPF/DKIM রেকর্ডের জন্য ব্যবহৃত হয়

### সেটআপ পদ্ধতি
1. cPanel বা DNS ম্যানেজারে লগইন করুন
2. **Zone Editor** বা **DNS Zone** অপশনে যান
3. প্রয়োজনীয় রেকর্ড টাইপ সিলেক্ট করুন
4. Name, Value এবং TTL সেট করুন
5. Save করুন`,
    contentEn: `## Setup DNS Records

### Common DNS Record Types
- **A Record:** Points domain to an IP address
- **CNAME:** Aliases one domain to another
- **MX Record:** Specifies email server
- **TXT Record:** Used for verification & SPF/DKIM records

### Setup Steps
1. Login to cPanel or DNS Manager
2. Go to **Zone Editor** or **DNS Zone**
3. Select the required record type
4. Set Name, Value and TTL
5. Save the record`,
  },
  "create-email-account": {
    bn: "ইমেইল অ্যাকাউন্ট তৈরি করুন", en: "Create email account",
    categoryBn: "ইমেইল গাইড", categoryEn: "Email Guide",
    contentBn: `## ইমেইল অ্যাকাউন্ট তৈরি

### ধাপ ১: cPanel এ লগইন করুন
আপনার cPanel ড্যাশবোর্ডে লগইন করুন।

### ধাপ ২: Email Accounts সিলেক্ট করুন
Email সেকশন থেকে **Email Accounts** অপশনে ক্লিক করুন।

### ধাপ ৩: নতুন অ্যাকাউন্ট তৈরি করুন
**Create** বাটনে ক্লিক করুন। ইউজারনেম, ডোমেইন এবং পাসওয়ার্ড দিন।

### ধাপ ৪: স্টোরেজ সেট করুন
ইমেইল স্টোরেজ লিমিট সেট করুন এবং **Create** ক্লিক করুন।`,
    contentEn: `## Create Email Account

### Step 1: Login to cPanel
Login to your cPanel dashboard.

### Step 2: Select Email Accounts
Click on **Email Accounts** under the Email section.

### Step 3: Create New Account
Click the **Create** button. Enter username, domain and password.

### Step 4: Set Storage
Set the email storage limit and click **Create**.`,
  },
  "setup-email-in-outlook": {
    bn: "আউটলুকে ইমেইল সেটআপ করুন", en: "Setup email in Outlook",
    categoryBn: "ইমেইল গাইড", categoryEn: "Email Guide",
    contentBn: `## আউটলুকে ইমেইল সেটআপ

### ধাপ ১: Outlook ওপেন করুন
Microsoft Outlook অ্যাপ্লিকেশন ওপেন করুন।

### ধাপ ২: অ্যাকাউন্ট যুক্ত করুন
File > Add Account এ যান এবং আপনার ইমেইল অ্যাড্রেস দিন।

### ধাপ ৩: IMAP/POP সেটিংস দিন
- **Incoming Server:** mail.yourdomain.com (IMAP: 993, POP: 995)
- **Outgoing Server:** mail.yourdomain.com (SMTP: 465)
- **Encryption:** SSL/TLS

### ধাপ ৪: পাসওয়ার্ড দিন
আপনার ইমেইল পাসওয়ার্ড দিন এবং কানেক্ট করুন।`,
    contentEn: `## Setup Email in Outlook

### Step 1: Open Outlook
Open the Microsoft Outlook application.

### Step 2: Add Account
Go to File > Add Account and enter your email address.

### Step 3: Enter IMAP/POP Settings
- **Incoming Server:** mail.yourdomain.com (IMAP: 993, POP: 995)
- **Outgoing Server:** mail.yourdomain.com (SMTP: 465)
- **Encryption:** SSL/TLS

### Step 4: Enter Password
Enter your email password and connect.`,
  },
  "forward-email-to-gmail": {
    bn: "Gmail এ ইমেইল ফরওয়ার্ড করুন", en: "Forward email to Gmail",
    categoryBn: "ইমেইল গাইড", categoryEn: "Email Guide",
    contentBn: `## Gmail এ ইমেইল ফরওয়ার্ড

### ধাপ ১: cPanel এ লগইন করুন
আপনার cPanel ড্যাশবোর্ডে যান।

### ধাপ ২: Forwarders অপশনে যান
Email সেকশন থেকে **Forwarders** অপশনে ক্লিক করুন।

### ধাপ ৩: ফরওয়ার্ডার তৈরি করুন
**Add Forwarder** ক্লিক করুন। সোর্স ইমেইল এবং ডেস্টিনেশন Gmail অ্যাড্রেস দিন।

> **টিপস:** আপনি একই ইমেইলের জন্য একাধিক ফরওয়ার্ডার সেট করতে পারেন।`,
    contentEn: `## Forward Email to Gmail

### Step 1: Login to cPanel
Go to your cPanel dashboard.

### Step 2: Go to Forwarders
Click on **Forwarders** under the Email section.

### Step 3: Create Forwarder
Click **Add Forwarder**. Enter the source email and destination Gmail address.

> **Tips:** You can set multiple forwarders for the same email.`,
  },
  "enable-two-factor-authentication": {
    bn: "টু-ফ্যাক্টর অথেনটিকেশন চালু করুন", en: "Enable two-factor authentication",
    categoryBn: "নিরাপত্তা", categoryEn: "Security",
    contentBn: `## টু-ফ্যাক্টর অথেনটিকেশন (2FA)

### ধাপ ১: cPanel এ লগইন করুন
আপনার cPanel ড্যাশবোর্ডে যান।

### ধাপ ২: Two-Factor Authentication খুঁজুন
Security সেকশন থেকে **Two-Factor Authentication** অপশন খুঁজুন।

### ধাপ ৩: সেটআপ করুন
**Set Up Two-Factor Authentication** বাটনে ক্লিক করুন। QR কোড স্ক্যান করুন Google Authenticator বা Authy অ্যাপ দিয়ে।

### ধাপ ৪: ভেরিফাই করুন
অ্যাপ থেকে প্রাপ্ত কোডটি দিয়ে ভেরিফাই করুন।`,
    contentEn: `## Two-Factor Authentication (2FA)

### Step 1: Login to cPanel
Go to your cPanel dashboard.

### Step 2: Find Two-Factor Authentication
Find **Two-Factor Authentication** under the Security section.

### Step 3: Set Up
Click **Set Up Two-Factor Authentication**. Scan the QR code with Google Authenticator or Authy app.

### Step 4: Verify
Enter the code from the app to verify.`,
  },
  "run-malware-scan": {
    bn: "ম্যালওয়্যার স্ক্যান চালান", en: "Run malware scan",
    categoryBn: "নিরাপত্তা", categoryEn: "Security",
    contentBn: `## ম্যালওয়্যার স্ক্যান

### ধাপ ১: cPanel এ লগইন করুন
আপনার cPanel ড্যাশবোর্ডে যান।

### ধাপ ২: ImunifyAV খুঁজুন
Security সেকশন থেকে **ImunifyAV** বা **Virus Scanner** অপশনে ক্লিক করুন।

### ধাপ ৩: স্ক্যান শুরু করুন
**Scan Now** বাটনে ক্লিক করে সম্পূর্ণ অ্যাকাউন্ট স্ক্যান করুন।

### ধাপ ৪: সংক্রমিত ফাইল পরিচালনা করুন
স্ক্যান শেষে সংক্রমিত ফাইলগুলো রিভিউ করুন এবং ক্লিন/ডিলিট করুন।`,
    contentEn: `## Malware Scan

### Step 1: Login to cPanel
Go to your cPanel dashboard.

### Step 2: Find ImunifyAV
Click on **ImunifyAV** or **Virus Scanner** under the Security section.

### Step 3: Start Scan
Click **Scan Now** to scan the entire account.

### Step 4: Handle Infected Files
Review infected files after the scan and clean/delete them.`,
  },
  "backup-and-restore-guide": {
    bn: "ব্যাকআপ ও রিস্টোর গাইড", en: "Backup and restore guide",
    categoryBn: "নিরাপত্তা", categoryEn: "Security",
    contentBn: `## ব্যাকআপ ও রিস্টোর

### ব্যাকআপ তৈরি করুন
1. cPanel এ **Backup Wizard** এ যান
2. **Back Up** সিলেক্ট করুন
3. Full Backup বা Partial Backup বেছে নিন
4. ব্যাকআপ ফাইল ডাউনলোড করুন

### রিস্টোর করুন
1. **Backup Wizard** > **Restore** এ যান
2. ব্যাকআপ ফাইল আপলোড করুন
3. রিস্টোর প্রসেস সম্পন্ন হওয়ার জন্য অপেক্ষা করুন

> **গুরুত্বপূর্ণ:** নিয়মিত ব্যাকআপ নিন, বিশেষ করে কোনো পরিবর্তন করার আগে।`,
    contentEn: `## Backup and Restore

### Create Backup
1. Go to **Backup Wizard** in cPanel
2. Select **Back Up**
3. Choose Full Backup or Partial Backup
4. Download the backup file

### Restore
1. Go to **Backup Wizard** > **Restore**
2. Upload the backup file
3. Wait for the restore process to complete

> **Important:** Take regular backups, especially before making any changes.`,
  },
};

// Helper to generate slug from English title
export const toSlug = (en: string) =>
  en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const KnowledgeBaseArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();
  const bn = lang === "bn";

  const article = slug ? articlesData[slug] : null;

  if (!article) {
    return (
      <PublicLayout>
        <SEOHead title="Article Not Found - Yess Host" description="The requested article was not found." />
        <div className="pt-20 lg:pt-24 pb-16 container mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{bn ? "আর্টিকেল পাওয়া যায়নি" : "Article Not Found"}</h1>
          <p className="text-muted-foreground mb-6">{bn ? "এই আর্টিকেলটি খুঁজে পাওয়া যায়নি।" : "This article could not be found."}</p>
          <Link to="/knowledge-base" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            <ArrowLeft className="w-4 h-4" /> {bn ? "নলেজ বেসে ফিরে যান" : "Back to Knowledge Base"}
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const content = bn ? article.contentBn : article.contentEn;

  return (
    <PublicLayout>
      <SEOHead
        title={`${bn ? article.bn : article.en} - Yess Host`}
        description={`${bn ? article.bn : article.en} - ${bn ? "বিস্তারিত গাইড" : "Detailed guide"}`}
        canonical={`/knowledge-base/${slug}`}
      />
      <div className="pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Breadcrumb */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <Link to="/knowledge-base" className="hover:text-primary transition-colors">
                {bn ? "নলেজ বেস" : "Knowledge Base"}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-muted-foreground/70">{bn ? article.categoryBn : article.categoryEn}</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium truncate">{bn ? article.bn : article.en}</span>
            </div>
          </motion.div>

          {/* Article */}
          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8">
            {/* Header */}
            <div className="mb-6 pb-6 border-b border-border/50">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
                {bn ? article.categoryBn : article.categoryEn}
              </span>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">
                {bn ? article.bn : article.en}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {bn ? "৫ মিনিটে পড়ুন" : "5 min read"}</span>
              </div>
            </div>

            {/* Content rendered as simple markdown-like text */}
            <div className="prose prose-sm max-w-none text-foreground">
              {content.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <br key={i} />;
                if (trimmed.startsWith("## ")) return <h2 key={i} className="text-xl font-bold text-foreground mt-6 mb-3">{trimmed.slice(3)}</h2>;
                if (trimmed.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold text-foreground mt-5 mb-2">{trimmed.slice(4)}</h3>;
                if (trimmed.startsWith("> ")) return <blockquote key={i} className="border-l-4 border-primary/30 pl-4 py-2 my-3 bg-primary/5 rounded-r-lg text-sm text-muted-foreground italic">{trimmed.slice(2)}</blockquote>;
                if (/^\d+\.\s/.test(trimmed)) return <p key={i} className="text-sm leading-relaxed ml-4 my-1">{trimmed}</p>;
                if (trimmed.startsWith("- ")) return <p key={i} className="text-sm leading-relaxed ml-4 my-1">• {trimmed.slice(2)}</p>;
                // Handle inline code
                const parts = trimmed.split(/(`[^`]+`)/);
                return (
                  <p key={i} className="text-sm leading-relaxed my-2">
                    {parts.map((part, j) =>
                      part.startsWith("`") && part.endsWith("`")
                        ? <code key={j} className="px-1.5 py-0.5 rounded bg-secondary text-primary text-xs font-mono">{part.slice(1, -1)}</code>
                        : part.replace(/\*\*([^*]+)\*\*/g, "").length !== part.length
                          ? <span key={j} dangerouslySetInnerHTML={{ __html: part.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>") }} />
                          : <span key={j}>{part}</span>
                    )}
                  </p>
                );
              })}
            </div>
          </motion.article>

          {/* Back link */}
          <div className="mt-6">
            <Link to="/knowledge-base"
              className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> {bn ? "নলেজ বেসে ফিরে যান" : "Back to Knowledge Base"}
            </Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default KnowledgeBaseArticle;
