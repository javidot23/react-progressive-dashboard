# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

```
Add this constant above the component:
const FILLED_ORDERED_LEGEND_ITEMS = [
  { id: "shipped-units", label: "Shipped Units", color: "#461E96" },
  { id: "unshipped-units", label: "Unshipped Units", color: "#A89DE6" },
] as const;
Then replace the current legendItems prop with:
<ChartWrapper
  title="Customer Units Ordered vs. Shipped by Category"
  description="Number of customer-ordered and shipped units across categories to assess 90-day fulfillment performance."
  infoTooltip="Customer units ordered versus shipped by material category for the past 90 days."
  legendPosition="bottom"
  renderLegend={() => (
    <div
      role="list"
      aria-label="Chart legend"
      className="flex w-full flex-wrap items-center justify-center gap-3"
    >
      {FILLED_ORDERED_LEGEND_ITEMS.map(item => (
        <div key={item.id} role="listitem" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-[13px] leading-none text-[#525252]">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )}
  isLoading={loading}
  isEmpty={!loading && !error && visibleCategories.length === 0}
  error={error}
  minHeight={400}
  variant="transparent"
  showDivider={false}
  className="h-full bg-white"
  contentClassName="pt-0"
>
```
