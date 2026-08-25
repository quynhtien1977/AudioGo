import { createContext, useContext, useState, useCallback } from "react";
import { loginApi } from "@/api/authApi";

const AuthContext = createContext(null);

// Đọc user từ storage và decode JWT để lấy role thật
function readUserFromStorage() {
  const raw   = localStorage.getItem("user") || sessionStorage.getItem("user");
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!raw) return null;

  let parsedUser;
  try {
    parsedUser = JSON.parse(raw);
  } catch {
    return null;
  }

  if (token) {
    try {
      // Giải mã JWT payload (base64url) để lấy role thật, tránh bị sửa ở localStorage
      const base64  = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      const realRole =
        payload.role ||
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (realRole) parsedUser.role = realRole;
    } catch {
      // Token malformed — giữ nguyên role từ storage
    }
  }

  return parsedUser;
}

export function AuthProvider({ children }) {
  // lazy initializer: chạy đúng 1 lần khi mount, đọc từ storage
  const [user, setUser]       = useState(() => readUserFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const login = useCallback(async (identifier, password, rememberMe) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginApi(identifier, password);

      if (res.isLocked === true) {
        throw "Tài khoản của bạn đã bị khóa";
      }

      const userData = {
        username: identifier,
        fullName: res.fullName,
        role: res.role,
        accountId: res.accountId,
        mustChangePassword: res.mustChangePassword ?? false,
      };

      if (rememberMe) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        sessionStorage.setItem("token", res.token);
        sessionStorage.setItem("user", JSON.stringify(userData));
      }

      // Update shared state ngay — SubscriptionContext sẽ trigger fetch subscription
      const freshUser = readUserFromStorage();
      setUser(freshUser);

      return { token: res.token, user: userData };
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  }, []);

  // Đọc lại user từ storage — dùng sau khi ProfilePage cập nhật thông tin
  const refreshUser = useCallback(() => {
    setUser(readUserFromStorage());
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within <AuthProvider>");
  }
  return ctx;
}
