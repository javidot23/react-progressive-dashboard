# PR Title

## Summary

## Why

## Technical Notes

## Testing/Validation

## Related Work

- Jira story: [CPR-849](https://abc-jira.atlassian.net/browse/CPR-849)

Summary of all failing tests
 FAIL  src/routes/AppRoutes.test.tsx
  ● Forecast status changes route gating › registers the route for vendor tenants

    useAuth must be used within an AuthProvider

      49 |   const context = useContext(AppAuthContext);
      50 |   if (!context) {
    > 51 |     throw new Error("useAuth must be used within an AuthProvider");
         |           ^
      52 |   }
      53 |   return context;
      54 | };

      at useAuth (src/contexts/AuthContext.tsx:51:11)
      at PostLoginTenantWelcomeRedirect (src/components/PostLoginTenantWelcomeRedirect.tsx:7:49)
      at Object.react-stack-bottom-frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:859:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at renderRoute (src/routes/AppRoutes.test.tsx:39:16)
      at renderRoute (src/routes/AppRoutes.test.tsx:49:5)

  ● Forecast status changes route gating › registers the route for customer_vendor tenants

    useAuth must be used within an AuthProvider

      49 |   const context = useContext(AppAuthContext);
      50 |   if (!context) {
    > 51 |     throw new Error("useAuth must be used within an AuthProvider");
         |           ^
      52 |   }
      53 |   return context;
      54 | };

      at useAuth (src/contexts/AuthContext.tsx:51:11)
      at PostLoginTenantWelcomeRedirect (src/components/PostLoginTenantWelcomeRedirect.tsx:7:49)
      at Object.react-stack-bottom-frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:859:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at renderRoute (src/routes/AppRoutes.test.tsx:39:16)
      at renderRoute (src/routes/AppRoutes.test.tsx:49:5)

  ● Forecast status changes route gating › does not register the route for customer

    useAuth must be used within an AuthProvider

      49 |   const context = useContext(AppAuthContext);
      50 |   if (!context) {
    > 51 |     throw new Error("useAuth must be used within an AuthProvider");
         |           ^
      52 |   }
      53 |   return context;
      54 | };

      at useAuth (src/contexts/AuthContext.tsx:51:11)
      at PostLoginTenantWelcomeRedirect (src/components/PostLoginTenantWelcomeRedirect.tsx:7:49)
      at Object.react-stack-bottom-frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:859:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at renderRoute (src/routes/AppRoutes.test.tsx:39:16)
      at renderRoute (src/routes/AppRoutes.test.tsx:55:5)

  ● Forecast status changes route gating › does not register the route for undefined

    useAuth must be used within an AuthProvider

      49 |   const context = useContext(AppAuthContext);
      50 |   if (!context) {
    > 51 |     throw new Error("useAuth must be used within an AuthProvider");
         |           ^
      52 |   }
      53 |   return context;
      54 | };

      at useAuth (src/contexts/AuthContext.tsx:51:11)
      at PostLoginTenantWelcomeRedirect (src/components/PostLoginTenantWelcomeRedirect.tsx:7:49)
      at Object.react-stack-bottom-frame (node_modules/react-dom/cjs/react-dom-client.development.js:23863:20)
      at renderWithHooks (node_modules/react-dom/cjs/react-dom-client.development.js:5529:22)
      at updateFunctionComponent (node_modules/react-dom/cjs/react-dom-client.development.js:8897:19)
      at beginWork (node_modules/react-dom/cjs/react-dom-client.development.js:10522:18)
      at runWithFiberInDEV (node_modules/react-dom/cjs/react-dom-client.development.js:1522:13)
      at performUnitOfWork (node_modules/react-dom/cjs/react-dom-client.development.js:15140:22)
      at workLoopSync (node_modules/react-dom/cjs/react-dom-client.development.js:14956:41)
      at renderRootSync (node_modules/react-dom/cjs/react-dom-client.development.js:14936:11)
      at performWorkOnRoot (node_modules/react-dom/cjs/react-dom-client.development.js:14462:44)
      at performWorkOnRootViaSchedulerTask (node_modules/react-dom/cjs/react-dom-client.development.js:16216:7)
      at flushActQueue (node_modules/react/cjs/react.development.js:566:34)
      at process.env.NODE_ENV.exports.act (node_modules/react/cjs/react.development.js:859:10)
      at node_modules/@testing-library/react/dist/act-compat.js:47:25
      at renderRoot (node_modules/@testing-library/react/dist/pure.js:190:26)
      at render (node_modules/@testing-library/react/dist/pure.js:292:10)
      at renderRoute (src/routes/AppRoutes.test.tsx:39:16)
      at renderRoute (src/routes/AppRoutes.test.tsx:55:5)