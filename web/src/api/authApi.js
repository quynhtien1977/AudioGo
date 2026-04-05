  // giả lập database
  const fakeUsers = [
    {
      email: "admin@gmail.com",
      password: "123456",
      role: "ADMIN",
      name: "Admin User",
    },
    {
      email: "manager@gmail.com",
      password: "123456",
      role: "MANAGER",
      name: "Manager User",
    },
  ]

  // fake login API
  export const loginApi = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = fakeUsers.find(
          (u) => u.email === email && u.password === password
        )

        if (!user) {
          reject("Tên đăng nhập hoặc mật khẩu không đúng")
        } else {
          resolve({
            token: "fake-jwt-token-123",
            user: {
              name: user.name,
              email: user.email,
              role: user.role,
            },
          })
        }
      }, 800) // giả lập delay
    })
  }

// fake forgot password API 
// export const forgotPasswordApi = (email) => {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       const user = fakeUsers.find((u) => u.email === email)

//       if (!user) {
//         reject("Email does not exist")
//       } else {
//         resolve("feature in development")
//       }
//     }, 1000)
//   })
// }   