export default function Filter({ label, active, icon, onClick }) {
  return (
    <button
      onClick={onClick} 
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border hover:bg-pink-100 hover:text-pink-500 ${
        active ? "bg-pink-100 text-pink-500" : "bg-gray-50"
      }`}
    >
      {label} {icon}
    </button>
  )
}