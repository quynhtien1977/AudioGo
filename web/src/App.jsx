import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/layouts/MainLayout";
import { SearchProvider } from "@/context/SearchContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

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
import AudioContentPage from "@/pages/AudioContentPage";
import ToursPage from "@/pages/ToursPage";
import TourDetailPage from "@/pages/TourDetailPage";
import CreateTourPage from "@/pages/CreateTourPage";
import ProfilePage from "@/pages/ProfilePage";
import DeviceTrackingPage from "@/pages/DeviceTrackingPage";
import AccessCodePage from "@/pages/AccessCodePage";

import DeviceActivityPage from "@/pages/DeviceActivityPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SubscriptionCheckoutPage from "@/pages/SubscriptionCheckoutPage";
import AdminSubscriptionDashboard from "@/pages/AdminSubscriptionDashboard";
import AdminTransactionDashboard from "@/pages/AdminTransactionDashboard";

import ProtectedRoute from "@/components/ProtectedRoute";
import NotFoundPage from "@/pages/NotFoundPage";
import ArticlesPage from "@/pages/ArticlesPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";

// Landing Page & Admin Settings
import LandingPage from "@/pages/landing/LandingPage";
import LandingSettingsPage from "@/pages/LandingSettingsPage";


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <SubscriptionProvider>
          <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#000',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              style: {
                background: '#10b981',
                color: '#fff',
              },
            },
            error: {
              style: {
                background: '#ef4444',
                color: '#fff',
            },
          },
        }}
      />
      <Routes>
        {/* ── Landing Page (PUBLIC) ── */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth public pages */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ── Legacy redirects – giữ để không 404 bookmark cũ ── */}
        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/pois" element={<Navigate to="/admin/pois" replace />} />
        <Route path="/pois/add" element={<Navigate to="/admin/pois/add" replace />} />
        <Route path="/pois/:id" element={<Navigate to="/admin/pois/:id" replace />} />
        <Route path="/tours" element={<Navigate to="/admin/tours" replace />} />
        <Route path="/tours/create" element={<Navigate to="/admin/tours/create" replace />} />
        <Route path="/tours/:id" element={<Navigate to="/admin/tours/:id" replace />} />
        <Route path="/categories" element={<Navigate to="/admin/categories" replace />} />
        <Route path="/audio" element={<Navigate to="/admin/audio" replace />} />
        <Route path="/cms/articles" element={<Navigate to="/admin/articles" replace />} />
        <Route path="/accounts" element={<Navigate to="/admin/accounts" replace />} />
        <Route path="/access-codes" element={<Navigate to="/admin/access-codes" replace />} />
        <Route path="/tracking" element={<Navigate to="/admin/tracking" replace />} />
        <Route path="/device-activity" element={<Navigate to="/admin/device-activity" replace />} />
        <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
        <Route path="/landing-settings" element={<Navigate to="/admin/landing" replace />} />
        <Route path="/profile" element={<Navigate to="/admin/profile" replace />} />
        <Route path="/poi/management" element={<Navigate to="/admin/pois/management" replace />} />
        <Route path="/poi/management/new" element={<Navigate to="/admin/pois/management/new" replace />} />
        <Route path="/poi/management/updates" element={<Navigate to="/admin/pois/management/updates" replace />} />
        <Route path="/poi/management/updates/:id" element={<Navigate to="/admin/pois/management/updates/:id" replace />} />
        <Route path="/poi/management/deletions" element={<Navigate to="/admin/pois/management/deletions" replace />} />
        <Route path="/subscription/checkout" element={<Navigate to="/admin/subscription/checkout" replace />} />
        <Route path="/pricing-plans" element={<Navigate to="/admin/dashboard" replace />} />

        {/* ════════════════════════════════════════
            ADMIN ROUTES – chuẩn hoá /admin/*
            ════════════════════════════════════════ */}

        {/* Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={["Admin", "Owner", "Editor"]}>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute roles={["Owner", "Editor"]}>
              <MainLayout>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POIs */}
        <Route
          path="/admin/pois"
          element={
            <ProtectedRoute roles={["Admin", "Owner", "Editor"]}>
              <MainLayout>
                <POIPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pois/add"
          element={
            <ProtectedRoute roles={["Owner"]}>
              <MainLayout>
                <AddPOIPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pois/:id"
          element={
            <ProtectedRoute roles={["Admin", "Owner"]}>
              <MainLayout>
                <POIDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pois/requests/:id"
          element={
            <ProtectedRoute roles={["Admin", "Owner"]}>
              <MainLayout>
                <POIDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* POI Management / Xét duyệt */}
        <Route
          path="/admin/pois/management"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POIManagementPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pois/management/new"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POINewListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pois/management/updates"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POIUpdateListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pois/management/updates/:id"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POIUpdateDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pois/management/deletions"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <POIDeletionListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Audio */}
        <Route
          path="/admin/audio"
          element={
            <ProtectedRoute roles={["Admin", "Owner", "Editor"]}>
              <MainLayout>
                <AudioContentPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Categories */}
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <CategoryPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Accounts */}
        <Route
          path="/admin/accounts"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <AccountsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Articles */}
        <Route
          path="/admin/articles"
          element={
            <ProtectedRoute roles={["Admin", "Editor"]}>
              <MainLayout>
                <ArticlesPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Access Codes */}
        <Route
          path="/admin/access-codes"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <AccessCodePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Tours */}
        <Route
          path="/admin/tours"
          element={
            <ProtectedRoute roles={["Admin", "Editor"]}>
              <MainLayout>
                <ToursPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tours/create"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <CreateTourPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tours/:id"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <TourDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Device Tracking */}
        <Route
          path="/admin/tracking"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <DeviceTrackingPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Device Activity */}
        <Route
          path="/admin/device-activity"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <DeviceActivityPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Analytics */}
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <AnalyticsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Subscription - Owner */}
        <Route
          path="/admin/subscription/checkout"
          element={
            <ProtectedRoute roles={["Owner"]}>
              <MainLayout>
                <SubscriptionCheckoutPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Subscription + Transactions - Admin */}
        <Route
          path="/admin/subscriptions"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <AdminSubscriptionDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/transactions"
          element={
            <ProtectedRoute roles={["Admin"]}>
              <MainLayout>
                <AdminTransactionDashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Landing Settings */}
        <Route
          path="/admin/landing"
          element={
            <ProtectedRoute roles={["Admin", "Editor"]}>
              <MainLayout>
                <LandingSettingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
        </SubscriptionProvider>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
