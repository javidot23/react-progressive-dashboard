# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

For this one, you have to update the way you are sending the qquery params. Basically, they are asking that we show last 4 weeks, compared to previous 4 weeks,  and api already returns it if you send:
 
order-transaction/weekly-sales-by-sales-group/?current_week=2026-08-24&previous_week=2026-07-27 - Not as static of course. You have to find the current week and send in current_week and then find the 4 weeks prior to previous_week