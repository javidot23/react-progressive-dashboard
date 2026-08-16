# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

# CPR-849: Create the upstream Manage Demand analysis experience

## Summary

- Creates a dedicated Demand analysis page within Manage for upstream tenants.
- Introduces demand, forecast, fulfillment, product-group, and class-of-trade metrics and visualizations.
- Creates high-demand and forecast-change product summaries with dedicated detail pages.
- Adds filtering, sorting, search, and infinite scrolling for detailed demand analysis.
- Establishes navigation, layouts, routes, and filter controls aligned with Manage standards.

## Why

Demand planners need a centralized experience to identify demand patterns, monitor forecast changes, evaluate fulfillment performance, and understand which products are experiencing the highest demand.

This PR creates that experience for upstream tenants within the Manage module.

## Technical Notes

- Creates protected, lazy-loaded detail routes for:
  - `/manage/demand/high-demand-products`
  - `/manage/demand/forecast-status-changes`
- Introduces an Outbound Unfilled Rate metric and visualizations for:
  - Demand vs. Forecast Comparison
  - Customer Units Ordered vs. Shipped by Category
  - Product Group Units Trend
  - Class of Trade
- Adds a Products in High Demand summary using MTD demand, fill-rate, product-status, and formulary data.
- Adds forecast-change summaries, including PRxO and PharmaGen product counts, month-over-month demand changes, and days on hand.
- Creates typed TanStack Query integrations for demand metrics, forecast comparisons, product lookup, material statuses, and paginated detail data.
- Adds server-backed filters for product name, Product ID, NDC, and material status. Table search remains scoped to currently loaded rows.
- Carries existing Manage global-filter selections into Demand drill-down navigation and data requests.
- Includes loading, updating, empty, malformed-response, partial-data, and retry states.

## Testing/Validation

- `npm run test:all -- --runInBand`
  - 164 test suites passed
  - 1,700 tests passed
- `npm run typecheck` — passed
- `npm run format:check` — passed
- ESLint for files changed from `dev` — passed with no warnings
- `npm run lint` — passed with 0 errors; the repository reports 569 warnings
- `npm run build` — passed with non-blocking CSS optimization and chunk-size warnings
- `git diff --check dev...HEAD` — passed

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)



DCMissedLinesCard
DCMissedLinesTable