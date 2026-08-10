import React from "react";

export default function PageHeader({ title, description, icon, actionButton, actions }) {
  const slot = actions ?? actionButton
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2.5 bg-pink-50 rounded-xl text-pink-500 flex-shrink-0 shadow-sm border border-pink-100/50">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-500 mt-1 font-medium leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {slot && (
        <div className="self-start md:self-auto flex-shrink-0">
          {slot}
        </div>
      )}
    </div>
  );
}
