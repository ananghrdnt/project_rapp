import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

// --- 1. Constants & Utils ---
const API_BASE = "http://localhost:5000";
const ROLES = {
  ADMIN: "ADMIN",
  ITBP: "ITBP",
  SAP: "SAP",
  DS: "DATA_SCIENCE",
};

// Validasi durasi (sama dengan AddProject)
const validateProjectDuration = (startStr, endStr, level) => {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);
  
  if (start > end) return "Plan start cannot be after plan end";

  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  if (level === "LOW" && diffDays >= 7) return "Low effort should be less than 7 days";
  if (level === "MID" && (diffDays < 7 || diffDays > 21)) return "Mid effort should be between 7–21 days";
  if (level === "HIGH" && diffDays <= 21) return "High effort should be more than 21 days";

  return null;
};

// --- 2. Reusable UI Components ---

const FormInput = ({ label, name, value, onChange, error, type = "text", placeholder, disabled = false }) => (
  <div className="flex flex-col gap-1">
    <label className="font-medium text-xs text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
      } ${disabled ? "bg-gray-100 text-gray-600" : ""}`}
    />
    {error && <span className="text-red-500 text-xs mt-0.5">{error}</span>}
  </div>
);

const FormSelect = ({ label, name, value, onChange, error, options, disabled = false, defaultOption = "Select" }) => (
  <div className="flex flex-col gap-1">
    <label className="font-medium text-xs text-gray-700">{label}</label>
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      disabled={disabled}
      className={`border rounded-lg px-2 py-1.5 text-xs w-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
      }`}
    >
      <option value="">-- {defaultOption} --</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <span className="text-red-500 text-xs mt-0.5">{error}</span>}
  </div>
);

// --- 3. Main Component ---

const EditProject = ({ id_project, onClose, onSave }) => {
  // State
  const [formData, setFormData] = useState({
    assigned_to: "",
    assigned_to_group: "",
    project_name: "",
    project_type_id: "",
    level: "",
    req_date: "",
    plan_start_date: "",
    plan_end_date: "",
    live_date: "",
    remark: "",
  });

  const [options, setOptions] = useState({
    projectTypes: [],
    users: { [ROLES.ITBP]: [], [ROLES.SAP]: [], [ROLES.DS]: [] },
  });

  const [currentUser, setCurrentUser] = useState({ role: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);

  // Initial Data Fetching
  useEffect(() => {
    // 1. User Info
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setCurrentUser({ 
        role: userData.role?.toUpperCase() || "", 
        name: userData.name || "" 
      });
    }

    // 2. Load Dropdown Options & Project Data
    const initData = async () => {
      try {
        const [typesRes, itbpRes, sapRes, dsRes, projectRes] = await Promise.all([
          axios.get(`${API_BASE}/projecttypes`),
          axios.get(`${API_BASE}/users?role=${ROLES.ITBP}`),
          axios.get(`${API_BASE}/users?role=${ROLES.SAP}`),
          axios.get(`${API_BASE}/users?role=${ROLES.DS}`),
          axios.get(`${API_BASE}/projects/${id_project}`),
        ]);

        // Set Options
        setOptions({
          projectTypes: typesRes.data.map(t => ({
            value: t.id_type,
            label: t.project_type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
          })),
          users: {
            [ROLES.ITBP]: itbpRes.data,
            [ROLES.SAP]: sapRes.data,
            [ROLES.DS]: dsRes.data,
          }
        });

        // Set Form Data from Project
        const p = projectRes.data;
        setFormData({
          assigned_to: p.assigned_to?.toString() || "",
          assigned_to_group: p.assigned_to_group || "",
          project_name: p.project_name || "",
          project_type_id: p.project_type_id || "",
          level: p.level || "",
          req_date: p.req_date?.substring(0, 10) || "",
          plan_start_date: p.plan_start_date?.substring(0, 10) || "",
          plan_end_date: p.plan_end_date?.substring(0, 10) || "",
          live_date: p.live_date?.substring(0, 10) || "",
          remark: p.remark || "",
        });

      } catch (err) {
        console.error("Error fetching data:", err);
        setAlert({ message: "Failed to load project data", type: "error" });
      }
    };

    if (id_project) initData();
  }, [id_project]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === "assigned_to_group") updated.assigned_to = "";
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const { project_name, assigned_to, assigned_to_group, project_type_id, level, req_date, plan_start_date, plan_end_date, remark } = formData;

    if (!project_name) newErrors.project_name = "Project name is required";
    if (!project_type_id) newErrors.project_type_id = "Project type is required";
    if (!assigned_to) newErrors.assigned_to = "Assigned To is required";
    if (currentUser.role === ROLES.ADMIN && !assigned_to_group) newErrors.assigned_to_group = "Group is required";
    if (!level) newErrors.level = "Effort level is required";
    if (!req_date) newErrors.req_date = "Request date is required";
    if (!plan_start_date) newErrors.plan_start_date = "Start date is required";
    if (!plan_end_date) newErrors.plan_end_date = "End date is required";
    if (!remark) newErrors.remark = "Remark is required";

    const dateError = validateProjectDuration(plan_start_date, plan_end_date, level);
    if (dateError) {
      if (dateError.includes("start")) newErrors.plan_start_date = dateError;
      else newErrors.plan_end_date = dateError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      setAlert({ message: "Validation failed. Please check the fields.", type: "error" });
      return;
    }

    setAlert({
      message: "Are you sure you want to update this project?",
      type: "confirm",
      actions: [
        { label: "Cancel", onClick: () => setAlert(null) },
        {
          label: "Confirm",
          onClick: async () => {
            setLoading(true);
            try {
              const token = localStorage.getItem("token");
              await axios.patch(
                `${API_BASE}/projects/${id_project}`,
                {
                  ...formData,
                  assigned_to: Number(formData.assigned_to),
                  live_date: formData.live_date || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              onSave();
              onClose();
            } catch (err) {
              const msg = err.response?.data?.msg || "Failed to update project.";
              setAlert({ message: msg, type: "error" });
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    });
  };

  // Derived Option for Assigned User
  const assignedUserOptions = useMemo(() => {
    if (!formData.assigned_to_group) return [];
    return (options.users[formData.assigned_to_group] || []).map(u => ({
      value: u.SAP,
      label: u.name
    }));
  }, [formData.assigned_to_group, options.users]);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] max-w-full shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center text-white bg-blue-600 border-b border-blue-700">
          <h3 className="text-sm font-bold m-0">FORM EDIT PROJECT</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors text-white">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <FormInput 
              label="Project Name" 
              name="project_name" 
              value={formData.project_name} 
              onChange={handleChange} 
              error={errors.project_name} 
            />

            <FormSelect 
              label="Project Type" 
              name="project_type_id" 
              value={formData.project_type_id} 
              onChange={handleChange} 
              error={errors.project_type_id} 
              options={options.projectTypes} 
            />

            {/* Assigned To Logic */}
            {currentUser.role === ROLES.ADMIN ? (
              <>
                <FormSelect 
                  label="Assigned To Group" 
                  name="assigned_to_group" 
                  value={formData.assigned_to_group} 
                  onChange={handleChange} 
                  error={errors.assigned_to_group} 
                  options={[
                    { value: ROLES.ITBP, label: "ITBP" },
                    { value: ROLES.SAP, label: "SAP" },
                    { value: ROLES.DS, label: "Data Science" },
                  ]} 
                />
                <FormSelect 
                  label="Assigned To User" 
                  name="assigned_to" 
                  value={formData.assigned_to} 
                  onChange={handleChange} 
                  error={errors.assigned_to} 
                  options={assignedUserOptions} 
                  disabled={!formData.assigned_to_group}
                />
              </>
            ) : (
              // Read-only for non-admin editing their own project context (typically)
               <FormInput 
                 label="Assigned To" 
                 name="assigned_to_display" 
                 value={currentUser.name} 
                 disabled={true} 
               />
            )}

            <FormSelect 
              label="Effort Est Level" 
              name="level" 
              value={formData.level} 
              onChange={handleChange} 
              error={errors.level} 
              options={[
                { value: "HIGH", label: "High" },
                { value: "MID", label: "Mid" },
                { value: "LOW", label: "Low" },
              ]} 
            />

            <FormInput label="Request Date" name="req_date" type="date" value={formData.req_date} onChange={handleChange} error={errors.req_date} />
            <FormInput label="Plan Start" name="plan_start_date" type="date" value={formData.plan_start_date} onChange={handleChange} error={errors.plan_start_date} />
            <FormInput label="Plan End" name="plan_end_date" type="date" value={formData.plan_end_date} onChange={handleChange} error={errors.plan_end_date} />
            <FormInput label="Go Live" name="live_date" type="date" value={formData.live_date} onChange={handleChange} />

            <div className="sm:col-span-2">
              <FormInput label="Remark" name="remark" value={formData.remark} onChange={handleChange} error={errors.remark} placeholder="Project notes..." />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:shadow-lg`}
            >
              <FaSave className="w-4 h-4" /> {loading ? "Updating..." : "Update Project"}
            </button>
          </div>
        </form>

        {alert && (
          <Alert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
            actions={alert.actions || [{ label: "OK", onClick: () => setAlert(null) }]}
          />
        )}
      </div>
    </div>
  );
};

export default EditProject;