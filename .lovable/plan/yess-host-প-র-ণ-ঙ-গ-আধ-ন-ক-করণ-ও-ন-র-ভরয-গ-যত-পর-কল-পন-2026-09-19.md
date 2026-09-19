# Yess Host পূর্ণাঙ্গ আধুনিকীকরণ ও নির্ভরযোগ্যতা পরিকল্পনা

## লক্ষ্য
পাবলিক সাইট, ক্লায়েন্ট ড্যাশবোর্ড, অ্যাডমিন ও কল সেন্টারকে একই আন্তর্জাতিক মানের, দ্বিভাষিক, মোবাইল-সক্ষম এবং নিরাপদ অভিজ্ঞতায় আনা। প্রথমে অর্থ, পরিচয় ও ডেটা-নিরাপত্তা; তারপর অসম্পূর্ণ কার্যক্রম; শেষে UX, SEO, accessibility ও পূর্ণ regression যাচাই।

## ধাপ ১ — জরুরি আর্থিক ও নিরাপত্তা সুরক্ষা
- Wallet invoice payment-কে একক atomic database transaction-এ নেওয়া: invoice lock, balance check, একবার debit, একবার settlement এবং invoice-ভিত্তিক idempotency। একই invoice-এ wallet ও gateway callback একসাথে এলে একটিই সফল হবে।
- Gateway settlement-এ invoice-level claim/lock, amount/currency/status reconciliation এবং duplicate callback protection শক্ত করা।
- Call-center invoice update-এ column guard: amount, owner, invoice number ও paid timestamp পরিবর্তনের ক্ষমতা শুধু admin-এর থাকবে।
- Support PIN server-side যাচাই; staff browser-এ raw PIN আর পাঠানো হবে না। Overview এবং Support PIN পেজ একই এক ঘণ্টার PIN দেখাবে।
- Scheduled invoice reminder-এ আলাদা secret verification ও duplicate-notification protection।
- CSV export-এ formula injection neutralization (`=`, `+`, `-`, `@`) এবং UTF-8/Excel-safe output।
- Granular staff permissions বাস্তবে প্রয়োগ: page access, server action এবং database policy—তিন স্তরেই একই permission map; শুধু UI checkbox হিসেবে থাকবে না।

## ধাপ ২ — Checkout ও payment recovery
- Nagad সফল হলে সঠিক payment URL-এ redirect; ব্যর্থ/অসম্পূর্ণ response-এ পরিষ্কার bilingual error।
- Order ও invoice তৈরির পরে gateway ব্যর্থ হলে একই checkout থেকে নিরাপদ retry; duplicate order/invoice তৈরি হবে না।
- Captured কিন্তু invoice-এ match না হওয়া payment-এর admin reconciliation queue। bKash payer reference ও SSLCommerz transaction identity cross-check।
- চালু payment method লোড হওয়ার সময় Skeleton; কোনো method প্রস্তুত না থাকলে order button disabled এবং স্পষ্ট fallback।
- প্রকৃত sandbox/test flow দিয়ে success, cancel, failure, retry ও duplicate callback যাচাই।

## ধাপ ৩ — Client Dashboard-এর অসম্পূর্ণ কার্যক্রম
- Overview-এর ভুয়া deterministic Support PIN সরিয়ে বাস্তব expiring PIN দেখানো/refresh link।
- Profile notification preferences backend-এ স্থায়ীভাবে সংরক্ষণ ও পুনরায় load; email/in-app channel অনুযায়ী কার্যকর করা।
- “Mass Payment” link সরাসরি invoice selection mode খুলবে। Service/Domain invoice CTA নির্দিষ্ট invoice preselect করবে।
- যেসব payment option প্রস্তুত নয় সেগুলো selectable দেখানো হবে না; admin gateway settings-এর সঙ্গে অবস্থা এক থাকবে।
- Services, Domains, Billing, Wallet, Support ও Profile-এ একই loading, empty, error, retry, success এবং mobile interaction pattern।

## ধাপ ৪ — Central Accounts ও রিপোর্টের নির্ভুলতা
- Accounts, Finance ও Expenses-এর 1000/2000-row client cap সরিয়ে server-side pagination, filtered totals এবং পূর্ণ CSV export।
- Office expense entry-এর একটিমাত্র validated server workflow; Finance quick-add ও Expenses page একই logic ব্যবহার করবে।
- Monthly statement, trial balance, client payments, bank/cash এবং expenses-এর date boundary ও double-entry reconciliation test।
- Scheduled report delivery log, last sent/next send, recipient validation এবং failed delivery retry visibility।
- Daily/weekly/monthly/yearly reportsে ledger totals ও source records মিলিয়ে automated reconciliation warning।

## ধাপ ৫ — Call Center ও Support SLA
- Live chat ও ticket delay শুধু customer message → first staff reply interval হিসেবে গণনা; পরপর customer/staff message ভুলভাবে breach হবে না।
- Call-center Live Chat-এ response timer, 15-minute warning, queue age, ownership/assignment এবং overdue filter।
- Support PIN verification server response হবে শুধু valid/expired/invalid; PIN value staff state/network response-এ থাকবে না।
- Customer lookup, reminder, ticket, call summary ও follow-up-এ permission checks ও audit trail।
- Incoming call/chat, ringtone, notification এবং post-call summary-এর desktop/mobile end-to-end পরীক্ষা।

## ধাপ ৬ — পাবলিক সাইট, bilingual UX ও accessibility
- Cart ও Live Chat-এর saved state hydration-safe করা; SSR এবং প্রথম client render অভিন্ন থাকবে।
- Navbar-এর icon controls-এ accessible name, expanded state, keyboard navigation ও focus management।
- Public navigation থেকে dedicated Domain Search দৃশ্যমান করা।
- Service ও Theme detail route-এ slug/data অনুযায়ী unique title, description, Open Graph ও Twitter metadata।
- ভাষা নির্বাচন প্রথম render থেকেই সঠিক রাখতে cookie-backed language preference; বাংলা ও ইংরেজিতে document language মিলবে।
- Checkout, forms, menus, drawers ও floating controls 384px mobile, tablet এবং desktop-এ overlap/overflow ছাড়া যাচাই।

## ধাপ ৭ — Design-system ও consistency pass
- Raw interactive controls ধাপে ধাপে shared Button/Input/Select/Dialog/Toggle components-এ আনা; semantic tokens ও 44px touch targets বজায় রাখা।
- Full-page generic spinner-গুলো page-specific Skeleton-এ রূপান্তর; button-এর ক্ষুদ্র busy indicator শুধু action feedback হিসেবে থাকবে।
- Duplicate visual patterns একীভূত, nested-card/অতিরিক্ত glass effect কমানো এবং client/admin/call-center hierarchy consistent করা।
- বাংলা typography, long labels, table overflow, empty states, destructive confirmations ও bilingual toast copy যাচাই।

## ধাপ ৮ — Regression, security ও release gate
- Payment atomicity, Support PIN, permission enforcement, CSV safety, ledger balance, report generation এবং notification preferences-এর automated tests।
- সব public/client/admin/call-center route desktop ও mobile-এ authenticated/unauthenticated browser checks।
- Console/runtime/network errors, broken links, horizontal overflow, keyboard navigation ও metadata uniqueness audit।
- Database security/linter findings পুনরায় চালিয়ে unresolved finding-এর কারণ নথিভুক্ত; build/type checks clean না হওয়া পর্যন্ত release বন্ধ।
- বাস্তব email/payment provider credential বা sandbox approval প্রয়োজন এমন check আলাদা করে চিহ্নিত করা হবে; কোড ও local verification সম্পন্ন হলেও বাহ্যিক provider delivery অনুমান করা হবে না।

## প্রযুক্তিগত বাস্তবায়ন
- নতুন privileged কাজ authenticated server functions ও RLS-নিয়ন্ত্রিত database functions-এ থাকবে; public callback/cron handler নিজস্ব signature/secret যাচাই করবে।
- প্রতিটি নতুন public table-এ একই migration-এ grants, RLS ও policies থাকবে; role থাকবে আলাদা `user_roles` table-এ।
- Existing routes ও bilingual design tokens বজায় রেখে focused edits; generated integration files পরিবর্তন করা হবে না।
- বড় পরিবর্তনগুলো phase-by-phase যাচাই করা হবে, যাতে payment/accounts regression দ্রুত ধরা পড়ে।

## সম্পন্ন হওয়ার মানদণ্ড
- একই invoice কোনো concurrency/retry অবস্থায় দুইবার paid/debited/booked হবে না।
- Staff raw Support PIN দেখতে পারবে না এবং permission checkbox বাস্তবে access নিয়ন্ত্রণ করবে।
- চালু সব payment method success/failure/retry flow সম্পূর্ণ করবে।
- Central Accounts UI, CSV ও emailed report একই period-এ একই totals দেখাবে এবং trial balance মিলবে।
- সকল গুরুত্বপূর্ণ route বাংলা/ইংরেজি, mobile/desktop, keyboard ও screen-reader-friendly হবে; কোনো hydration/runtime/build error থাকবে না।
