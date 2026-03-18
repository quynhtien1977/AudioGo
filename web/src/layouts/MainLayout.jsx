import { Link } from "react-router-dom";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 p-4 space-y-2">
        <h2 className="font-bold text-lg">POI Manager</h2>
        <nav className="space-y-2">
          <Link to="/">Dashboard</Link>
          <Link to="/pois">POIs</Link>
          <Link to="/approvals">Approvals</Link>
          <Link to="/tours">Tours</Link>
          <Link to="/analytics">Analytics</Link>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
