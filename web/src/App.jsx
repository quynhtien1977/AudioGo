import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "@/layouts/MainLayout";

import DashboardPage from "@/pages/DashboardPage";
import POIPage from "@/pages/POIPage";
import AccountsPage from "@/pages/AccountsPage";
import LoginPage from "@/pages/LoginPage";
import CategoryPage from "@/pages/CategoryPage";
import POIDetailPage from "@/pages/POIDetailPage";
import AddPOIPage from "@/pages/AddPOIPage";
import AudioPage from "@/pages/AudioPage";
import ToursPage from "@/pages/ToursPage";
import TourDetailPage from "@/pages/TourDetailPage";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Dashboard (ADMIN only) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POIs (ADMIN + MANAGER only) */}
        <Route
          path="/pois"
          element={
            <ProtectedRoute roles={["ADMIN","MANAGER"]}>
              <MainLayout>
                <POIPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POI Add */}
        <Route
          path="/pois/add"
          element={
            <ProtectedRoute roles={["MANAGER"]}>
              <MainLayout>
                <AddPOIPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POI Detail */}
        <Route
          path="/pois/:id"
          element={
            <ProtectedRoute roles={["ADMIN", "MANAGER"]}>
              <MainLayout>
                <POIDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/audio"
          element={
            <ProtectedRoute roles={["MANAGER"]}>
              <MainLayout>
                <AudioPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Categories (ADMIN only) */}
        <Route
          path="/categories"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <MainLayout>
                <CategoryPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Accounts (ADMIN only) */}
        <Route
          path="/accounts"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <MainLayout>
                <AccountsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tours"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <MainLayout>
                <ToursPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tours/:id"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <MainLayout>
                <TourDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}