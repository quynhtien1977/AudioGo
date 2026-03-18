import { useState } from "react"

export default function Topbar() {
  const [role, setRole] = useState("admin")

  return (
    <div className="flex justify-between items-center px-6 py-4 border-b bg-white">
      {/* Search */}
      <input
        placeholder="Search POIs, visitors, or tours..."
        className="w-1/3 px-4 py-2 rounded-full bg-gray-100 outline-none"
      />

      {/* Right */}
      <div className="flex items-center gap-4">
        {/*    ROLE SWITCH */}
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setRole("admin")}
            className={`px-3 py-1 rounded-full text-sm ${
              role === "admin"
                ? "bg-pink-500 text-white"
                : "text-gray-500"
            }`}
          >
            Admin
          </button>

          <button
            onClick={() => setRole("owner")}
            className={`px-3 py-1 rounded-full text-sm ${
              role === "owner"
                ? "bg-pink-500 text-white"
                : "text-gray-500"
            }`}
          >
            Restaurant Manager
          </button>
        </div>

        {/* User */}
        <div className="text-right">
          <p className="font-semibold">Sarah Jenkins</p>
          <p className="text-xs text-gray-400">
            {role === "admin" ? "Super Admin" : "Shop Owner"}
          </p>
        </div>
      </div>
    </div>
  )
}