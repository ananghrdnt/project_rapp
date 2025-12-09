import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

const EditData = ({ type, dataId, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // KONFIGURASI DATA 
  const dataConfig = useMemo(() => ({
    projectType: {
      endpoint: "http://localhost:5000/projecttypes",
      getEndpoint: (id) => `http://localhost:5000/projecttypes/${id}`,
      payloadField: "project_type",
      method: "patch",
      title: "EDIT PROJECT TYPE",
      label: "Project Type",
      placeholder: "Enter Project Type",
      hasRole: false
    },
    platformTask: {
      endpoint: "http://localhost:5000/platforms",
      getEndpoint: (id) => `http://localhost:5000/platforms/${id}`,
      payloadField: "platform",
      method: "patch",
      title: "EDIT PLATFORM TASK",
      label: "Platform Task",
      placeholder: "Enter Platform Task",
      hasRole: false
    },
    taskGroup: {
      endpoint: "http://localhost:5000/task-groups",
      getEndpoint: (id) => `http://localhost:5000/task-groups/${id}`,
      payloadField: "task_group",
      method: "put",
      title: "EDIT TASK GROUP",
      label: "Task Group",
      placeholder: "Enter Task Group",
      hasRole: false
    },
    positionUser: {
      endpoint: "http://localhost:5000/positions",
      getEndpoint: (id) => `http://localhost:5000/positions/${id}`,
      payloadField: "position",
      method: "put",
      title: "EDIT POSITION USER",
      label: "Position",
      placeholder: "Enter Position",
      hasRole: true
    }
  }), []);

  const currentConfig = dataConfig[type];

  
  // FUNGSI UTILITAS

  // Tampilkan error alert
  const showError = useCallback((msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  // Validasi form
  const validate = useCallback(() => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = `${currentConfig.label} is required`;
    }
    
    if (type === "positionUser" && !roleId) {
      newErrors.roleId = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, roleId, type, currentConfig]);

  // HANDLERS 
  // Handler untuk close modal
  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // Handler untuk konfirmasi save
  const handleConfirmSave = useCallback(async () => {
    if (!dataId || !currentConfig) return;
    
    setLoading(true);
    
    try {
      const payload = type === "positionUser" 
        ? { 
            [currentConfig.payloadField]: name,
            role_id: Number(roleId)
          }
        : { 
            [currentConfig.payloadField]: name 
          };

      const url = currentConfig.getEndpoint(dataId);
      
      if (currentConfig.method === "patch") {
        await axios.patch(url, payload);
      } else {
        await axios.put(url, payload);
      }
      
      setAlert({
        message: `${currentConfig.label} updated successfully!`,
        type: "success"
      });
      
      setTimeout(() => {
        setAlert(null);
        if (onSave) onSave();
        if (onClose) onClose();
      }, 1000);
      
    } catch (error) {
      const errorMsg = error.response?.data?.msg || "Failed to update, please try again!";
      showError(errorMsg);
      console.error("Edit data error:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [name, roleId, type, currentConfig, dataId, onSave, onClose, showError]);

  // Handler untuk submit form
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validate()) {
      showError("Please fill in all required fields.");
      return;
    }

    setAlert({
      message: `Are you sure you want to update this ${currentConfig.label}?`,
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

 
  // USE EFFECT

  // Ambil data roles untuk positionUser
  useEffect(() => {
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

  // Ambil data yang akan diedit
  useEffect(() => {
    const fetchData = async () => {
      if (!dataId || !currentConfig) return;

      try {
        const url = currentConfig.getEndpoint(dataId);
        const res = await axios.get(url);
        const data = res.data;

        if (type === "positionUser") {
          setName(data.position || "");
          setRoleId(data.role_id || "");
        } else {
          setName(data[currentConfig.payloadField] || "");
        }
      } catch (err) {
        console.error("Failed to fetch data for edit:", err);
        showError("Failed to load data for editing");
      }
    };

    fetchData();
  }, [type, dataId, currentConfig, showError]);

  
  // STYLING UTILITAS
  const inputClass = useMemo(() => (field) => 
    `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] 
        ? "border-red-500 bg-red-50" 
        : "border-gray-300 focus:border-blue-500"
    }`, [errors]);

  
  // RENDER
  
  if (!currentConfig) {
    return null;
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
                <label className="font-medium text-xs text-gray-700">
                  Role
                </label>
                <select
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
                      {role.role}
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

export default EditData;