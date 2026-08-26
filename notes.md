# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

Summary
This PR addresses CPR-1520 sales data issues by:

- Correcting the Total Sales volume YoY presentation.
- Replacing free-form Manufacturer Contract filtering with a remote multiselect typeahead.
  Changes
  Total Sales
- Use shipped_qty_yoy_pct for Sales Volume YoY Change.
- Display YoY percentages as rounded whole numbers.
- Keep YTD units and the volume bar together in one column.
- Remove duplicate YoY text from the YTD volume cell and accessible label.
- Cover Product, Customer, and Sales Group views, including zero and unavailable values.
  Manufacturer Contract filter
- Search /chargebacks/missing/manufacturer-contract-name/ after a 300 ms debounce.
- Add pagination, cancellation, caching, strict response validation, loading/error states, and retry behavior.
- Trim and deduplicate options while excluding empty and literal NULL values.
- Preserve selections across searches and filter-panel remounts.
- Only allow contracts returned by the backend.
- Preserve draft/applied behavior: filters affect the table and export only after selecting Show results.
- Continue serializing multiple selections as manufacturer_contract_name CSV.
