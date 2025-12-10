// Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiUsers,
  FiFolder,
  FiHome,
  FiChevronDown,
  FiChevronRight,
  FiDatabase,
  FiSettings,
} from "react-icons/fi";

const Sidebar = () => {
  const location = useLocation();
  const isSubMenuActive = location.pathname.startsWith("/administration/");
  const [openAdmin, setOpenAdmin] = useState(isSubMenuActive);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "ENGINEER";

  const allMenus = [
    { name: "Dashboard", path: "/dashboard", icon: <FiHome size={18} /> },
    { name: "Project", path: "/project", icon: <FiFolder size={18} /> },
  ];

  let menuItems = [];

  if (role === "ADMIN") {
    menuItems = [
      ...allMenus,
      {
        name: "Administration",
        icon: <FiSettings size={18} />,
        children: [
          { name: "User Management", path: "/administration/user", icon: <FiUsers size={16} /> },
          { name: "Data Management", path: "/administration/data-project", icon: <FiDatabase size={16} /> },
        ],
      },
    ];
  } else {
    menuItems = allMenus;
  }

  useEffect(() => {
    if (role === "ADMIN") setOpenAdmin(isSubMenuActive);
  }, [location.pathname, role, isSubMenuActive]);

  const MenuItem = ({ item, isActive, isSubItem = false }) => {
    const iconClass = isActive
      ? "text-white"
      : "text-blue-700/80 group-hover:text-blue-800 transition-colors duration-200";

    const baseClasses = isSubItem
      ? "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200"
      : "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200";

    const activeClasses = isSubItem
      ? "bg-blue-600 text-white font-medium shadow-sm"
      : "bg-blue-600 text-white shadow-lg shadow-blue-500/50";

    const inactiveClasses = isSubItem
      ? "text-gray-700 hover:bg-blue-100 hover:text-blue-700"
      : "text-gray-800 hover:bg-blue-100 hover:text-blue-700";

    return (
      <Link
        to={item.path}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} group`}
      >
        <span className={iconClass}>{item.icon}</span>
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="w-64 h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 border-r border-gray-100 flex flex-col items-center pt-6 pb-4 shadow-xl font-sans transition-all duration-300">
      
      {/* Logo */}
      <div className="flex flex-col items-center mb-8 -mt-6">
        <img
          src="/april.png"
          alt="Logo"
          className="w-32 h-auto drop-shadow-lg transition-transform duration-300 hover:scale-[1.03] cursor-pointer will-change-transform"
        />
      </div>

      {/* Menu */}
<ul className="w-full px-4 space-y-3 flex-grow overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (location.pathname === "/" && item.path === "/project");

          // Menu dengan submenu
          if (item.children) {
            const isAnySubActive = item.children.some((sub) => location.pathname === sub.path);
            const isMenuOpen = openAdmin || isAnySubActive;

            return (
              <li key={item.name} className="flex flex-col">
                <button
                  onClick={() => setOpenAdmin(!openAdmin)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isMenuOpen
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/50"
                      : "text-gray-800 hover:bg-blue-100 hover:text-blue-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isMenuOpen ? "text-white" : "text-blue-700/80 group-hover:text-blue-800"}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  <span className={isMenuOpen ? "text-white" : "text-gray-400"}>
                    {isMenuOpen ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
                  </span>
                </button>

                {/* Submenu tanpa garis */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isMenuOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                  }`}
                >
<ul className="space-y-1.5 pl-2 mt-1.5">
                    {item.children.map((sub) => {
                      const isSubActive = location.pathname === sub.path;
                      return (
                        <li key={sub.path}>
                          <MenuItem item={sub} isActive={isSubActive} isSubItem />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </li>
            );
          }

          // Menu biasa
          return (
            <li key={item.path}>
              <MenuItem item={item} isActive={isActive} />
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <p className="text-[10px] text-gray-400 tracking-wider mt-2">
        © 2025 APRIL
      </p>
    </div>
  );
};

export default Sidebar;
