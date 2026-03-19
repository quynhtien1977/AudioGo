// giả lập database
let fakeUsers = [
  {
    name: "Jane Cooper",
    email: "jane.cooper@culinary.com",
    password: "123456",
    role: "ADMIN",
    id: "USR-9021",
    locked: false,
    createdAt: "2023-10-20T09:15:00Z",
    updatedAt: "2023-10-21T10:00:00Z",
  },
  {
    name: "Cody Fisher",
    email: "cody.fisher@thebistro.com",
    password: "123456",
    role: "MANAGER",
    id: "USR-8821",
    locked: false,
    createdAt: "2023-10-22T14:30:00Z",
    updatedAt: "2023-10-22T14:30:00Z",
  },
  {
    name: "Esther Howard",
    email: "esther.h@cafearua.com",
    password: "123456",
    role: "MANAGER",
    id: "USR-7712",
    locked: false,
    createdAt: "2023-10-23T08:00:00Z",
    updatedAt: "2023-10-24T10:05:00Z",
  },
  {
    name: "Esther Howard",
    email: "esther.h@cafearua.com",
    password: "123456",
    role: "MANAGER",
    id: "USR-7712",
    locked: false,
    createdAt: "2023-10-23T08:00:00Z",
    updatedAt: "2023-10-24T10:05:00Z",
  },
]

// GET
export const getUsersApi = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve([...fakeUsers]), 500)
  )

// CREATE - Tự động thêm timestamp
export const createUserApi = (newUser) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toISOString();
      const user = {
        ...newUser,
        password: "123456",
        id: "USR-" + Math.floor(Math.random() * 10000),
        locked: false,
        createdAt: now,
        updatedAt: now,
      }
      fakeUsers = [user, ...fakeUsers]
      resolve(user)
    }, 500)
  })

// LOCK - Cập nhật updatedAt khi thay đổi trạng thái
export const toggleLockApi = (id) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const user = fakeUsers.find((u) => u.id === id)
      if (user) {
        user.locked = !user.locked
        user.updatedAt = new Date().toISOString()
      }
      resolve(user)
    }, 400)
  })

// UPDATE ROLE - Cập nhật updatedAt
export const updateRoleApi = (id, role) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const user = fakeUsers.find((u) => u.id === id)
      if (user) {
        user.role = role
        user.updatedAt = new Date().toISOString()
      }
      resolve(user)
    }, 400)
  });