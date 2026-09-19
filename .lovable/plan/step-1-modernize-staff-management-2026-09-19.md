# Step 1: Modernize Staff Management

## Goal
Turn Admin Staff Management into a clear, data-driven corporate workspace consistent with the Enterprise Unified Console, without changing existing permissions or backend rules.

## User experience
- Add a compact page header with staff invitation/action controls.
- Show live role and workload metrics using the shared console pattern.
- Add staff search, role filtering, and paginated results.
- Present each team member with identity, roles, support activity, and joined date.
- Improve add-staff selection and role assignment while preserving existing role actions.
- Add clear loading, error, no-staff, and no-search-result states in Bengali and English.
- Optimize controls and staff rows for mobile with 44px touch targets.

## Technical details
- Reuse semantic design tokens, shared staff primitives, shadcn controls, and DataPagination.
- Keep current `user_roles`, `profiles`, `support_tickets`, and `ticket_replies` data sources and existing RLS behavior.
- Replace raw buttons and generic animated loaders with design-system controls and skeletons.
- Add client-side role filtering and pagination over the live result set.
- Preserve role assignment/removal behavior and bilingual notifications.
- Verify type safety, current build health, desktop/mobile rendering, filtering, pagination, and role-control interactions without making destructive test changes.

## Next steps
After Step 1 is verified, continue in order with Affiliate Admin, Finance, then the remaining dashboard groups from the roadmap.
