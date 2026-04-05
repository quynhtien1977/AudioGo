import { useEffect, useState } from "react";
import { getContentsByPOI } from "@/api/contentApi";

const POIScript = ({ poiId, isEditing, value, onChange }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const data = await getContentsByPOI(poiId);
        const filtered = data.filter((c) => c.POI_ID === Number(poiId));
        const masterContent = filtered.find((c) => c.isMaster) || filtered[0];

        setContent(masterContent);

        // QUAN TRỌNG: Nếu form.script đang trống, hãy lấy nội dung cũ từ API đổ vào
        if (!value && masterContent?.Description) {
          onChange(masterContent.Description);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [poiId]);

  if (loading) return <p className="text-gray-400 italic">Loading script...</p>;

  return (
    <div className="w-full">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 flex-1">
          <h3 className="text-xl font-extrabold text-gray-700 whitespace-nowrap">
            Audio Script Content
          </h3>
          <div className="h-[1px] bg-gray-100 flex-1"></div>
        </div>
        {/* <button className="ml-4 text-[10px] font-black text-pink-400 uppercase tracking-[0.2em] hover:text-pink-600 transition-colors">
          AUTO-GENERATE
        </button> */}
      </div>

      {/* CONTENT BOX */}
      <div
        className={`transition-all duration-300 rounded-[32px] overflow-hidden
        ${isEditing 
          ? "bg-[#FFF5F7] border-2 border-dashed border-pink-200 shadow-inner" 
          : "bg-white border border-gray-100 shadow-sm p-8"
        }`}
      >
        {isEditing ? (
          <textarea
            // Sử dụng value từ props (form.script từ cha) để không mất nội dung
            value={value || ""} 
            onChange={(e) => onChange(e.target.value)}
            // 'resize-y' cho phép người dùng kéo thả độ cao ở góc dưới bên phải
            className="w-full min-h-[200px] p-8 bg-transparent text-gray-600 text-lg leading-relaxed italic 
                       outline-none resize-y border-none focus:ring-0
                       scrollbar-thin scrollbar-thumb-pink-200"
            placeholder="Nhập hoặc sửa nội dung thuyết minh cũ..."
          />
        ) : (
          <p className="text-gray-600 text-lg leading-relaxed italic font-medium">
            "{value || content?.Description || "Chưa có nội dung thuyết minh."}"
          </p>
        )}
      </div>

      {/* FOOTER HINT (Chỉ hiện khi đang edit) */}
      {isEditing && (
        <p className="text-[10px] text-gray-400 mt-2 ml-4 italic">
          * Bạn có thể kéo góc dưới bên phải để mở rộng khung soạn thảo.
        </p>
      )}
    </div>
  );
};

export default POIScript;