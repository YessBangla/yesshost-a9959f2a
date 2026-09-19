# Unified mobile design and invoice payment rollout

## What will change
- Apply one light corporate glass mobile shell across the public site, service pages, client dashboard, billing, and payment-result screens.
- Replace wide invoice tables with clear mobile invoice cards while preserving desktop tables and all existing filters/actions.
- Add a secure shareable invoice page where a customer can view, download, and pay an invoice without exposing other account data.
- Make invoice links open the exact invoice and payment action, with copy/share controls from billing and service/domain views.
- Correct payment initiation and callback handling so gateway-confirmed payments update the invoice, payment history, linked order, and service automatically and only once.
- Improve failed/cancelled payment return pages so the exact invoice can be retried.

## Mobile verification
- Test the home page, navigation menu, service page, shared invoice page, billing page, payment result, and chat button at 430px and 384px widths.
- Confirm there is no horizontal overflow, controls remain at least 44px, sheets/dialogs fit, and chat never overlaps bottom navigation.
- Run the focused automated tests and inspect current preview/build diagnostics.

## Technical details
- Use a server-generated, expiring invoice share token stored only as a hash; public invoice reads return a minimal safe invoice projection.
- Payment amount and ownership/token authorization are verified server-side; browser-supplied prices are ignored.
- Gateway transaction references will map reliably back to full invoice IDs, and callbacks will use the same configured gateway credentials as initiation.
- Keep existing semantic design tokens and the current light liquid-glass direction; no dark redesign or unrelated feature work.
