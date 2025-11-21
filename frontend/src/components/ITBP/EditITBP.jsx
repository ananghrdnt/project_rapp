import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const EditITBP = ({ SAP, onClose, onSave }) => {
  const [sap, setSAP] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [position, setPosition] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [alert, setAlert] = useState(null);

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  // ✅ Ambil data ITBP berdasarkan SAP
  useEffect(() => {
    if (!SAP) return;
    const fetchITBP = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/users/${SAP}`);
        setSAP(res.data.SAP);
        setName(res.data.name);
        setUsername(res.data.username);
        setPosition(res.data.position || "");
        setRole(res.data.role || "");
      } catch (err) {
        console.error("Error fetching ITBP:", err);
      }
    };
    fetchITBP();
  }, [SAP]);

  // ✅ Validasi input
  const validate = () => {
    const newErrors = {};
    if (!sap) newErrors.sap = "SAP is required";
    if (!name) newErrors.name = "Name is required";
    if (!username) newErrors.username = "Username is required";
    if (!position) newErrors.position = "Position is required";
    if (!role) newErrors.role = "Role is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Update data ITBP
  const updateITBP = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setAlert({
      message: "Are you sure you want to update this ITBP?",
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
                SAP: Number(sap),
                name,
                username,
                oldPassword: oldPassword || undefined,
                newPassword: newPassword || undefined,
                position,
                role,
              });
              setAlert(null);
              onSave?.();
              onClose?.();
            } catch (error) {
              const msg =
                error.response?.data?.msg ||
                "Failed to update ITBP, please try again!";
              setAlert({
                message: msg,
                type: "error",
                actions: [
                  { label: "OK", type: "confirm", onClick: () => setAlert(null) },
                ],
              });
              console.error("Update ITBP error:", msg);
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
      <div className="bg-white rounded-xl w-[500px] max-w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`p-4 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}
        >
          <h3 className="text-sm font-bold tracking-wide">EDIT ITBP DATA</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={updateITBP} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SAP */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">SAP</label>
              <input
                type="number"
                value={sap}
                disabled
                className="border border-gray-300 bg-gray-100 rounded-md px-2 py-1.5 w-full cursor-not-allowed text-gray-600"
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
            </div>

            {/* Role */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={
                  inputClass("role") + " appearance-none cursor-pointer"
                }
              >
                <option value="">Select Role</option>
                <option value="ADMIN">Admin</option>
                <option value="ITBP">ITBP</option>
                <option value="ENGINEER">Engineer</option>
              </select>
            </div>

            {/* Old Password */}
            <div className="flex flex-col gap-1 relative">
              <label className="font-medium text-xs text-gray-700">
                Old Password (optional)
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className={inputClass("oldPassword")}
                  placeholder="Enter old password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showOldPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1 relative">
              <label className="font-medium text-xs text-gray-700">
                New Password (optional)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass("newPassword")}
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showNewPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Position */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="font-medium text-xs text-gray-700">
                Position
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={
                  inputClass("position") + " appearance-none cursor-pointer"
                }
              >
                <option value="">Select Position</option>
                <option value="BACKEND">Backend</option>
                <option value="FRONTEND">Frontend</option>
                <option value="FULLSTACK">Fullstack</option>
                <option value="MOBILE">Mobile</option>
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
              } text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all duration-200`}
            >
              <FaSave className="w-4 h-4" />{" "}
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

export default EditITBP;
