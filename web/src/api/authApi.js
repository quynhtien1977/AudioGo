const BASE_URL = "http://localhost:5086/api";

export const loginApi = async (identifier, password) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier,
      password, 
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw err || "Đăng nhập thất bại";
  }

  const data = await res.json();

  return {
    token: data.token,
    role: data.role,
    accountId: data.accountId,
    fullName: data.fullName,
    isLocked: data.isLocked,
    mustChangePassword: data.mustChangePassword ?? false,
  };
};

// POST /api/auth/forgot-password
export const forgotPasswordApi = async (email) => {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw err || "Yêu cầu thất bại";
  }
  return res.json();
};

// POST /api/auth/reset-password
export const resetPasswordApi = async (token, newPassword) => {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw err || "Đặt lại mật khẩu thất bại";
  }
  return res.json();
};

// POST /api/auth/change-password  (cần JWT token)
export const changePasswordApi = async (oldPassword, newPassword) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw err || "Đổi mật khẩu thất bại";
  }
  return res.json();
};

// GET /api/auth/me — xác thực token và lấy role THẬT từ server (không tin localStorage)
export const getMeApi = async () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  if (!token) return null;

  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    // Token hết hạn hoặc không hợp lệ
    return null;
  }

  if (!res.ok) return null;

  return res.json(); // { accountId, username, fullName, role, email, phoneNumber, mustChangePassword }
};
