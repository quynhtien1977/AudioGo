import { useNavigate, useLocation } from "react-router-dom"
import { Search } from "lucide-react"

export default function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()

  // Lấy user từ localStorage / sessionStorage
  const user =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"))

  const role = user?.role 

  // logout
  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    navigate("/")
  }

  // Determine placeholder text based on the current route
  const getPlaceholder = () => {
    if (location.pathname.includes("/poi")) {
      return "Tìm POIs...";
    } else if (location.pathname.includes("/account")) {
      return "Tìm Tài khoản...";
    } else if (location.pathname.includes("/categories")) {
      return "Tìm Thể loại...";
    }else if (location.pathname.includes("/tours")) {
      return "Tìm Tour...";
    }else if (location.pathname.includes("/audio")) {
      return "Tìm Audio...";
    }
    else {
      return "Tìm...";
    }
  }

  // Determine if the search bar should be displayed
  const shouldDisplaySearch = !location.pathname.includes("/dashboard");

  return (
    <div className="flex justify-between items-center px-6 py-4 border-b bg-white">

      {/* Search */}
      {shouldDisplaySearch && (
        <div className="relative w-1/3">
          <Search className="text-gray-400 w-5 h-5 absolute ml-3 mt-2" />
          <input
            placeholder={getPlaceholder()}
            className="w-full px-12 py-2 rounded-full bg-gray-100 outline-none"
          />
        </div>
      )}

      {/* Right */}
      <div className="flex items-center gap-4 ml-auto">

        {/* ROLE SWITCH */}
      
        {/*  Logout */}
        <button
          onClick={handleLogout}
          className="px-3 py-1 rounded-full text-sm bg-gray-200 hover:bg-pink-500 hover:text-white transition duration-200"
        >
          Logout
        </button>

        {/*  User Info */}
        <div className="text-right">
          <p className="font-semibold">{user.username}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
        </div>

      </div>

    </div>
  )
}