import React, { useState, useEffect } from "react";
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

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  // 🔹 Ambil role untuk Position User
  useEffect(() => {
    if (type === "positionUser") {
      const fetchRoles = async () => {
        try {
          const res = await axios.get("http://localhost:5000/roles");
          setRoles(res.data);
        } catch (err) {
          console.error("Failed to load roles:", err);
        }
      };
      fetchRoles();
    }
  }, [type]);

  const validate = () => {
    const newErrors = {};
    if (!name) newErrors.name = "Field is required";

    if (type === "positionUser" && !roleId) {
      newErrors.roleId = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showError = (msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  };

  const saveData = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showError("Please fill in all required fields.");
      return;
    }

    setAlert({
      message: `Are you sure you want to add this ${type}?`,
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        {
          label: "Confirm",
          type: "confirm",
          onClick: async () => {
            setLoading(true);
            try {
              let url = "";
              let payload = {};

              switch (type) {
                case "projectType":
                  url = "http://localhost:5000/projecttypes";
                  payload = { project_type: name };
                  break;
                case "platformTask":
                  url = "http://localhost:5000/platforms";
                  payload = { platform: name };
                  break;
                case "taskGroup":
                  url = "http://localhost:5000/task-groups";
                  payload = { task_group: name };
                  break;
                case "positionUser":
                  url = "http://localhost:5000/positions";
                  payload = { position: name, role_id: Number(roleId) };
                  break;
                default:
                  break;
              }

              await axios.post(url, payload);
              setTimeout(() => {
                setAlert(null);
                if (onSave) onSave();
                if (onClose) onClose();
              }, 1000);
            } catch (error) {
              const msg =
                error.response?.data?.msg || "Failed to add, please try again!";
              showError(msg);
              console.error("Add data error:", msg);
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
      errors[field] ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[420px] max-w-full shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        {/* Header */}
        <div
          className={`p-4 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}
        >
          <h3 className="text-sm font-bold tracking-wide">
            {`ADD NEW ${type === "projectType" ? "PROJECT TYPE" :
                type === "platformTask" ? "PLATFORM TASK" :
                type === "taskGroup" ? "TASK GROUP" :
                "POSITION USER"}`}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={saveData} className="p-6">
          <div className="flex flex-col gap-4">
            {/* Name / Position Field */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                {type === "positionUser" ? "Position" :
                  type === "projectType" ? "Project Type" :
                  type === "platformTask" ? "Platform Task" :
                  "Task Group"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass("name")}
                placeholder={`Enter ${type === "positionUser" ? "Position" : type}`}
              />
              {errors.name && (
                <span className="text-red-500 text-xs mt-0.5">{errors.name}</span>
              )}
            </div>

            {/* Role Dropdown for Position User */}
            {type === "positionUser" && (
              <div className="flex flex-col gap-1">
                <label className="font-medium text-xs text-gray-700">Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className={inputClass("roleId") + " appearance-none cursor-pointer"}
                >
                  <option value="" disabled>
                    -- Select Role --
                  </option>
{roles.map((r) => (
  <option key={r.id_role} value={r.id_role}>
    {["ITBP", "ITGA", "SAP", "Admin"].includes(r.role)
      ? r.role
      : r.role
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")}
  </option>
))}


                </select>
                {errors.roleId && (
                  <span className="text-red-500 text-xs mt-0.5">{errors.roleId}</span>
                )}
              </div>
            )}
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
              alert.actions || [{ label: "OK", type: "confirm", onClick: () => setAlert(null) }]
            }
          />
        )}
      </div>
    </div>
  );
};

export default AddData;
