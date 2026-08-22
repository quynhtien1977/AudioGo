import axios from "axios"

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5086/api")

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token")

// ======================
// AXIOS CLIENT
// ======================

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach token
client.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization =
      `Bearer ${token}`
  }

  return config
})

// Handle errors
client.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(
      "Subscription API Error:",
      err.response || err.message,
    )

    return Promise.reject(err)
  },
)

// ======================
// SUBSCRIPTION PLANS
// ======================

/**
 * Get all subscription plans
 */
export const getSubscriptionPlansApi =
  async () => {
    const res = await client.get(
      "/cms/subscriptions/plans",
    )

    return res.data
  }

/**
 * Get specific plan by id
 */
export const getSubscriptionPlanByIdApi =
  async (planId) => {
    const res = await client.get(
      `/cms/subscriptions/plans/${planId}`,
    )

    return res.data
  }

/**
 * GET /cms/subscriptions/poi-grace-status
 * Owner kiểm tra grace period sau downgrade gói (có POI vượt giới hạn).
 * Trả về { inGracePeriod, hoursLeft, activePois, maxAllowed, excessPois, planName, message }
 */
export const getPoiGraceStatusApi = async () => {
  const res = await client.get("/cms/subscriptions/poi-grace-status")
  return res.data
}

/**
 * CREATE NEW PLAN
 * ADMIN ONLY
 */
export const createSubscriptionPlanApi =
  async (payload) => {
    const res = await client.post(
      "/cms/subscriptions/plans",
      payload,
    )

    return res.data?.plan || res.data
  }

// ======================
// ADMIN - UPDATE PLAN
// ======================

/**
 * Update subscription plan
 * ADMIN ONLY
 */
export const updateSubscriptionPlanApi =
  async (planId, payload) => {
    const res = await client.put(
      `/cms/subscriptions/plans/${planId}`,
      payload,
    )

    return res.data?.plan || res.data
  }

/**
 * Toggle active/inactive plan
 * ADMIN ONLY
 */
export const toggleSubscriptionPlanStatusApi =
  async (planId) => {
    const res = await client.put(
      `/cms/subscriptions/plans/${planId}/toggle`,
    )

    return res.data
  }

/**
 * Delete subscription plan permanently
 * ADMIN ONLY — only allowed if no active subscriptions
 */
export const deleteSubscriptionPlanApi =
  async (planId) => {
    const res = await client.delete(
      `/cms/subscriptions/plans/${planId}`,
    )

    return res.data
  }

// ======================
// OWNER SUBSCRIPTIONS
// ======================

/**
 * Get current owner's subscription
 */
export const getMySubscriptionApi =
  async () => {
    const res = await client.get(
      "/cms/subscriptions/me",
    )

    return res.data
  }

/**
 * Create new subscription
 */
export const createSubscriptionApi =
  async (payload) => {
    const planId =
      payload?.subscriptionPlanId ||
      payload?.planId ||
      payload?.PlanId
    const res = await client.post(
      "/cms/subscriptions/upgrade/init",
      {
        planId,
        gateway: "SEPAY",
      },
    )

    return res.data
  }

/**
 * Upgrade subscription
 */
export const upgradeSubscriptionApi =
  async (payload) => {
    const planId =
      typeof payload === "string"
        ? payload
        : (payload?.subscriptionPlanId || payload?.planId || payload?.PlanId)
    const res = await client.post(
      "/cms/subscriptions/upgrade/init",
      {
        planId,
        gateway: "SEPAY",
      },
    )

    return res.data
  }

/**
 * Init owner upgrade transaction (gateway payment)
 * OWNER ONLY
 */
export const initUpgradeSubscriptionApi = async (
  planId,
  gateway = "SEPAY",
) => {
  const res = await client.post(
    "/cms/subscriptions/upgrade/init",
    {
      planId,
      gateway,
    },
  )

  return res.data
}

// ======================
// ADMIN - SUBSCRIPTIONS
// ======================

export const getAllSubscriptionsApi =
  async (
    page = 1,
    pageSize = 10,
    status = null,
    accountId = null,
  ) => {
    const params = {
      page,
      pageSize,
    }

    if (status)
      params.status = status

    if (accountId)
      params.accountId = accountId

    const res = await client.get(
      "/admin/subscriptions",
      { params },
    )

    return res.data
  }

export const getOwnerSubscriptionDetailsApi =
  async (accountId) => {
    const res = await client.get(
      `/admin/subscriptions/${accountId}`,
    )

    return res.data
  }

export const updateOwnerSubscriptionApi =
  async (accountId, payload) => {
    const res = await client.put(
      `/admin/subscriptions/${accountId}`,
      payload,
    )

    return res.data
  }

export const expireSubscriptionApi =
  async (accountId) => {
    const res = await client.post(
      `/admin/subscriptions/${accountId}/expire`,
    )

    return res.data
  }

// ======================
// ADMIN - TRANSACTIONS
// ======================

export const getAllTransactionsApi =
  async (
    page = 1,
    pageSize = 10,
    status = null,
    accountId = null,
  ) => {
    const params = {
      page,
      pageSize,
    }

    if (status)
      params.status = status

    if (accountId)
      params.accountId = accountId

    const res = await client.get(
      "/cms/payments",
      { params },
    )

    return res.data
  }

/**
 * Owner: xem lịch sử giao dịch của chính mình
 */
export const getMyTransactionsApi = async (page = 1, pageSize = 20) => {
  const res = await client.get("/cms/payments/my", { params: { page, pageSize } })
  return res.data
}

/**
 * Admin: đếm subscriptions sắp hết hạn
 */
export const getExpiringSubscriptionsApi = async (days = 7) => {
  const res = await client.get("/cms/subscriptions/expiring", { params: { days } })
  return res.data
}

export const getTransactionDetailsApi =
  async (transactionId) => {
    const res = await client.get(
      `/cms/payments/${transactionId}`,
    )

    return res.data
  }

export const refundTransactionApi =
  async (
    transactionId,
    payload,
  ) => {
    const res = await client.post(
      `/admin/transactions/${transactionId}/refund`,
      payload,
    )

    return res.data
  }

// ======================
// EXPORT DEFAULT
// ======================

export default {
  // Plans
  getSubscriptionPlansApi,
  getSubscriptionPlanByIdApi,
  createSubscriptionPlanApi,
  updateSubscriptionPlanApi,
  toggleSubscriptionPlanStatusApi,
  deleteSubscriptionPlanApi,

  // Owner subscriptions
  getMySubscriptionApi,
  createSubscriptionApi,
  upgradeSubscriptionApi,
  initUpgradeSubscriptionApi,

  // Admin subscriptions
  getAllSubscriptionsApi,
  getOwnerSubscriptionDetailsApi,
  updateOwnerSubscriptionApi,
  expireSubscriptionApi,

  // Transactions
  getAllTransactionsApi,
  getTransactionDetailsApi,
  refundTransactionApi,
}
