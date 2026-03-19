import { useNavigate } from "react-router-dom"

export default function Topbar() {
  const navigate = useNavigate()

  // 🔥 Lấy user thật từ localStorage / sessionStorage
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"))

  const role = user?.role // "ADMIN" | "MANAGER"

  // 🔥 logout
  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    navigate("/")
  }

  // 🔥 switch role = logout + về login
  const handleSwitchRole = (targetRole) => {
    if (role === targetRole) return

    localStorage.clear()
    sessionStorage.clear()
    navigate("/")
  }

  // 🔥 map role hiển thị
  const displayRole =
    role === "ADMIN" ? "Admin" : "Manager"

  return (
    <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
      {/* Search */}
      <input
        placeholder="Search POIs, visitors, or tours..."
        className="w-1/3 px-4 py-2 rounded-full bg-gray-100 outline-none"
      />

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* ROLE SWITCH */}
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => handleSwitchRole("ADMIN")}
            className={`px-3 py-1 rounded-full text-sm hover:bg-gray-200 ${
              role === "ADMIN"
                ? "bg-pink-500 text-white"
                : "text-gray-500"
            }`}
          >
            Admin
          </button>

          <button
            onClick={() => handleSwitchRole("MANAGER")}
            className={`px-3 py-1 rounded-full text-sm hover:bg-gray-200 ${
              role === "MANAGER"
                ? "bg-pink-500 text-white"
                : "text-gray-500"
            }`}
          >
            Restaurant Manager
          </button>
        </div>

        {/* 🔥 Logout */}
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-pink-500 hover:text-white transition duration-200"
        >
          Logout
        </button>

        {/* 🔥 User Info */}
        <div className="text-right">
          <p className="font-semibold">{user?.name || "Guest"}</p>
          <p className="text-xs text-gray-400">{displayRole}</p>
        </div>
      </div>
    </div>
  )
}