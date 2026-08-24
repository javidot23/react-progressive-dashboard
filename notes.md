# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

Outbound Unfilled Rate KPI
This is using the current week’s unfilled rate as the denominator instead of the previous week’s unfilled rate:

current unfilled rate: 3.76
previous unfilled rate: 3.44

(current - previous) / previous = 9.2% (right)
(current - previous) / current = 8.4% (wrong)
