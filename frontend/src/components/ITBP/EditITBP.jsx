import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const InputField = ({
  field,
  value,
  error,
  loading,
  passwordVisibility,
  onInputChange,
  onTogglePassword,
  inputClass
}) => {
  const { key, label, type, placeholder, options, disabled, isPassword } = field;

  // Select
  if (type === "select") {
    return (
      <>
        <label className="font-medium text-xs text-gray-700">{label}</label>
        <select
          value={value}
          disabled={disabled || loading}
          onChange={(e) => onInputChange(key, e.target.value)}
          className={`${inputClass(key)} appearance-none cursor-pointer`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && <span className="text-red-500 text-xs">{error}</span>}
      </>
    );
  }

  // Password
  if (isPassword) {
    const show = passwordVisibility[key];
    return (
      <>
        <label className="font-medium text-xs text-gray-700">{label}</label>

        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={value}
            disabled={loading}
            placeholder={placeholder}
            onChange={(e) => onInputChange(key, e.target.value)}
            className={inputClass(key)}
          />

          <button
            type="button"
            disabled={loading}
            onClick={() => onTogglePassword(key)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600 p-1"
          >
            {show ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {error && <span className="text-red-500 text-xs">{error}</span>}
      </>
    );
  }

  // Default Input
  return (
    <>
      <label className="font-medium text-xs text-gray-700">{label}</label>

      <input
        type={type}
        value={value}
        disabled={disabled || loading}
        placeholder={placeholder}
        onChange={(e) => onInputChange(key, e.target.value)}
        className={inputClass(key)}
      />

      {error && <span className="text-red-500 text-xs">{error}</span>}
    </>
  );
};


const EditITBP = ({ SAP, onClose, onSave }) => {
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

  //FORM CONFIG
  const formConfig = useMemo(
    () => ({
      fields: [
        { key: "SAP", label: "SAP", type: "number", required: true, disabled: true },
        { key: "name", label: "Name", type: "text", required: true },
        { key: "username", label: "Username", type: "text", required: true },
        {
          key: "role",
          label: "Role",
          type: "select",
          required: true,
          options: [
            { value: "", label: "Select Role" },
            { value: "ADMIN", label: "Admin" },
            { value: "ITBP", label: "ITBP" },
            { value: "ENGINEER", label: "Engineer" }
          ]
        },
        { key: "oldPassword", label: "Old Password", type: "password", isPassword: true },
        { key: "newPassword", label: "New Password", type: "password", isPassword: true },
        {
          key: "position",
          label: "Position",
          type: "select",
          required: true,
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
    }),
    [SAP]
  );

  //LOAD INITIAL DATA
  useEffect(() => {
    if (!SAP) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(formConfig.endpoint);
        const data = res.data;

        const fetched = {
          SAP: data.SAP?.toString() || "",
          name: data.name || "",
          username: data.username || "",
          position: data.position || "",
          role: data.role || "",
          oldPassword: "",
          newPassword: ""
        };

        setFormData(fetched);
        setInitialData(fetched);
      } catch {
        showError("Failed to load data.");
      }
    };

    fetchData();
  }, [SAP, formConfig.endpoint, showError]);

  //INPUT HANDLE
  const onInputChange = useCallback(
    (key, value) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: "" }));
      }
    },
    [errors]
  );

  const onTogglePassword = useCallback((key) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);

  //VALIDATION
  const validateForm = useCallback(() => {
    const e = {};
    formConfig.fields.forEach((f) => {
      if (f.required && !formData[f.key]) e[f.key] = `${f.label} is required`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [formData, formConfig.fields]);

  //CHECK CHANGE
  const hasChanges = useCallback(() => {
    if (!initialData) return false;
    return Object.keys(initialData).some((k) => formData[k] !== initialData[k]);
  }, [formData, initialData]);

  //UPDATE
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

      setAlert({ message: "Updated successfully!", type: "success" });

      setTimeout(() => {
        setAlert(null);
        onSave?.();
        onClose?.();
      }, 1500);
    } catch (err) {
      showError(err.response?.data?.msg || "Update failed.");
    } finally {
      setLoading(false);
    }
  }, [formData, formConfig.endpoint, onSave, onClose, showError]);

  //HANDLE SUBMIT
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      if (!validateForm()) return showError("Please complete all required fields.");

      if (!hasChanges()) {
        return setAlert({
          message: "No changes detected.",
          type: "confirm",
          actions: [
            { label: "OK", type: "confirm", onClick: () => setAlert(null) }
          ]
        });
      }

      setAlert({
        message: "Confirm update?",
        type: "confirm",
        actions: [
          { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
          { label: "Confirm", type: "confirm", onClick: handleConfirmUpdate }
        ]
      });
    },
    [validateForm, hasChanges, handleConfirmUpdate, showError]
  );

  
//INPUT STYLE
  const inputClass = (key) =>
    `border rounded-lg px-2 py-1.5 text-xs w-full ${
      errors[key] ? "border-red-500 bg-red-50" : "border-gray-300"
    }`;

//RENDER
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-[500px] rounded-xl shadow-2xl">
        <div className="p-4 flex justify-between items-center bg-blue-600 text-white">
          <h3 className="text-sm font-bold">EDIT ITBP DATA</h3>
          <button onClick={onClose} disabled={loading}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {formConfig.fields.map((f) => (
            <InputField
              key={f.key}
              field={f}
              value={formData[f.key]}
              error={errors[f.key]}
              loading={loading}
              passwordVisibility={passwordVisibility}
              onInputChange={onInputChange}
              onTogglePassword={onTogglePassword}
              inputClass={inputClass}
            />
          ))}

          <div className="col-span-2 flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} disabled={loading} className="border px-3 py-1.5 rounded-lg">
              Cancel
            </button>

            <button type="submit" disabled={loading} className="px-3 py-1.5 bg-green-600 text-white rounded-lg flex items-center gap-2">
              <FaSave />
              Save Changes
            </button>
          </div>
        </form>

        {alert && (
          <Alert message={alert.message} type={alert.type} actions={alert.actions} />
        )}
      </div>
    </div>
  );
};

export default EditITBP;
