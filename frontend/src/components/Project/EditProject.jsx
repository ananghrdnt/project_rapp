import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

// Helper function untuk class input
const getInputClass = (fieldName, errors) =>
  `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    errors[fieldName]
      ? "border-red-500 bg-red-50"
      : "border-gray-300 focus:border-blue-500"
  }`;

const EditProject = ({ id_project, onClose, onSave }) => {
  // --- State Declarations ---
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedToGroup, setAssignedToGroup] = useState("");
  
  // Data Master
  const [itbps, setItbps] = useState([]);
  const [saps, setSaps] = useState([]); 
  const [dataScientists, setDataScientists] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);

  // Form Fields
  const [projectName, setProjectName] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [level, setLevel] = useState("");
  const [reqDate, setReqDate] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [planEndDate, setPlanEndDate] = useState("");
  const [liveDate, setLiveDate] = useState("");
  const [remark, setRemark] = useState("");
  
  // UI States
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

  // --- Effects ---

  // Load user info + supporting data
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    if (userData) {
      setUserRole(userData.role?.toUpperCase() || "");
      setUserName(userData.name || "");
    }

    const fetchData = async () => {
      try {
        const [typeRes, itbpRes, sapRes, dsRes] = await Promise.all([
          axios.get("http://localhost:5000/projecttypes"),
          axios.get("http://localhost:5000/users?role=ITBP"),
          axios.get("http://localhost:5000/users?role=SAP"),
          axios.get("http://localhost:5000/users?role=DATA_SCIENCE"),
        ]);
        setProjectTypes(typeRes.data);
        setItbps(itbpRes.data);
        setSaps(sapRes.data);
        setDataScientists(dsRes.data);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };
    fetchData();
  }, []);

  // Dropdown user list logic
  const getAssignedToUsers = useCallback(() => {
    switch (assignedToGroup) {
      case "ITBP": return itbps;
      case "SAP": return saps;
      case "DATA_SCIENCE": return dataScientists;
      default: return [];
    }
  }, [assignedToGroup, itbps, saps, dataScientists]);

  // Auto-select Assigned To Logic
  useEffect(() => {
    if (!assignedTo || !assignedToGroup) return;
    const users = getAssignedToUsers();
    
    const match = users.find((u) => 
      u.SAP?.toString() === assignedTo?.toString() || 
      u.id_user?.toString() === assignedTo?.toString()
    );

    if (match) {
      setAssignedTo(match.SAP ? match.SAP.toString() : match.id_user.toString());
    }
  }, [assignedTo, assignedToGroup, getAssignedToUsers]);

  // Load project detail
  useEffect(() => {
    if (!id_project) return;
    axios.get(`http://localhost:5000/projects/${id_project}`)
      .then((res) => {
        const p = res.data;
        setAssignedToGroup(p.assigned_to_group || "");
        setAssignedTo(p.assigned_to?.toString() || "");
        setProjectName(p.project_name || "");
        setProjectTypeId(p.project_type_id || "");
        setLevel(p.level || "");
        setReqDate(p.req_date?.substring(0, 10) || "");
        setPlanStartDate(p.plan_start_date?.substring(0, 10) || "");
        setPlanEndDate(p.plan_end_date?.substring(0, 10) || "");
        setLiveDate(p.live_date?.substring(0, 10) || "");
        setRemark(p.remark || "");
      })
      .catch((err) => console.error("Error fetching project:", err));
  }, [id_project]);

  // --- Validation Logic ---

  const checkDateValidation = (currentErrors) => {
    if (!reqDate || !planStartDate || !planEndDate) return;

    const start = new Date(planStartDate);
    const end = new Date(planEndDate);

    if (start > end) {
      currentErrors.planStartDate = "Plan start cannot be after plan end";
      return;
    }

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (level === "LOW" && diffDays >= 7) {
      currentErrors.planEndDate = "Low effort should be less than 7 days";
    } else if (level === "MID" && (diffDays < 7 || diffDays > 21)) {
      currentErrors.planEndDate = "Mid effort should be between 7–21 days";
    } else if (level === "HIGH" && diffDays <= 21) {
      currentErrors.planEndDate = "High effort should be more than 21 days";
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!projectName) newErrors.projectName = "Project name is required";
    if (!assignedTo) newErrors.assignedTo = "Assigned To is required";
    if (userRole === "ADMIN" && !assignedToGroup) newErrors.assignedToGroup = "Assigned To Group is required";
    if (!projectTypeId) newErrors.projectTypeId = "Project type is required";
    if (!level) newErrors.level = "Effort level is required";
    if (!reqDate) newErrors.reqDate = "Request date is required";
    if (!planStartDate) newErrors.planStartDate = "Plan start date is required";
    if (!planEndDate) newErrors.planEndDate = "Plan end date is required";
    if (!remark) newErrors.remark = "Remark is required";

    checkDateValidation(newErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---

  const showError = (msg) => {
    setAlert({ message: msg, type: "error" });
    setTimeout(() => setAlert(null), 3000);
  };

  const updateProject = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showError("You must be logged in to update a project");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        assigned_to: Number(assignedTo),
        assigned_to_group: assignedToGroup,
        project_name: projectName,
        project_type_id: projectTypeId,
        level,
        req_date: reqDate,
        plan_start_date: planStartDate,
        plan_end_date: planEndDate,
        live_date: liveDate || null,
        remark,
      };

      await axios.patch(
        `http://localhost:5000/projects/${id_project}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAlert(null);
      onSave();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.msg || "Failed to update project, please try again!";
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      showError("Failed to update project because of missing or invalid fields");
      return;
    }

    setAlert({
      message: "Are you sure you want to update this project?",
      type: "confirm",
      actions: [
        { label: "Cancel", type: "cancel", onClick: () => setAlert(null) },
        { label: "Confirm", type: "confirm", onClick: () => { setAlert(null); updateProject(); } },
      ],
    });
  };

  // --- Pre-calculated JSX Options ---
  
  const userOptions = useMemo(() => {
    return getAssignedToUsers().map((u) => (
      <option key={u.SAP || u.id_user} value={u.SAP || u.id_user}>
        {u.name}
      </option>
    ));
  }, [getAssignedToUsers]);

  const typeOptions = useMemo(() => {
    return projectTypes.map((type) => (
      <option key={type.id_type} value={type.id_type}>
        {type.project_type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
      </option>
    ));
  }, [projectTypes]);

  // --- Render Functions ---

  const renderAssignedToSection = () => {
    if (userRole !== "ADMIN") {
      return (
        <div className="flex flex-col gap-1">
          {/* FIX: Tambahkan htmlFor pada label dan id pada input */}
          <label htmlFor="assigned-to-readonly" className="font-medium text-xs text-gray-700">Assigned To</label>
          <input
            id="assigned-to-readonly"
            type="text"
            value={`${userName}`}
            disabled
            className="border rounded-lg px-2 py-1.5 text-xs bg-gray-100 text-gray-600 w-full"
          />
          <input type="hidden" value={assignedTo} />
        </div>
      );
    }

    return (
      <>
        <div className="flex flex-col gap-1">
          {/* FIX: Tambahkan htmlFor dan id */}
          <label htmlFor="assigned-to-group" className="font-medium text-xs text-gray-700">Assigned To Group</label>
          <select
            id="assigned-to-group"
            value={assignedToGroup}
            onChange={(e) => {
              setAssignedToGroup(e.target.value);
              setAssignedTo("");
            }}
            className={getInputClass("assignedToGroup", errors) + " appearance-none cursor-pointer"}
          >
            <option value="">-- Select Group --</option>
            <option value="ITBP">ITBP</option>
            <option value="SAP">SAP</option>
            <option value="DATA_SCIENCE">Data Science</option>
          </select>
          {errors.assignedToGroup && (
            <span className="text-red-500 text-xs mt-0.5">{errors.assignedToGroup}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {/* FIX: Tambahkan htmlFor dan id */}
          <label htmlFor="assigned-to-user" className="font-medium text-xs text-gray-700">Assigned To User</label>
          <select
            id="assigned-to-user"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className={getInputClass("assignedTo", errors) + " appearance-none cursor-pointer"}
            disabled={!assignedToGroup}
          >
            <option value="">-- Select User --</option>
            {userOptions}
          </select>
          {errors.assignedTo && (
            <span className="text-red-500 text-xs mt-0.5">{errors.assignedTo}</span>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] max-w-full shadow-2xl overflow-hidden">
        <div className={`p-4 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}>
          <h3 className="text-sm font-bold">FORM EDIT PROJECT</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="project-name" className="font-medium text-xs text-gray-700">Project Name</label>
              <input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={getInputClass("projectName", errors)}
                placeholder="Project Name"
              />
              {errors.projectName && <span className="text-red-500 text-xs mt-0.5">{errors.projectName}</span>}
            </div>

            {/* Project Type */}
            <div className="flex flex-col gap-1">
              <label htmlFor="project-type" className="font-medium text-xs text-gray-700">Project Type</label>
              <select
                id="project-type"
                value={projectTypeId}
                onChange={(e) => setProjectTypeId(Number(e.target.value))}
                className={getInputClass("projectTypeId", errors) + " appearance-none cursor-pointer"}
              >
                <option value="">-- Select Project Type --</option>
                {typeOptions}
              </select>
              {errors.projectTypeId && <span className="text-red-500 text-xs mt-0.5">{errors.projectTypeId}</span>}
            </div>

            {/* Assigned To Section */}
            {renderAssignedToSection()}

            {/* Effort Level */}
            <div className="flex flex-col gap-1">
              <label htmlFor="effort-level" className="font-medium text-xs text-gray-700">Effort Est Level</label>
              <select
                id="effort-level"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={getInputClass("level", errors) + " appearance-none cursor-pointer"}
              >
                <option value="">-- Select Effort Level --</option>
                <option value="HIGH">High</option>
                <option value="MID">Mid</option>
                <option value="LOW">Low</option>
              </select>
              {errors.level && <span className="text-red-500 text-xs mt-0.5">{errors.level}</span>}
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-1">
              <label htmlFor="req-date" className="font-medium text-xs text-gray-700">Request Date</label>
              <input
                id="req-date"
                type="date"
                value={reqDate}
                onChange={(e) => setReqDate(e.target.value)}
                className={getInputClass("reqDate", errors)}
              />
              {errors.reqDate && <span className="text-red-500 text-xs mt-0.5">{errors.reqDate}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="plan-start" className="font-medium text-xs text-gray-700">Plan Start</label>
              <input
                id="plan-start"
                type="date"
                value={planStartDate}
                onChange={(e) => setPlanStartDate(e.target.value)}
                className={getInputClass("planStartDate", errors)}
              />
              {errors.planStartDate && <span className="text-red-500 text-xs mt-0.5">{errors.planStartDate}</span>}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="plan-end" className="font-medium text-xs text-gray-700">Plan End</label>
              <input
                id="plan-end"
                type="date"
                value={planEndDate}
                onChange={(e) => setPlanEndDate(e.target.value)}
                className={getInputClass("planEndDate", errors)}
              />
              {errors.planEndDate && <span className="text-red-500 text-xs mt-0.5">{errors.planEndDate}</span>}
            </div>

            {/* Go Live */}
            <div className="flex flex-col gap-1">
              <label htmlFor="go-live" className="font-medium text-xs text-gray-700">Go Live</label>
              <input
                id="go-live"
                type="date"
                value={liveDate}
                onChange={(e) => setLiveDate(e.target.value)}
                className={getInputClass("liveDate", errors)}
              />
            </div>

            {/* Remark */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor="remark" className="font-medium text-xs text-gray-700">Remark</label>
              <input
                id="remark"
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className={getInputClass("remark", errors)}
                placeholder="Project notes or brief description"
              />
              {errors.remark && <span className="text-red-500 text-xs mt-0.5">{errors.remark}</span>}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t mt-6">
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading ? "bg-gray-400 cursor-not-allowed" : primaryGreen
              } text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-md transition-all duration-200 transform active:scale-[0.98] hover:shadow-lg`}
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
            actions={alert.actions || [{ label: "OK", type: "confirm", onClick: () => setAlert(null) }]}
          />
        )}
      </div>
    </div>
  );
};

export default EditProject;