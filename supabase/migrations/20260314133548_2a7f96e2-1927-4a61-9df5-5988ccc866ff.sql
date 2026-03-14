
INSERT INTO public.site_content (page, section_key, title_bn, title_en, content_bn, content_en, metadata, sort_order) VALUES
('home', 'cta_badge', 'সাহায্য দরকার?', 'Need Help?', NULL, NULL, '{}', 20),
('home', 'cta_title', 'আজই আপনার ওয়েবসাইট শুরু করুন', 'Start Your Website Today', NULL, NULL, '{}', 21),
('home', 'cta_subtitle', 'আমাদের এক্সপার্ট টিম আপনাকে সঠিক হোস্টিং সলিউশন বেছে নিতে সাহায্য করবে।', 'Our expert team will help you choose the right hosting solution.', NULL, NULL, '{}', 22),
('home', 'cta_contacts', NULL, NULL, NULL, NULL, '{"phone":"+8809638205205","phone_label_bn":"কল করুন","phone_label_en":"Call Us","chat_label_bn":"লাইভ চ্যাট","chat_label_en":"Live Chat","email":"support@yesshost.com","email_label_bn":"ইমেইল করুন","email_label_en":"Email Us"}', 23),
('home', 'server_title', 'গ্লোবাল সার্ভার নেটওয়ার্ক', 'Global Server Network', NULL, NULL, '{}', 30),
('home', 'server_subtitle', 'বিশ্বের বিভিন্ন স্থানে আমাদের ডাটা সেন্টার থেকে আল্ট্রা-ফাস্ট স্পিড নিশ্চিত করি।', 'We ensure ultra-fast speed from our data centers across the globe.', NULL, NULL, '{}', 31),
('home', 'server_list', NULL, NULL, NULL, NULL, '{"servers":[{"location":"🇨🇦 Canada","city":"Toronto","latency":"12ms","load":34},{"location":"🇺🇸 United States","city":"New York","latency":"18ms","load":52},{"location":"🇫🇮 Finland","city":"Helsinki","latency":"28ms","load":41},{"location":"🇮🇳 India","city":"Mumbai","latency":"35ms","load":27},{"location":"🇦🇺 Australia","city":"Sydney","latency":"42ms","load":19},{"location":"🇧🇩 Bangladesh","city":"Dhaka (BDIX)","latency":"5ms","load":63}]}', 32)
ON CONFLICT DO NOTHING;
