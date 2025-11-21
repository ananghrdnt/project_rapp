import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaTimes, FaSave } from "react-icons/fa";
import Alert from "../Alert";

const EditProject = ({ id_project, onClose, onSave }) => {
  const [assigned_to, setAssignedTo] = useState("");
  const [assigned_to_group, setAssignedToGroup] = useState("");
  const [itbps, setItbps] = useState([]);
  const [saps, setSAPs] = useState([]);
  const [dataScientists, setDataScientists] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);

  const [project_name, setProjectName] = useState("");
  const [project_type_id, setProjectTypeId] = useState("");
  const [level, setLevel] = useState("");
  const [req_date, setReqDate] = useState("");
  const [plan_start_date, setPlanStartDate] = useState("");
  const [plan_end_date, setPlanEndDate] = useState("");
  const [live_date, setLiveDate] = useState("");
  const [remark, setRemark] = useState("");
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  const primaryBlue = "bg-blue-600";
  const primaryGreen = "bg-green-600 hover:bg-green-700";

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
        setSAPs(sapRes.data);
        setDataScientists(dsRes.data);
      } catch (err) {
        console.error("Error fetching initial data:", err);
      }
    };
    fetchData();
  }, []);

  // Dropdown user list sesuai grup (pakai useCallback)
  const getAssignedToUsers = useCallback(() => {
    switch (assigned_to_group) {
      case "ITBP":
        return itbps;
      case "SAP":
        return saps;
      case "DATA_SCIENCE":
        return dataScientists;
      default:
        return [];
    }
  }, [assigned_to_group, itbps, saps, dataScientists]);

  // Auto-select Assigned To setelah semua data user siap
  useEffect(() => {
    if (!assigned_to || !assigned_to_group) return;

    const users = getAssignedToUsers();
    const match = users.find((u) => u.id_user?.toString() === assigned_to?.toString());

    if (match) {
      setAssignedTo(match.id_user.toString());
    }
  }, [assigned_to, assigned_to_group, getAssignedToUsers]);

  // Load project detail
  useEffect(() => {
    if (!id_project) return;

    axios
      .get(`http://localhost:5000/projects/${id_project}`)
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

  const validate = () => {
    const newErrors = {};
    if (!project_name) newErrors.project_name = "Project name is required";
    if (!assigned_to) newErrors.assigned_to = "Assigned To is required";
    if (userRole === "ADMIN" && !assigned_to_group)
      newErrors.assigned_to_group = "Assigned To Group is required";
    if (!project_type_id) newErrors.project_type_id = "Project type is required";
    if (!level) newErrors.level = "Effort level is required";
    if (!req_date) newErrors.req_date = "Request date is required";
    if (!plan_start_date)
      newErrors.plan_start_date = "Plan start date is required";
    if (!plan_end_date)
      newErrors.plan_end_date = "Plan end date is required";
    if (!remark) newErrors.remark = "Remark is required";

    if (req_date && plan_start_date && plan_end_date) {
      const start = new Date(plan_start_date);
      const end = new Date(plan_end_date);
      if (start > end)
        newErrors.plan_start_date = "Plan start cannot be after plan end";
      else {
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        if (level === "LOW" && diffDays >= 7)
          newErrors.plan_end_date = "Low effort should be less than 7 days";
        else if (level === "MID" && (diffDays < 7 || diffDays > 21))
          newErrors.plan_end_date = "Mid effort should be between 7–21 days";
        else if (level === "HIGH" && diffDays <= 21)
          newErrors.plan_end_date = "High effort should be more than 21 days";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
      await axios.patch(
        `http://localhost:5000/projects/${id_project}`,
        {
          assigned_to: Number(assigned_to),
          assigned_to_group,
          project_name,
          project_type_id,
          level,
          req_date,
          plan_start_date,
          plan_end_date,
          live_date: live_date || null,
          remark,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAlert(null);
      onSave();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.msg ||
        "Failed to update project, please try again!";
      showError(msg);
      console.error("Update project error:", msg);
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
        {
          label: "Confirm",
          type: "confirm",
          onClick: () => {
            setAlert(null);
            updateProject();
          },
        },
      ],
    });
  };

  const inputClass = (field) =>
    `border rounded-lg px-2 py-1.5 text-xs w-full transition duration-150 ease-in-out placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field]
        ? "border-red-500 bg-red-50"
        : "border-gray-300 focus:border-blue-500"
    }`;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4 font-sans backdrop-blur-sm">
      <div className="bg-white rounded-xl w-[700px] max-w-full shadow-2xl overflow-hidden">
        <div
          className={`p-4 flex justify-between items-center text-white ${primaryBlue} border-b border-blue-700`}
        >
          <h3 className="text-sm font-bold">FORM EDIT PROJECT</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Project Name
              </label>
              <input
                type="text"
                value={project_name}
                onChange={(e) => setProjectName(e.target.value)}
                className={inputClass("project_name")}
                placeholder="Project Name"
              />
              {errors.project_name && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.project_name}
                </span>
              )}
            </div>

            {/* Project Type */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Project Type
              </label>
              <select
                value={project_type_id}
                onChange={(e) => setProjectTypeId(Number(e.target.value))}
                className={inputClass("project_type_id") + " appearance-none cursor-pointer"}
              >
                <option value="">-- Select Project Type --</option>
                {projectTypes.map((type) => (
                  <option key={type.id_type} value={type.id_type}>
                    {type.project_type
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
              {errors.project_type_id && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.project_type_id}
                </span>
              )}
            </div>

            {/* Assigned To */}
            {userRole === "ADMIN" ? (
              <>
                {/* Group */}
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-xs text-gray-700">
                    Assigned To Group
                  </label>
                  <select
                    value={assigned_to_group}
                    onChange={(e) => {
                      setAssignedToGroup(e.target.value);
                      setAssignedTo("");
                    }}
                    className={
                      inputClass("assigned_to_group") + " appearance-none cursor-pointer"
                    }
                  >
                    <option value="">-- Select Group --</option>
                    <option value="ITBP">ITBP</option>
                    <option value="SAP">SAP</option>
                    <option value="DATA_SCIENCE">Data Science</option>
                  </select>
                  {errors.assigned_to_group && (
                    <span className="text-red-500 text-xs mt-0.5">
                      {errors.assigned_to_group}
                    </span>
                  )}
                </div>

                {/* User */}
                <div className="flex flex-col gap-1">
                  <label className="font-medium text-xs text-gray-700">
                    Assigned To User
                  </label>
                  <select
                    value={assigned_to}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className={
                      inputClass("assigned_to") + " appearance-none cursor-pointer"
                    }
                    disabled={!assigned_to_group}
                  >
                    <option value="">-- Select User --</option>
                 {getAssignedToUsers().map((u) => (
    <option key={u.SAP} value={u.SAP}>
    {u.name}
  </option>
))}

                  </select>
                  {errors.assigned_to && (
                    <span className="text-red-500 text-xs mt-0.5">
                      {errors.assigned_to}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                <label className="font-medium text-xs text-gray-700">
                  Assigned To
                </label>
                <input
                  type="text"
                  value={`${userName}`}
                  disabled
                  className="border rounded-lg px-2 py-1.5 text-xs bg-gray-100 text-gray-600 w-full"
                />
                <input type="hidden" value={assigned_to} />
              </div>
            )}

            {/* Effort Level */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">
                Effort Est Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className={inputClass("level") + " appearance-none cursor-pointer"}
              >
                <option value="">-- Select Effort Level --</option>
                <option value="HIGH">High</option>
                <option value="MID">Mid</option>
                <option value="LOW">Low</option>
              </select>
              {errors.level && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.level}
                </span>
              )}
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">Request Date</label>
              <input
                type="date"
                value={req_date}
                onChange={(e) => setReqDate(e.target.value)}
                className={inputClass("req_date")}
              />
            </div>

         <div className="flex flex-col gap-1">
  <label className="font-medium text-xs text-gray-700">Plan Start</label>
  <input
    type="date"
    value={plan_start_date}
    onChange={(e) => setPlanStartDate(e.target.value)}
    className={inputClass("plan_start_date")}
  />
  {errors.plan_start_date && (
    <span className="text-red-500 text-xs mt-0.5">
      {errors.plan_start_date}
    </span>
  )}
</div>

<div className="flex flex-col gap-1">
  <label className="font-medium text-xs text-gray-700">Plan End</label>
  <input
    type="date"
    value={plan_end_date}
    onChange={(e) => setPlanEndDate(e.target.value)}
    className={inputClass("plan_end_date")}
  />
  {errors.plan_end_date && (
    <span className="text-red-500 text-xs mt-0.5">
      {errors.plan_end_date}
    </span>
  )}
</div>


            {/* Go Live */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-xs text-gray-700">Go Live</label>
              <input
                type="date"
                value={live_date}
                onChange={(e) => setLiveDate(e.target.value)}
                className={inputClass("live_date")}
              />
            </div>

            {/* Remark */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="font-medium text-xs text-gray-700">Remark</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className={inputClass("remark")}
                placeholder="Project notes or brief description"
              />
              {errors.remark && (
                <span className="text-red-500 text-xs mt-0.5">
                  {errors.remark}
                </span>
              )}
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
            actions={
              alert.actions || [
                { label: "OK", type: "confirm", onClick: () => setAlert(null) },
              ]
            }
          />
        )}
      </div>
    </div>
  );
};

export default EditProject;
