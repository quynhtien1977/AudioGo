// import axios from "axios"

// const API_URL = "http://localhost:5086/api"

// const getToken = () =>
//   localStorage.getItem("token") || sessionStorage.getItem("token")

// // Create axios client for subscription API
// const client = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// })

// // Attach token to requests
// client.interceptors.request.use((config) => {
//   const token = getToken()
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// // Handle errors
// client.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     console.error("Subscription API Error:", err.response || err.message)
//     return Promise.reject(err)
//   }
// )

// // ======================
// // SUBSCRIPTION PLANS
// // ======================

// /**
//  * Get all subscription plans
//  * @returns {Promise<Array>} List of subscription plans with pricing tiers
//  */
// export const getSubscriptionPlansApi = async () => {
//   const res = await client.get("/cms/subscriptions/plans")
//   return res.data
// }

// /**
//  * Get specific subscription plan by ID
//  * @param {number} planId - Plan ID
//  * @returns {Promise<Object>} Subscription plan details
//  */
// export const getSubscriptionPlanByIdApi = async (planId) => {
//   const res = await client.get(`/cms/subscriptions/plans/${planId}`)
//   return res.data
// }

// // ======================
// // OWNER SUBSCRIPTIONS
// // ======================

// /**
//  * Get current owner's active subscription
//  * @returns {Promise<Object>} Current subscription details
//  */
// export const getMySubscriptionApi = async () => {
//   const res = await client.get("/cms/subscriptions/me")
//   return res.data
// }

// /**
//  * Create new subscription (checkout)
//  * @param {Object} payload - { planId, paymentMethodId }
//  * @returns {Promise<Object>} Payment transaction details
//  */
// export const createSubscriptionApi = async (payload) => {
//   const res = await client.post("/subscription/create", payload)
//   return res.data
// }

// /**
//  * Upgrade current subscription to a higher tier
//  * @param {Object} payload - { newPlanId }
//  * @returns {Promise<Object>} Upgraded subscription details
//  */
// export const upgradeSubscriptionApi = async (payload) => {
//   const res = await client.post("/subscription/upgrade", payload)
//   return res.data
// }

// // ======================
// // ADMIN - SUBSCRIPTIONS
// // ======================

// /**
//  * Get all owner subscriptions (Admin only)
//  * @param {number} page - Page number (1-indexed)
//  * @param {number} pageSize - Items per page
//  * @param {string} status - Filter by status: ACTIVE, EXPIRED, CANCELLED
//  * @param {number} accountId - Filter by owner account ID (optional)
//  * @returns {Promise<Object>} Paginated subscriptions
//  */
// export const getAllSubscriptionsApi = async (page = 1, pageSize = 10, status = null, accountId = null) => {
//   const params = { page, pageSize }
//   if (status) params.status = status
//   if (accountId) params.accountId = accountId
  
//   const res = await client.get("/admin/subscriptions", { params })
//   return res.data
// }

// /**
//  * Get owner's subscription details (Admin only)
//  * @param {number} accountId - Owner account ID
//  * @returns {Promise<Object>} Owner's subscription details
//  */
// export const getOwnerSubscriptionDetailsApi = async (accountId) => {
//   const res = await client.get(`/admin/subscriptions/${accountId}`)
//   return res.data
// }

// /**
//  * Manually update owner subscription (Admin only)
//  * @param {number} accountId - Owner account ID
//  * @param {Object} payload - Updated subscription data
//  * @returns {Promise<Object>} Updated subscription
//  */
// export const updateOwnerSubscriptionApi = async (accountId, payload) => {
//   const res = await client.put(`/admin/subscriptions/${accountId}`, payload)
//   return res.data
// }

// /**
//  * Manually expire subscription (Admin only)
//  * @param {number} accountId - Owner account ID
//  * @returns {Promise<Object>} Expiration result
//  */
// export const expireSubscriptionApi = async (accountId) => {
//   const res = await client.post(`/admin/subscriptions/${accountId}/expire`)
//   return res.data
// }

// // ======================
// // ADMIN - TRANSACTIONS
// // ======================

// /**
//  * Get all payment transactions (Admin only)
//  * @param {number} page - Page number (1-indexed)
//  * @param {number} pageSize - Items per page
//  * @param {string} status - Filter by status: PENDING, COMPLETED, FAILED
//  * @param {number} accountId - Filter by owner account ID (optional)
//  * @returns {Promise<Object>} Paginated transactions
//  */
// export const getAllTransactionsApi = async (page = 1, pageSize = 10, status = null, accountId = null) => {
//   const params = { page, pageSize }
//   if (status) params.status = status
//   if (accountId) params.accountId = accountId
  
//   const res = await client.get("/admin/transactions", { params })
//   return res.data
// }

// /**
//  * Get transaction details (Admin only)
//  * @param {number} transactionId - Transaction ID
//  * @returns {Promise<Object>} Transaction details
//  */
// export const getTransactionDetailsApi = async (transactionId) => {
//   const res = await client.get(`/admin/transactions/${transactionId}`)
//   return res.data
// }

// /**
//  * Manually refund transaction (Admin only)
//  * @param {number} transactionId - Transaction ID
//  * @param {Object} payload - { reason }
//  * @returns {Promise<Object>} Refund result
//  */
// export const refundTransactionApi = async (transactionId, payload) => {
//   const res = await client.post(`/admin/transactions/${transactionId}/refund`, payload)
//   return res.data
// }

// export default {
//   // Plans
//   getSubscriptionPlansApi,
//   getSubscriptionPlanByIdApi,
  
//   // Owner Subscriptions
//   getMySubscriptionApi,
//   createSubscriptionApi,
//   upgradeSubscriptionApi,
  
//   // Admin
//   getAllSubscriptionsApi,
//   getOwnerSubscriptionDetailsApi,
//   updateOwnerSubscriptionApi,
//   expireSubscriptionApi,
//   getAllTransactionsApi,
//   getTransactionDetailsApi,
//   refundTransactionApi
// }
import axios from "axios"

const API_URL = "http://localhost:5086/api"

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

    return res.data
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
    const res = await client.post(
      "/subscription/create",
      payload,
    )

    return res.data
  }

/**
 * Upgrade subscription
 */
export const upgradeSubscriptionApi =
  async (payload) => {
    const res = await client.post(
      "/subscription/upgrade",
      payload,
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
      "/admin/transactions",
      { params },
    )

    return res.data
  }

export const getTransactionDetailsApi =
  async (transactionId) => {
    const res = await client.get(
      `/admin/transactions/${transactionId}`,
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
  updateSubscriptionPlanApi,
  toggleSubscriptionPlanStatusApi,

  // Owner subscriptions
  getMySubscriptionApi,
  createSubscriptionApi,
  upgradeSubscriptionApi,

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