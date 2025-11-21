import React from "react";
import {
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoHelpCircleOutline,
  IoClose,
} from "react-icons/io5";

const Alert = ({ message, type = "success", onClose, actions }) => {
  const config = {
    success: {
      borderColor: "border-blue-300",
      textColor: "text-blue-700",
      bgColor: "bg-gradient-to-b from-white via-blue-50 to-blue-100",
      icon: <IoCheckmarkCircleOutline className="w-7 h-7 text-blue-500 mb-2" />,
      title: "Success",
    },
    error: {
      borderColor: "border-red-300",
      textColor: "text-red-700",
      bgColor: "bg-gradient-to-b from-white via-red-50 to-red-100",
      icon: <IoAlertCircleOutline className="w-7 h-7 text-red-500 mb-2" />,
      title: "Error",
    },
    confirm: {
      borderColor: "border-yellow-300",
      textColor: "text-gray-800",
      bgColor: "bg-gradient-to-b from-white via-yellow-50 to-yellow-100",
      icon: <IoHelpCircleOutline className="w-7 h-7 text-yellow-500 mb-2" />,
      title: "Confirmation",
    },
  };

  const currentConfig = config[type] || config.confirm;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div
        className={`relative p-5 ${currentConfig.bgColor} rounded-xl border ${currentConfig.borderColor} text-gray-800 flex flex-col items-center max-w-[20rem] w-11/12 shadow-lg transition-all duration-200 ease-out`}
      >
        {/* Tombol Close */}
        {!actions && onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-700 transition"
          >
            <IoClose className="w-5 h-5" />
          </button>
        )}

        {/* Ikon */}
        {currentConfig.icon}

        {/* Judul */}
        <h3 className={`text-base font-semibold mb-1 ${currentConfig.textColor}`}>
          {currentConfig.title}
        </h3>

        {/* Pesan */}
        <p className="text-center mb-5 text-[11px] text-gray-600 leading-snug px-2">
          {message}
        </p>

        {/* Tombol Aksi */}
        <div className="flex gap-2 justify-center w-full">
          {actions?.map((a, i) => (
            <button
              key={i}
              onClick={a.onClick}
              className={`flex-1 px-4 py-1.5 text-[11px] rounded-md font-medium transition-colors duration-200 ${
                a.type === "cancel"
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : type === "success"
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : type === "error"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
              }`}
            >
              {a.label}
            </button>
          ))}

          {/* Tombol Close default */}
          {!actions && onClose && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-[11px] rounded-md font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;
