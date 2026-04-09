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

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["Admin", "Owner"]}>
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
            <ProtectedRoute roles={["Admin", "Owner"]}>
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
            <ProtectedRoute roles={["Owner"]}>
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
            <ProtectedRoute roles={["Admin", "Owner"]}>
              <MainLayout>
                <POIDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/audio"
          element={
            <ProtectedRoute roles={["Owner"]}>
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
            <ProtectedRoute roles={["Admin"]}>
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
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <AccountsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tours"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <ToursPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tours/:id"
          element={
            <ProtectedRoute roles={["Admin"]}>
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