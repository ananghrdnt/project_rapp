import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

// Constants
const API_BASE_URL = "http://localhost:5000";
const USER_ROLES = {
  ITBP: "ITBP",
  SAP: "SAP",
  DATA_SCIENCE: "DATA_SCIENCE",
  ADMIN: "ADMIN"
};
const EFFORT_LEVELS = ["HIGH", "MID", "LOW"];

// Custom Hook untuk fetch data
const useFetchData = (endpoint) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/${endpoint}`);
        setData(response.data);
      } catch (err) {
        setError(err.message);
        console.error(`Error fetching ${endpoint}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error };
};

// Reusable Form Input Components
const TextInput = ({ label, value, onChange, error, placeholder, disabled, type = "text" }) => {
  const inputClass = `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
  } ${disabled ? "bg-gray-100 text-gray-600" : ""}`;

  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium text-xs text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClass}
      />
      {error && <span className="text-red-500 text-xs mt-0.5">{error}</span>}
    </div>
  );
};

const SelectInput = ({ label, value, onChange, options, error, disabled, placeholder }) => {
  const selectClass = `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? "border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
  } ${disabled ? "bg-gray-100 text-gray-600" : ""} appearance-none cursor-pointer`;

  return (
    <div className="flex flex-col gap-1">
      <label className="font-medium text-xs text-gray-700">{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={selectClass}
      >
        <option value="">{placeholder || `-- Select ${label} --`}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-red-500 text-xs mt-0.5">{error}</span>}
    </div>
  );
};

// Validation helper functions
const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === "") {
    return `${fieldName} is required`;
  }
  return null;
};

const validateDateRange = (startDate, endDate, level) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return "Plan start cannot be after plan end";
  }

  const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  const validationRules = {
    LOW: { min: 0, max: 6, message: "Low effort should be less than 7 days" },
    MID: { min: 7, max: 21, message: "Mid effort should be between 7–21 days" },
    HIGH: { min: 22, max: Infinity, message: "High effort should be more than 21 days" }
  };

  const rule = validationRules[level];
  if (rule && (diffDays < rule.min || diffDays > rule.max)) {
    return rule.message;
  }

  return null;
};

// Helper function untuk mengambil data user dari localStorage
const getUserFromLocalStorage = () => {
  const userData = JSON.parse(localStorage.getItem("user")) || {};
  return {
    role: (userData.role || "").toUpperCase(),
    name: userData.name || "",
    sap: userData.SAP || ""
  };
};

const AddProject = ({ onClose, onSave }) => {
  // Form state menggunakan single object
  const [formData, setFormData] = useState({
    assigned_to: "",
    assigned_to_group: "",
    project_name: "",
    project_type_id: "",
    level: "",
    req_date: "",
    plan_start_date: "",
    plan_end_date: "",
    remark: ""
  });

  const [usersByRole, setUsersByRole] = useState({
    ITBP: [],
    SAP: [],
    DATA_SCIENCE: []
  });

  const [projectTypes, setProjectTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Use useMemo untuk userInfo untuk mencegah re-render yang tidak perlu
  const userInfo = useMemo(() => getUserFromLocalStorage(), []);

  const { data: projectTypesData } = useFetchData("projecttypes");

  // Color constants
  const PRIMARY_BLUE = "bg-blue-600";
  const PRIMARY_GREEN = "bg-green-600 hover:bg-green-700";

  // Initialize user data dengan useMemo
  const validRoles = useMemo(() => [USER_ROLES.ITBP, USER_ROLES.SAP, USER_ROLES.DATA_SCIENCE], []);
  
  // PERBAIKAN: useEffect dengan dependency yang lengkap
  useEffect(() => {
    const initializeUserData = async () => {
      try {
        const [itbpRes, sapRes, dsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/users?role=ITBP`),
          axios.get(`${API_BASE_URL}/users?role=SAP`),
          axios.get(`${API_BASE_URL}/users?role=DATA_SCIENCE`)
        ]);

        setUsersByRole({
          ITBP: itbpRes.data,
          SAP: sapRes.data,
          DATA_SCIENCE: dsRes.data
        });
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    initializeUserData();
  }, []); // Empty dependency array karena hanya perlu dijalankan sekali

  // Update project types
  useEffect(() => {
    if (projectTypesData) {
      setProjectTypes(projectTypesData);
    }
  }, [projectTypesData]);

  // PERBAIKAN: Gunakan useCallback untuk setAssignedTo otomatis
  const setAutoAssignedTo = useCallback(() => {
    const { role, sap } = userInfo;
    
    if (sap && validRoles.includes(role)) {
      setFormData(prev => ({
        ...prev,
        assigned_to: sap.toString(),
        assigned_to_group: role
      }));
    }
  }, [userInfo, validRoles]);

  // Set assigned_to automatically based on user role
  useEffect(() => {
    setAutoAssignedTo();
  }, [setAutoAssignedTo]); // Sekarang dependency array lengkap

  // Form field change handler
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Get users for selected group
  const getAssignedToUsers = () => {
    const users = usersByRole[formData.assigned_to_group] || [];
    return users.map(user => ({
      value: user.SAP,
      label: user.name
    }));
  };

  // Format project type options
  const getProjectTypeOptions = useMemo(() => {
    return projectTypes.map(type => ({
      value: type.id_type,
      label: type.project_type
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase())
    }));
  }, [projectTypes]);

  // Effort level options
  const getEffortLevelOptions = useMemo(() => {
    return EFFORT_LEVELS.map(level => ({
      value: level,
      label: level.charAt(0) + level.slice(1).toLowerCase()
    }));
  }, []);

  // Validation
  const validateForm = () => {
    const newErrors = {};
    
    // Required field validations
    const requiredFields = [
      { field: "project_name", name: "Project name" },
      { field: "project_type_id", name: "Project type" },
      { field: "level", name: "Effort level" },
      { field: "req_date", name: "Request date" },
      { field: "plan_start_date", name: "Plan start date" },
      { field: "plan_end_date", name: "Plan end date" },
      { field: "remark", name: "Remark" }
    ];

    requiredFields.forEach(({ field, name }) => {
      const error = validateRequired(formData[field], name);
      if (error) newErrors[field] = error;
    });

    // Assigned to validation
    if (!formData.assigned_to) {
      newErrors.assigned_to = "Assigned To is required";
    }

    // Admin-specific validation
    if (userInfo.role === USER_ROLES.ADMIN && !formData.assigned_to_group) {
      newErrors.assigned_to_group = "Assigned To Group is required";
    }

    // Date range validation
    if (formData.plan_start_date && formData.plan_end_date && formData.level) {
      const dateError = validateDateRange(
        formData.plan_start_date,
        formData.plan_end_date,
        formData.level
      );
      if (dateError) {
        newErrors.plan_end_date = dateError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Show error message
  const showError = useCallback((msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  }, []);

  // Save project
  const saveProject = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError("Failed to add project because of missing or invalid fields");
      return;
    }

    setAlert({
      message: "Are you sure you want to add this project?",
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        {
          label: "Confirm",
          type: "confirm",
          onClick: async () => {
            setLoading(true);
            try {
              const token = localStorage.getItem("token");
              await axios.post(
                `${API_BASE_URL}/projects`,
                {
                  assigned_to: Number(formData.assigned_to),
                  project_name: formData.project_name,
                  project_type_id: formData.project_type_id,
                  level: formData.level,
                  req_date: formData.req_date,
                  plan_start_date: formData.plan_start_date,
                  plan_end_date: formData.plan_end_date,
                  remark: formData.remark,
                  status: "TO_DO",
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              setAlert(null);
              onSave();
              onClose();
            } catch (err) {
              const msg = err.response?.data?.msg || 
                         "Failed to add project, please try again!";
              showError(msg);
              console.error("Add project error:", err);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
  };

  // Assigned group options
  const assignedGroupOptions = useMemo(() => [
    { value: USER_ROLES.ITBP, label: "ITBP" },
    { value: USER_ROLES.SAP, label: "SAP" },
    { value: USER_ROLES.DATA_SCIENCE, label: "Data Science" }
  ], []);

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] max-w-full shadow-2xl overflow-hidden transition-all duration-300 transform scale-100">
        <div className={`p-4 flex justify-between items-center text-white ${PRIMARY_BLUE} border-b border-blue-700`}>
          <h3 className="text-sm font-bold m-0 tracking-wide">FORM ADD NEW PROJECT</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close form"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={saveProject} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Name */}
            <TextInput
              label="Project Name"
              value={formData.project_name}
              onChange={(e) => handleFieldChange("project_name", e.target.value)}
              error={errors.project_name}
              placeholder="Project Name"
            />

            {/* Project Type */}
            <SelectInput
              label="Project Type"
              value={formData.project_type_id}
              onChange={(e) => handleFieldChange("project_type_id", Number(e.target.value))}
              options={getProjectTypeOptions}
              error={errors.project_type_id}
            />

            {/* Assigned To Fields */}
            {userInfo.role === USER_ROLES.ADMIN ? (
              <>
                <SelectInput
                  label="Assigned To Group"
                  value={formData.assigned_to_group}
                  onChange={(e) => {
                    handleFieldChange("assigned_to_group", e.target.value);
                    handleFieldChange("assigned_to", "");
                  }}
                  options={assignedGroupOptions}
                  error={errors.assigned_to_group}
                  placeholder="-- Select Group --"
                />

                <SelectInput
                  label="Assigned To User"
                  value={formData.assigned_to}
                  onChange={(e) => handleFieldChange("assigned_to", e.target.value)}
                  options={getAssignedToUsers()}
                  error={errors.assigned_to}
                  disabled={!formData.assigned_to_group}
                  placeholder="-- Select User --"
                />
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="font-medium text-xs text-gray-700">Assigned To</label>
                <input
                  type="text"
                  value={userInfo.name}
                  disabled
                  className="border rounded-lg px-2 py-1.5 text-xs bg-gray-100 text-gray-600 w-full"
                />
                <input type="hidden" name="assigned_to" value={formData.assigned_to} />
              </div>
            )}

            {/* Effort Level */}
            <SelectInput
              label="Effort Est Level"
              value={formData.level}
              onChange={(e) => handleFieldChange("level", e.target.value)}
              options={getEffortLevelOptions}
              error={errors.level}
            />

            {/* Request Date */}
            <TextInput
              label="Request Date"
              type="date"
              value={formData.req_date}
              onChange={(e) => handleFieldChange("req_date", e.target.value)}
              error={errors.req_date}
            />

            {/* Plan Start */}
            <TextInput
              label="Plan Start"
              type="date"
              value={formData.plan_start_date}
              onChange={(e) => handleFieldChange("plan_start_date", e.target.value)}
              error={errors.plan_start_date}
            />

            {/* Plan End */}
            <TextInput
              label="Plan End"
              type="date"
              value={formData.plan_end_date}
              onChange={(e) => handleFieldChange("plan_end_date", e.target.value)}
              error={errors.plan_end_date}
            />

            {/* Remark */}
            <div className="sm:col-span-2">
              <TextInput
                label="Remark"
                value={formData.remark}
                onChange={(e) => handleFieldChange("remark", e.target.value)}
                error={errors.remark}
                placeholder="Project notes or brief description"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`${loading ? "bg-gray-400 cursor-not-allowed" : PRIMARY_GREEN} text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all duration-200 transform active:scale-[0.98] hover:shadow-lg`}
            >
              <FaSave className="w-4 h-4" /> {loading ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>

        {alert && (
          <Alert
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
            actions={alert.actions || [
              { label: "OK", type: "confirm", onClick: () => setAlert(null) },
            ]}
          />
        )}
      </div>
    </div>
  );
};

export default AddProject;