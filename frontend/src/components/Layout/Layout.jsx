// Layout.jsx
import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import ProfileSettings from "./ProfileSettings";

const Layout = ({ user, onLogout, children, setUser }) => {
  const [showProfile, setShowProfile] = useState(false);

  const handleOpenProfile = () => setShowProfile(true);
  const handleCloseProfile = () => setShowProfile(false);

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar
          user={user}
          onLogout={onLogout}
          onProfile={handleOpenProfile}
        />
        {/* Content tanpa border-radius & shadow */}
        <div className="p-4 flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {showProfile && (
        <ProfileSettings
          user={user}
          onClose={handleCloseProfile}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
};

export default Layout;
