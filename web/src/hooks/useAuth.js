import { useState, useEffect, useCallback } from "react";
import { loginApi, getMeApi } from "@/api/authApi";

/**
 * useAuth — Hook xác thực người dùng.
 *
 * Thay vì đọc role trực tiếp từ localStorage (có thể bị sửa qua DevTools),
 * hook này gọi GET /api/auth/me khi app khởi động để lấy thông tin user thật
 * được xác thực bởi JWT trên server.
 *
 * Flow:
 * 1. App mount → đọc token từ storage
 * 2. Gọi /api/auth/me với token → lấy { accountId, username, fullName, role, ... }
 * 3. Set user state từ response (role đến từ server, không phải localStorage)
 * 4. Nếu 401 → clear storage → user = null → ProtectedRoute redirect /login
 */
export default function useAuth() {
  const [user, setUser]       = useState(null);
  const [authReady, setAuthReady] = useState(false); // true sau khi verify xong
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Xác thực token hiện tại với server
  const verifyToken = useCallback(async () => {
    try {
      const meData = await getMeApi();
      if (meData) {
        setUser({
          accountId:          meData.accountId,
          username:           meData.username,
          fullName:           meData.fullName,
          role:               meData.role,          // role từ server JWT, không thể giả mạo
          email:              meData.email,
          phoneNumber:        meData.phoneNumber,
          mustChangePassword: meData.mustChangePassword ?? false,
        });
      } else {
        throw new Error("Invalid token");
      }
    } catch (err) {
      // Token không hợp lệ hoặc hết hạn → clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      setUser(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  // Chạy 1 lần khi app mount
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      verifyToken();
    } else {
      setAuthReady(true); // không có token → không cần verify
    }
  }, [verifyToken]);

  const login = async (identifier, password, rememberMe) => {
    setLoading(true);
    setError(null);

    try {
      const res = await loginApi(identifier, password);

      if (res.isLocked === true) {
        throw "Tài khoản của bạn đã bị khóa";
      }

      // Lưu token (KHÔNG lưu role — role sẽ lấy từ /api/auth/me)
      if (rememberMe) {
        localStorage.setItem("token", res.token);
      } else {
        sessionStorage.setItem("token", res.token);
      }

      // Xác thực ngay sau login để lấy role thật từ server
      await verifyToken();

      return { token: res.token };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    authReady,        // dùng để hiển thị loading spinner trước khi verify xong
    login,
    logout,
    loading,
    error,
  };
}