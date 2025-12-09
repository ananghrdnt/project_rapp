import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const EditITBP = ({ SAP, onClose, onSave }) => {
  // STATE TERPUSAT
  const [formData, setFormData] = useState({
    SAP: "",
    name: "",
    username: "",
    oldPassword: "",
    newPassword: "",
    position: "",
    role: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    oldPassword: false,
    newPassword: false
  });
  const [alert, setAlert] = useState(null);
  const [initialData, setInitialData] = useState(null);

  // FUNGSI UTILITAS - DIPINDAHKAN SEBELUM useEffect
  const showError = useCallback((msg) => {
    setAlert({ 
      message: msg, 
      type: "error",
      actions: [
        { 
          label: "OK", 
          type: "confirm", 
          onClick: () => setAlert(null) 
        }
      ]
    });
  }, []);

  // KONFIGURASI FORM TERPUSAT
  const formConfig = useMemo(() => ({
    fields: [
      {
        key: "SAP",
        label: "SAP",
        type: "number",
        placeholder: "SAP Number",
        required: true,
        disabled: true,
        gridClass: "col-span-1",
        validation: (value) => !value ? "SAP is required" : null
      },
      {
        key: "name",
        label: "Name",
        type: "text",
        placeholder: "Full Name",
        required: true,
        gridClass: "col-span-1",
        validation: (value) => !value ? "Name is required" : null
      },
      {
        key: "username",
        label: "Username",
        type: "text",
        placeholder: "User login ID",
        required: true,
        gridClass: "col-span-1",
        validation: (value) => !value ? "Username is required" : null
      },
      {
        key: "role",
        label: "Role",
        type: "select",
        required: true,
        gridClass: "col-span-1",
        validation: (value) => !value ? "Role is required" : null,
        options: [
          { value: "", label: "Select Role" },
          { value: "ADMIN", label: "Admin" },
          { value: "ITBP", label: "ITBP" },
          { value: "ENGINEER", label: "Engineer" }
        ]
      },
      {
        key: "oldPassword",
        label: "Old Password (optional)",
        type: "password",
        placeholder: "Enter old password",
        required: false,
        gridClass: "col-span-1",
        isPassword: true,
        validation: null
      },
      {
        key: "newPassword",
        label: "New Password (optional)",
        type: "password",
        placeholder: "Leave blank to keep current",
        required: false,
        gridClass: "col-span-1",
        isPassword: true,
        validation: null
      },
      {
        key: "position",
        label: "Position",
        type: "select",
        required: true,
        gridClass: "col-span-2",
        validation: (value) => !value ? "Position is required" : null,
        options: [
          { value: "", label: "Select Position" },
          { value: "BACKEND", label: "Backend" },
          { value: "FRONTEND", label: "Frontend" },
          { value: "FULLSTACK", label: "Fullstack" },
          { value: "MOBILE", label: "Mobile" }
        ]
      }
    ],
    endpoint: `http://localhost:5000/users/${SAP}`,
    method: "PATCH"
  }), [SAP]);

  // ✅ Ambil data ITBP berdasarkan SAP
  useEffect(() => {
    if (!SAP) return;

    const fetchITBP = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/users/${SAP}`);
        const data = res.data;
        
        setFormData({
          SAP: data.SAP?.toString() || "",
          name: data.name || "",
          username: data.username || "",
          oldPassword: "",
          newPassword: "",
          position: data.position || "",
          role: data.role || ""
        });
        
        setInitialData({
          SAP: data.SAP?.toString() || "",
          name: data.name || "",
          username: data.username || "",
          position: data.position || "",
          role: data.role || ""
        });
      } catch (err) {
        console.error("Error fetching ITBP:", err);
        showError("Failed to load ITBP data. Please try again.");
      }
    };
    
    fetchITBP();
  }, [SAP, showError]);

  // FUNGSI UTILITAS REUSABLE
  const handleInputChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  }, [errors]);

  const togglePasswordVisibility = useCallback((fieldKey) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    formConfig.fields.forEach(field => {
      if (field.required && field.validation) {
        const value = formData[field.key];
        const error = field.validation(value);
        
        if (error) {
          newErrors[field.key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, formConfig]);

  const hasChanges = useCallback(() => {
    if (!initialData) return false;
    
    return Object.keys(initialData).some(key => {
      if (key === 'oldPassword' || key === 'newPassword') return false;
      return formData[key] !== initialData[key];
    });
  }, [formData, initialData]);

  // HANDLERS
  const handleConfirmUpdate = useCallback(async () => {
    setLoading(true);
    
    try {
      const payload = {
        SAP: Number(formData.SAP),
        name: formData.name,
        username: formData.username,
        position: formData.position,
        role: formData.role,
        oldPassword: formData.oldPassword || undefined,
        newPassword: formData.newPassword || undefined
      };

      await axios.patch(formConfig.endpoint, payload);
      
      setAlert({
        message: "ITBP data updated successfully!",
        type: "success"
      });
      
      setTimeout(() => {
        setAlert(null);
        if (onSave) onSave();
        if (onClose) onClose();
      }, 1500);
      
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 
                      "Failed to update ITBP. Please try again!";
      showError(errorMsg);
      console.error("Update ITBP error:", err);
    } finally {
      setLoading(false);
    }
  }, [formData, formConfig, onSave, onClose, showError]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError("Please fill in all required fields correctly.");
      return;
    }

    if (!hasChanges() && !formData.oldPassword && !formData.newPassword) {
      setAlert({
        message: "No changes detected. Would you like to close without saving?",
        type: "confirm",
        actions: [
          { 
            label: "Cancel", 
            type: "cancel", 
            onClick: () => setAlert(null) 
          },
          {
            label: "Close",
            type: "confirm",
            onClick: () => onClose?.()
          },
        ],
      });
      return;
    }

    setAlert({
      message: "Are you sure you want to update this ITBP data?",
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
          onClick: handleConfirmUpdate
        },
      ],
    });
  }, [validateForm, showError, hasChanges, formData, handleConfirmUpdate, onClose]);

  const handleClose = useCallback(() => {
    if (hasChanges() || formData.oldPassword || formData.newPassword) {
      setAlert({
        message: "You have unsaved changes. Are you sure you want to close?",
        type: "confirm",
        actions: [
          { 
            label: "Continue Editing", 
            type: "cancel", 
            onClick: () => setAlert(null) 
          },
          {
            label: "Close Without Saving",
            type: "confirm",
            onClick: () => onClose?.()
          },
        ],
      });
    } else {
      onClose?.();
    }
  }, [hasChanges, formData, onClose]);

  // STYLING UTILITAS
  const inputClass = useMemo(() => (fieldKey) => 
    `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[fieldKey] 
        ? "border-red-500 bg-red-50" 
        : "border-gray-300 focus:border-blue-500"
    } ${formConfig.fields.find(f => f.key === fieldKey)?.disabled ? "bg-gray-100 cursor-not-allowed text-gray-600" : ""}`, 
    [errors, formConfig.fields]);

  // KOMPONEN REUSABLE - TANPA VARIABLE error YANG TIDAK DIGUNAKAN
  const InputField = useMemo(() => ({ field }) => {
    const { key, label, type, placeholder, options, disabled, isPassword } = field;
    const value = formData[key];
    // ✅ HAPUS: const error = errors[key];

    if (type === "select") {
      return (
        <>
          <label className="font-medium text-xs text-gray-700">{label}</label>
          <select
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={inputClass(key) + " appearance-none cursor-pointer"}
            disabled={disabled || loading}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </>
      );
    }

    if (isPassword) {
      const showPassword = passwordVisibility[key];
      
      return (
        <>
          <label className="font-medium text-xs text-gray-700">{label}</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className={inputClass(key)}
              placeholder={placeholder}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(key)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 transition-colors p-1"
              disabled={loading}
            >
              {showPassword ? (
                <FaEyeSlash className="w-4 h-4" />
              ) : (
                <FaEye className="w-4 h-4" />
              )}
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <label className="font-medium text-xs text-gray-700">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => handleInputChange(key, e.target.value)}
          className={inputClass(key)}
          placeholder={placeholder}
          disabled={disabled || loading}
        />
      </>
    );
  }, [formData, inputClass, loading, passwordVisibility, handleInputChange, togglePasswordVisibility]);

  // RENDER
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[500px] max-w-full shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center text-white bg-blue-600 border-b border-blue-700">
          <h3 className="text-sm font-bold m-0 tracking-wide">
            EDIT ITBP DATA
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close form"
            disabled={loading}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formConfig.fields.map((field) => (
              <div 
                key={field.key} 
                className={`flex flex-col gap-1 ${field.gridClass}`}
              >
                <InputField field={field} />
                {errors[field.key] && (
                  <span className="text-red-500 text-xs mt-0.5">
                    {errors[field.key]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className={`
                ${loading 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : "bg-white hover:bg-gray-50 text-gray-700"
                } 
                border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold 
                transition-all duration-200
              `}
            >
              Cancel
            </button>
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
              {loading ? "Updating..." : "Save Changes"}
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

export default EditITBP;