import React, { useState, useRef, useEffect } from "react";
import { FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";

const Navbar = ({ user, onLogout, onProfile }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full h-16 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white flex justify-end items-center px-6 font-sans shadow-lg relative transition-all duration-300">
      {/* Welcome Text */}
      <span className="mr-3 text-[13px] tracking-wide">
        Welcome,{" "}
        <span className="font-semibold">{user?.name || "User"}</span>!
      </span>

      {/* User Icon Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="bg-white/20 hover:bg-white/30 p-2.5 rounded-full shadow-inner transition-all duration-200 backdrop-blur-md border border-white/30"
        >
          <FaUser className="text-white text-lg" />
        </button>

        {/* Dropdown Menu */}
        {open && (
          <div
            className="absolute right-0 mt-3 w-52 bg-white text-gray-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn border border-gray-100"
            style={{ animation: "fadeIn 0.2s ease-in-out" }}
          >
            <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-100">
  <div className="bg-blue-100 p-2 rounded-full">
    <FaUser className="text-blue-600" />
  </div>
  <div className="flex flex-col">
    <span className="font-semibold text-sm text-gray-700">
      {user?.name || "User"}
    </span>
  <span className="text-[10px] text-gray-500 tracking-wide">
  {(() => {
    const role = user?.role?.toLowerCase();
    switch (role) {
      case "admin":
        return "Admin";
      case "itbp":
        return "ITBP";
      case "itga":
        return "ITGA";
      case "sap":
        return "SAP";
      case "data_science":
      case "data science":
        return "Data Science";
      default:
        return "User";
    }
  })()}
</span>

  </div>
</div>


            <button
              onClick={() => {
                setOpen(false);
                onProfile?.();
              }}
              className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-blue-50 text-sm transition"
            >
              <FaCog className="text-blue-500" />
              <span>Profile Settings</span>
            </button>

            <hr className="my-1 border-gray-100" />

            <button
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
              className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-red-50 text-sm text-red-600 transition"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Animation for dropdown */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Navbar;
