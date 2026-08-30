import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import toast, { Toaster, ToastBar } from "react-hot-toast";
import { X } from "lucide-react";

import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/layouts/MainLayout";
import { SearchProvider } from "@/context/SearchContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import ProtectedRoute from "@/components/ProtectedRoute";

// Eager load LandingPage for instant first render on public traffic
import LandingPage from "@/pages/landing/LandingPage";

// Lazy load Auth Pages
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// Lazy load Admin Pages (Heavy bundle isolation)
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const POIPage = lazy(() => import("@/pages/POIPage"));
const POIManagementPage = lazy(() => import("@/pages/POIManagementPage"));
const POINewListPage = lazy(() => import("@/pages/POINewListPage"));
const POIUpdateListPage = lazy(() => import("@/pages/POIUpdateListPage"));
const POIUpdateDetailPage = lazy(() => import("@/pages/POIUpdateDetailPage"));
const POIDeletionListPage = lazy(() => import("@/pages/POIDeletionListPage"));
const AccountsPage = lazy(() => import("@/pages/AccountsPage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const POIDetailPage = lazy(() => import("@/pages/POIDetailPage"));
const AddPOIPage = lazy(() => import("@/pages/AddPOIPage"));
const AudioContentPage = lazy(() => import("@/pages/AudioContentPage"));
const ToursPage = lazy(() => import("@/pages/ToursPage"));
const TourDetailPage = lazy(() => import("@/pages/TourDetailPage"));
const CreateTourPage = lazy(() => import("@/pages/CreateTourPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const DeviceTrackingPage = lazy(() => import("@/pages/DeviceTrackingPage"));
const AccessCodePage = lazy(() => import("@/pages/AccessCodePage"));
const DeviceActivityPage = lazy(() => import("@/pages/DeviceActivityPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const SubscriptionCheckoutPage = lazy(() => import("@/pages/SubscriptionCheckoutPage"));
const AdminSubscriptionDashboard = lazy(() => import("@/pages/AdminSubscriptionDashboard"));
const AdminTransactionDashboard = lazy(() => import("@/pages/AdminTransactionDashboard"));
const ArticlesPage = lazy(() => import("@/pages/ArticlesPage"));
const LandingSettingsPage = lazy(() => import("@/pages/LandingSettingsPage"));
const BannersPage = lazy(() => import("@/pages/BannersPage"));
const AppSettingsPage = lazy(() => import("@/pages/AppSettingsPage"));
const AdminBroadcastPage = lazy(() => import("@/pages/AdminBroadcastPage"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D1A]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-pink-500/20 border-t-pink-500 animate-spin" />
        <span className="text-white/40 text-xs font-medium tracking-wider">Đang tải...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <SubscriptionProvider>
            <TooltipProvider delayDuration={200}>
              <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#1f2937',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontWeight: '500',
                  },
                  success: {
                    style: {
                      background: '#10b981',
                      color: '#fff',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#10b981',
                    },
                  },
                  error: {
                    style: {
                      background: '#ef4444',
                      color: '#fff',
                    },
                    iconTheme: {
                      primary: '#fff',
                      secondary: '#ef4444',
                    },
                  },
                }}
              >
                {(t) => (
                  <ToastBar toast={t}>
                    {({ icon, message }) => (
                      <div className="flex items-center gap-2.5 w-full">
                        {icon}
                        <div className="flex-1 text-xs sm:text-sm font-medium leading-snug">
                          {message}
                        </div>
                        {t.type !== "loading" && (
                          <button
                            type="button"
                            onClick={() => toast.dismiss(t.id)}
                            className="p-1 -mr-1 rounded-md hover:bg-black/10 transition-colors opacity-70 hover:opacity-100 flex items-center justify-center cursor-pointer text-current flex-shrink-0"
                            title="Đóng thông báo"
                            aria-label="Đóng thông báo"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </ToastBar>
                )}
              </Toaster>
            <Suspense fallback={<PageLoader />}>
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
                <Route path="/banners" element={<Navigate to="/admin/banners" replace />} />
                <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
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
                    <ProtectedRoute roles={["Admin", "Owner", "Editor"]}>
                      <MainLayout>
                        <POIDetailPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/pois/requests/:id"
                  element={
                    <ProtectedRoute roles={["Admin", "Owner", "Editor"]}>
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
                    <ProtectedRoute roles={["Admin", "Editor"]}>
                      <MainLayout>
                        <CreateTourPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/tours/:id"
                  element={
                    <ProtectedRoute roles={["Admin", "Editor"]}>
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

                {/* Banners & App Settings */}
                <Route
                  path="/admin/banners"
                  element={
                    <ProtectedRoute roles={["Admin", "Editor"]}>
                      <MainLayout>
                        <BannersPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute roles={["Admin"]}>
                      <MainLayout>
                        <AppSettingsPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* Broadcast & Notifications */}
                <Route
                  path="/admin/notifications"
                  element={
                    <ProtectedRoute roles={["Admin"]}>
                      <MainLayout>
                        <AdminBroadcastPage />
                      </MainLayout>
                    </ProtectedRoute>
                  }
                />

                {/* 404 */}
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            </TooltipProvider>
          </SubscriptionProvider>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
