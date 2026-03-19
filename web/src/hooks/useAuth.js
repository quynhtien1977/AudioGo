  import { useState } from "react"
import { loginApi, forgotPasswordApi } from "../api/authApi"

export default function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const login = async (email, password, rememberMe) => {
    setLoading(true)
    setError(null)

    try {
      const res = await loginApi(email, password)

      // remember me logic
      if (rememberMe) {
        localStorage.setItem("token", res.token)
        localStorage.setItem("user", JSON.stringify(res.user))
      } else {
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

  const forgotPassword = async (email) => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await forgotPasswordApi(email)
      setMessage(res)
      return res
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.clear()
    sessionStorage.clear()
  }

  return {
    login,
    logout,
    forgotPassword,
    loading,
    error,
    message,
  }
}