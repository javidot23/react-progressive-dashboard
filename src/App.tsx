import { Link, Route, Routes } from "react-router";
import ManagePage from "./pages/manage/ManagePage";

function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold">React Progressive Dashboard</h1>
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
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold">404</h1>
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
