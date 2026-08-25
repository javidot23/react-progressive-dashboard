# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

1521
Fixes the temporary 404 displayed when refreshing the Inventory and Sales pages. These routes now remain registered while authentication and tenant context resolve, showing the existing loading state before permissions are evaluated.
Unauthorized tenants still receive a legitimate 404, while existing legacy redirects, filters, and navigation behavior remain unchanged. Tests were added for the relevant tenant types and loading states.

1516
Enables the Contract Status filter on the Material FTS Quantity Exposure page, defaulting to PRxO and supporting PharmaGen. The selected sales group is now applied consistently to table results and CSV exports.

1524
Standardizes responsive chart headers across Demand, Sales, and Inventory. It also keeps the Top Units Sales controls together and removes the dividers before Inventory chart legends.
