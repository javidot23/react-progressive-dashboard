# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

# PR Title

CPR-850: Create the Supply section in the Manage module

## Summary

- Creates the Supply section within the Manage module.
- Adds API-backed KPIs for Products Without EPCIS, Unsuccessful Scans, and Failure to Supply Exposure.
- Introduces Supply overview content for purchase-order performance, organization performance, and outbound line service.
- Adds secondary drill-down pages for:
  - EPCIS Data Coverage
  - Purchase Order Scans
  - Purchase Orders by Product
  - Line Service Levels by Product
  - Material FTS Quantity Exposure
- Provides responsive layouts, remote filtering and sorting, horizontal scrolling, and infinite table pagination.

## Why

Supply users need a centralized experience for identifying product availability risks, inbound scanning problems, purchase-order performance issues, and failure-to-supply exposure.

This section provides high-level visibility through the Manage dashboard while supporting detailed investigation through dedicated secondary pages.

## Technical Notes

- Registers protected, lazy-loaded Supply routes under `/manage/supply`.
- Uses TanStack Query for API state, cancellation, pagination, cache isolation, and tenant transitions.
- Integrates existing Manage `gf2_*` global-filter selections into Supply requests and drill-down navigation.
- Uses the established DataGrid and TableFilter architecture for server-backed filtering, sorting, loading, empty, error, retry, and infinite-scroll states.
- Adds the Material FTS service-level KPI cards and material exposure table using:
  - `/order-transaction/fail-to-supply/service-level-kpis/`
  - `/order-transaction-aggregated/fail-to-supply/material-exposure/`
- Preserves the responsive Manage header behavior used by Sales, adapted for the three Supply KPIs.
- Keeps unavailable functionality, including complete CSV export and “See By DC,” disabled until its supporting contract is available.

## Testing/Validation

- `npm run lint` — passed with no errors.
- `npm run format:check` — passed.
- `npm run typecheck` — passed.
- `npm run typecheck:storybook` — passed.
- `npm run test:all -- --runInBand` — 194 suites and 1,875 tests passed.
- `npm run build` — passed.
- `npm run build-storybook` — passed.
- `git diff --check` — passed.
- Validated Supply KPI responsiveness at 639px, 640px, 1279px, and 1280px.
- Validated KPI drill-down navigation, preserved global filters, dividers, and responsive padding behavior.

## Reviewer Note

- The Contract Status filter is present in the Material FTS Quantity Exposure UI but remains disabled. Its server-side filtering behavior must be implemented once the endpoint supports the required Contract Status parameter.

## Related Work

- Jira story: [CPR-850](https://abc-jira.atlassian.net/browse/CPR-850)
