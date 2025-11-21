import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const EditUser = ({ SAP, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  // 🔹 Ambil role & posisi
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [roleRes, posRes] = await Promise.all([
          axios.get("http://localhost:5000/roles"),
          axios.get("http://localhost:5000/positions"),
        ]);

        const formattedRoles = roleRes.data.map((r) => ({
          ...r,
          role:
            r.role === "DATA_SCIENCE"
              ? "Data Science"
              : ["ITBP", "ITGA", "SAP"].includes(r.role)
              ? r.role
              : "Admin",
        }));

        setRoles(formattedRoles);
        setPositions(posRes.data);
      } catch (err) {
        console.error("Failed to load roles/positions:", err);
      }
    };
    fetchOptions();
  }, []);

  // 🔹 Ambil data user berdasarkan SAP
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/users/${SAP}`);
        const user = res.data;
        setName(user.name || "");
        setUsername(user.username || "");
        setRoleId(user.role_id?.toString() || "");
        setPositionId(user.position_id?.toString() || "");
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };
    if (SAP) fetchUser();
  }, [SAP]);

  // 🔹 Filter posisi sesuai role
  useEffect(() => {
    if (roleId) {
      const filtered = positions.filter(
        (pos) => pos.role_id === Number(roleId)
      );
      setFilteredPositions(filtered);
    } else {
      setFilteredPositions([]);
    }
  }, [roleId, positions]);

  const validate = () => {
    const newErrors = {};
    if (!SAP) newErrors.SAP = "SAP is required";
    if (!name) newErrors.name = "Name is required";
    if (!username) newErrors.username = "Username is required";
    if (!roleId) newErrors.roleId = "Role is required";

    const selectedRole = roles.find((r) => r.id_role === Number(roleId));
    if (selectedRole?.role !== "Admin" && !positionId)
      newErrors.positionId = "Position is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showError = (msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  };

  const updateUser = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showError("Please fill in all required fields.");
      return;
    }

    setAlert({
      message: "Are you sure you want to update this user?",
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        {
          label: "Confirm",
          type: "confirm",
          onClick: async () => {
            setLoading(true);
            try {
await axios.patch(`http://localhost:5000/users/${SAP}`, {
                name,
                username,
                password: password || undefined,
                role_id: Number(roleId),
                position_id: positionId ? Number(positionId) : null,
              });

              setTimeout(() => {
                setAlert(null);
                if (onSave) onSave();
                if (onClose) onClose();
              }, 1500);
            } catch (error) {
              const msg =
                error.response?.data?.msg ||
                "Failed to update user, please try again!";
              showError(msg);
              console.error("Update user error:", msg);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
  };

  const inputClass = (field) =>
    `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field]
        ? "border-red-500 bg-red-50"
        : "border-gray-300 focus:border-blue-500"
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[520px] max-w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`p-4 flex justify-between items-center text-white ${primaryBlue}`}
        >
          <h3 className="text-sm font-bold tracking-wide">FORM EDIT USER</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={updateUser} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SAP (readonly) */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">SAP</label>
              <input
                type="number"
                value={SAP}
                disabled
                className="border border-gray-300 bg-gray-100 rounded-lg px-2 py-1.5 text-xs w-full cursor-not-allowed"
              />
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass("name")}
                placeholder="Full Name"
              />
              {errors.name && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.name}
                </span>
              )}
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass("username")}
                placeholder="User login ID"
              />
              {errors.username && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.username}
                </span>
              )}
            </div>

            {/* Password (opsional) */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                New Password (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass("password")}
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <FaEyeSlash className="w-4 h-4" />
                  ) : (
                    <FaEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">Role</label>
              <select
                value={roleId}
                onChange={(e) => {
                  setRoleId(e.target.value);
                  setPositionId("");
                }}
                className={inputClass("roleId")}
              >
                <option value="" disabled>
                  -- Select Role --
                </option>
                {roles.map((r) => (
                  <option key={r.id_role} value={r.id_role}>
                    {r.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Position
              </label>
              <select
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                disabled={
                  roles.find((r) => r.id_role === Number(roleId))?.role ===
                  "Admin"
                }
                className={inputClass("positionId")}
              >
                <option value="" disabled>
                  -- Select Position --
                </option>
                {filteredPositions.map((p) => (
                  <option key={p.id_position} value={p.id_position}>
                    {p.position}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Button */}
          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "bg-gray-400 cursor-not-allowed" : primaryGreen
              } text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all duration-200 transform active:scale-[0.98] hover:shadow-lg`}
            >
              <FaSave className="w-4 h-4" />
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* ALERT */}
        {alert && (
          <Alert
            message={alert.message}
            type={alert.type}
            actions={
              alert.actions || [
                { label: "OK", type: "confirm", onClick: () => setAlert(null) },
              ]
            }
          />
        )}
      </div>
    </div>
  );
};

export default EditUser;
