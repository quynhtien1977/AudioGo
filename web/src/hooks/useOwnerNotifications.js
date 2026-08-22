/**
 * useOwnerNotifications — #10
 * Polls Owner's own subscription status and fires toast alerts
 * when the subscription is about to expire.
 *
 * Runs once on mount + every 60 seconds.
 * Uses sessionStorage to avoid duplicate toasts in the same tab session.
 */
import { useEffect, useRef } from "react"
import toast from "react-hot-toast"
import { getMySubscriptionApi } from "@/api/subscriptionApi"

const POLL_INTERVAL_MS = 60_000  // 1 min
const SESSION_KEY = "owner_notify_last_shown"

export function useOwnerNotifications(user) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (!user || user.role !== "Owner") return

    const check = async () => {
      try {
        const sub = await getMySubscriptionApi()
        if (!sub || sub.status !== "ACTIVE") return

        const endDate = new Date(sub.endDate)
        const now     = new Date()
        const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))

        // Only notify once per session per threshold
        const lastShown = parseInt(sessionStorage.getItem(SESSION_KEY) || "0")
        const today     = Math.floor(Date.now() / 86_400_000)
        if (lastShown === today) return

        if (diffDays <= 0) {
          toast.error("Gói đăng ký của bạn đã hết hạn! Vui lòng gia hạn để tiếp tục sử dụng.", {
            duration: 8000,
            id: "sub_expired",
          })
          sessionStorage.setItem(SESSION_KEY, today.toString())
        } else if (diffDays <= 3) {
          toast.error(`Gói đăng ký hết hạn sau ${diffDays} ngày! Gia hạn ngay để tránh gián đoạn.`, {
            duration: 6000,
            id: "sub_expiring_critical",
          })
          sessionStorage.setItem(SESSION_KEY, today.toString())
        } else if (diffDays <= 7) {
          toast(`Gói đăng ký của bạn còn ${diffDays} ngày. Hãy gia hạn sớm.`, {
            duration: 5000,
            id: "sub_expiring_warning",
          })
          sessionStorage.setItem(SESSION_KEY, today.toString())
        }
      } catch {
        // Silently ignore — don't spam errors
      }
    }

    // Run immediately on mount
    check()

    // Poll every minute
    timerRef.current = setInterval(check, POLL_INTERVAL_MS)
    return () => clearInterval(timerRef.current)
  }, [user?.accountId, user?.role])
}
