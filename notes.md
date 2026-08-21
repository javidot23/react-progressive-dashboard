# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

# PR Title

CPR-852: Create the upstream Manage Sales analysis experience

## Summary

Creates the Sales section within the Manage module for upstream tenants.

This PR introduces:

- A Sales dashboard with month-to-date KPIs and drill-down navigation.
- Sales visualizations covering unit sales, geographic distribution, sales changes, chargebacks, DCO trends, and validation timeliness.
- A responsive header with Total Sales, Sales Without Chargebacks, Contract Sales & Rebills, and Chargebacks metrics.
- Secondary pages for:
  - Total Sales.
  - Sales Without Chargebacks.
  - Active and Rejected Chargebacks.
- Product, Customer, and Sales Group views for Total Sales.
- Server-backed Product Name, Product ID, NDC, and Controlled Substance filters.
- Infinite scrolling, supported server-side sorting, loading, empty, malformed-response, and retry states.
- Upstream tenant route registration and Manage navigation integration.
- A reusable Select molecule and supporting DataGrid enhancements.

## Why

The Manage module needs a dedicated Sales experience that gives upstream users a consolidated view of sales performance and chargeback activity.

This work establishes the Sales section as a first-class Manage destination and provides direct paths from summary metrics to detailed analysis pages.

## Technical Notes

- Sales routes and navigation are registered only for upstream tenant capabilities.
- Server state is managed through TanStack Query with tenant-aware query keys, cancellation, pagination, and defensive response validation.
- The Total Sales page is available at `/manage/sales/all-sales`.
- Total Sales supports Product, Customer, and Sales Group breakdowns using the corresponding YTD backend endpoints.
- Product Name selections resolve to material numbers and are combined with manually entered Product IDs for exact server-side filtering.
- Existing `gf2_*` selections are preserved through Manage and drill-down navigation.
- Authentication and tenant binding continue to use the existing BFF cookie-session architecture.
- CSV export is displayed but intentionally disabled until complete-dataset export support is available.
- Customer Name, Customer ID, and Sales Group filters remain disabled pending backend support.

## Testing/Validation

Validation completed during implementation using Node 22:

- `npm run lint`
- `npm run format:check`
- `npm run typecheck`
- `npm run typecheck:storybook`
- `npm run test:all`
- `npm run build`
- `npm run build-storybook`
- `git diff --check`

## Related Work

- Jira story: [CPR-852](https://abc-jira.atlassian.net/browse/CPR-852)
- Backend follow-ups:
  - Customer Name and Customer ID filtering.
  - Sales Group filtering.
  - Global-filter parity across Total Sales views.
  - Complete-dataset CSV export support.
