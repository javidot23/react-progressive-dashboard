# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

Issue 2 — Sales Volume YTD
The Sales Volume YTD column currently uses current_ytd_shipped_qty and shipped_qty_yoy_pct. The endpoint also returns current_ytd_sales, previous_ytd_sales, current_ytd_order_qty, previous_ytd_order_qty, current_ytd_shipped_qty, previous_ytd_shipped_qty, sales_yoy_pct, order_qty_yoy_pct, and shipped_qty_yoy_pct.
Which fields should the frontend use for the Sales Volume YTD value and its YoY percentage?

Issue 3 — Manufacturer Contract filter
The endpoint currently filters manufacturer_contract_name using an exact, case-sensitive match. Should it be changed to accept any text and return all matching contracts using a partial, case-insensitive match—for example, should APEXUS match APEXUS GENERICS?
