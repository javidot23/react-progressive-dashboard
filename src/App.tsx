import { Link, Route, Routes } from "react-router";
import { useRouteView } from "./hooks/useRouteView";
import ManagePage from "./pages/manage/ManagePage";

function Home() {
  const headingRef = useRouteView("Home");

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-4xl font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-600"
      >
        React Progressive Dashboard
      </h1>
      <Link
        to="/manage-v2#summary"
        className="mt-6 inline-block font-medium text-violet-700"
      >
        Open Manage V2
      </Link>
    </main>
  );
}

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
      <Route index element={<Home />} />
      <Route path="manage-v2" element={<ManagePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
