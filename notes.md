# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

```
jest.mock("@/components/ProtectedRoute", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/PostLoginTenantWelcomeRedirect", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/RequireTenant", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```
