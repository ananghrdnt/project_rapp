import React, { useState } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const AddEngineer = ({ onClose, onSave }) => {
  const [SAP, setSAP] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [position, setPosition] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  const validate = () => {
    const newErrors = {};
    if (!SAP) newErrors.SAP = "SAP is required";
    if (!name) newErrors.name = "Name is required";
    if (!username) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";
    if (!position) newErrors.position = "Position is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showError = (msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  };

  const saveEngineer = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showError("Failed to add engineer because of missing fields");
      return;
    }

    // Konfirmasi sebelum simpan
    setAlert({
      message: "Are you sure you want to add this engineer?",
      type: "confirm",
      actions: [
        {
          label: "Cancel",
          type: "cancel",
          onClick: () => setAlert(null),
        },
        {
          label: "Confirm",
          type: "confirm",
          onClick: async () => {
            setLoading(true);
            try {
              // ✅ Sesuaikan endpoint ke createUser di backend
              await axios.post("http://localhost:5000/users", {
                SAP: Number(SAP),
                name,
                username,
                password,
                position,
                role: "ENGINEER", // otomatis role ENGINEER
              });

              

              setTimeout(() => {
                setAlert(null);
                if (onSave) onSave();
                if (onClose) onClose();
              }, 1500);
            } catch (error) {
              const msg =
                error.response?.data?.msg ||
                "Failed to add engineer, please try again!";
              showError(msg);
              console.error("Add engineer error:", msg);
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
      <div className="bg-white rounded-xl w-[500px] max-w-full shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        {/* Header */}
        <div
          className={`p-4 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}
        >
          <h3 className="text-sm font-bold m-0 tracking-wide">
            FORM ADD NEW ENGINEER
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close form"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={saveEngineer} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SAP */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">SAP</label>
              <input
                type="number"
                value={SAP}
                onChange={(e) => setSAP(e.target.value)}
                className={inputClass("SAP")}
                placeholder="e.g., 10001"
              />
              {errors.SAP && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.SAP}
                </span>
              )}
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

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Password
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
              {errors.password && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.password}
                </span>
              )}
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
                <option value="" disabled>
                  Select Position
                </option>
                <option value="BACKEND">Backend</option>
                <option value="FRONTEND">Frontend</option>
                <option value="FULLSTACK">Fullstack</option>
                <option value="MOBILE">Mobile</option>
              </select>
              {errors.position && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.position}
                </span>
              )}
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
              <FaSave className="w-4 h-4" />{" "}
              {loading ? "Saving..." : "Save Engineer"}
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
                {
                  label: "OK",
                  type: "confirm",
                  onClick: () => setAlert(null),
                },
              ]
            }
          />
        )}
      </div>
    </div>
  );
};

export default AddEngineer;
