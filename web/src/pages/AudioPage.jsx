import React, { useState, useEffect } from "react";
import { UploadCloud, Sparkles, Search, Filter, X, Music, Trash2, AlertCircle } from "lucide-react";

import AudioTable from "@/components/AudioTable";
import ConfirmModal from "@/components/ConfirmModal";
import { getAudios, uploadAudio, generateAudio } from "@/api/audioApi";

const voices = [
  { id: 1, name: "Emily", img: "https://i.pravatar.cc/100?img=5" },
  { id: 2, name: "Marcus", img: "https://i.pravatar.cc/100?img=12" },
  { id: 3, name: "Sofia", img: "https://i.pravatar.cc/100?img=20" },
];

const AudioContent = () => {
  // Logic State
  const [selectedVoice, setSelectedVoice] = useState(1);
  const [script, setScript] = useState("");
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [showDeleteNotify, setShowDeleteNotify] = useState(false);

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAudios();
        setAudios(data || []);
      } catch (error) {
        console.error("Failed to fetch audios", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ================= HANDLERS =================
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const newAudios = await uploadAudio(files);
    setAudios((prev) => [...newAudios, ...prev]);
  };

  const handleGenerate = async () => {
    if (!script.trim()) return;
    const newAudio = await generateAudio(script, selectedVoice);
    setAudios((prev) => [newAudio, ...prev]);
    setScript("");
  };

  // Xử lý logic xóa (Hiện thông báo thay vì xóa trực tiếp)
  const handleDeleteRequest = () => {
    setShowDeleteNotify(true);
  };

  return (
    <div className="p-8 bg-[#FDF8FA]/50 min-h-screen space-y-8 font-sans text-gray-800">
      {/* HEADER & TOP STATS */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">QUẢN LÝ AUDIO</h1>
          <p className="text-gray-500 mt-1 font-medium">Quản lý và tạo audio cho các điểm đến của bạn.</p>
        </div>

        <div className="flex gap-4">
          <StatCard label="Tổng số lượng audio" value={audios.length} icon="🎵" />
          <StatCard label="Dung lượng sử dụng" value="4.2 GB" subValue="/ 10GB" icon="☁️" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT: AI GENERATION */}
        <div className="col-span-5 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-8">
          <div className="flex items-center gap-2">
            <Sparkles className="text-pink-500" size={20} />
            <h2 className="font-bold text-lg">AI Audio Generation</h2>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-4 uppercase">Chọn Giọng Nói Cho Audio</p>
            <div className="flex gap-4">
              {voices.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`flex-1 cursor-pointer p-4 rounded-2xl border-2 transition-all text-center
                    ${selectedVoice === v.id ? "border-pink-500 bg-pink-50/50" : "border-gray-50 bg-gray-50/50"}`}
                >
                  <img src={v.img} alt={v.name} className="w-12 h-12 rounded-full mx-auto mb-3 shadow-sm" />
                  <p className={`text-sm font-bold ${selectedVoice === v.id ? "text-pink-600" : "text-gray-400"}`}>{v.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-3 uppercase">Mô tả</p>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full h-32 p-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-pink-100 text-sm italic resize-none"
              placeholder="Nhập nội dung..."
            />
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-gradient-to-r from-[#D81B60] to-[#EC4899] text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-100 active:scale-[0.98] transition-all"
          >
            <Sparkles size={18} /> Tạo File Audio
          </button>
        </div>

        {/* RIGHT: UPLOAD & LIBRARY */}
        <div className="col-span-7 space-y-8">
          <label className="border-2 border-dashed border-pink-100 rounded-[2.5rem] p-12 text-center bg-white relative group cursor-pointer hover:bg-pink-50/30 transition-all block">
            <input type="file" multiple accept="audio/*" onChange={handleUpload} className="hidden" />
            <div className="absolute top-6 right-8">
              <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-pink-500">
                <UploadCloud size={20} />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-2">Tải lên Audio Mới</h3>
            <p className="text-gray-400 text-sm">
              Kéo và thả tệp vào đây, hoặc <span className="text-pink-500 font-bold underline">duyệt</span> tệp cục bộ.
            </p>
          </label>

          {/* REFACTORED LIBRARY TABLE */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="font-bold text-xl text-gray-800 tracking-tight">Danh sách Audio</h3>
              <div className="flex gap-3">
                {/* <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-pink-50 hover:text-pink-500 transition-all border border-gray-100">
                  <Filter size={18} />
                </button>
                <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-pink-50 hover:text-pink-500 transition-all border border-gray-100">
                  <Search size={18} />
                </button> */}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-0">
                <thead>
                  <tr className="text-[10px] text-gray-400 font-bold tracking-[0.15em] border-b border-gray-50 uppercase">
                    <th className="pb-4 pl-4 w-[35%]">Tên POI</th>
                    <th className="pb-4 w-[45%] text-center">Audio</th>
                    <th className="pb-4 pr-4 w-[20%] text-right">Hành động</th>
                  </tr>
                </thead>
                
                <tbody className="text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan="3" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
                          <p className="text-gray-400 font-medium animate-pulse">Loading library assets...</p>
                        </div>
                      </td>
                    </tr>
                  ) : audios.length > 0 ? (
                    audios.slice(0, 3).map((a) => (
                      <AudioTable 
                        key={a.id} 
                        name={a.name} 
                        poi={a.poi || "General"} 
                        audioUrl={a.url} 
                        onDelete={handleDeleteRequest} // Gọi logic thông báo
                        // Bỏ onEdit vì yêu cầu chỉ còn nút xóa
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-16 text-center text-gray-400 italic">
                        No audio files found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-center mt-8 pt-4 border-t border-gray-50">
              <button
                onClick={() => setShowPopup(true)}
                className="group inline-flex items-center gap-2 text-pink-500 font-bold text-[11px] hover:text-pink-600 uppercase tracking-[0.2em] transition-all"
              >
                Xem tất cả
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL VIEW ALL */}
      <ConfirmModal
        open={showPopup}
        title={null}
        onConfirm={() => setShowPopup(false)}
        confirmText="Đóng"
        message={
          <div className="w-full max-w-4xl text-left">
            {/* HEADER CỦA MODAL */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-black text-gray-800">Danh sách Audio</h2>
                <p className="text-sm text-gray-400 font-medium mt-1">
                  Quản lý toàn bộ {audios.length} tệp tin trong hệ thống
                </p>
              </div>
              <div className="bg-pink-50 text-pink-600 text-xs font-bold px-4 py-2 rounded-xl">
                {audios.length} files audio
              </div>
            </div>

            {/* TABLE TRONG MODAL */}
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-0">
                <thead>
                  <tr className="text-[10px] text-gray-400 font-bold tracking-[0.15em] border-b border-gray-50 uppercase sticky top-0 bg-white z-10">
                    <th className="pb-4 pl-4 w-[30%]">Tên POI</th>
                    <th className="pb-4 w-[55%] text-center">Audio</th>
                    <th className="pb-4 pr-4 w-[15%] text-right">Hành động</th>
                  </tr>
                </thead>
                
                <tbody className="text-sm">
                  {audios.map((a) => (
                    <AudioTable 
                      key={a.id} 
                      name={a.name} 
                      poi={a.poi || "Chưa gán"} 
                      audioUrl={a.url} 
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </tbody>
              </table>

              {audios.length === 0 && (
                <div className="py-20 text-center text-gray-400 italic">
                  Danh sách hiện đang trống.
                </div>
              )}
            </div>
          </div>
        }
      />

      {/* NOTIFICATION MODAL FOR DELETE REQUEST */}
      <ConfirmModal
        open={showDeleteNotify}
        title={null}
        onConfirm={() => setShowDeleteNotify(false)}
        confirmText="Đã hiểu"
        message={
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Yêu cầu xóa đã được gửi</h2>
            <p className="text-gray-500 text-sm px-6">
              Hệ thống đã ghi nhận yêu cầu xóa tệp âm thanh của bạn. 
              Yêu cầu này sẽ được gửi đến <strong>Quản trị viên (Admin)</strong> để phê duyệt trước khi tệp bị xóa vĩnh viễn.
            </p>
          </div>
        }
      />
    </div>
  );
};

const StatCard = ({ label, value, icon, subValue }) => (
  <div className="bg-white p-4 px-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 min-w-[210px] text-left">
    <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-lg">{icon}</div>
    <div className="text-left">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-1">
        <h4 className="text-2xl font-black text-gray-800">{value}</h4>
        {subValue && <span className="text-[10px] text-gray-300 font-bold">{subValue}</span>}
      </div>
    </div>
  </div>
);

export default AudioContent;