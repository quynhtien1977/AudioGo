import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import POIPage from "./pages/POIPage";
import AccountsPage from "./pages/AccountsPage";
import LoginPage from "./pages/LoginPage";
import CategoryPage from "./pages/CategoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
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

        {/* Categories */}
        <Route
          path="/categories"
          element={
            <MainLayout>
              <CategoryPage />
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