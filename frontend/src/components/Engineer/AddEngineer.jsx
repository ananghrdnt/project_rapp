import React, { useState } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";
const Field = ({
  label,
  field,
  type = "text",
  value,
  error,
  onChange,
  inputClass,
  children,
}) => (
  <div className="flex flex-col gap-1">
    <label className="font-medium text-xs text-gray-700">{label}</label>

    {children || (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className={inputClass(field)}
      />
    )}

    {error && (
      <span className="text-red-500 text-xs mt-0.5">{error}</span>
    )}
  </div>
);

const AddEngineer = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    SAP: "",
    name: "",
    username: "",
    password: "",
    position: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);

  const requiredFields = ["SAP", "name", "username", "password", "position"];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!formData[field]) {
        newErrors[field] = `${field} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const triggerAlert = (message, type = "error", actions = null) => {
    setAlert({ message, type, actions });
    if (type === "error") {
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const saveEngineer = async (e) => {
    e.preventDefault();

    if (!validate()) {
      triggerAlert("Failed to add engineer because of missing fields");
      return;
    }

    triggerAlert("Are you sure you want to add this engineer?", "confirm", [
      { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
      {
        label: "Confirm",
        type: "confirm",
        onClick: async () => {
          setLoading(true);
          try {
            await axios.post("http://localhost:5000/users", {
              SAP: Number(formData.SAP),
              ...formData,
              role: "ENGINEER",
            });

            setTimeout(() => {
              setAlert(null);
              onSave?.();
              onClose?.();
            }, 1500);
          } catch (error) {
            const msg =
              error.response?.data?.msg ||
              "Failed to add engineer, please try again!";
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

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[500px] max-w-full shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="p-4 flex justify-between items-center bg-blue-600 text-white">
          <h3 className="text-sm font-bold">FORM ADD NEW ENGINEER</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20"
            aria-label="Close form"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={saveEngineer} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="SAP"
              field="SAP"
              type="number"
              value={formData.SAP}
              error={errors.SAP}
              onChange={handleChange}
              inputClass={inputClass}
            />

            <Field
              label="Name"
              field="name"
              value={formData.name}
              error={errors.name}
              onChange={handleChange}
              inputClass={inputClass}
            />

            <Field
              label="Username"
              field="username"
              value={formData.username}
              error={errors.username}
              onChange={handleChange}
              inputClass={inputClass}
            />

            {/* PASSWORD */}
            <Field label="Password" error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleChange("password", e.target.value)
                  }
                  className={inputClass("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </Field>

            {/* POSITION */}
            <Field label="Position" error={errors.position}>
              <select
                value={formData.position}
                onChange={(e) =>
                  handleChange("position", e.target.value)
                }
                className={`${inputClass("position")} appearance-none`}
              >
                <option value="" disabled>
                  Select Position
                </option>
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
                loading
                  ? "bg-gray-400"
                  : "bg-green-600 hover:bg-green-700"
              } text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2`}
            >
              <FaSave /> {loading ? "Saving..." : "Save Engineer"}
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
