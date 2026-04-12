import { useState } from "react";
import { loginApi } from "@/api/authApi";

export default function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getUser = () => {
    const user =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    return user ? JSON.parse(user) : null;
  };

  const user = getUser();

  const login = async (username, password, rememberMe) => {
    setLoading(true);
    setError(null);

    try {
      const res = await loginApi(username, password);

      if (res.isLocked === true) {
        throw "Tài khoản của bạn đã bị khóa";
      }

      const userData = {
        username: username, // LẤY TỪ INPUT
        role: res.role,
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