import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaSave, FaEye, FaEyeSlash } from "react-icons/fa";
import Alert from "../Alert";

const EditUser = ({ SAP, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    roleId: "",
    positionId: "",
  });

  const { name, username, password, roleId, positionId } = form;

  const [roles, setRoles] = useState([]);
  const [positions, setPositions] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const mappedRole = (roleValue) =>
    roleValue === "DATA_SCIENCE" ? "Data Science" : roleValue;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roleRes, posRes, userRes] = await Promise.all([
          axios.get("http://localhost:5000/roles"),
          axios.get("http://localhost:5000/positions"),
          axios.get(`http://localhost:5000/users/${SAP}`),
        ]);

        setRoles(
          roleRes.data.map((r) => ({
            ...r,
            role:
              ["ITBP", "ITGA", "SAP"].includes(r.role) === true
                ? r.role
                : mappedRole(r.role) || "Admin",
          }))
        );

        setPositions(posRes.data);

        const user = userRes.data;
        setForm({
          name: user.name ?? "",
          username: user.username ?? "",
          password: "",
          roleId: user.role_id?.toString() ?? "",
          positionId: user.position_id?.toString() ?? "",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (SAP) fetchData();
  }, [SAP]);

  useEffect(() => {
    setFilteredPositions(
      roleId ? positions.filter((p) => p.role_id === Number(roleId)) : []
    );
  }, [roleId, positions]);

  const validate = () => {
    const e = {};
    if (!SAP) e.SAP = "SAP is required";
    if (!name) e.name = "Name is required";
    if (!username) e.username = "Username is required";
    if (!roleId) e.roleId = "Role is required";

    const roleData = roles.find((r) => r.id_role === Number(roleId));
    if (roleData?.role !== "Admin" && !positionId)
      e.positionId = "Position is required";

    setErrors(e);
    return !Object.keys(e).length;
  };

  const showError = (msg) =>
    setAlert({ message: msg, type: "error", actions: [] });

  const confirmUpdate = async () => {
    setLoading(true);
    try {
      await axios.patch(`http://localhost:5000/users/${SAP}`, {
        name,
        username,
        password: password || undefined,
        role_id: Number(roleId),
        position_id: positionId ? Number(positionId) : null,
      });

      setAlert(null);
      onSave?.();
      onClose?.();
    } catch (error) {
      showError(
        error.response?.data?.msg ||
          "Failed to update user, please try again!"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (e) => {
    e.preventDefault();
    if (!validate()) return showError("Please fill in all required fields.");

    setAlert({
      message: "Are you sure you want to update this user?",
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        { label: "Confirm", type: "confirm", onClick: confirmUpdate },
      ],
    });
  };

  const inputClass = (field) =>
    `border rounded-lg px-2 py-1.5 text-xs w-full ${
      errors[field] ? "border-red-500 bg-red-50" : "border-gray-300"
    } focus:ring-2 focus:ring-blue-500`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-[520px] max-w-full shadow-xl">

        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between">
          <h3 className="text-sm font-bold">FORM EDIT USER</h3>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={updateUser} className="p-6">
          <div className="grid md:grid-cols-2 gap-4">

            {/* SAP */}
            <div>
              <label className="text-xs font-medium">SAP</label>
              <input
                type="number"
                value={SAP}
                disabled
                className="border bg-gray-100 rounded-lg px-2 py-1.5 text-xs w-full"
              />
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => updateField("name", e.target.value)}
                className={inputClass("name")}
                placeholder="Full Name"
              />
              {errors.name && (
                <small className="text-red-500">{errors.name}</small>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="text-xs font-medium">Username</label>
              <input
                value={username}
                onChange={(e) => updateField("username", e.target.value)}
                className={inputClass("username")}
                placeholder="User login ID"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className={inputClass("password")}
                  placeholder="********"
                />
                <button
                  type="button"
                  className="absolute top-1/2 -translate-y-1/2 right-3"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="text-xs font-medium">Role</label>
              <select
                value={roleId}
                onChange={(e) => {
                  updateField("roleId", e.target.value);
                  updateField("positionId", "");
                }}
                className={inputClass("roleId")}
              >
                <option value="">-- Select Role --</option>
                {roles.map((r) => (
                  <option key={r.id_role} value={r.id_role}>
                    {r.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="text-xs font-medium">Position</label>
              <select
                disabled={
                  roles.find((r) => r.id_role === Number(roleId))?.role ===
                  "Admin"
                }
                value={positionId}
                onChange={(e) => updateField("positionId", e.target.value)}
                className={inputClass("positionId")}
              >
                <option value="">-- Select Position --</option>
                {filteredPositions.map((p) => (
                  <option key={p.id_position} value={p.id_position}>
                    {p.position}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              disabled={loading}
              className={`text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <FaSave />
              {loading ? "Updating..." : "Save Changes"}
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

export default EditUser;
