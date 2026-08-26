# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

Summary
Fixes CPR-1536 by updating the Unit Sales Trend comparison dates to use two consecutive, non-overlapping four-week periods.
Changes

- Uses the current week’s Monday as current_week.
- Uses the Monday four weeks earlier as previous_week.
- Preserves existing filters, query keys, cancellation, chart behavior, CSV export, and API contract.
- Adds coverage for the expected date calculation, year boundaries, request parameters, and non-overlapping periods.
  Validation
- npm run lint
- npm run format:check
- npm run typecheck
- npm run typecheck:storybook
- npm run test:all — 251 suites and 2,310 tests passed
- npm run build
