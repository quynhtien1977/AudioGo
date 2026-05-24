import React from "react";

export default function StatsCard({ title, value, sub, subtitle, icon, color, gradient }) {
  const displaySub = sub || subtitle;
  
  // Custom gradient or default clean border box
  const bgStyle = gradient
    ? `bg-gradient-to-br ${gradient}`
    : "bg-white border border-pink-100/30 shadow-sm";

  return (
    <div className={`p-5 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-md ${bgStyle} flex justify-between items-center`}>
      <div className="flex-1 text-left">
        <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
          {title}
        </span>
        <span className={`text-2xl md:text-3xl font-black block mt-1 text-gray-800 ${color || ""}`}>
          {value}
        </span>
        {displaySub && (
          <span className="text-xs text-gray-400 font-medium block mt-1">
            {displaySub}
          </span>
        )}
      </div>
      {icon && (
        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-pink-50 text-pink-500 border border-pink-100/20 flex-shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
}