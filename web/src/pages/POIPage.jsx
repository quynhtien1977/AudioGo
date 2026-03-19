// import { Eye, MoreVertical, MapPin } from "lucide-react"

// const pois = [
//   {
//     name: "Le Petit Bistro",
//     cuisine: "French Cuisine",
//     location: "Paris, France",
//     priority: "HIGH",
//     status: "Published",
//     image: "https://source.unsplash.com/50x50/?bistro",
//   },
//   {
//     name: "Sushi Zen",
//     cuisine: "Authentic Japanese",
//     location: "Tokyo, Japan",
//     priority: "MEDIUM",
//     status: "Pending",
//     image: "https://source.unsplash.com/50x50/?sushi",
//   },
//   {
//     name: "Pasta Palace",
//     cuisine: "Rustic Italian",
//     location: "Rome, Italy",
//     priority: "LOW",
//     status: "Draft",
//     image: "https://source.unsplash.com/50x50/?pasta",
//   },
// ]

// // 🎯 helper style
// const getPriorityStyle = (p) => {
//   if (p === "HIGH") return "bg-red-100 text-red-500"
//   if (p === "MEDIUM") return "bg-blue-100 text-blue-500"
//   return "bg-gray-200 text-gray-500"
// }

// const getStatusStyle = (s) => {
//   if (s === "Published") return "bg-green-100 text-green-600"
//   if (s === "Pending") return "bg-yellow-100 text-yellow-600"
//   return "bg-gray-100 text-gray-500"
// }

// export default function POIPage() {
//   return (
//     <div>
//       {/* HEADER */}
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-2xl font-bold">POI Manager</h1>
//           <p className="text-gray-500 text-sm">
//             Showing all curated culinary spots for your audio tours.
//           </p>
//         </div>

//         <div className="flex gap-3">
//           {/* <button className="px-4 py-2 border border-pink-300 text-pink-500 rounded-lg hover:bg-pink-50">
//             Filter
//           </button> */}
//           <button className="px-4 py-2 bg-pink-500 text-white rounded-lg shadow hover:bg-pink-600 ">
//             + Create new POI
//           </button>
//         </div>
//       </div>

//       {/* TABS */}
//       <div className="flex gap-6 mb-4 text-sm">
//         <span className="text-pink-500 border-b-2 border-pink-500 pb-1 font-medium">
//           All POIs (42)
//         </span>
//         <span className="text-gray-400">Pending Approval (12)</span>
//         <span className="text-gray-400">Archived</span>
//       </div>

//       {/* TABLE CARD */}
//       <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
//         {/* HEADER */}
//         <div className="grid grid-cols-6 text-xs text-gray-400 px-6 py-3 border-b">
//           <span className="col-span-2">NAME</span>
//           <span>LOCATION</span>
//           <span>PRIORITY</span>
//           <span>STATUS</span>
//           <span className="text-right">ACTIONS</span>
//         </div>

//         {/* ROW */}
//         {pois.map((poi, i) => (
//           <div
//             key={i}
//             className="grid grid-cols-6 items-center px-6 py-4 border-b hover:bg-gray-50 transition"
//           >
//             {/* NAME */}
//             <div className="col-span-2 flex items-center gap-3">
//               <img
//                 src={poi.image}
//                 className="w-12 h-12 rounded-xl object-cover"
//               />
//               <div>
//                 <p className="font-semibold">{poi.name}</p>
//                 <p className="text-xs text-gray-400">{poi.cuisine}</p>
//               </div>
//             </div>

//             {/* LOCATION */}
//             <div className="flex items-center gap-1 text-gray-500 text-sm">
//               <MapPin size={14} />
//               {poi.location}
//             </div>

//             {/* PRIORITY */}
//             <div>
//               <span
//                 className={`px-3 py-1 text-xs rounded-full font-medium ${getPriorityStyle(
//                   poi.priority
//                 )}`}
//               >
//                 {poi.priority}
//               </span>
//             </div>

//             {/* STATUS */}
//             <div>
//               <span
//                 className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusStyle(
//                   poi.status
//                 )}`}
//               >
//                 {poi.status}
//               </span>
//             </div>

//             {/* ACTION */}
//             <div className="flex justify-end items-center gap-3 text-gray-400">
//               {poi.status === "Pending" ? (
//                 <button className="px-3 py-1 bg-pink-500 text-white text-xs rounded-lg hover:bg-pink-600">
//                   Approve Request
//                 </button>
//               ) : (
//                 <Eye size={16} className="cursor-pointer" />
//               )}
//               <MoreVertical size={16} className="cursor-pointer" />
//             </div>
//           </div>
//         ))}

//         {/* FOOTER */}
//         <div className="flex justify-between items-center px-6 py-4 text-sm text-gray-400">
//           <span>Showing 1 to 3 of 42 POIs</span>

//           <div className="flex items-center gap-2">
//             <button>{"<"}</button>
//             <button className="w-8 h-8 bg-pink-500 text-white rounded-full">
//               1
//             </button>
//             <button>2</button>
//             <button>3</button>
//             <button>{">"}</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

import React from 'react';
import { 
  MapPin, 
  Headphones, 
  BarChart3, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  ChevronRight,
  Map as MapIcon
} from 'lucide-react';

const POIPage = () => {
  // Dữ liệu giả lập cho bảng
  const poiData = [
    { id: '#POI-001', name: 'Quầy Phở Thìn', category: 'Ẩm thực', listens: '1,240', status: 'Active' },
    { id: '#POI-002', name: 'Khu Gốm Bát Tràng', category: 'Trải nghiệm', listens: '850', status: 'Active' },
    { id: '#POI-003', name: 'Nhà Hát Lớn', category: 'Di tích', listens: '2,100', status: 'Maintenance' },
    { id: '#POI-004', name: 'Cà Phê Giảng', category: 'Ẩm thực', listens: '960', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      {/* --- PHẦN 1: HEADER TRANG --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">POI Manager</h1>
          <p className="text-gray-500 font-medium">Quản lý các điểm thuyết minh và nội dung âm thanh trong khu vực.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-[#EE4B8E] hover:bg-[#D63A79] text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-pink-100 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          Thêm điểm POI mới
        </button>
      </div>

      {/* --- PHẦN 2: 3 STAT CARDS (Bỏ Map Health) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="bg-blue-500 p-4 rounded-2xl text-white shadow-lg shadow-blue-100">
            <MapPin className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tổng số POI</p>
            <p className="text-3xl font-black text-gray-900">128</p>
          </div>
        </div>

        {/* Card 2 - Tone hồng Dashboard */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="bg-[#EE4B8E] p-4 rounded-2xl text-white shadow-lg shadow-pink-100">
            <Headphones className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lượt nghe Audio</p>
            <p className="text-3xl font-black text-gray-900">45.2k</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-emerald-100">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Độ phủ sóng</p>
            <p className="text-3xl font-black text-gray-900">92%</p>
          </div>
        </div>
      </div>

      {/* --- PHẦN 3: BẢNG DANH SÁCH (THAY CHO MAP HEALTH) --- */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar của bảng */}
        <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900">Tất cả điểm POI</h2>
            <span className="bg-pink-50 text-[#EE4B8E] text-xs font-bold px-3 py-1 rounded-full border border-pink-100">
              {poiData.length} điểm
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-[#EE4B8E]" />
              <input 
                type="text" 
                placeholder="Tìm kiếm POI..." 
                className="pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-pink-100 outline-none w-64 transition-all"
              />
            </div>
            <button className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-pink-50 hover:text-[#EE4B8E] transition-all">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">ID</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Tên điểm tham quan</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Danh mục</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Lượt nghe</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Trạng thái</th>
                <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {poiData.map((poi, index) => (
                <tr key={index} className="hover:bg-pink-50/20 transition-all group">
                  <td className="px-8 py-5 text-sm font-bold text-[#EE4B8E]">{poi.id}</td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-100/50 flex items-center justify-center text-[#EE4B8E]">
                        <MapIcon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-900">{poi.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-gray-500 font-medium">{poi.category}</td>
                  <td className="px-8 py-5 text-sm font-black text-gray-700">{poi.listens}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      poi.status === 'Active' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-amber-100 text-amber-600'
                    }`}>
                      {poi.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-gray-300 hover:text-[#EE4B8E] transition-all">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer của bảng - Phân trang */}
        <div className="p-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-500 font-medium">Hiển thị 1-4 trên tổng số 128 điểm</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-[#EE4B8E]">Trước</button>
            <button className="px-4 py-2 text-sm font-bold bg-white shadow-sm border border-gray-100 rounded-lg text-[#EE4B8E]">1</button>
            <button className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-[#EE4B8E]">2</button>
            <button className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-[#EE4B8E]">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POIPage;