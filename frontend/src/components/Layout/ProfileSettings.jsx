import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  IoClose,
  IoSave,
  IoPerson,
  IoLockClosedOutline as IoLock,
  IoPersonCircleOutline as IoPersonCircle,
} from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const ProfileSettings = ({ user, onClose, onUpdateUser }) => {
  const [userData, setUserData] = useState({
    SAP: "",
    name: "",
    username: "",
    position_name: "",
    role_name: "",
  });

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});

  const PRIMARY_COLOR = "bg-blue-700";
  const HOVER_COLOR = "hover:bg-blue-800";
  const SAVE_COLOR = "bg-green-600";
  const SAVE_HOVER = "hover:bg-green-700";

  // 🔹 Fetch profile data
  useEffect(() => {
    if (!user?.SAP) return;
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/users/${user.SAP}`);

        const formatRole = (role) => {
          const roleValue = typeof role === "object" ? role.role : role;
          if (!roleValue || typeof roleValue !== "string") return "";
          const map = {
            ADMIN: "Admin",
            ITBP: "ITBP",
            ITGA: "ITGA",
            SAP: "SAP",
            DATASCIENCE: "Data Science",
            DATA_SCIENCE: "Data Science",
          };
          return map[roleValue.toUpperCase()] || roleValue;
        };

        setUserData({
          SAP: res.data.SAP,
          name: res.data.name,
          username: res.data.username,
          position_name: res.data.position?.position || "",
          role_name: formatRole(res.data.role),
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [user]);

  // 🔹 Validate input
  const validate = () => {
    const newErrors = {};
    if (!userData.name) newErrors.name = "Name is required";
    if (!userData.username) newErrors.username = "Username is required";

    if ((newPassword || confirmPassword) && !oldPassword)
      newErrors.oldPassword = "Current password is required";
    if (newPassword && newPassword !== confirmPassword)
      newErrors.confirmPassword = "New password and confirmation do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔹 Update user profile
  const handleUpdate = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setAlert({
      message: "Are you sure you want to update your profile?",
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        {
          label: "Confirm",
          type: "confirm",
       onClick: async () => {
  setLoading(true);
  setAlert(null);
  try {
    const body = {
      name: userData.name,
      username: userData.username,
    };

    if (oldPassword && newPassword && confirmPassword) {
      body.oldPassword = oldPassword;
      body.newPassword = newPassword;
    }

    const res = await axios.patch(
      `http://localhost:5000/users/${user.SAP}`,
      body
    );

    // ✅ Tambahkan ini supaya Dashboard langsung baca data terbaru
    localStorage.setItem("user", JSON.stringify(res.data));

    onUpdateUser?.(res.data);
    setAlert({
      message: "Profile updated successfully!",
      type: "success",
      actions: [
        {
          label: "OK",
          type: "confirm",
          onClick: () => {
            setAlert(null);
            onClose?.();
          },
        },
      ],
    });
    setErrors({});
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  } catch (error) {
    const msg =
      error.response?.data?.msg ||
      "Failed to update profile. Please try again.";

    if (msg.includes("Current password is incorrect")) {
      setErrors((prev) => ({
        ...prev,
        oldPassword: "Current password is incorrect",
      }));
    }

    setAlert({
      message: msg,
      type: "error",
      actions: [
        {
          label: "OK",
          type: "confirm",
          onClick: () => setAlert(null),
        },
      ],
    });
  } finally {
    setLoading(false);
  }
},

        },
      ],
    });
  };

  const inputClass = (field) =>
    `border rounded-lg px-2 py-1 text-xs w-full transition-all duration-200 focus:ring-2 focus:ring-blue-400 ${
      errors[field]
        ? "border-red-500 bg-red-50"
        : "border-gray-300 focus:border-blue-400"
    }`;

  const ErrorText = ({ field }) =>
    errors[field] ? (
      <p className="text-[10px] text-red-600 mt-1">{errors[field]}</p>
    ) : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 text-xs">
      <div className="bg-white rounded-xl w-[380px] shadow-2xl overflow-hidden">
        <div className={`${PRIMARY_COLOR} p-3 flex justify-between items-center`}>
          <h3 className="text-white text-sm font-semibold flex items-center gap-2">
            <IoPersonCircle className="w-4 h-4" /> Profile Settings
          </h3>
          <button
            onClick={onClose}
            className={`text-white p-1 rounded-full ${HOVER_COLOR}`}
          >
            <IoClose className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-4 space-y-3">
          {/* ===== User Information ===== */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-gray-700 border-b pb-1 flex items-center gap-1">
              <IoPerson className="text-gray-500 w-3 h-3" /> User Information
            </h4>

            {/* SAP ID */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">
                SAP ID
              </label>
              <input
                type="text"
                value={userData.SAP}
                readOnly
                className={`${inputClass("SAP")} bg-gray-100 cursor-not-allowed`}
              />
            </div>

            {/* Role */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">
                Role
              </label>
              <input
                type="text"
                value={userData.role_name}
                readOnly
                className={`${inputClass("role_name")} bg-gray-100 cursor-not-allowed`}
              />
            </div>

            {/* Position - tampil hanya jika bukan Admin */}
            {userData.role_name !== "Admin" && (
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase">
                  Position
                </label>
                <input
                  type="text"
                  value={userData.position_name || "-"}
                  readOnly
                  className={`${inputClass(
                    "position_name"
                  )} bg-gray-100 cursor-not-allowed`}
                />
              </div>
            )}

            {/* Name */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">
                Name
              </label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) =>
                  setUserData({ ...userData, name: e.target.value })
                }
                className={inputClass("name")}
              />
              <ErrorText field="name" />
            </div>

            {/* Username */}
            <div>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">
                Username
              </label>
              <input
                type="text"
                value={userData.username}
                onChange={(e) =>
                  setUserData({ ...userData, username: e.target.value })
                }
                className={inputClass("username")}
              />
              <ErrorText field="username" />
            </div>
          </div>

          {/* ===== Change Password ===== */}
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <h4 className="text-[11px] font-bold text-gray-700 border-b pb-1 flex items-center gap-1">
              <IoLock className="text-gray-500 w-3 h-3" /> Change Password
            </h4>

            {/* Current Password */}
            <div className="relative">
              <input
                type={showPassword.old ? "text" : "password"}
                placeholder="Current Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className={inputClass("oldPassword")}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({ ...showPassword, old: !showPassword.old })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword.old ? <FaEyeSlash /> : <FaEye />}
              </button>
              <ErrorText field="oldPassword" />
            </div>

            {/* New Password */}
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass("newPassword")}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword.new ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {/* Confirm New Password */}
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass("confirmPassword")}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    confirm: !showPassword.confirm,
                  })
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
              <ErrorText field="confirmPassword" />
            </div>
          </div>

          {/* ===== Save ===== */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "bg-gray-400" : `${SAVE_COLOR} ${SAVE_HOVER}`
              } text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1`}
            >
              <IoSave className="w-3.5 h-3.5" />
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>

        {alert && (
          <Alert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
            actions={alert.actions}
          />
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
