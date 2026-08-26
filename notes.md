# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

Summary

- Standardizes secondary-page layouts across Sales, Demand, Supply, Inventory, and Summary.
- Aligns spacing between the back link, page title, subtitle, and legends.
- Uses responsive title-to-description spacing: 10px on mobile and 30px from the md breakpoint.
- Makes tables and product grids consume the remaining viewport height with internal scrolling.
- Keeps the footer at the bottom of the viewport with consistent background, width, padding, and alignment.
- Preserves existing filters, sorting, exports, pagination, table density, and data behavior.
- Adds and updates tests for layout contracts and loading, empty, error, and populated states.
