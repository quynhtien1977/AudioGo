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

  // return res.json();
  const data = await res.json();

  return {
    token: data.token,
    role: data.role,
    accountId: data.accountId,
    fullName: data.fullName,
    isLocked: data.isLocked,
  };
};
