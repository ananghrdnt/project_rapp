import React, { useState, useMemo, useCallback } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const AddITBP = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    SAP: "",
    name: "",
    username: "",
    password: "",
    position: ""
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);

  // KONFIGURASI FORM TERPUSAT
  const formConfig = useMemo(() => ({
    fields: [
      {
        key: "SAP",
        label: "SAP",
        type: "number",
        placeholder: "e.g., 20001",
        required: true,
        gridClass: "col-span-1",
        validation: (value) => {
          if (!value) return "SAP is required";
          if (isNaN(Number(value))) return "SAP must be a number";
          return null;
        }
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
        key: "password",
        label: "Password",
        type: "password",
        placeholder: "********",
        required: true,
        gridClass: "col-span-1",
        validation: (value) => !value ? "Password is required" : null
      },
      {
        key: "position",
        label: "Position",
        type: "select",
        required: true,
        gridClass: "col-span-2",
        validation: (value) => !value ? "Position is required" : null,
        options: [
          { value: "", label: "Select Position", disabled: true },
          { value: "BACKEND", label: "Backend" },
          { value: "FRONTEND", label: "Frontend" },
          { value: "FULLSTACK", label: "Fullstack" },
          { value: "MOBILE", label: "Mobile" }
        ]
      }
    ],
    endpoint: "http://localhost:5000/users",
    role: "ITBP"
  }), []);

  // FUNGSI UTILITAS REUSABLE
  // Handle form input changes
  const handleInputChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  }, [errors]);

  // Tampilkan error alert
  const showError = useCallback((msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  // Validasi form
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    formConfig.fields.forEach(field => {
      const value = formData[field.key];
      const error = field.validation ? field.validation(value) : null;
      
      if (error) {
        newErrors[field.key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, formConfig]);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // HANDLERS 
  // Handler untuk konfirmasi save
  const handleConfirmSave = useCallback(async () => {
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        SAP: Number(formData.SAP),
        role: formConfig.role
      };

      await axios.post(formConfig.endpoint, payload);
      
      setAlert({
        message: "ITBP user added successfully!",
        type: "success"
      });
      
      setTimeout(() => {
        setAlert(null);
        if (onSave) onSave();
        if (onClose) onClose();
      }, 1500);
      
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to add ITBP, please try again!";
      showError(errorMsg);
      console.error("Add ITBP error:", err);
    } finally {
      setLoading(false);
    }
  }, [formData, formConfig, onSave, onClose, showError]);

  // Handler untuk submit form
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError("Please fill in all required fields correctly.");
      return;
    }

    setAlert({
      message: "Are you sure you want to add this ITBP user?",
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
  }, [validateForm, showError, handleConfirmSave]);

  // Handler untuk close modal
  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  // STYLING UTILITAS
  const inputClass = useMemo(() => (fieldKey) => 
    `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[fieldKey] 
        ? "border-red-500 bg-red-50" 
        : "border-gray-300 focus:border-blue-500"
    }`, [errors]);

  // KOMPONEN REUSABLE
  // Komponen InputField untuk berbagai jenis input
  const InputField = useMemo(() => ({ field }) => {
    const { key, label, type, placeholder, options } = field;
    const value = formData[key];
    // FIX: Hapus variabel fieldError yang tidak digunakan

    if (type === "select") {
      return (
        <>
          <label className="font-medium text-xs text-gray-700">{label}</label>
          <select
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={inputClass(key) + " appearance-none cursor-pointer"}
            disabled={loading}
          >
            {options.map(option => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        </>
      );
    }

    if (type === "password") {
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
              onClick={togglePasswordVisibility}
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
          disabled={loading}
        />
      </>
    );
  }, [formData, inputClass, loading, showPassword, handleInputChange, togglePasswordVisibility]);

  // RENDER
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[500px] max-w-full shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center text-white bg-blue-600 border-b border-blue-700">
          <h3 className="text-sm font-bold m-0 tracking-wide">
            FORM ADD NEW ITBP USER
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
              {loading ? "Saving..." : "Save ITBP"}
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

export default AddITBP;