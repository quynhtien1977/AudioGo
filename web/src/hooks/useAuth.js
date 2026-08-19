import { useState, useMemo } from "react";
import { loginApi } from "@/api/authApi";

export default function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // useMemo: chỉ parse storage 1 lần khi mount, giữ reference ổn định
  // Tránh JSON.parse() tạo object mới mỗi render → gây infinite useEffect loop
  const user = useMemo(() => {
    const raw =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");
    const token = 
      localStorage.getItem("token") || 
      sessionStorage.getItem("token");

    if (!raw) return null;
    let parsedUser = JSON.parse(raw);

    // Xác thực role thật bằng cách giải mã JWT (tránh bị sửa ở client localStorage)
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        // Xử lý các token thiếu padding (base64url)
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const decodedPayload = JSON.parse(atob(base64));
        
        // ASP.NET lưu role bằng claim dài, đôi khi là 'role'
        const realRole = decodedPayload.role || decodedPayload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (realRole) {
          parsedUser.role = realRole;
        }
      } catch (err) {
        console.error("Token decode error:", err);
      }
    }

    return parsedUser;
  }, []);

  const login = async (identifier, password, rememberMe) => {
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

      return { token: res.token, user: userData };
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
  };

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    error,
  };
}