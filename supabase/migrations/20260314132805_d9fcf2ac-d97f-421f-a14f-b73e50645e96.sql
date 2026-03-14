
-- Seed hero section content
INSERT INTO public.site_content (page, section_key, title_bn, title_en, content_bn, content_en, metadata, sort_order) VALUES
('home', 'hero_offer', '⭐ .TOP ডোমেইন মাত্র ১৮০ টাকা! .COM ডোমেইন ৯৯০ টাকা', '⭐ .TOP Domain only ৳180! .COM Domain ৳990', NULL, NULL, '{}', 1),
('home', 'hero_title1', 'পারফেক্ট ডোমেইন', 'Perfect Domain', NULL, NULL, '{}', 2),
('home', 'hero_title2', 'প্রিমিয়াম কোয়ালিটি', 'Premium Quality', NULL, NULL, '{}', 3),
('home', 'hero_subtitle', 'ফ্রি DNS ম্যানেজমেন্ট • ফুল ডোমেইন কন্ট্রোল প্যানেল • ডোমেইন প্রাইভেসি প্রোটেকশন', 'Free DNS Management • Full Domain Control Panel • Domain Privacy Protection', NULL, NULL, '{}', 4),
('home', 'hero_placeholder', 'আপনার ডোমেইন নাম লিখুন..', 'Enter domain name here..', NULL, NULL, '{}', 5),
('home', 'hero_register', 'রেজিস্টার', 'Register', NULL, NULL, '{}', 6),
('home', 'hero_domain_prices', NULL, NULL, NULL, NULL, '{"prices": [{"ext":".top","price":"১৮০","popular":false},{"ext":".xyz","price":"২৯৫","popular":false},{"ext":".fun","price":"৩৮০","popular":false},{"ext":".shop","price":"৩৯০","popular":false},{"ext":".com","price":"৯৯০","popular":true}]}', 7),
('home', 'hero_stats', NULL, NULL, NULL, NULL, '{"stats": [{"icon":"Globe","value":"50K+","label_bn":"সক্রিয় ওয়েবসাইট","label_en":"Active Websites"},{"icon":"Clock","value":"99.9%","label_bn":"আপটাইম গ্যারান্টি","label_en":"Uptime Guarantee"},{"icon":"Zap","value":"LiteSpeed","label_bn":"ওয়েব সার্ভার","label_en":"Web Server"},{"icon":"Shield","value":"24/7","label_bn":"এক্সপার্ট সাপোর্ট","label_en":"Expert Support"}]}', 8),

-- Seed features section content
('home', 'features_section_title', 'সকল হোস্টিং সলিউশন এক জায়গায়', 'All Hosting Solutions in One Place', NULL, NULL, '{}', 10),
('home', 'features_section_subtitle', 'আপনার প্রয়োজন অনুযায়ী সেরা হোস্টিং সলিউশন বেছে নিন', 'Choose the best hosting solution for your needs', NULL, NULL, '{}', 11),
('home', 'features_services', NULL, NULL, NULL, NULL, '{"services": [
  {"icon":"Globe","title_bn":"ডোমেইন","title_en":"Domain","desc_bn":"আপনার পছন্দের ডোমেইন নাম রেজিস্ট্রেশন করুন সবচেয়ে কম মূল্যে","desc_en":"Register your preferred domain name at the lowest price","price":"199 BDT/Year","color":"from-blue-500/20 to-blue-600/5"},
  {"icon":"HardDrive","title_bn":"ওয়েব হোস্টিং","title_en":"Web Hosting","desc_bn":"LiteSpeed ওয়েব সার্ভার ও NVMe SSD দিয়ে তৈরি হাই-পারফরম্যান্স শেয়ার্ড হোস্টিং","desc_en":"High-performance shared hosting with LiteSpeed & NVMe SSD","price":"130 BDT/Month","color":"from-green-500/20 to-green-600/5"},
  {"icon":"Cpu","title_bn":"প্রো ওয়েব হোস্টিং","title_en":"Pro Web Hosting","desc_bn":"বেশি রিসোর্স, সিঙ্গাপুর লোকেশন সার্ভার ও এডভান্সড ফিচার সহ প্রো হোস্টিং","desc_en":"Pro hosting with more resources, Singapore server & advanced features","price":"200 BDT/Month","color":"from-purple-500/20 to-purple-600/5"},
  {"icon":"Rocket","title_bn":"প্রিমিয়াম হোস্টিং","title_en":"Premium Hosting","desc_bn":"Shell SSH অ্যাক্সেস ও আনলিমিটেড ডাটাবেস সহ এন্টারপ্রাইজ লেভেল হোস্টিং","desc_en":"Enterprise-level hosting with Shell SSH access & unlimited databases","price":"500 BDT/Month","color":"from-orange-500/20 to-orange-600/5"},
  {"icon":"Server","title_bn":"রিসেলার","title_en":"Reseller","desc_bn":"নিজের হোস্টিং বিজনেস শুরু করুন WHM/cPanel রিসেলার হোস্টিং দিয়ে","desc_en":"Start your own hosting business with WHM/cPanel reseller hosting","price":"1,499 BDT/Month","color":"from-pink-500/20 to-pink-600/5"},
  {"icon":"Shield","title_bn":"ভিপিএস","title_en":"VPS","desc_bn":"ফুল রুট অ্যাক্সেস ও ডেডিকেটেড রিসোর্স সহ ভার্চুয়াল প্রাইভেট সার্ভার","desc_en":"Virtual Private Server with full root access & dedicated resources","price":"750 BDT/Month","color":"from-cyan-500/20 to-cyan-600/5"},
  {"icon":"Mail","title_bn":"ইমেইল হোস্টিং","title_en":"Email Hosting","desc_bn":"প্রফেশনাল ইমেইল হোস্টিং সলিউশন আপনার ব্র্যান্ডের জন্য","desc_en":"Professional email hosting for your brand","price":"799 BDT/Month","color":"from-yellow-500/20 to-yellow-600/5"},
  {"icon":"HardDrive","title_bn":"ডেডিকেটেড","title_en":"Dedicated","desc_bn":"ফুল ম্যানেজড ডেডিকেটেড সার্ভার পাওয়ারফুল হার্ডওয়্যার সহ","desc_en":"Fully managed dedicated server with powerful hardware","price":"11,200 BDT/Month","color":"from-red-500/20 to-red-600/5"}
]}', 12),
('home', 'features_benefits_title', 'আমরা যা যা অফার করি', 'What We Offer', NULL, NULL, '{}', 13),
('home', 'features_benefits', NULL, NULL, NULL, NULL, '{"features": [
  {"icon":"RefreshCw","title_bn":"ফ্রি মাইগ্রেশন","title_en":"Free Migration","desc_bn":"আপনার বর্তমান হোস্ট থেকে আমরা ফ্রিতে আপনার ওয়েবসাইট মাইগ্রেট করে দেব","desc_en":"We will migrate your website from your current host for free"},
  {"icon":"Shield","title_bn":"মানি ব্যাক গ্যারান্টি","title_en":"Money Back Guarantee","desc_bn":"৩০ দিনের মধ্যে সন্তুষ্ট না হলে সম্পূর্ণ টাকা ফেরত","desc_en":"Full refund within 30 days if not satisfied"},
  {"icon":"MousePointerClick","title_bn":"ওয়ান ক্লিক ইনস্টল","title_en":"One-Click Install","desc_bn":"WordPress, Joomla এবং 300+ অ্যাপ ওয়ান ক্লিকে ইনস্টল করুন","desc_en":"Install WordPress, Joomla and 300+ apps with one click"},
  {"icon":"BarChart3","title_bn":"99.9% আপটাইম","title_en":"99.9% Uptime","desc_bn":"আমাদের ওয়ার্ল্ড-ক্লাস ডাটা সেন্টারে আপনার সাইট সবসময় অনলাইন থাকবে","desc_en":"Your site will always be online in our world-class data center"},
  {"icon":"Headphones","title_bn":"24/7 সাপোর্ট","title_en":"24/7 Support","desc_bn":"যেকোনো সমস্যায় আমাদের টেকনিক্যাল টিম ২৪/৭ আপনার পাশে","desc_en":"Our technical team is by your side 24/7 for any issues"},
  {"icon":"Lock","title_bn":"ফ্রি SSL","title_en":"Free SSL","desc_bn":"সকল হোস্টিং প্ল্যানে ফ্রি SSL সার্টিফিকেট অন্তর্ভুক্ত","desc_en":"Free SSL certificate included with all hosting plans"}
]}', 14)
ON CONFLICT DO NOTHING;
