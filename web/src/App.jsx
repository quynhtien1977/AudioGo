import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import POIPage from "./pages/POIPage";
import AccountsPage from "./pages/AccountsPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/"
          element={
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          }
        />

        {/* POIs */}
        <Route
          path="/pois"
          element={
            <MainLayout>
              <POIPage />
            </MainLayout>
          }
        />

        {/* Accounts */}
        <Route
          path="/accounts"
          element={
            <MainLayout>
              <AccountsPage />
            </MainLayout>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
} 