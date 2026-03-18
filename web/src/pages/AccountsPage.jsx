import { Pencil, Trash2 } from "lucide-react"

const users = [
  {
    name: "Jane Cooper",
    email: "jane.cooper@culinary.com",
    role: "ADMIN",
    lastLogin: "2023-10-24 09:15",
    id: "USR-9021",
    avatar: "https://i.pravatar.cc/40?img=1",
  },
  {
    name: "Cody Fisher",
    email: "cody.fisher@thebistro.com",
    role: "MANAGER",
    lastLogin: "2023-10-23 18:42",
    id: "USR-8821",
    avatar: "https://i.pravatar.cc/40?img=2",
  },
  {
    name: "Esther Howard",
    email: "esther.h@cafearua.com",
    role: "MANAGER",
    lastLogin: "2023-10-24 10:05",
    id: "USR-7712",
    avatar: "https://i.pravatar.cc/40?img=3",
  },
  {
    name: "Jenny Wilson",
    email: "jenny@admin-portal.com",
    role: "ADMIN",
    lastLogin: "2023-10-22 14:30",
    id: "USR-6540",
    avatar: "https://i.pravatar.cc/40?img=4",
  },
]

const roleStyle = (role) => {
  if (role === "ADMIN") return "bg-pink-100 text-pink-500"
  return "bg-blue-100 text-blue-500"
}

export default function AccountsPage() {
  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Account Manager</h1>
          <p className="text-gray-500 text-sm">
            Manage user list and system permissions
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg shadow hover:bg-pink-600">
          + Create new account
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* HEADER */}
        <div className="grid grid-cols-[2fr_3fr_1fr_2fr_1fr] text-xs text-pink-400 px-6 py-3 border-b font-medium">
          {/* <span>AVATAR</span> */}
          <span>FULL NAME</span>
          <span>EMAIL</span>
          <span>ROLE</span>
          <span>LAST LOGIN</span>
          <span className="text-right">ACTIONS</span>
        </div>

        {/* ROWS */}
        {users.map((user, i) => (
        <div
            key={i}
            className="grid grid-cols-[2fr_3fr_1fr_2fr_1fr] items-center px-6 py-4 border-b hover:bg-gray-50"
        >
            {/* AVATAR */}
            {/* <img
              src={user.avatar}
              className="w-10 h-10 rounded-full"
            /> */}

            {/* NAME */}
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-xs text-gray-400">ID: {user.id}</p>
            </div>

            {/* EMAIL */}
            <div className="text-gray-500 text-sm">
              {user.email}
            </div>

            {/* ROLE */}
            <div>
              <span
                className={`px-3 py-1 text-xs rounded-full font-medium ${roleStyle(
                  user.role
                )}`}
              >
                {user.role}
              </span>
            </div>

            {/* LAST LOGIN */}
            <div className="text-sm text-gray-500">
              {user.lastLogin}
            </div>

            {/* ACTION */}
            <div className="flex justify-end gap-3 text-gray-400">
              <Pencil size={16} className="cursor-pointer" />
              <Trash2 size={16} className="cursor-pointer" />
            </div>
          </div>
        ))}

        {/* FOOTER */}
        <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-400">
          <span>Showing 4 / 42 Users</span>

          <div className="flex items-center gap-2">
            <button>{"<"}</button>
            <button className="w-8 h-8 bg-pink-500 text-white rounded-full">
              1
            </button>
            <button>2</button>
            <button>3</button>
            <span>...</span>
            <button>10</button>
            <button>{">"}</button>
          </div>
        </div>
      </div>
    </div>
  )
}