
-- Add slug-specific plans for service detail pages
-- We need to update existing plans to have proper slugs, and add missing service plans

-- First update existing slugs to be more specific
UPDATE public.pricing_plans SET slug = 'basic-hosting' WHERE category = 'web' AND name LIKE 'PH%';
UPDATE public.pricing_plans SET slug = 'pro-hosting' WHERE category = 'web' AND name LIKE 'PRO%';
UPDATE public.pricing_plans SET slug = 'premium-hosting' WHERE category = 'web' AND name LIKE 'Premium%';
UPDATE public.pricing_plans SET slug = 'linux-reseller' WHERE category = 'reseller' AND name LIKE 'RH Linux%';
UPDATE public.pricing_plans SET slug = 'bdix-reseller' WHERE category = 'reseller' AND name LIKE 'BDIX RH%';
UPDATE public.pricing_plans SET slug = 'usa-vps' WHERE category = 'vps' AND name LIKE 'USA VPS%';
UPDATE public.pricing_plans SET slug = 'bdix-vps' WHERE category = 'vps' AND name LIKE 'BDIX VPS%';
UPDATE public.pricing_plans SET slug = 'dedicated' WHERE category = 'vps' AND name LIKE 'AMD%';
UPDATE public.pricing_plans SET slug = 'email-hosting' WHERE category = 'email';

-- Add missing plans for service detail pages
INSERT INTO public.pricing_plans (category, slug, name, price_bdt, annual_price_bdt, subtitle, features, is_highlighted, sort_order) VALUES
-- Basic hosting extra plans
('web', 'basic-hosting', 'PH 2GB', '১৮০', '১,৮০০', NULL, '["Host 3 Domain","2GB NVMe Storage","Unlimited Bandwidth","15 Sub Domain","15 Email Accounts","15 Databases","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server","cPanel Control Panel"]', true, 2),
('web', 'basic-hosting', 'PH 5GB', '২৫০', '২,৫০০', NULL, '["Host 5 Domain","5GB NVMe Storage","Unlimited Bandwidth","20 Sub Domain","20 Email Accounts","20 Databases","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server","cPanel Control Panel"]', false, 3),

-- Pro hosting extra plans  
('web', 'pro-hosting', 'PRO 10GB', '৩৫০', '৩,৮০০', NULL, '["Host 10 Domain","10GB NVMe Storage","Unlimited Bandwidth","50 Email Accounts","50 Databases","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server","Singapore Location Server","cPanel Control Panel"]', false, 2),
('web', 'pro-hosting', 'PRO 20GB', '৫০০', '৫,৫০০', NULL, '["Host 15 Domain","20GB NVMe Storage","Unlimited Bandwidth","Unlimited Email","Unlimited Databases","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server","Singapore Location Server","cPanel Control Panel"]', false, 3),

-- Premium extra plans
('web', 'premium-hosting', 'Premium 10', '৮০০', '৮,৫০০', NULL, '["15 Website Hosted","10GB NVMe Storage","Unlimited Bandwidth","30 Email Accounts","30 Sub Domain","Unlimited Databases","Ruby, Python, NodeJS","Free SSL Certificate","Shell (SSH) Access","cPanel Control Panel"]', false, 2),
('web', 'premium-hosting', 'Premium 20', '১,২০০', '১৩,০০০', NULL, '["20 Website Hosted","20GB NVMe Storage","Unlimited Bandwidth","Unlimited Email","Unlimited Sub Domain","Unlimited Databases","Ruby, Python, NodeJS","Free SSL Certificate","Shell (SSH) Access","cPanel Control Panel"]', false, 3),

-- BDIX Hosting
('web', 'bdix-hosting', 'BDIX 2GB', '১৫০', '১,৫০০', NULL, '["Host 2 Domain","2GB NVMe Storage","500 GB Bandwidth","10 Email Accounts","10 Databases","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server","BDIX Location Server","cPanel Control Panel"]', false, 1),
('web', 'bdix-hosting', 'BDIX 5GB', '২৫০', '২,৫০০', NULL, '["Host 5 Domain","5GB NVMe Storage","1TB Bandwidth","20 Email Accounts","20 Databases","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server","BDIX Location Server","cPanel Control Panel"]', true, 2),
('web', 'bdix-hosting', 'BDIX 10GB', '৪০০', '৪,০০০', NULL, '["Host 10 Domain","10GB NVMe Storage","2TB Bandwidth","30 Email Accounts","30 Databases","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server","BDIX Location Server","cPanel Control Panel"]', false, 3),

-- Linux Reseller extra
('reseller', 'linux-reseller', 'RH Linux 30', '২,৪৯৯', NULL, NULL, '["30 cPanel Accounts","100GB SSD Storage","Unlimited Bandwidth","cPanel / WHM Access","Daily Remote Backups","1-Click App Installs","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server"]', true, 2),

-- BDIX Reseller extra
('reseller', 'bdix-reseller', 'BDIX RH 10', '১,০৯৯', NULL, NULL, '["10 cPanel Accounts","10GB NVMe Storage","300 GB Bandwidth","cPanel / WHM Access","Daily Remote Backups","1-Click App Installs","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server"]', false, 1),
('reseller', 'bdix-reseller', 'BDIX RH 50', '২,৯৯৯', NULL, NULL, '["50 cPanel Accounts","50GB NVMe Storage","1TB Bandwidth","cPanel / WHM Access","Daily Remote Backups","1-Click App Installs","Ruby, Python, NodeJS","Free SSL Certificate","LiteSpeed Web Server"]', false, 3),

-- USA VPS extra
('vps', 'usa-vps', 'USA VPS 2', '১,৩০০', NULL, NULL, '["2 CPU Cores","4 GB RAM","50GB SSD Disk","2TB Bandwidth","1 Dedicated IP","Full Root Access","KVM Virtualization","CentOS / Ubuntu / AlmaLinux"]', true, 2),
('vps', 'usa-vps', 'USA VPS 4', '২,৫০০', NULL, NULL, '["4 CPU Cores","8 GB RAM","100GB SSD Disk","4TB Bandwidth","1 Dedicated IP","Full Root Access","KVM Virtualization","CentOS / Ubuntu / AlmaLinux"]', false, 3),

-- BDIX VPS extra
('vps', 'bdix-vps', 'BDIX VPS 2', '১,৮০০', NULL, NULL, '["2 CPU Cores","2 GB RAM","40GB NVMe Disk","1TB Bandwidth","1 Dedicated IP","Full Root Access","KVM Virtualization","CentOS / Ubuntu / AlmaLinux"]', false, 2),
('vps', 'bdix-vps', 'BDIX VPS 4', '৩,৫০০', NULL, NULL, '["4 CPU Cores","4 GB RAM","80GB NVMe Disk","2TB Bandwidth","1 Dedicated IP","Full Root Access","KVM Virtualization","CentOS / Ubuntu / AlmaLinux"]', false, 3),

-- Dedicated extra
('vps', 'dedicated', 'Intel Xeon E-2236', '১৫,৯০০', NULL, NULL, '["6 Cores 3.40 GHz","64GB DDR4 ECC","1TB NVMe PCIe 4.0","1Gbps Port","2 IP Addresses","Fully Managed Service","RAID Configuration","24/7 Customer Support"]', false, 2),
('vps', 'dedicated', 'Dual Xeon E5-2680v4', '২৫,০০০', NULL, NULL, '["28 Cores 2.40 GHz","128GB DDR4 ECC","2x 1TB NVMe SSD","10Gbps Port","5 IP Addresses","Fully Managed Service","Hardware RAID","24/7 Priority Support"]', false, 3),

-- Radio Hosting
('services', 'radio-hosting', 'Radio Basic', '৫০০', NULL, NULL, '["50 Listeners","128 Kbps Quality","Unlimited Bandwidth","SHOUTcast Panel","Auto DJ","24/7 Streaming","Custom Mount Points","SSL Support"]', false, 1),
('services', 'radio-hosting', 'Radio Pro', '৯৯৯', NULL, NULL, '["200 Listeners","256 Kbps Quality","Unlimited Bandwidth","SHOUTcast / Icecast","Auto DJ + Scheduler","24/7 Streaming","Custom Mount Points","SSL Support"]', true, 2),
('services', 'radio-hosting', 'Radio Premium', '১,৯৯৯', NULL, NULL, '["500 Listeners","320 Kbps Quality","Unlimited Bandwidth","SHOUTcast / Icecast","Auto DJ + Scheduler","24/7 Streaming","Multiple Mount Points","Dedicated Resources"]', false, 3),

-- Graphics Design
('services', 'graphics-design', 'Logo Design', '২,০০০', NULL, NULL, '["3 Concepts","Unlimited Revisions","Source File (AI/PSD)","High Resolution","Transparent PNG","Brand Guidelines","Social Media Kit","24-48 Hours Delivery"]', false, 1),
('services', 'graphics-design', 'Full Branding', '৫,০০০', NULL, NULL, '["Logo Design","Business Card","Letterhead","Social Media Cover","Email Signature","Brand Color Palette","Typography Guide","All Source Files"]', true, 2),
('services', 'graphics-design', 'Web Design', '১০,০০০', NULL, NULL, '["Custom UI/UX Design","Responsive Layout","Up to 10 Pages","Figma/XD File","Icon Set","Image Optimization","Style Guide","Revision Support"]', false, 3),

-- Domain
('services', 'domain', '.com Domain', '১,১৫০', NULL, NULL, '["1 Year Registration","Free DNS Management","Free WHOIS Privacy","Domain Forwarding","Email Forwarding","Domain Lock","Transfer Support","24/7 Support"]', false, 1),
('services', 'domain', '.com.bd Domain', '১,৫০০', NULL, NULL, '["2 Year Registration","Free DNS Management","Bangladesh TLD","Domain Forwarding","Email Forwarding","BTCL Approved","Transfer Support","24/7 Support"]', true, 2),
('services', 'domain', '.xyz / .online', '৩৫০', NULL, NULL, '["1 Year Registration","Free DNS Management","Free WHOIS Privacy","Domain Forwarding","Email Forwarding","Domain Lock","Budget Friendly","24/7 Support"]', false, 3)
ON CONFLICT DO NOTHING;

-- Also seed service page metadata into site_content
INSERT INTO public.site_content (page, section_key, title_bn, title_en, content_bn, content_en, metadata, sort_order) VALUES
('services', 'basic-hosting', 'বেসিক ওয়েব হোস্টিং', 'Basic Web Hosting', 'ছোট ওয়েবসাইট ও ব্লগের জন্য পারফেক্ট হোস্টিং সলিউশন। দ্রুত গতি, নির্ভরযোগ্য আপটাইম।', 'Perfect hosting solution for small websites and blogs. Fast speed, reliable uptime.', '{"icon":"Server","highlights":[{"icon":"Zap","label_bn":"LiteSpeed সার্ভার","label_en":"LiteSpeed Server"},{"icon":"Shield","label_bn":"ফ্রি SSL","label_en":"Free SSL"},{"icon":"Clock","label_bn":"৯৯.৯% আপটাইম","label_en":"99.9% Uptime"},{"icon":"Headphones","label_bn":"২৪/৭ সাপোর্ট","label_en":"24/7 Support"}]}', 1),
('services', 'pro-hosting', 'প্রো ওয়েব হোস্টিং', 'Pro Web Hosting', 'প্রফেশনাল ওয়েবসাইট ও ই-কমার্স স্টোরের জন্য শক্তিশালী হোস্টিং। সিঙ্গাপুর লোকেশন সার্ভার।', 'Powerful hosting for professional websites and e-commerce stores. Singapore location server.', '{"icon":"Server","highlights":[{"icon":"Globe","label_bn":"সিঙ্গাপুর সার্ভার","label_en":"Singapore Server"},{"icon":"Zap","label_bn":"NVMe SSD","label_en":"NVMe SSD"},{"icon":"Shield","label_bn":"ফ্রি SSL","label_en":"Free SSL"},{"icon":"Headphones","label_bn":"২৪/৭ সাপোর্ট","label_en":"24/7 Support"}]}', 2),
('services', 'premium-hosting', 'প্রিমিয়াম হোস্টিং', 'Premium Hosting', 'সর্বোচ্চ পারফরম্যান্স ও নিরাপত্তা সহ এন্টারপ্রাইজ গ্রেড হোস্টিং সলিউশন। SSH অ্যাক্সেস।', 'Enterprise-grade hosting solution with maximum performance and security. SSH access included.', '{"icon":"Server","highlights":[{"icon":"Zap","label_bn":"SSH অ্যাক্সেস","label_en":"SSH Access"},{"icon":"Shield","label_bn":"এন্টারপ্রাইজ সিকিউরিটি","label_en":"Enterprise Security"},{"icon":"Clock","label_bn":"৯৯.৯% আপটাইম","label_en":"99.9% Uptime"},{"icon":"Headphones","label_bn":"প্রায়োরিটি সাপোর্ট","label_en":"Priority Support"}]}', 3),
('services', 'bdix-hosting', 'বিডিআইএক্স হোস্টিং', 'BDIX Hosting', 'বাংলাদেশের সবচেয়ে দ্রুত BDIX হোস্টিং সার্ভিস। লোকাল কনটেন্ট ডেলিভারির জন্য সেরা।', 'Bangladesh''s fastest BDIX hosting service. Best for local content delivery.', '{"icon":"Globe","highlights":[{"icon":"Zap","label_bn":"BDIX স্পিড","label_en":"BDIX Speed"},{"icon":"Globe","label_bn":"BD লোকেশন","label_en":"BD Location"},{"icon":"Shield","label_bn":"ফ্রি SSL","label_en":"Free SSL"},{"icon":"Headphones","label_bn":"বাংলা সাপোর্ট","label_en":"Bangla Support"}]}', 4),
('services', 'linux-reseller', 'লিনাক্স রিসেলার হোস্টিং', 'Linux Reseller Hosting', 'আপনার নিজস্ব হোস্টিং ব্যবসা শুরু করুন। WHM কন্ট্রোল প্যানেল সহ সম্পূর্ণ রিসেলার প্যাকেজ।', 'Start your own hosting business. Complete reseller package with WHM control panel.', '{"icon":"Server","highlights":[{"icon":"Server","label_bn":"WHM অ্যাক্সেস","label_en":"WHM Access"},{"icon":"Shield","label_bn":"হোয়াইট লেবেল","label_en":"White Label"},{"icon":"Zap","label_bn":"LiteSpeed","label_en":"LiteSpeed"},{"icon":"Headphones","label_bn":"২৪/৭ সাপোর্ট","label_en":"24/7 Support"}]}', 5),
('services', 'bdix-reseller', 'বিডিআইএক্স রিসেলার হোস্টিং', 'BDIX Reseller Hosting', 'BDIX লোকেশনে রিসেলার হোস্টিং। বাংলাদেশে দ্রুত গতির হোস্টিং ব্যবসা শুরু করুন।', 'Reseller hosting at BDIX location. Start a fast hosting business in Bangladesh.', '{"icon":"Globe","highlights":[{"icon":"Zap","label_bn":"BDIX স্পিড","label_en":"BDIX Speed"},{"icon":"Server","label_bn":"WHM অ্যাক্সেস","label_en":"WHM Access"},{"icon":"Shield","label_bn":"ফ্রি SSL","label_en":"Free SSL"},{"icon":"Globe","label_bn":"BD লোকেশন","label_en":"BD Location"}]}', 6),
('services', 'usa-vps', 'USA VPS সার্ভার', 'USA VPS Server', 'আমেরিকার ডেটাসেন্টারে শক্তিশালী VPS সার্ভার। ফুল রুট অ্যাক্সেস, KVM ভার্চুয়ালাইজেশন।', 'Powerful VPS server in US datacenter. Full root access, KVM virtualization.', '{"icon":"Server","highlights":[{"icon":"Globe","label_bn":"USA লোকেশন","label_en":"USA Location"},{"icon":"Zap","label_bn":"KVM ভার্চুয়ালাইজেশন","label_en":"KVM Virtualization"},{"icon":"Shield","label_bn":"রুট অ্যাক্সেস","label_en":"Root Access"},{"icon":"Clock","label_bn":"তাৎক্ষণিক সেটআপ","label_en":"Instant Setup"}]}', 7),
('services', 'bdix-vps', 'BDIX VPS সার্ভার', 'BDIX VPS Server', 'বাংলাদেশ BDIX লোকেশনে দ্রুতগতির VPS সার্ভার। লোকাল ট্রাফিকের জন্য সেরা পারফরম্যান্স।', 'High-speed VPS server at Bangladesh BDIX location. Best performance for local traffic.', '{"icon":"Globe","highlights":[{"icon":"Zap","label_bn":"BDIX স্পিড","label_en":"BDIX Speed"},{"icon":"Globe","label_bn":"BD লোকেশন","label_en":"BD Location"},{"icon":"Shield","label_bn":"NVMe SSD","label_en":"NVMe SSD"},{"icon":"Headphones","label_bn":"বাংলা সাপোর্ট","label_en":"Bangla Support"}]}', 8),
('services', 'dedicated', 'ডেডিকেটেড সার্ভার', 'Dedicated Server', 'সম্পূর্ণ ডেডিকেটেড সার্ভার — সর্বোচ্চ পারফরম্যান্স, সিকিউরিটি ও কন্ট্রোল।', 'Fully dedicated servers — maximum performance, security and control.', '{"icon":"Server","highlights":[{"icon":"Server","label_bn":"ডেডিকেটেড রিসোর্স","label_en":"Dedicated Resources"},{"icon":"Shield","label_bn":"ম্যানেজড সার্ভিস","label_en":"Managed Service"},{"icon":"Zap","label_bn":"১ Gbps+ পোর্ট","label_en":"1 Gbps+ Port"},{"icon":"Headphones","label_bn":"প্রায়োরিটি সাপোর্ট","label_en":"Priority Support"}]}', 9),
('services', 'email-hosting', 'ইমেইল হোস্টিং', 'Email Hosting', 'প্রফেশনাল ইমেইল হোস্টিং সার্ভিস। আপনার ডোমেইন দিয়ে ইমেইল ব্যবহার করুন।', 'Professional email hosting service. Use email with your own domain.', '{"icon":"Globe","highlights":[{"icon":"Shield","label_bn":"SPAM প্রটেকশন","label_en":"SPAM Protection"},{"icon":"Globe","label_bn":"কাস্টম ডোমেইন","label_en":"Custom Domain"},{"icon":"Zap","label_bn":"IMAP/SMTP/POP","label_en":"IMAP/SMTP/POP"},{"icon":"Headphones","label_bn":"২৪/৭ সাপোর্ট","label_en":"24/7 Support"}]}', 10),
('services', 'radio-hosting', 'রেডিও হোস্টিং', 'Radio Hosting', 'আপনার নিজস্ব অনলাইন রেডিও স্টেশন চালু করুন। SHOUTcast ও Icecast সাপোর্ট।', 'Launch your own online radio station. SHOUTcast and Icecast support.', '{"icon":"Globe","highlights":[{"icon":"Zap","label_bn":"২৪/৭ স্ট্রিমিং","label_en":"24/7 Streaming"},{"icon":"Globe","label_bn":"Auto DJ","label_en":"Auto DJ"},{"icon":"Shield","label_bn":"SSL সাপোর্ট","label_en":"SSL Support"},{"icon":"Headphones","label_bn":"টেক সাপোর্ট","label_en":"Tech Support"}]}', 11),
('services', 'graphics-design', 'গ্রাফিক্স ডিজাইন', 'Graphics Design', 'প্রফেশনাল গ্রাফিক্স ডিজাইন সার্ভিস। লোগো, ব্যানার, সোশ্যাল মিডিয়া পোস্ট ডিজাইন।', 'Professional graphics design service. Logo, banner, social media post design.', '{"icon":"Globe","highlights":[{"icon":"Zap","label_bn":"দ্রুত ডেলিভারি","label_en":"Fast Delivery"},{"icon":"Shield","label_bn":"সোর্স ফাইল","label_en":"Source Files"},{"icon":"Globe","label_bn":"আনলিমিটেড রিভিশন","label_en":"Unlimited Revisions"},{"icon":"Headphones","label_bn":"ডেডিকেটেড ডিজাইনার","label_en":"Dedicated Designer"}]}', 12),
('services', 'domain', 'ডোমেইন রেজিস্ট্রেশন', 'Domain Registration', 'আপনার পছন্দের ডোমেইন নেম রেজিস্টার করুন। .com, .net, .org, .xyz, .com.bd সহ সকল এক্সটেনশন।', 'Register your preferred domain name. All extensions including .com, .net, .org, .xyz, .com.bd.', '{"icon":"Globe","highlights":[{"icon":"Globe","label_bn":"সকল এক্সটেনশন","label_en":"All Extensions"},{"icon":"Shield","label_bn":"WHOIS প্রাইভেসি","label_en":"WHOIS Privacy"},{"icon":"Zap","label_bn":"তাৎক্ষণিক অ্যাক্টিভেশন","label_en":"Instant Activation"},{"icon":"Headphones","label_bn":"ট্রান্সফার সাপোর্ট","label_en":"Transfer Support"}]}', 13)
ON CONFLICT DO NOTHING;
