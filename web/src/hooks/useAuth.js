import { useState } from "react"

// import { loginApi, forgotPasswordApi } from "../api/authApi"
import { loginApi } from "@/api/authApi"

export default function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // const [message, setMessage] = useState(null) 

  const getUser = () => {
  const user =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

    return user ? JSON.parse(user) : null;
  };

  const user = getUser();

  const login = async (email, password, rememberMe) => {
    setLoading(true)
    setError(null)

    try {
      const res = await loginApi(email, password)

      // remember me logic
      if (rememberMe) {
        // lưu lâu dài
        localStorage.setItem("token", res.token)
        localStorage.setItem("user", JSON.stringify(res.user))
      } else {
        // lưu tạm thời
        sessionStorage.setItem("token", res.token)
        sessionStorage.setItem("user", JSON.stringify(res.user))
      }

      return res
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  

  // chức năng quên mật khẩu hiện đang để trống vì chưa có API thực tế, nếu có thể sẽ bổ sung sau 
  // const forgotPassword = async (email) => {
  //   setLoading(true)
  //   setError(null)
  //   setMessage(null)

  //   try {
  //     const res = await forgotPasswordApi(email)
  //     setMessage(res)
  //     return res
  //   } catch (err) {
  //     setError(err)
  //     throw err
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const logout = () => {
    localStorage.clear()
    sessionStorage.clear()
  }

  // return {
  //   login,
  //   logout,
  //   forgotPassword,
  //   loading,
  //   error,
  //   message,
  // }

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
    error,
  }
}