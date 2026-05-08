// ============================================================
// Shared validators — dùng cho ProfilePage và CreateAccountModal
// ============================================================

/**
 * Kiểm tra số điện thoại Việt Nam (di động).
 * Hợp lệ: 10 số bắt đầu 0[3-9] hoặc +84[3-9] + 8 số.
 * VD hợp lệ: 0901234567, +84901234567
 */
export const isValidPhone = (phone) =>
  /^(0[3-9][0-9]{8}|(\+84)[3-9][0-9]{8})$/.test(phone?.trim() ?? "")

/**
 * Kiểm tra format email cơ bản (RFC-like).
 * VD hợp lệ: abc@gmail.com
 */
export const isValidEmailFormat = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email?.trim() ?? "")

/**
 * Kiểm tra domain email có tồn tại thực không qua DNS MX lookup.
 * Dùng Google DNS over HTTPS — không cần API key, không cần backend.
 * Xác nhận domain CÓ cấu hình nhận email (MX record).
 *
 * Nếu mất mạng hoặc lỗi fetch → trả true để không block người dùng.
 *
 * @param {string} email
 * @returns {Promise<boolean>}
 */
export const isEmailDomainValid = async (email) => {
  try {
    const trimmed = email?.trim() ?? ""
    const parts = trimmed.split("@")
    if (parts.length !== 2 || !parts[1]) return false

    const domain = parts[1]

    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      { signal: AbortSignal.timeout(5000) } // timeout 5s để không block quá lâu
    )

    if (!res.ok) return true // không check được → cho qua

    const data = await res.json()

    // Status 0 = NOERROR, Answer tồn tại → domain có MX record → nhận email được
    return data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0
  } catch {
    // Offline, timeout, hoặc CORS error → cho qua để không block
    return true
  }
}
