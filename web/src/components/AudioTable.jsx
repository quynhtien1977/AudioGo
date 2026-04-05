import React, { useState, useRef } from "react";
import { Trash, Play, Pause, MapPin } from "lucide-react";

const AudioTable = ({ name, poi, audioUrl, onDelete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Xử lý Play/Pause
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Cập nhật thanh tiến trình
  const handleTimeUpdate = () => {
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration;
    if (total) {
      setProgress((current / total) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <tr className="group hover:bg-gray-50/80 transition-all border-b border-gray-50/50 last:border-none">
      
      {/* CỘT 1: POI ASSOCIATION (35%) */}
      <td className="py-5 pl-4 w-[35%]">
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-400" />
            <span className="font-bold text-gray-700 text-sm">{poi}</span>
          </div>
          <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1 pl-4">
             File: {name}
          </p>
        </div>
      </td>

      {/* CỘT 2: AUDIO PREVIEW (45%) */}
      <td className="py-5 w-[45%]">
        <div className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:border-pink-100 transition-all shadow-sm">
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onLoadedMetadata={handleLoadedMetadata}
          />
          
          <button
            onClick={togglePlay}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-pink-500 text-white rounded-full hover:bg-pink-600 shadow-md shadow-pink-100 transition-all active:scale-90"
          >
            {isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} className="ml-0.5" fill="currentColor" />
            )}
          </button>

          <div className="flex-1 space-y-1.5 pr-2">
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono font-bold text-gray-400 uppercase tracking-tighter">
              <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </td>

      {/* CỘT 3: ACTION (20%) */}
      <td className="py-5 pr-4 w-[20%] text-right">
        <div className="flex justify-end">
          <button
            onClick={onDelete}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm hover:shadow-none"
            title="Gửi yêu cầu xóa"
          >
            <Trash size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AudioTable;