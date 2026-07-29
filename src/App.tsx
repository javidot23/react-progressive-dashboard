import { Link, Route, Routes } from "react-router";
import { useRouteView } from "./hooks/useRouteView";
import ManagePage from "./pages/manage/ManagePage";
import { UnderConstructionPage } from "./pages/UnderConstructionPage";

function NotFound() {
  const headingRef = useRouteView("Not found");

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-4xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
      >
        404
      </h1>
      <Link to="/" className="mt-6 inline-block text-violet-700">
        Return home
      </Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        index
        element={
          <UnderConstructionPage
            activePrimaryId="overview"
            path="/"
            title="Overview"
          />
        }
      />
      <Route
        path="react"
        element={
          <UnderConstructionPage
            activePrimaryId="react"
            path="/react"
            title="React"
          />
        }
      />
      <Route
        path="plan"
        element={
          <UnderConstructionPage
            activePrimaryId="plan"
            path="/plan"
            title="Plan"
          />
        }
      />
      <Route path="manage" element={<ManagePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
