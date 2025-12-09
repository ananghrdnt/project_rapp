import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const AddUser = ({ onClose, onSave }) => {
  const [form, setForm] = useState({
    SAP: "",
    name: "",
    username: "",
    password: "",
    roleId: "",
    positionId: "",
  });

  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /** Fetch Roles + Positions */
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [roleRes, posRes] = await Promise.all([
          axios.get("http://localhost:5000/roles"),
          axios.get("http://localhost:5000/positions"),
        ]);

        const roleMapping = {
          DATA_SCIENCE: "Data Science",
          ITBP: "ITBP",
          ITGA: "ITGA",
          SAP: "SAP",
          ADMIN: "Admin",
        };

        const formattedRoles = roleRes.data.map((r) => ({
          ...r,
          role: roleMapping[r.role] || r.role,
        }));

        setRoles(formattedRoles);
        setPositions(posRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOptions();
  }, []);

  /** Filter Position On Role Change */
  useEffect(() => {
    const filtered = positions.filter(
      (p) => p.role_id === Number(form.roleId)
    );
    setFilteredPositions(filtered);
    updateField("positionId", "");
  }, [form.roleId, positions]);

  const validate = () => {
    const requiredFields = ["SAP", "name", "username", "password", "roleId"];
    const newErrors = {};

    requiredFields.forEach((f) => {
      if (!form[f]) newErrors[f] = `${f} is required`;
    });

    const selectedRole = roles.find((r) => r.id_role === Number(form.roleId));
    if (selectedRole?.role !== "Admin" && !form.positionId)
      newErrors.positionId = "Position is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showError = (msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  };

  const confirmSave = async () => {
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/users", {
        ...form,
        SAP: Number(form.SAP),
        role_id: Number(form.roleId),
        position_id: form.positionId ? Number(form.positionId) : null,
      });

      setTimeout(() => {
        setAlert(null);
        onSave?.();
        onClose?.();
      }, 1500);
    } catch (err) {
      showError(err.response?.data?.msg || "Failed to add user.");
    } finally {
      setLoading(false);
    }
  };

  const saveUser = (e) => {
    e.preventDefault();
    if (!validate()) {
      showError("Please fill in all required fields.");
      return;
    }

    setAlert({
      message: "Are you sure you want to add this user?",
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        { label: "Confirm", type: "confirm", onClick: confirmSave },
      ],
    });
  };

  const inputClass = (field) =>
    `border rounded-lg px-2 py-1.5 text-xs w-full transition focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? "border-red-500 bg-red-50" : "border-gray-300"
    }`;

  const isAdmin = roles.find((r) => r.id_role === Number(form.roleId))?.role === "Admin";

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[520px] max-w-full shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className={`p-4 flex justify-between items-center text-white ${primaryBlue}`}>
          <h3 className="text-sm font-bold">FORM ADD NEW USER</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={saveUser} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "SAP", type: "number", field: "SAP", placeholder: "e.g. 20001" },
              { label: "Name", type: "text", field: "name", placeholder: "Full Name" },
              { label: "Username", type: "text", field: "username", placeholder: "User Login ID" },
            ].map((item) => (
              <div key={item.field} className="flex flex-col gap-1">
                <label className="text-xs text-gray-700">{item.label}</label>
                <input
                  type={item.type}
                  value={form[item.field]}
                  onChange={(e) => updateField(item.field, e.target.value)}
                  className={inputClass(item.field)}
                  placeholder={item.placeholder}
                />
                {errors[item.field] && (
                  <span className="text-red-500 text-xs">{errors[item.field]}</span>
                )}
              </div>
            ))}

            {/* PASSWORD */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className={inputClass("password")}
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <span className="text-red-500 text-xs">{errors.password}</span>
              )}
            </div>

            {/* ROLE */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-700">Role</label>
              <select
                value={form.roleId}
                onChange={(e) => updateField("roleId", e.target.value)}
                className={`${inputClass("roleId")} cursor-pointer`}
              >
                <option value="" disabled>-- Select Role --</option>
                {roles.map((r) => (
                  <option key={r.id_role} value={r.id_role}>{r.role}</option>
                ))}
              </select>
              {errors.roleId && (
                <span className="text-red-500 text-xs">{errors.roleId}</span>
              )}
            </div>

            {/* POSITION */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-700">Position</label>
              <select
                value={form.positionId}
                onChange={(e) => updateField("positionId", e.target.value)}
                disabled={isAdmin}
                className={`${inputClass("positionId")} cursor-pointer disabled:bg-gray-100`}
              >
                <option value="" disabled>-- Select Position --</option>
                {filteredPositions.map((p) => (
                  <option key={p.id_position} value={p.id_position}>
                    {p.position}
                  </option>
                ))}
              </select>
              {errors.positionId && (
                <span className="text-red-500 text-xs">{errors.positionId}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`${loading ? "bg-gray-400" : primaryGreen} text-white px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2`}
            >
              <FaSave className="w-4 h-4" />
              {loading ? "Saving..." : "Save User"}
            </button>
          </div>
        </form>

        {alert && (
          <Alert
            message={alert.message}
            type={alert.type}
            actions={alert.actions}
          />
        )}
      </div>
    </div>
  );
};

export default AddUser;