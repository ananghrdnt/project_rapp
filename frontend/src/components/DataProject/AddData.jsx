import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

const AddData = ({ type, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // KONFIGURASI DATA - Semua config di satu tempat
  const dataConfig = useMemo(() => ({
    projectType: {
      endpoint: "http://localhost:5000/projecttypes",
      payloadField: "project_type",
      title: "ADD NEW PROJECT TYPE",
      label: "Project Type",
      placeholder: "Enter Project Type"
    },
    platformTask: {
      endpoint: "http://localhost:5000/platforms",
      payloadField: "platform",
      title: "ADD NEW PLATFORM TASK",
      label: "Platform Task",
      placeholder: "Enter Platform Task"
    },
    taskGroup: {
      endpoint: "http://localhost:5000/task-groups",
      payloadField: "task_group",
      title: "ADD NEW TASK GROUP",
      label: "Task Group",
      placeholder: "Enter Task Group"
    },
    positionUser: {
      endpoint: "http://localhost:5000/positions",
      payloadField: "position",
      title: "ADD NEW POSITION USER",
      label: "Position",
      placeholder: "Enter Position"
    }
  }), []);

  const currentConfig = dataConfig[type];

  // FUNGSI UTILITAS
  // Format role untuk display (sama dengan di DataList)
  const formatRoleDisplay = useCallback((role) => {
    if (!role) return "";
    if (["ITBP", "ITGA", "SAP", "Admin"].includes(role)) return role;
    
    return role
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }, []);

  // Tampilkan error alert
  const showError = useCallback((msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  // Validasi form
  const validate = useCallback(() => {
    const newErrors = {};
    
    // Validasi nama
    if (!name.trim()) {
      newErrors.name = `${currentConfig.label} is required`;
    }
    
    // Validasi role hanya untuk positionUser
    if (type === "positionUser" && !roleId) {
      newErrors.roleId = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, roleId, type, currentConfig]);

  // Reset form
  const resetForm = useCallback(() => {
    setName("");
    setRoleId("");
    setErrors({});
  }, []);

  // Handler untuk konfirmasi save
  const handleConfirmSave = useCallback(async () => {
    setLoading(true);
    
    try {
      // Siapkan payload berdasarkan tipe
      const payload = type === "positionUser" 
        ? { 
            [currentConfig.payloadField]: name,
            role_id: Number(roleId)
          }
        : { 
            [currentConfig.payloadField]: name 
          };

      // Kirim request
      await axios.post(currentConfig.endpoint, payload);
      
      // Reset form
      resetForm();
      
      // Tampilkan success message
      setAlert({
        message: `${currentConfig.label} added successfully!`,
        type: "success"
      });
      
      // Panggil callback setelah delay
      setTimeout(() => {
        setAlert(null);
        if (onSave) onSave();
        if (onClose) onClose();
      }, 1000);
      
    } catch (error) {
      const errorMsg = error.response?.data?.msg || "Failed to add, please try again!";
      showError(errorMsg);
      console.error("Add data error:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [name, roleId, type, currentConfig, onSave, onClose, resetForm, showError]);

  // Handler untuk submit form
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validate()) {
      showError("Please fill in all required fields.");
      return;
    }

    setAlert({
      message: `Are you sure you want to add this ${currentConfig.label}?`,
      type: "confirm",
      actions: [
        { 
          label: "Cancel", 
          type: "cancel", 
          onClick: () => setAlert(null) 
        },
        {
          label: "Confirm",
          type: "confirm",
          onClick: handleConfirmSave
        },
      ],
    });
  }, [validate, showError, currentConfig, handleConfirmSave]);

  // Handler untuk close modal
  const handleClose = useCallback(() => {
    resetForm();
    if (onClose) onClose();
  }, [resetForm, onClose]);

  // USE EFFECT
  useEffect(() => {
    // Ambil data roles hanya untuk positionUser
    const fetchRoles = async () => {
      if (type === "positionUser") {
        try {
          const res = await axios.get("http://localhost:5000/roles");
          setRoles(res.data);
        } catch (err) {
          console.error("Failed to load roles:", err);
          showError("Failed to load roles");
        }
      }
    };

    fetchRoles();
  }, [type, showError]);

  // STYLING UTILITAS
  const inputClass = useMemo(() => (field) => 
    `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] 
        ? "border-red-500 bg-red-50" 
        : "border-gray-300 focus:border-blue-500"
    }`, [errors]);

  // RENDER
  if (!currentConfig) {
    return null; // Atau tampilkan error
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[420px] max-w-full shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        {/* Header */}
        <div className="p-4 flex justify-between items-center text-white bg-blue-600 border-b border-blue-700">
          <h3 className="text-sm font-bold tracking-wide">
            {currentConfig.title}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close modal"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex flex-col gap-4">
            {/* Name Field */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                {currentConfig.label}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass("name")}
                placeholder={currentConfig.placeholder}
                disabled={loading}
              />
              {errors.name && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.name}
                </span>
              )}
            </div>

            {/* Role Dropdown (hanya untuk Position User) */}
            {type === "positionUser" && (
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="role-select"
                  className="font-medium text-xs text-gray-700">
                  Role
                </label>
                <select
                  id="role-select"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className={inputClass("roleId") + " appearance-none cursor-pointer"}
                  disabled={loading}
                >
                  <option value="" disabled>
                    -- Select Role --
                  </option>
                  {roles.map((role) => (
                    <option key={role.id_role} value={role.id_role}>
                      {formatRoleDisplay(role.role)}
                    </option>
                  ))}
                </select>
                {errors.roleId && (
                  <span className="text-red-500 text-xs mt-0.5">
                    {errors.roleId}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`
                ${loading 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-green-600 hover:bg-green-700"
                } 
                text-white px-3 py-1.5 rounded-lg text-xs font-bold 
                flex items-center gap-2 shadow-md transition-all 
                duration-200 transform active:scale-[0.98] hover:shadow-lg
              `}
            >
              <FaSave className="w-4 h-4" />
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>

        {/* Alert */}
        {alert && (
          <Alert
            message={alert.message}
            type={alert.type}
            actions={
              alert.actions || [
                { 
                  label: "OK", 
                  type: "confirm", 
                  onClick: () => setAlert(null) 
                }
              ]
            }
          />
        )}
      </div>
    </div>
  );
};

export default AddData;