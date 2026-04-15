import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "@/layouts/MainLayout";

import DashboardPage from "@/pages/DashboardPage";
import POIPage from "@/pages/POIPage";
import POIManagementPage from "@/pages/POIManagementPage";
import POINewListPage from "@/pages/POINewListPage";
import POIUpdateListPage from "@/pages/POIUpdateListPage";
import POIUpdateDetailPage from "@/pages/POIUpdateDetailPage";
import POIDeletionListPage from "@/pages/POIDeletionListPage";
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

        {/* POI REQUEST Detail */}
        <Route
          path="/pois/requests/:id"
          element={
            <ProtectedRoute roles={["Admin", "Owner"]}>
              <MainLayout>
                <POIDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POI Management (ADMIN only) */}
        <Route
          path="/poi/management"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POIManagementPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POI New List */}
        <Route
          path="/poi/management/new"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POINewListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POI Update List */}
        <Route
          path="/poi/management/updates"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POIUpdateListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POI Update Detail */}
        <Route
          path="/poi/management/updates/:id"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POIUpdateDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POI Deletion List */}
        <Route
          path="/poi/management/deletions"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POIDeletionListPage />
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