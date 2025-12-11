import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const EditEngineer = ({ SAP, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    SAP: "",
    name: "",
    username: "",
    position: "",
    role: "",
    oldPassword: "",
    newPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [alert, setAlert] = useState(null);

  // Fetch initial data
  useEffect(() => {
    if (!SAP) return;
    const fetchUser = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/users/${SAP}`);
        setFormData((prev) => ({
          ...prev,
          SAP: res.data.SAP,
          name: res.data.name,
          username: res.data.username,
          position: res.data.position || "",
          role: res.data.role || "",
        }));
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };
    fetchUser();
  }, [SAP]);

  const requiredFields = ["name", "username", "position", "role"];

  const validate = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!formData[field]) newErrors[field] = `${field} is required`;
    });
    setErrors(newErrors);
    return !Object.keys(newErrors).length;
  };

  const triggerAlert = (message, type = "error", actions = null) => {
    setAlert({ message, type, actions });
    if (type === "error") {
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Submit update
  const updateUser = async (e) => {
    e.preventDefault();
    if (!validate()) {
      triggerAlert("Please complete required fields");
      return;
    }

    triggerAlert("Are you sure you want to update this engineer?", "confirm", [
      { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
      {
        label: "Confirm",
        type: "confirm",
        onClick: async () => {
          setLoading(true);
          try {
            await axios.patch(`http://localhost:5000/users/${SAP}`, {
              SAP: Number(formData.SAP),
              name: formData.name,
              username: formData.username,
              position: formData.position,
              role: formData.role,
              oldPassword: formData.oldPassword || undefined,
              newPassword: formData.newPassword || undefined,
            });

            setTimeout(() => {
              setAlert(null);
              onSave?.();
              onClose?.();
            }, 1000);
          } catch (error) {
            const msg =
              error.response?.data?.msg ||
              "Failed to update engineer, please try again!";
            triggerAlert(msg);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const inputClass = (field) =>
    `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field]
        ? "border-red-500 bg-red-50"
        : "border-gray-300 focus:border-blue-500"
    }`;

const Field = ({ label, field, type = "text", disabled = false, children }) => (
  <div className="flex flex-col gap-1">
    <label className="font-medium text-xs text-gray-700">{label}</label>
    {children || (
      <input
        type={type}
        disabled={disabled}
        value={formData[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        className={`${inputClass(field)} ${
          disabled ? "bg-gray-100 cursor-not-allowed text-gray-600" : ""
        }`}
      />
    )}
    {errors[field] && (
      <span className="text-red-500 text-xs">{errors[field]}</span>
    )}
  </div>
);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[500px] max-w-full shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="p-4 flex justify-between items-center bg-blue-600 text-white border-b border-blue-700">
          <h3 className="text-sm font-bold tracking-wide">FORM EDIT ENGINEER</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={updateUser} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Field label="SAP" field="SAP" type="number" disabled />

            <Field label="Name" field="name" />
            <Field label="Username" field="username" />

            {/* ROLE */}
            <Field label="Role" field="role">
              <select
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className={inputClass("role") + " appearance-none cursor-pointer"}
              >
                <option value="" disabled>Select Role</option>
                <option value="ADMIN">Admin</option>
                <option value="ITBP">ITBP</option>
                <option value="ENGINEER">Engineer</option>
              </select>
            </Field>

            {/* Old Password */}
            <Field label="Old Password (optional)" field="oldPassword">
              <div className="relative">
                <input
                  type={showOldPass ? "text" : "password"}
                  value={formData.oldPassword}
                  onChange={(e) => handleChange("oldPassword", e.target.value)}
                  className={inputClass("oldPassword")}
                  placeholder="Enter old password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >
                  {showOldPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>

            {/* New Password */}
            <Field label="New Password (optional)" field="newPassword">
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                  className={inputClass("newPassword")}
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >
                  {showNewPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>

            {/* Position */}
            <Field label="Position" field="position" type="select">
              <select
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
                className={inputClass("position") + " appearance-none cursor-pointer"}
              >
                <option value="" disabled>Select Position</option>
                <option value="BACKEND">Backend</option>
                <option value="FRONTEND">Frontend</option>
                <option value="FULLSTACK">Fullstack</option>
                <option value="MOBILE">Mobile</option>
              </select>
            </Field>

          </div>

          {/* BUTTON */}
          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              } text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all`}
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

export default EditEngineer;
