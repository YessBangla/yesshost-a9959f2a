# Enterprise Unified Staff Console

## লক্ষ্য
Call Center, Support ও Sales-এর বিদ্যমান কাজগুলোকে একই কর্পোরেট স্টাফ কনসোলে সাজানো হবে। প্রতিটি টিমের আলাদা কাজ ও তথ্য থাকবে, কিন্তু গ্রাহকের সঙ্গে কথা, টিকেট, কল এবং অর্ডারের প্রেক্ষাপট এক জায়গায় দেখা যাবে।

## যা তৈরি হবে

### 1. সমন্বিত Overview
- বাস্তব ডেটা দিয়ে Active/Open Chats, Open Tickets, Pending Orders, Completed/Missed Calls, response workload ও sales value দেখানো।
- জরুরি কাজের queue: অপেক্ষমাণ chat, high-priority ticket, pending order এবং missed call এক তালিকায়।
- প্রতিটি সারি থেকে সংশ্লিষ্ট Chat, Ticket, Order বা Call History পাতায় সরাসরি যাওয়া যাবে।
- recent customer activity ও revenue/order snapshot যুক্ত হবে; কোনো বানানো KPI দেখানো হবে না।

### 2. Call Center workspace
- searchable conversation queue, open/closed status filter, selected customer header এবং call status একই স্ক্রিনে।
- incoming/active call controls ও বর্তমান WebRTC flow অক্ষত থাকবে।
- conversation-এর পাশে customer context: পরিচয়, যোগাযোগ, recent order/service context এবং দ্রুত Ticket/Order লিংক।
- loading spinner-এর বদলে skeleton এবং নির্ভরযোগ্য empty/error state থাকবে।

### 3. Support workspace
- status, priority, department ও customer search দিয়ে ticket queue।
- selected ticket-এর full thread, SLA/age indicator, customer context ও reply composer।
- reply দিলে বিদ্যমান নিয়ম অনুযায়ী ticket `in_progress` হবে; invalid/empty reply বন্ধ থাকবে।
- high-priority ও দীর্ঘক্ষণ অপেক্ষমাণ ticket স্পষ্টভাবে চিহ্নিত হবে।

### 4. Sales workspace
- Order page-কে searchable, filterable এবং paginated sales queue করা।
- total order value, pending value, paid/active volume ও conversion proxy বাস্তব order data থেকে দেখানো।
- customer, purchased items, payment state এবং order timeline একই expanded view-তে থাকবে।
- Confirm, Cancel, Provision/Activate-এর বর্তমান কাজ সংরক্ষণ করে failure feedback ও disabled states উন্নত করা হবে।

### 5. Calls ও staff shell
- Call History-তে search, filters, pagination এবং outcome/duration summary থাকবে।
- sidebar-এ Operations, Customer Care ও Sales grouping; top-right agent menu-তে profile/status/sign-out রাখা হবে।
- mobile-এ drawer, tab/queue navigation ও 44px touch targets বজায় থাকবে।
- সব Staff page-এ BN/EN কপি ও একই state language থাকবে।

## নির্বাচিত ভিজ্যুয়াল দিক
- **Direction:** Enterprise Unified Console
- **Palette:** Ocean Deep — deep navy, ocean blue, teal এবং mint accents; সব রং semantic staff tokens হিসেবে সংজ্ঞায়িত হবে।
- **Typography:** Sora headings + Manrope body; বাংলা Noto Sans Bengali-তে থাকবে। Font stylesheet document head থেকে load হবে।
- **Layout:** compact KPI band, 3-column operational workspace, solid white surfaces, thin borders, 6–8px radius, restrained shadows।
- animation শুধু live-row highlight, status pulse ও 160ms state transition; reduced-motion মানা হবে।

## Technical details
- বর্তমান TanStack routes, auth guard, RLS এবং realtime subscriptions অপরিবর্তিত থাকবে।
- dashboard data existing secured client queries থেকেই আসবে; নতুন demo/static metrics যোগ হবে না।
- shared staff UI primitives তৈরি হবে: metric strip, queue toolbar, status badge, customer context এবং skeleton/empty states।
- existing Button, Input, Badge, Select ও pagination components ব্যবহার করা হবে; raw visual values page code-এ থাকবে না।
- প্রতিটি `/call-center/*` leaf route-এ unique title, description, Open Graph metadata ও Twitter card metadata যোগ হবে।

## যাচাই
- TypeScript check ও preview build status পরিষ্কার করা।
- desktop এবং mobile viewport-এ Overview, Live Chat, Tickets, Orders ও Call History পরীক্ষা।
- chat reply, ticket reply, order status/provision action এবং route navigation smoke-test।
- console/runtime errors, overlap, truncation ও empty/loading states পরীক্ষা।
